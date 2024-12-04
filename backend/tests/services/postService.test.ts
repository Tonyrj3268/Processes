// postService.test.ts
import { PostService } from "@src/services/postService";
import { Post, IPostDocument } from "@src/models/post";
import { User, IUserDocument } from "@src/models/user";
import { Comment } from "@src/models/comment";
import { Like } from "@src/models/like";
import { Types } from "mongoose";
import "@tests/setup";

describe("PostService", () => {
    // 定義測試所需的變數
    let postService: PostService;         // 服務實例
    let testUser: IUserDocument;          // 主要測試用戶
    let anotherUser: IUserDocument;       // 用於交互測試的次要用戶
    let testPost: IPostDocument;          // 測試貼文

    /**
     * 創建測試用戶的輔助函數
     * @param overrides - 可選的用戶數據覆蓋對象
     * @returns Promise<IUserDocument> - 返回創建的用戶文檔
     * 
     * 使用展開運算符合併默認值和覆蓋值，
     * 讓測試數據的創建更加靈活且可重用
     */
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

    /**
     * 在所有測試開始前執行一次
     * 初始化 PostService 實例
     */
    beforeAll(() => {
        postService = new PostService();
    });

    /**
     * 在每個測試前執行
     * 創建測試所需的基礎數據：用戶和貼文
     */
    beforeEach(async () => {
        // 創建主要測試用戶
        testUser = await createTestUser({
            userName: "testuser",
            accountName: "testAccountName",
            email: "test@example.com",
            password: "password123",
        });

        // 創建次要測試用戶（用於模擬用戶間互動）
        anotherUser = await createTestUser({
            userName: "anotheruser",
            accountName: "anotherAccountName",
            email: "another@example.com",
            password: "password123",
        });

        // 創建測試貼文
        testPost = await new Post({
            user: testUser._id,
            content: "Test post content",
        }).save();
    });

    describe("getPersonalPosts", () => {
        it("應該返回用戶的貼文列表", async () => {
            // 調用服務方法獲取用戶的貼文列表
            const posts = await postService.getPersonalPosts(1, testUser._id);

            // 驗證返回數據的結構和類型
            expect(posts).toBeDefined();
            expect(Array.isArray(posts)).toBeTruthy();
        });
    });

    describe("getAllPosts", () => {
        it("應該返回貼文列表及總數", async () => {
            // 調用服務方法獲取貼文列表
            const posts = await postService.getAllPosts(1);

            // 驗證返回數據的結構和類型
            expect(posts).toBeDefined();
            expect(Array.isArray(posts)).toBeTruthy();
        });
    });


    describe("createPost", () => {
        it("應該成功建立貼文", async () => {
            const content = "New test post";

            // 調用服務方法創建貼文
            const post = await postService.createPost(testUser._id, content, []);

            // 驗證創建的貼文
            expect(post).toBeDefined();
            expect(post.content).toBe(content);
            expect(post.user.toString()).toBe(testUser._id.toString());
        });
    });

    describe("updatePost", () => {
        it("應該成功更新貼文", async () => {
            // 調用服務方法更新貼文
            const result = await postService.updatePost(
                testPost._id,
                testUser._id,
                "Updated content"
            );

            // 驗證更新操作是否成功
            expect(result).toBe(true);

            // 從數據庫中獲取更新後的貼文並驗證內容
            const updatedPost = await Post.findById(testPost._id);
            expect(updatedPost?.content).toBe("Updated content");
        });

        it("應該在貼文不存在時返回false", async () => {
            // 使用一個不存在的 ObjectId 測試更新操作
            const result = await postService.updatePost(
                new Types.ObjectId(),  // 創建一個新的、不存在的 ObjectId
                testUser._id,
                "Updated content"
            );

            // 驗證操作返回失敗
            expect(result).toBe(false);
        });
    });

    describe("likePost", () => {
        it("應該成功對貼文按讚", async () => {
            // 調用服務方法進行按讚
            const result = await postService.likePost(testPost._id, anotherUser._id);
            expect(result).toBe(true);

            // 驗證數據庫中是否實際創建了點讚記錄
            const like = await Like.findOne({
                target: testPost._id,
                user: anotherUser._id,
            });
            expect(like).toBeDefined();
        });

        it("不應該重複按讚", async () => {
            // 首先創建一個點讚
            const firstLike = await postService.likePost(testPost._id, anotherUser._id);
            expect(firstLike).toBe(true);
            const like = await Like.findOne({
                target: testPost._id,
                user: anotherUser._id,
            });
            expect(like).not.toBeNull();
            // 嘗試重複點讚
            const result = await postService.likePost(testPost._id, anotherUser._id);

            // 驗證重複點讚操作返回失敗
            expect(result).toBe(false);
            const likeCount = await Like.countDocuments({
                target: testPost._id,
                user: anotherUser._id,
            });
            expect(likeCount).toBe(1);
        });
    });

    describe("unlikePost", () => {
        /**
         * 在每個取消讚的測試前
         * 先建立一個已存在的讚
         */
        beforeEach(async () => {
            await postService.likePost(testPost._id, anotherUser._id);
        });

        it("應該成功取消按讚", async () => {
            // 調用服務方法取消讚
            const result = await postService.unlikePost(testPost._id, anotherUser._id);
            expect(result).toBe(true);

            // 驗證數據庫中的讚記錄已被刪除
            const like = await Like.findOne({
                target: testPost._id,
                user: anotherUser._id,
            });
            expect(like).toBeNull();
        });
    });

    describe("addComment", () => {
        it("應該成功新增評論", async () => {
            // 調用服務方法新增評論
            const result = await postService.addComment(
                testPost._id,
                anotherUser._id,
                "Test comment"
            );

            // 驗證評論新增操作成功
            expect(result).toBe(true);
            // 驗證數據庫中是否實際創建了評論
            const comment = await Comment.findOne({
                user: anotherUser._id
            });
            expect(comment).toBeDefined();
            expect(comment?.content).toBe("Test comment");
        });
    });
});