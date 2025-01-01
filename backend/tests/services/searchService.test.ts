// tests/services/searchService.test.ts
import { SearchService } from '@src/services/searchService';
import { Post } from '@src/models/post';
import { User } from '@src/models/user';
import { Comment } from '@src/models/comment';
import { Types } from 'mongoose';
import client from '@src/config/elasticsearch';
import "@tests/setup";

// 模擬 Elasticsearch 客戶端
jest.mock('@src/config/elasticsearch', () => ({
    search: jest.fn(),
    get: jest.fn()
}));

describe('SearchService', () => {
    let searchService: SearchService;

    // 基礎測試數據
    const mockUser = {
        _id: new Types.ObjectId(),
        userName: '測試用戶',
        accountName: 'testuser',
        avatarUrl: 'test.jpg',
        bio: '測試簡介',
        followersCount: 10,
        followingCount: 5,
        isPublic: true
    };

    const mockPost = {
        _id: new Types.ObjectId(),
        content: '測試貼文內容',
        user: mockUser,
        likesCount: 5,
        comments: [],
        createdAt: new Date(),
        images: []
    };

    const mockComment = {
        _id: new Types.ObjectId(),
        content: '測試評論內容',
        user: mockUser,
        likesCount: 3,
        comments: [],
        createdAt: new Date()
    };

    beforeEach(() => {
        searchService = new SearchService();
        jest.clearAllMocks();
    });

    describe('searchPosts', () => {
        it('應該成功搜索貼文並返回正確格式的結果', async () => {
            // 模擬 Elasticsearch 搜索結果
            const mockElasticResult = {
                hits: {
                    hits: [{
                        _id: mockPost._id.toString(),
                        _score: 1.0,
                        _source: {
                            content: mockPost.content
                        }
                    }]
                }
            };

            (client.search as jest.Mock).mockResolvedValue(mockElasticResult);

            // 模擬 MongoDB 查詢鏈
            const mockPopulate = jest.fn().mockResolvedValue([mockPost]);
            const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });
            jest.spyOn(Post, 'find').mockImplementation(mockFind);

            const result = await searchService.searchPosts('測試', undefined, 10);

            // 驗證結果格式
            expect(result).toEqual({
                posts: [{
                    postId: mockPost._id,
                    author: {
                        id: mockUser._id,
                        userName: mockUser.userName,
                        accountName: mockUser.accountName,
                        avatarUrl: mockUser.avatarUrl
                    },
                    content: mockPost.content,
                    likesCount: mockPost.likesCount,
                    commentCount: 0,
                    createdAt: mockPost.createdAt,
                    highlight: {
                        content: mockPost.content
                    }
                }],
                nextCursor: null
            });
        });

        it('應該返回空數組當沒有搜索結果時', async () => {
            (client.search as jest.Mock).mockResolvedValue({ hits: { hits: [] } });

            const result = await searchService.searchPosts('不存在的內容', undefined, 10);

            expect(result.posts).toEqual([]);
            expect(result.nextCursor).toBeNull();
        });
    });

    describe('searchUsers', () => {
        it('應該成功搜索用戶並返回正確格式的結果', async () => {
            const mockElasticResult = {
                hits: {
                    hits: [{
                        _id: mockUser._id.toString(),
                        _score: 1.0,
                        _source: {
                            userName: mockUser.userName,
                            accountName: mockUser.accountName
                        }
                    }]
                }
            };

            (client.search as jest.Mock).mockResolvedValue(mockElasticResult);
            jest.spyOn(User, 'find').mockResolvedValue([mockUser]);

            const result = await searchService.searchUsers('測試', undefined, 10);

            expect(result).toEqual({
                users: [{
                    id: mockUser._id,
                    userName: mockUser.userName,
                    accountName: mockUser.accountName,
                    avatarUrl: mockUser.avatarUrl,
                    bio: mockUser.bio,
                    followersCount: mockUser.followersCount,
                    followingCount: mockUser.followingCount
                }],
                nextCursor: null
            });
        });
    });

    describe('searchComments', () => {
        it('應該成功搜索評論並返回正確格式的結果', async () => {
            const mockElasticResult = {
                hits: {
                    hits: [{
                        _id: mockComment._id.toString(),
                        _score: 1.0,
                        _source: {
                            content: mockComment.content
                        }
                    }]
                }
            };

            (client.search as jest.Mock).mockResolvedValue(mockElasticResult);
            // 模擬 MongoDB 查詢鏈
            const mockPopulate = jest.fn().mockResolvedValue([mockComment]);
            const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });
            jest.spyOn(Comment, 'find').mockImplementation(mockFind);

            const result = await searchService.searchComments('測試', undefined, 10);

            expect(result).toEqual({
                comments: [{
                    commentId: mockComment._id,
                    author: {
                        id: mockUser._id,
                        userName: mockUser.userName,
                        accountName: mockUser.accountName,
                        avatarUrl: mockUser.avatarUrl
                    },
                    content: mockComment.content,
                    likesCount: mockComment.likesCount,
                    repliesCount: 0,
                    createdAt: mockComment.createdAt,
                    highlight: {
                        content: mockComment.content
                    }
                }],
                nextCursor: null
            });
        });
    });

    describe('錯誤處理', () => {
        it('應該處理 Elasticsearch 搜索錯誤', async () => {
            (client.search as jest.Mock).mockRejectedValue(new Error('Elasticsearch error'));

            await expect(searchService.searchPosts('測試')).rejects.toThrow();
        });

        it('應該處理 MongoDB 查詢錯誤', async () => {
            (client.search as jest.Mock).mockResolvedValue({
                hits: {
                    hits: [{
                        _id: mockPost._id.toString(),
                        _score: 1.0
                    }]
                }
            });

            const mockPopulate = jest.fn().mockRejectedValue(new Error('MongoDB error'));
            const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate });
            jest.spyOn(Post, 'find').mockImplementation(mockFind);

            await expect(searchService.searchPosts('測試')).rejects.toThrow('MongoDB error');
        });
    });
});