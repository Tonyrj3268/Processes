import client from '@src/config/elasticsearch';
import { Post } from '@src/models/post';
import { User } from '@src/models/user';
import { Comment, ICommentDocument } from '@src/models/comment';
import { IUserDocument } from '@src/models/user';

export async function setupElasticsearch() {
    try {
        // 檢查索引是否存在
        const postsIndexExists = await client.indices.exists({
            index: 'posts'
        });

        const usersIndexExists = await client.indices.exists({
            index: 'users'
        });

        const commentsIndexExists = await client.indices.exists({
            index: 'comments'
        });

        // 創建貼文索引
        if (!postsIndexExists) {
            await client.indices.create({
                index: 'posts',
                settings: {
                    analysis: {
                        analyzer: {
                            my_analyzer: {
                                type: 'custom',
                                tokenizer: 'smartcn_tokenizer',
                                filter: [
                                    'lowercase',
                                    'asciifolding'
                                ]
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        content: {
                            type: 'text',
                            analyzer: 'my_analyzer',
                            search_analyzer: 'my_analyzer'
                        },
                        userId: { type: 'keyword' },
                        userName: {
                            type: 'text',
                            analyzer: 'my_analyzer'
                        },
                        createdAt: { type: 'date' }
                    }
                }
            });
        }

        // 創建評論索引
        if (!commentsIndexExists) {
            await client.indices.create({
                index: 'comments',
                settings: {
                    analysis: {
                        analyzer: {
                            my_analyzer: {
                                type: 'custom',
                                tokenizer: 'smartcn_tokenizer',
                                filter: [
                                    'lowercase',
                                    'asciifolding'
                                ]
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        content: {
                            type: 'text',
                            analyzer: 'my_analyzer',
                            search_analyzer: 'my_analyzer'
                        },
                        userId: { type: 'keyword' },
                        userName: {
                            type: 'text',
                            analyzer: 'my_analyzer'
                        },
                        accountName: {
                            type: 'text',
                            analyzer: 'my_analyzer'
                        },
                        avatarUrl: { type: 'keyword' },
                        likesCount: { type: 'integer' },
                        repliesCount: { type: 'integer' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' }
                    }
                }
            });
        }

        // 創建用戶索引
        if (!usersIndexExists) {
            await client.indices.create({
                index: 'users',
                settings: {
                    analysis: {
                        analyzer: {
                            my_analyzer: {
                                type: 'custom',
                                tokenizer: 'smartcn_tokenizer',
                                filter: [
                                    'lowercase',
                                    'asciifolding'
                                ]
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        userName: {
                            type: 'text',
                            analyzer: 'my_analyzer'
                        },
                        accountName: {
                            type: 'text',
                            analyzer: 'my_analyzer'
                        },
                        bio: {
                            type: 'text',
                            analyzer: 'my_analyzer'
                        },
                        isPublic: { type: 'boolean' },
                        avatarUrl: { type: 'keyword' },
                        followersCount: { type: 'integer' },
                        followingCount: { type: 'integer' },
                        createdAt: { type: 'date' }
                    }
                }
            });
        }

        // 同步現有的貼文
        const posts = await Post.find().populate('user', 'userName');

        // 如果有現有的貼文文檔，先刪除
        if (postsIndexExists) {
            await client.deleteByQuery({
                index: 'posts',
                query: {
                    match_all: {}
                }
            });
        }

        // 批量索引貼文文檔
        const operations = posts.flatMap(post => [{
            index: {
                _index: 'posts',
                _id: post._id.toString()
            }
        }, {
            content: post.content,
            userId: post.user._id.toString(),
            userName: (post.user as IUserDocument).userName,
            createdAt: post.createdAt
        }]);

        if (operations.length > 0) {
            await client.bulk({ operations, refresh: true });
        }

        // 同步現有的用戶
        const users = await User.find();

        // 如果有現有的用戶文檔，先刪除
        if (usersIndexExists) {
            await client.deleteByQuery({
                index: 'users',
                query: {
                    match_all: {}
                }
            });
        }

        // 批量索引用戶文檔
        const userOperations = users.flatMap(user => [{
            index: {
                _index: 'users',
                _id: user._id.toString()
            }
        }, {
            userName: user.userName,
            accountName: user.accountName,
            bio: user.bio || '',
            isPublic: user.isPublic,
            avatarUrl: user.avatarUrl,
            followersCount: user.followersCount,
            followingCount: user.followingCount,
            createdAt: user.createdAt
        }]);

        if (userOperations.length > 0) {
            await client.bulk({ operations: userOperations, refresh: true });
        }

        // 同步現有的評論
        const comments = await Comment.find().populate('user', 'userName accountName avatarUrl');

        // 如果有現有的評論文檔，先刪除
        if (commentsIndexExists) {
            await client.deleteByQuery({
                index: 'comments',
                query: {
                    match_all: {}
                }
            });
        }

        // 批量索引評論文檔
        const commentOperations = comments.flatMap((comment: ICommentDocument) => [{
            index: {
                _index: 'comments',
                _id: comment._id.toString()
            }
        }, {
            content: comment.content,
            userId: (comment.user as unknown as IUserDocument)._id.toString(),
            userName: (comment.user as unknown as IUserDocument).userName,
            accountName: (comment.user as unknown as IUserDocument).accountName,
            avatarUrl: (comment.user as unknown as IUserDocument).avatarUrl,
            likesCount: comment.likesCount,
            repliesCount: comment.comments.length,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
        }]);

        if (commentOperations.length > 0) {
            await client.bulk({ operations: commentOperations, refresh: true });
        }

        console.log('Elasticsearch setup completed successfully');
    } catch (error) {
        console.error('Elasticsearch setup failed:', error);
        throw error;
    }
}