// src/services/searchService.ts
import client from "@src/config/elasticsearch";
import { Post } from "@src/models/post";
import { User } from "@src/models/user";
import { Comment } from "@src/models/comment";
import { IUserDocument } from "@src/models/user";
import { SearchRequest, SearchHit, ElasticGetResponse } from "@src/types/elasticsearch";

export class SearchService {
    /**
     * 搜索貼文
     * @param query 搜索關鍵字
     * @param cursor 游標（上一頁最後一筆資料的ID）
     * @param limit 每頁數量
     */
    async searchPosts(query: string, cursor?: string, limit: number = 10) {
        try {
            const searchQuery: SearchRequest = {
                index: 'posts',
                body: {
                    size: limit + 1, // 多取一條用來判斷是否還有下一頁
                    query: {
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
                    },
                    sort: [
                        { _score: 'desc' },
                        { _id: 'desc' }
                    ]
                }
            };

            // 如果有游標，添加 search_after 條件
            if (cursor) {
                const cursorDoc = await client.get({
                    index: 'posts',
                    id: cursor
                }) as ElasticGetResponse;

                searchQuery.body.search_after = [
                    cursorDoc._score,
                    cursorDoc._id
                ];
            }

            const result = await client.search(searchQuery);

            const hits = result.hits.hits as SearchHit[];

            // 移除多取的那一條，用於下一頁的判斷
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
                        { _score: 'desc' },
                        { _id: 'desc' }
                    ]
                }
            };

            if (cursor) {
                const cursorDoc = await client.get({
                    index: 'users',
                    id: cursor
                }) as ElasticGetResponse;

                searchQuery.body.search_after = [
                    cursorDoc._score,
                    cursorDoc._id
                ];
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
                        { _score: 'desc' },
                        { _id: 'desc' }
                    ]
                }
            };

            if (cursor) {
                const cursorDoc = await client.get({
                    index: 'comments',
                    id: cursor
                }) as ElasticGetResponse;

                searchQuery.body.search_after = [
                    cursorDoc._score,
                    cursorDoc._id
                ];
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