import { PostService } from "@src/services/postService";
import { Post, IPostDocument } from "@src/models/post";
import { User, IUserDocument } from "@src/models/user";
import { Comment } from "@src/models/comment";
import { Like } from "@src/models/like";
import { Event } from "@src/models/events";
import { Types } from "mongoose";
import "@tests/setup";

describe("PostService with MongoMemoryServer", () => {
    let postService: PostService;
    let testUser: IUserDocument;
    let anotherUser: IUserDocument;
    let testPost: IPostDocument;

    // 工廠函數來創建用戶
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
    const createTestPost = async (user: IUserDocument, content: string = "Test post content"): Promise<IPostDocument> => {
        const post = new Post({
            user: user._id,
            content,
            comments: [],
        });
        await post.save();
        return post;
    };

    beforeAll(() => {
        postService = new PostService();
    });

    beforeEach(async () => {
        testUser = await createTestUser({
            userName: "testuser",
            accountName: "testAccountName",
            email: "test@example.com",
            password: "password123",
        });

        anotherUser = await createTestUser({
            userName: "anotheruser",
            accountName: "anotherAccountName",
            email: "another@example.com",
            password: "password123",
        });

        testPost = await createTestPost(testUser);
    });

    describe("getAllPosts", () => {
        it("應該返回所有貼文", async () => {
            const posts = await postService.getAllPosts();

            expect(posts).toHaveLength(1); // including testPost
        });
    });

    describe("createPost", () => {
        it("應該成功創建貼文", async () => {
            const content = "New test post";
            const newPost = await postService.createPost(testUser._id, content);

            expect(newPost).toBeDefined();
            expect(newPost.content).toBe(content);
            expect(newPost.user.toString()).toBe(testUser._id.toString());
        });

        it("應該在創建貼文時拋出錯誤如果內容為空", async () => {
            await expect(postService.createPost(testUser._id, ""))
                .rejects
                .toThrow();
        });
    });

    describe("updatePost", () => {
        it("應該成功更新貼文", async () => {
            const newContent = "Updated content";
            const updatedPost = await postService.updatePost(
                testPost._id,
                testUser._id,
                newContent
            );

            expect(updatedPost).toBeDefined();
            expect(updatedPost!.content).toBe(newContent);
        });

        it("當用戶嘗試更新不屬於他們的貼文時應該返回null", async () => {
            const newContent = "Trying to update";
            const updatedPost = await postService.updatePost(
                testPost._id,
                anotherUser._id,
                newContent
            );

            expect(updatedPost).toBeNull();
        });
    });

    describe("deletePost", () => {
        it("應該成功刪除貼文及其相關數據", async () => {
            // 創建相關數據
            await postService.likePost(testPost._id, anotherUser._id);
            await postService.addComment(testPost._id, anotherUser._id, "Test comment");

            const result = await postService.deletePost(testPost._id, testUser._id);

            expect(result).toBe(true);

            // 驗證貼文和相關數據是否已刪除
            const deletedPost = await Post.findById(testPost._id);
            const comments = await Comment.find({ post: testPost._id });
            const likes = await Like.find({ target: testPost._id, targetModel: 'Post' });
            const events = await Event.find({ 'details.postId': testPost._id });

            expect(deletedPost).toBeNull();
            expect(comments).toHaveLength(0);
            expect(likes).toHaveLength(0);
            expect(events).toHaveLength(0);
        });

        it("當用戶嘗試刪除不屬於他們的貼文時應該返回false", async () => {
            const result = await postService.deletePost(testPost._id, anotherUser._id);
            expect(result).toBe(false);

            // 驗證貼文是否仍然存在
            const post = await Post.findById(testPost._id);
            expect(post).not.toBeNull();
        });
    });

    describe("likePost", () => {
        it("應該成功點讚貼文", async () => {
            const result = await postService.likePost(testPost._id, anotherUser._id);

            expect(result).toBe(true);

            // 驗證點讚記錄
            const like = await Like.findOne({
                target: testPost._id,
                user: anotherUser._id,
                targetModel: 'Post'
            });
            expect(like).not.toBeNull();

            // 驗證貼文的讚數是否增加
            const updatedPost = await Post.findById(testPost._id);
            expect(updatedPost!.likesCount).toBe(1);

            // 驗證是否創建了通知事件
            const event = await Event.findOne({
                sender: anotherUser._id,
                receiver: testUser._id,
                eventType: 'like',
                'details.postId': testPost._id
            });
            expect(event).not.toBeNull();
        });

        it("不應該允許重複點讚", async () => {
            // 首次點讚
            await postService.likePost(testPost._id, anotherUser._id);

            // 嘗試重複點讚
            const result = await postService.likePost(testPost._id, anotherUser._id);
            expect(result).toBe(false);

            // 驗證點讚數量沒有增加
            const likes = await Like.find({
                target: testPost._id,
                user: anotherUser._id
            });
            expect(likes).toHaveLength(1);

            const post = await Post.findById(testPost._id);
            expect(post!.likesCount).toBe(1);
        });
    });

    describe("unlikePost", () => {
        beforeEach(async () => {
            // 先建立點讚
            await postService.likePost(testPost._id, anotherUser._id);
        });

        it("應該成功取消點讚", async () => {
            const result = await postService.unlikePost(testPost._id, anotherUser._id);

            expect(result).toBe(true);

            // 驗證點讚記錄已刪除
            const like = await Like.findOne({
                target: testPost._id,
                user: anotherUser._id
            });
            expect(like).toBeNull();

            // 驗證貼文的讚數是否減少
            const updatedPost = await Post.findById(testPost._id);
            expect(updatedPost!.likesCount).toBe(0);

            // 驗證通知事件是否被刪除
            const event = await Event.findOne({
                sender: anotherUser._id,
                receiver: testUser._id,
                eventType: 'like',
                'details.postId': testPost._id
            });
            expect(event).toBeNull();
        });

        it("當取消不存在的點讚時應該返回false", async () => {
            // 先取消一次點讚
            await postService.unlikePost(testPost._id, anotherUser._id);

            // 再次嘗試取消
            const result = await postService.unlikePost(testPost._id, anotherUser._id);
            expect(result).toBe(false);
        });
    });

    describe("addComment", () => {
        it("應該成功新增評論", async () => {
            const commentContent = "Test comment";
            const comment = await postService.addComment(
                testPost._id,
                anotherUser._id,
                commentContent
            );

            expect(comment!.content).toBe(commentContent);
            expect(comment!.user.toString()).toBe(anotherUser._id.toString());

            // 驗證貼文是否包含評論
            const updatedPost = await Post.findById(testPost._id);
            expect(updatedPost!.comments).toHaveLength(1);

            // 驗證是否創建了通知事件
            const event = await Event.findOne({
                sender: anotherUser._id,
                receiver: testUser._id,
                eventType: 'comment',
                'details.postId': testPost._id,
                'details.commentId': comment!._id
            });
            expect(event).not.toBeNull();
        });

        it("當貼文不存在時應該返回null", async () => {
            const nonExistentPostId = new Types.ObjectId();
            const comment = await postService.addComment(
                nonExistentPostId,
                anotherUser._id,
                "Test comment"
            );

            expect(comment).toBeNull();
        });
    });
});