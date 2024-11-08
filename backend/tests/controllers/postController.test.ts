import { Request, Response } from 'express';
import { PostController } from '@src/controllers/postController';
import { PostService } from '@src/services/postService';
import { IUserDocument, User } from '@src/models/user';
import { IPostDocument, Post } from '@src/models/post';
import "@tests/setup";

// 模擬 Express 的 Response 對象
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('PostController', () => {
    let testUser: IUserDocument;
    let controller: PostController;
    let mockPostService: PostService;
    let testPost: IPostDocument;

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

    beforeEach(async () => {
        mockPostService = new PostService();
        controller = new PostController(mockPostService);
        testUser = await createTestUser({
            userName: "testuser",
            accountName: "testAccountName",
            email: "test@example.com",
            password: "password123",
        });

        testPost = await new Post({
            user: testUser._id,
            content: "Test post content"
        }).save();
    });

    describe('getAllPosts', () => {
        it('應該返回分頁的貼文列表', async () => {
            const req = {
                query: { page: '1', limit: '10' }
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'getAllPosts').mockResolvedValue({
                posts: [testPost],
                total: 1
            });

            await controller.getAllPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                posts: expect.any(Array),
                pagination: expect.any(Object)
            }));
        });
    });

    describe('createPost', () => {
        it('應該成功建立新貼文', async () => {
            const req = {
                body: { content: 'Test content' },
                user: testUser
            } as Request;
            const res = mockResponse();

            await controller.createPost(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                msg: "Post created successfully"
            });
        });
    });

    describe('updatePost', () => {
        it('應該成功更新貼文', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Updated content' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'updatePost').mockResolvedValue(true);

            await controller.updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('應該回傳 404，當貼文不存在時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Updated content' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'updatePost').mockResolvedValue(false);

            await controller.updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('likePost', () => {
        it('應該成功對貼文按讚', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'likePost').mockResolvedValue(true);

            await controller.likePost(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                msg: "Post liked successfully"
            });
        });

        it('應該回傳 409，當已經按過讚時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'likePost').mockResolvedValue(false);

            await controller.likePost(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
        });
    });

    describe('unlikePost', () => {
        it('應該成功取消按讚', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'unlikePost').mockResolvedValue(true);

            await controller.unlikePost(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('addComment', () => {
        it('應該成功新增評論', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Test comment' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(mockPostService, 'addComment').mockResolvedValue(true);

            await controller.addComment(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });
});