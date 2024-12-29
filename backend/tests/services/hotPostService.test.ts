// tests/services/hotPostService.test.ts
import { HotPostService } from '@src/services/hotPostService';
import { Post } from '@src/models/post';
import { User, IUserDocument } from '@src/models/user';
import { Types } from 'mongoose';
import redisClient from '@src/config/redis';
import "@tests/setup";

describe('HotPostService', () => {
    let hotPostService: HotPostService;
    let testUser: IUserDocument;

    // 創建測試用戶的輔助函數
    const createTestUser = async (overrides = {}) => {
        const userData = {
            userName: "testuser",
            accountName: "testAccountName",
            email: "test@example.com",
            password: "password123",
            avatarUrl: "test.jpg",
            ...overrides
        };
        return await User.create(userData);
    };

    // 創建測試貼文的輔助函數
    const createTestPost = async (userId: Types.ObjectId, likesCount: number = 0) => {
        return await Post.create({
            user: userId,
            content: `Test post content ${Date.now()}`,
            likesCount,
            comments: [],
            createdAt: new Date(),
            images: []
        });
    };

    beforeEach(async () => {
        // 創建測試用戶
        testUser = await createTestUser();
        hotPostService = new HotPostService();
        // 清空 Redis 緩存
        await redisClient.del('hot:posts');
    });

    describe('getHotPosts', () => {
        it('應該從 Redis 返回熱門貼文（如果存在）', async () => {
            // 準備測試數據
            const mockPost = await Post.create({
                content: 'Hot post content',
                user: testUser._id,
                likesCount: 100,
                comments: [],
                images: []
            });

            const mockPosts = [{
                ...mockPost.toObject(),
                user: testUser.toObject()
            }];

            // 將測試數據存入 Redis
            await redisClient.setex('hot:posts', 600, JSON.stringify(mockPosts));

            // 執行測試
            const result = await hotPostService.getHotPosts();

            // 驗證結果
            expect(result).toHaveLength(1);
            const post = result[0];
            expect(post).toBeDefined();
            expect(post).toMatchObject({
                content: 'Hot post content',
                likesCount: 100,
                user: expect.objectContaining({
                    _id: expect.any(String),
                    userName: testUser.userName,
                    accountName: testUser.accountName,
                }),
            });
        });

        it('應該在 Redis 緩存不存在時返回空數組', async () => {
            const result = await hotPostService.getHotPosts();
            expect(result).toEqual([]);
        });
    });

    describe('updateHotPosts', () => {
        it('應該更新熱門貼文列表並緩存到 Redis', async () => {
            // 創建多個測試貼文，帶有不同的點讚數
            await createTestPost(testUser._id, 100);
            await createTestPost(testUser._id, 50);
            await createTestPost(testUser._id, 200);

            // 執行更新
            await hotPostService.updateHotPosts();

            // 從 Redis 獲取更新後的列表
            const cachedData = await redisClient.get('hot:posts');
            expect(cachedData).not.toBeNull();

            const hotPosts = JSON.parse(cachedData!);

            // 驗證排序
            expect(hotPosts).toHaveLength(3);
            expect(hotPosts[0].likesCount).toBeGreaterThanOrEqual(hotPosts[1].likesCount);
            expect(hotPosts[1].likesCount).toBeGreaterThanOrEqual(hotPosts[2].likesCount);
        });

        it('應該在沒有貼文時正確處理', async () => {
            await hotPostService.updateHotPosts();

            const cachedData = await redisClient.get('hot:posts');
            expect(cachedData).not.toBeNull();

            const hotPosts = JSON.parse(cachedData!);
            expect(hotPosts).toHaveLength(0);
        });
    });

    describe('服務生命週期', () => {
        it('應該在非測試環境下啟動排程任務', () => {
            // 暫時修改環境變數
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const service = new HotPostService();
            // @ts-expect-error 訪問私有屬性進行測試
            expect(service.cronJob).toBeDefined();

            // 清理
            process.env.NODE_ENV = originalEnv;
            service.stop();
        });

        it('應該在測試環境下不啟動排程任務', () => {
            process.env.NODE_ENV = 'test';
            const service = new HotPostService();
            // @ts-expect-error 訪問私有屬性進行測試
            expect(service.cronJob).toBeUndefined();
        });
    });

    afterAll(() => {
        // 確保停止所有排程任務
        hotPostService.stop();
    });
});