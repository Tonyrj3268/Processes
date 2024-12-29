// tests/services/postService.test.ts
import { PostService } from "@src/services/postService";
import { User, IUserDocument } from "@src/models/user";
import { Post, IPostDocument } from "@src/models/post";
import { Types } from "mongoose";
import "@tests/setup";

// 模擬 Elasticsearch
jest.mock('@src/config/elasticsearch', () => ({
    indices: {
        exists: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue({}),
    },
    index: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
}));

describe("PostService", () => {
    let postService: PostService;
    let testUser: IUserDocument;
    let testPost: IPostDocument;

    // 輔助函數：創建測試用戶
    const createTestUser = async (overrides = {}) => {
        const userData = {
            userName: "testUser",
            accountName: "testAccount",
            email: "test@example.com",
            password: "password123",
            ...overrides
        };
        const user = new User(userData);
        return await user.save();
    };

    // 輔助函數：創建測試貼文
    const createTestPost = async (userId: Types.ObjectId, overrides = {}) => {
        const postData = {
            user: userId,
            content: "Test post content",
            images: [],
            ...overrides
        };
        const post = new Post(postData);
        return await post.save();
    };

    beforeAll(() => {
        postService = new PostService();
    });

    beforeEach(async () => {
        // 創建測試用戶和測試貼文
        testUser = await createTestUser();
        testPost = await createTestPost(testUser._id);
    });

    describe("getPersonalPosts", () => {
        it("應該返回用戶的所有貼文", async () => {
            // 創建多個測試貼文
            await createTestPost(testUser._id, { content: "Second post" });
            await createTestPost(testUser._id, { content: "Third post" });

            const posts = await postService.getPersonalPosts(testUser._id);

            expect(posts).toHaveLength(3);
            expect(posts[0].user.toString()).toBe(testUser._id.toString());
        });

        it("不應該返回其他用戶的貼文", async () => {
            const anotherUser = await createTestUser({
                email: "another@example.com",
                accountName: "anotherAccount"
            });
            await createTestPost(anotherUser._id);

            const posts = await postService.getPersonalPosts(testUser._id);

            expect(posts.every(post => post.user.toString() === testUser._id.toString())).toBe(true);
        });
    });

    describe("createPost", () => {
        it("應該成功創建貼文", async () => {
            const content = "New test post";
            const images = ["image1.jpg", "image2.jpg"];

            const newPost = await postService.createPost(testUser._id, content, images);

            expect(newPost).toBeDefined();
            expect(newPost.content).toBe(content);
            expect(newPost.images).toEqual(images);
            expect(newPost.user._id.toString()).toBe(testUser._id.toString());
        });

        it("內容超過限制時應該拋出錯誤", async () => {
            const longContent = "a".repeat(281); // 超過 280 字元限制

            await expect(
                postService.createPost(testUser._id, longContent, [])
            ).rejects.toThrow();
        });
    });

    describe("updatePost", () => {
        it("應該成功更新貼文", async () => {
            const newContent = "Updated content";
            const newImages = ["newImage.jpg"];

            const result = await postService.updatePost(
                testPost._id,
                testUser._id,
                newContent,
                newImages
            );

            expect(result).toBe(true);
            const updatedPost = await Post.findById(testPost._id);
            expect(updatedPost?.content).toBe(newContent);
            expect(updatedPost?.images).toEqual(newImages);
        });

        it("不應該允許其他用戶更新貼文", async () => {
            const anotherUser = await createTestUser({
                email: "another@example.com",
                accountName: "anotherAccount"
            });

            const result = await postService.updatePost(
                testPost._id,
                anotherUser._id,
                "Unauthorized update"
            );

            expect(result).toBe(false);
        });
    });

    describe("deletePost", () => {
        it("應該成功刪除貼文", async () => {
            const result = await postService.deletePost(testPost._id, testUser._id);

            expect(result).toBe(true);
            const deletedPost = await Post.findById(testPost._id);
            expect(deletedPost).toBeNull();
        });

        it("不應該允許其他用戶刪除貼文", async () => {
            const anotherUser = await createTestUser({
                email: "another@example.com",
                accountName: "anotherAccount"
            });

            const result = await postService.deletePost(testPost._id, anotherUser._id);

            expect(result).toBe(false);
            const post = await Post.findById(testPost._id);
            expect(post).not.toBeNull();
        });
    });
});