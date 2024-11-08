import { PostService } from "@src/services/postService";
import { Post, IPostDocument } from "@src/models/post";
import { User, IUserDocument } from "@src/models/user";
import { Comment } from "@src/models/comment";
import { Like } from "@src/models/like";
import { Types } from "mongoose";
import "@tests/setup";

describe("PostService", () => {
    let postService: PostService;
    let testUser: IUserDocument;
    let anotherUser: IUserDocument;
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

        testPost = await new Post({
            user: testUser._id,
            content: "Test post content",
        }).save();
    });

    describe("getAllPosts", () => {
        it("應該返回貼文列表及總數", async () => {
            const { posts, total } = await postService.getAllPosts(1, 10);
            expect(posts).toBeDefined();
            expect(total).toBeDefined();
            expect(Array.isArray(posts)).toBeTruthy();
        });
    });

    describe("createPost", () => {
        it("應該成功建立貼文", async () => {
            const content = "New test post";
            const post = await postService.createPost(testUser._id, content);

            expect(post).toBeDefined();
            expect(post.content).toBe(content);
            expect(post.user.toString()).toBe(testUser._id.toString());
        });
    });

    describe("updatePost", () => {
        it("應該成功更新貼文", async () => {
            const result = await postService.updatePost(
                testPost._id,
                testUser._id,
                "Updated content"
            );

            expect(result).toBe(true);
            const updatedPost = await Post.findById(testPost._id);
            expect(updatedPost?.content).toBe("Updated content");
        });

        it("應該在貼文不存在時返回false", async () => {
            const result = await postService.updatePost(
                new Types.ObjectId(),
                testUser._id,
                "Updated content"
            );

            expect(result).toBe(false);
        });
    });

    describe("likePost", () => {
        it("應該成功對貼文按讚", async () => {
            const result = await postService.likePost(testPost._id, anotherUser._id);
            expect(result).toBe(true);

            const like = await Like.findOne({
                target: testPost._id,
                user: anotherUser._id,
            });
            expect(like).toBeDefined();
        });

        it("不應該重複按讚", async () => {
            await postService.likePost(testPost._id, anotherUser._id);
            const result = await postService.likePost(testPost._id, anotherUser._id);
            expect(result).toBe(false);
        });
    });

    describe("unlikePost", () => {
        beforeEach(async () => {
            await postService.likePost(testPost._id, anotherUser._id);
        });

        it("應該成功取消按讚", async () => {
            const result = await postService.unlikePost(testPost._id, anotherUser._id);
            expect(result).toBe(true);

            const like = await Like.findOne({
                target: testPost._id,
                user: anotherUser._id,
            });
            expect(like).toBeNull();
        });
    });

    describe("addComment", () => {
        it("應該成功新增評論", async () => {
            const result = await postService.addComment(
                testPost._id,
                anotherUser._id,
                "Test comment"
            );

            expect(result).toBe(true);

            const comment = await Comment.findOne({
                post: testPost._id,
                user: anotherUser._id
            });
            expect(comment).toBeDefined();
            expect(comment?.content).toBe("Test comment");
        });
    });
});