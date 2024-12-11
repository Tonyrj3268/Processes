// postController.test.ts
import { Request, Response } from 'express';
import { PostController } from '@src/controllers/postController';
import { PostService } from '@src/services/postService';
import { IUserDocument, User } from '@src/models/user';
import { IPostDocument, Post } from '@src/models/post';
import "@tests/setup";
import { Types } from 'mongoose';
import redisClient from '@src/config/redis';

/**
 * 創建模擬的 Express Response 對象
 * 使用 Partial<Response> 允許我們只實現需要的方法
 * 返回一個帶有模擬 status 和 json 方法的 Response 對象
 * mockReturnValue(res) 使方法調用可以鏈式操作
 */
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('PostController', () => {
    // 定義測試所需的變數
    let testUser: IUserDocument;          // 測試用戶
    let anotherUser: IUserDocument;       // 用於交互測試的次要用戶
    let controller: PostController;        // 控制器實例
    let mockPostService: PostService;      // 模擬的 PostService
    let testPost: IPostDocument;          // 測試貼文

    /**
     * 創建測試用戶的輔助函數
     * @param overrides - 可選的用戶數據覆蓋對象
     * @returns Promise<IUserDocument> - 返回創建的用戶文檔
     * 
     * 使用展開運算符 (...) 合併默認值和覆蓋值，
     * 允許靈活地創建不同的測試用戶數據
     */
    const createTestUser = async (overrides = {}): Promise<IUserDocument> => {
        const userData = {
            accountName: "defaultAccountName",
            userName: "defaultUser",
            email: "default@example.com",
            password: "defaultPassword",
            ...overrides,
        };
        const user = new User(userData);
        await user.save();
        return user;
    };

    /**
     * 在每個測試前執行的設置
     * 初始化測試環境，創建必要的測試數據
     */
    beforeEach(async () => {
        // 創建新的服務和控制器實例
        mockPostService = new PostService();
        controller = new PostController(mockPostService, redisClient);

        // 創建測試用戶
        testUser = await createTestUser({
            userName: "testuser",
            accountName: "testAccountName",
            email: "test@example.com",
            password: "password123",
            avatarUrl: "test-avatar.jpg",
            isPublic: false
        });

        anotherUser = await createTestUser({
            userName: "anotheruser",
            accountName: "anotherAccountName",
            email: "another@example.com",
            password: "password123",
            avatarUrl: "another-avatar.jpg"
        });

        // 創建測試貼文
        testPost = await new Post({
            user: testUser._id,
            content: "Test post content"
        }).save();
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
                query: { page: '1', limit: '10' },
                user: testUser,
            } as unknown as Request;
            const res = mockResponse();

            // 使用 jest.spyOn 監視並模擬 getAllPosts 方法的返回值
            jest.spyOn(mockPostService, 'getAllPosts').mockResolvedValue([testPost]);

            // 執行測試
            await controller.getAllPosts(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                "posts": expect.arrayContaining([
                    expect.objectContaining({
                        postId: testPost._id,
                        author: expect.objectContaining({
                            id: testUser._id,
                            accountName: undefined,
                            userName: undefined,
                            avatarUrl: undefined
                        }),
                        content: testPost.content,
                        likesCount: 0,
                        commentCount: 0,
                        createdAt: testPost.createdAt
                    })
                ]),
                nextCursor: expect.any(Types.ObjectId)
            }));
        });
    });

    describe('createPost', () => {
        it('應該成功建立新貼文', async () => {
            // 模擬帶有用戶信息和貼文內容的請求
            const req = {
                body: { content: 'Test content' },
                user: testUser
            } as Request;
            const res = mockResponse();

            // 執行測試
            await controller.createPost(req, res);

            // 驗證響應
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ msg: 'Post created successfully', post: expect.any(Object) })
            );
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
});