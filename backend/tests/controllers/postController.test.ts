// tests/controllers/postController.test.ts
import { Request, Response } from 'express';
import { PostController } from '@src/controllers/postController';
import { PostService } from '@src/services/postService';
import { HotPostService } from '@src/services/hotPostService';
import { IUserDocument, User } from '@src/models/user';
import { IPostDocument, Post } from '@src/models/post';
import "@tests/setup";
import redisClient from '@src/config/redis';

// 模擬 Response 對象
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('PostController', () => {
    let testUser: IUserDocument;
    let anotherUser: IUserDocument;
    let controller: PostController;
    let mockPostService: PostService;
    let mockHotPostService: HotPostService;
    let testPost: IPostDocument;

    // 創建測試用戶的工廠函數
    const createTestUser = async (overrides = {}): Promise<IUserDocument> => {
        const userData = {
            accountName: "defaultAccountName",
            userName: "defaultUser",
            email: "default@example.com",
            password: "defaultPassword",
            ...overrides,
        };
        return await User.create(userData);
    };

    beforeAll(() => {
        // 確保在測試環境下運行
        process.env.NODE_ENV = 'test';
    });

    beforeEach(async () => {
        mockPostService = new PostService();
        mockHotPostService = new HotPostService();
        controller = new PostController(mockPostService, mockHotPostService, redisClient);

        // 模擬 HotPostService 的方法
        jest.spyOn(mockHotPostService, 'getHotPosts').mockResolvedValue([]);

        // 創建測試用戶
        testUser = await createTestUser({
            userName: "testuser",
            accountName: "testAccountName",
            email: "test@example.com",
            isPublic: false  // 關鍵修改：設置為非公開
        });

        anotherUser = await createTestUser({
            userName: "anotherUser",
            accountName: "anotherAccountName",
            email: "another@example.com"
        });

        // 創建測試貼文
        testPost = await Post.create({
            user: testUser._id,
            content: "Test post content",
            images: [],
            likesCount: 0,
            comments: []
        });

        // 關聯用戶資訊
        await testPost.populate('user');
    });

    describe('getPersonalPosts', () => {
        it('不應該返回未公開用戶的貼文列表', async () => {
            // 模擬請求對象，包含分頁參數
            const req = {
                query: { limit: '10' },
                params: { userId: testUser._id.toString() },
                user: anotherUser,
            } as unknown as Request;
            const res = mockResponse();

            // 使用 jest.spyOn 監視並模擬 getPersonalPosts 方法的返回值
            jest.spyOn(mockPostService, 'getPersonalPosts').mockResolvedValue([testPost]);

            // 執行測試
            await controller.getPersonalPosts(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ msg: '該使用者未公開個人貼文' });
        });
    });

    describe('getAllPosts', () => {
        it('應該返回分頁的貼文列表', async () => {
            // 模擬請求對象，包含分頁參數
            const req = {
                query: { limit: '10' },
                user: testUser,
            } as unknown as Request;
            const res = mockResponse();

            // 使用 jest.spyOn 監視並模擬 getAllPosts 方法的返回值
            jest.spyOn(mockPostService, 'getAllPosts').mockResolvedValue([testPost]);
            jest.spyOn(mockHotPostService, 'getHotPosts').mockResolvedValue([]);

            // 執行測試
            await controller.getAllPosts(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                posts: [{
                    postId: testPost._id,
                    author: {
                        id: testUser._id,
                        userName: testUser.userName,
                        accountName: testUser.accountName,
                        avatarUrl: testUser.avatarUrl || ""
                    },
                    content: testPost.content,
                    likesCount: 0,
                    commentCount: 0,
                    createdAt: testPost.createdAt,
                    images: [],
                    isLiked: false
                }],
                nextCursor: testPost._id
            });
        });

        // 添加更多測試用例
        it('當無資料時應返回空列表', async () => {
            const req = {
                query: { limit: '10' },
                user: testUser,
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'getAllPosts').mockResolvedValue([]);
            jest.spyOn(mockHotPostService, 'getHotPosts').mockResolvedValue([]);

            await controller.getAllPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                posts: [],
                nextCursor: null
            });
        });

        it('應處理參數驗證', async () => {
            const req = {
                query: { limit: '-1' }, // 無效的限制參數
                user: testUser,
            } as unknown as Request;
            const res = mockResponse();

            await controller.getAllPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ msg: '無效的參數' });
        });
    });

    describe('updatePost', () => {
        it('應該成功更新貼文', async () => {
            // 模擬更新貼文的請求
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Updated content' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            // 模擬服務層方法返回成功
            jest.spyOn(mockPostService, 'updatePost').mockResolvedValue(true);

            // 執行測試
            await controller.updatePost(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('應該回傳 404，當貼文不存在時', async () => {
            // 模擬相同的請求，但服務層返回失敗
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Updated content' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            // 模擬服務層方法返回失敗
            jest.spyOn(mockPostService, 'updatePost').mockResolvedValue(false);

            // 執行測試
            await controller.updatePost(req, res);

            // 驗證回傳 404 狀態碼
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('likePost', () => {
        it('應該成功對貼文按讚', async () => {
            // 模擬按讚請求
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            // 模擬服務層方法返回成功
            jest.spyOn(mockPostService, 'likePost').mockResolvedValue(true);

            // 執行測試
            await controller.likePost(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "已按讚",
                success: true

            });
        });

        it('應該回傳 404，當已經按過讚時', async () => {
            // 模擬重複按讚的請求
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            // 模擬服務層方法返回失敗（已存在的讚）
            jest.spyOn(mockPostService, 'likePost').mockResolvedValue(false);

            // 執行測試
            await controller.likePost(req, res);

            // 驗證返回衝突狀態碼
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('unlikePost', () => {
        it('應該成功取消按讚', async () => {
            // 模擬取消按讚的請求
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            // 模擬服務層方法返回成功
            jest.spyOn(mockPostService, 'unlikePost').mockResolvedValue(true);

            // 執行測試
            await controller.unlikePost(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('addComment', () => {
        it('應該成功新增評論', async () => {
            // 模擬添加評論的請求
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Test comment' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            // 模擬服務層方法返回成功
            jest.spyOn(mockPostService, 'addComment').mockResolvedValue(true);

            // 執行測試
            await controller.addComment(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    afterAll(() => {
        if (mockHotPostService instanceof HotPostService) {
            // 停止 cron job
            mockHotPostService.stop?.();
        }
    });
});