// src/services/searchService.ts
import client from "@src/config/elasticsearch";
import { Post } from "@src/models/post";
import { User } from "@src/models/user";
import { Comment } from "@src/models/comment";
import { IUserDocument } from "@src/models/user";
import { SearchRequest, SearchHit, ElasticGetResponse } from "@src/types/elasticsearch";
import { Follow } from "@src/models/follow";
import { Types } from "mongoose";

export class SearchService {
    /**
     * 搜索貼文
     * @param query 搜索關鍵字
     * @param cursor 游標（上一頁最後一筆資料的ID）
     * @param limit 每頁數量
     * @param currentUserId 當前登入用戶的ID（用於檢查追蹤關係）
     */
    async searchPosts(query: string, cursor?: string, limit: number = 10, currentUserId?: string) {
        try {
            let visibleUserIds = [];

            // 1. 獲取所有公開用戶的 ID
            const publicUsers = await User.find({ isPublic: true }).select('_id');
            visibleUserIds = publicUsers.map(user => user._id.toString());

            // 2. 如果用戶已登入，添加他追蹤的私人帳號
            if (currentUserId) {
                const followedUsers = await Follow.find({
                    follower: new Types.ObjectId(currentUserId),
                    status: 'accepted'  // 只考慮已接受的追蹤關係
                }).select('following');

                const followedUserIds = followedUsers.map(follow => follow.following.toString());

                // 合併公開用戶和已追蹤用戶的 ID，確保沒有重複
                visibleUserIds = [...new Set([...visibleUserIds, ...followedUserIds])];
            }

            const searchQuery: SearchRequest = {
                index: 'posts',
                body: {
                    size: limit + 1,
                    sort: [
                        { "createdAt": "desc" }
                    ],
                    query: {
                        bool: {
                            must: [
                                {
                                    bool: {
                                        should: [
                                            {
                                                multi_match: {
                                                    query,
                                                    fields: ['content^3', 'userName^2'],
                                                    fuzziness: 'AUTO'
                                                }
                                            },
                                            {
                                                match_phrase: {
                                                    content: {
                                                        query,
                                                        boost: 4
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            filter: [
                                {
                                    bool: {
                                        should: visibleUserIds.map(id => ({
                                            term: {
                                                "userId": id
                                            }
                                        }))
                                    }
                                }
                            ]
                        }
                    }
                }
            };

            // 處理游標分頁
            if (cursor) {
                const cursorDoc = await client.get({
                    index: 'posts',
                    id: cursor
                }) as ElasticGetResponse;

                if (cursorDoc._source?.createdAt) {
                    searchQuery.body.search_after = [cursorDoc._source.createdAt];
                }
            }

            const result = await client.search(searchQuery);
            const hits = result.hits.hits as SearchHit[];

            const hasMore = hits.length > limit;
            if (hasMore) {
                hits.pop();
            }

            const posts = await Post.find({
                _id: { $in: hits.map(hit => hit._id) }
            }).populate('user', 'userName accountName avatarUrl');

            // 根據 Elasticsearch 的排序結果對 MongoDB 的結果進行排序
            const sortedPosts = hits.map(hit =>
                posts.find(post => post._id.toString() === hit._id)
            ).filter(Boolean);

            return {
                posts: sortedPosts.map(post => ({
                    postId: post!._id,
                    author: {
                        id: post!.user._id,
                        userName: (post!.user as IUserDocument).userName,
                        accountName: (post!.user as IUserDocument).accountName,
                        avatarUrl: (post!.user as IUserDocument).avatarUrl
                    },
                    content: post!.content,
                    likesCount: post!.likesCount,
                    commentCount: post!.comments.length,
                    createdAt: post!.createdAt,
                    highlight: hits.find(hit => hit._id === post!._id.toString())?._source
                })),
                nextCursor: hasMore ? sortedPosts[sortedPosts.length - 1]?._id : null
            };
        } catch (error) {
            console.error('Error in searchPosts:', error);
            throw error;
        }
    }

    /**
     * 搜索用戶
     */
    async searchUsers(query: string, cursor?: string, limit: number = 10) {
        try {
            const searchQuery: SearchRequest = {
                index: 'users',
                body: {
                    size: limit + 1,
                    query: {
                        bool: {
                            should: [
                                {
                                    multi_match: {
                                        query,
                                        fields: ['userName^3', 'accountName^2', 'bio'],
                                        fuzziness: 'AUTO'
                                    }
                                }
                            ],
                            filter: [
                                { term: { isPublic: true } }
                            ]
                        }
                    },
                    sort: [
                        { createdAt: 'desc' }
                    ]
                }
            };

            if (cursor) {
                const cursorDoc = await client.get({
                    index: 'users',
                    id: cursor
                }) as ElasticGetResponse;

                if (cursorDoc._source?.createdAt) {
                    searchQuery.body.search_after = [cursorDoc._source.createdAt];
                }
            }

            const result = await client.search(searchQuery);

            const hits = result.hits.hits;
            const hasMore = hits.length > limit;
            if (hasMore) {
                hits.pop();
            }

            const users = await User.find({
                _id: { $in: hits.map(hit => hit._id) }
            });

            const sortedUsers = hits.map(hit =>
                users.find(user => user._id.toString() === hit._id)
            ).filter(Boolean);

            return {
                users: sortedUsers.map(user => ({
                    id: user!._id,
                    userName: user!.userName,
                    accountName: user!.accountName,
                    avatarUrl: user!.avatarUrl,
                    bio: user!.bio,
                    followersCount: user!.followersCount,
                    followingCount: user!.followingCount
                })),
                nextCursor: hasMore ? sortedUsers[sortedUsers.length - 1]?._id : null
            };
        } catch (error) {
            console.error('Error in searchUsers:', error);
            throw error;
        }
    }

    /**
     * 搜索評論
     */
    async searchComments(query: string, cursor?: string, limit: number = 10) {
        try {
            const searchQuery: SearchRequest = {
                index: 'comments',
                body: {
                    size: limit + 1,
                    query: {
                        bool: {
                            should: [{
                                multi_match: {
                                    query,
                                    fields: ['content^3', 'userName^2'],
                                    fuzziness: 'AUTO'
                                }
                            }]
                        }
                    },
                    sort: [
                        { createdAt: 'desc' }
                    ]
                }
            };

            if (cursor) {
                const cursorDoc = await client.get({
                    index: 'comments',
                    id: cursor
                }) as ElasticGetResponse;

                if (cursorDoc._source?.createdAt) {
                    searchQuery.body.search_after = [cursorDoc._source.createdAt];
                }
            }

            const result = await client.search(searchQuery);

            const hits = result.hits.hits;
            const hasMore = hits.length > limit;
            if (hasMore) {
                hits.pop();
            }

            const comments = await Comment.find({
                _id: { $in: hits.map(hit => hit._id) }
            }).populate('user', 'userName accountName avatarUrl');

            const sortedComments = hits.map(hit =>
                comments.find(comment => comment._id.toString() === hit._id)
            ).filter(Boolean);

            return {
                comments: sortedComments.map(comment => ({
                    commentId: comment!._id,
                    author: {
                        id: comment!.user._id,
                        userName: (comment!.user as IUserDocument).userName,
                        accountName: (comment!.user as IUserDocument).accountName,
                        avatarUrl: (comment!.user as IUserDocument).avatarUrl
                    },
                    content: comment!.content,
                    likesCount: comment!.likesCount,
                    repliesCount: comment!.comments.length,
                    createdAt: comment!.createdAt,
                    highlight: hits.find(hit => hit._id === comment!._id.toString())?._source
                })),
                nextCursor: hasMore ? sortedComments[sortedComments.length - 1]?._id : null
            };
        } catch (error) {
            console.error('Error in searchComments:', error);
            throw error;
        }
    }
}

export const searchService = new SearchService();