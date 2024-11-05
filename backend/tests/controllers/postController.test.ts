import { Request, Response } from 'express';
import { PostController } from '@src/controllers/postController';
import { PostService } from '@src/services/postService';
import { Types } from 'mongoose';
import { IUserDocument, User } from '@src/models/user';
import { IPostDocument, Post } from '@src/models/post';
import "@tests/setup";


// 模擬 Express 的 Response 對象
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
    return res as Response;
};

describe('PostController', () => {
    let testUser: IUserDocument;
    let postController: PostController;
    let postService: PostService;
    let testPost: IPostDocument;

    const createTestUser = async (overrides = {}): Promise<IUserDocument> => {
        const userData = {
            userName: "defaultUser",
            accountName: "defaultAccountName",
            email: "default@example.com",
            password: "defaultPassword",
            ...overrides,
        };
        const user = new User(userData);
        await user.save();
        return user;
    };

    // 工廠函數來創建貼文
    const createTestPost = async (user: IUserDocument, content: string = "Test post content") => {
        const post = new Post({
            user: user._id,
            content,
        });
        await post.save();
        return post;
    };

    beforeEach(async () => {
        postService = new PostService();
        postController = new PostController(postService);
        // Create mock user
        testUser = await createTestUser()

        testPost = await createTestPost(testUser);

    });
    describe('getAllPosts', () => {
        it('應該返回所有貼文，當成功獲取時', async () => {
            const req = {} as Request;
            const res = mockResponse();

            await postController.getAllPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            // 修改測試預期結果以匹配實際回傳格式
            expect(res.json).toHaveBeenCalledWith({
                posts: expect.arrayContaining([
                    expect.objectContaining({
                        _id: testPost._id,
                        comments: testPost.comments,
                        content: testPost.content,
                        createdAt: testPost.createdAt,
                        likesCount: testPost.likesCount,
                        updatedAt: testPost.updatedAt,
                        user: expect.objectContaining({
                            _id: testUser._id,
                            accountName: testUser.accountName,
                            userName: testUser.userName,
                        })
                    })
                ])
            });
        });
        it('應該回傳 500，當發生伺服器錯誤時', async () => {
            const req = {} as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'getAllPosts')
                .mockRejectedValue(new Error('Database error'));

            await postController.getAllPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ msg: '伺服器錯誤' });
        });
    });
    describe('createPost', () => {
        it('應該成功建立貼文', async () => {
            const req = {
                body: { content: 'Test post content' },
                user: testUser
            } as Request;
            const res = mockResponse();
            await postController.createPost(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                msg: '貼文建立成功',
                post: expect.objectContaining({
                    _id: expect.any(Types.ObjectId),
                    content: 'Test post content',
                    user: testUser._id
                })
            });
        });

        it('應該回傳 500，當發生伺服器錯誤時', async () => {
            const req = {
                body: { content: 'Test post content' },
                user: testUser
            } as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'createPost')
                .mockRejectedValue(new Error('Database error'));

            await postController.createPost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ msg: '伺服器錯誤' });
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

            await postController.updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                msg: '貼文更新成功',
                post: expect.objectContaining({
                    content: 'Updated content'
                })
            });
        });

        it('應該回傳 404，當貼文不存在或無權限時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Updated content' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'updatePost').mockResolvedValue(null);

            await postController.updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                msg: '貼文不存在或無權限修改'
            });
        });
    });

    describe('deletePost', () => {
        it('應該成功刪除貼文', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'deletePost').mockResolvedValue(true);

            await postController.deletePost(req, res);

            expect(postService.deletePost).toHaveBeenCalledWith(
                expect.any(Types.ObjectId),
                testUser._id
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ msg: '貼文刪除成功' });
        });

        it('應該回傳 404，當貼文不存在或無權限時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'deletePost').mockResolvedValue(false);

            await postController.deletePost(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ msg: '貼文不存在或無權限刪除' });
        });

        it('應該回傳 500，當發生伺服器錯誤時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'deletePost')
                .mockRejectedValue(new Error('Database error'));

            await postController.deletePost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ msg: '伺服器錯誤' });
        });
    });

    describe('likePost', () => {
        it('應該成功點讚貼文', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'likePost').mockResolvedValue(true);

            await postController.likePost(req, res);

            expect(postService.likePost).toHaveBeenCalledWith(
                expect.any(Types.ObjectId),
                testUser._id
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ msg: '貼文點讚成功' });
        });

        it('應該回傳 409，當貼文已被點讚時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'likePost').mockResolvedValue(false);

            await postController.likePost(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ msg: '貼文不存在或已經點讚' });
        });

        it('應該回傳 500，當發生伺服器錯誤時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'likePost')
                .mockRejectedValue(new Error('Database error'));

            await postController.likePost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ msg: '伺服器錯誤' });
        });
    });

    describe('unlikePost', () => {
        it('應該成功取消點讚', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'unlikePost').mockResolvedValue(true);

            await postController.unlikePost(req, res);

            expect(postService.unlikePost).toHaveBeenCalledWith(
                expect.any(Types.ObjectId),
                testUser._id
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ msg: '取消貼文點讚成功' });
        });

        it('應該回傳 409，當貼文尚未被點讚時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'unlikePost').mockResolvedValue(false);

            await postController.unlikePost(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ msg: '貼文不存在或尚未點讚' });
        });

        it('應該回傳 500，當發生伺服器錯誤時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'unlikePost')
                .mockRejectedValue(new Error('Database error'));

            await postController.unlikePost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ msg: '伺服器錯誤' });
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

            await postController.addComment(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                msg: '評論新增成功',
                comment: expect.objectContaining({
                    _id: expect.any(Types.ObjectId),
                    content: 'Test comment',
                    user: testUser._id,
                    createdAt: expect.any(Date)
                })
            });
        });

        it('應該回傳 404，當貼文不存在時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Test comment' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'addComment').mockResolvedValue(null);

            await postController.addComment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ msg: '貼文不存在' });
        });

        it('應該回傳 500，當發生伺服器錯誤時', async () => {
            const req = {
                params: { postId: testPost._id.toString() },
                body: { content: 'Test comment' },
                user: testUser
            } as unknown as Request;
            const res = mockResponse();

            jest.spyOn(postService, 'addComment')
                .mockRejectedValue(new Error('Database error'));

            await postController.addComment(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ msg: '伺服器錯誤' });
        });
    });
});