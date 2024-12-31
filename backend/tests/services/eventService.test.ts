// tests/services/eventService.test.ts
import { EventService } from '@src/services/eventService';
import { Event } from '@src/models/event';
import { User, IUserDocument } from '@src/models/user';
import { Types } from 'mongoose';
import "@tests/setup";
import redisClient from '@src/config/redis';

// 模擬 Elasticsearch
jest.mock('@src/config/elasticsearch', () => ({
    indices: {
        exists: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue({}),
    },
    index: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
}));

describe('EventService', () => {
    let eventService: EventService;
    let sender: IUserDocument;
    let receiver: IUserDocument;

    // 創建測試用戶的輔助函數
    const createTestUser = async (overrides = {}) => {
        const defaultData = {
            userName: "defaultUser",
            accountName: "defaultAccount",
            email: "default@example.com",
            password: "password123",
        };
        return await User.create({ ...defaultData, ...overrides });
    };

    // 創建測試事件的輔助函數
    const createTestEvent = async (
        type: "follow" | "comment" | "like" | "friend_request",
        details: Record<string, unknown> = {}
    ) => {
        const eventData = {
            sender: sender._id,
            receiver: receiver._id,
            eventType: type,
            details,
            timestamp: new Date()
        };
        return await Event.create(eventData);
    };

    beforeAll(() => {
        eventService = new EventService(redisClient);
    });

    beforeEach(async () => {
        // 創建測試用戶
        sender = await createTestUser({
            userName: "sender",
            accountName: "senderAccount",
            email: "sender@example.com"
        });

        receiver = await createTestUser({
            userName: "receiver",
            accountName: "receiverAccount",
            email: "receiver@example.com"
        });
    });

    describe('getEvents', () => {
        beforeEach(async () => {
            // 創建多種類型的測試事件
            await createTestEvent("follow");
            await createTestEvent("comment", {
                commentId: new Types.ObjectId().toString(),
                commentText: "Test comment",
                postId: new Types.ObjectId().toString(),
                postText: "Test post"
            });
            await createTestEvent("like", {
                contentId: new Types.ObjectId().toString(),
                contentType: "post",
                contentText: "Liked content"
            });
        });

        it('應該返回用戶的所有事件', async () => {
            const events = await eventService.getEvents(receiver._id);

            expect(events).toHaveLength(3);
            expect(events[0].sender._id.toString()).toBe(sender._id.toString());
            expect(events[0].receiver._id.toString()).toBe(receiver._id.toString());
        });

        it('應該按時間倒序排列事件', async () => {
            const events = await eventService.getEvents(receiver._id);

            for (let i = 0; i < events.length - 1; i++) {
                const currentTime = new Date(events[i].timestamp).getTime();
                const nextTime = new Date(events[i + 1].timestamp).getTime();
                expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }
        });

        it('應該正確填充發送者和接收者資訊', async () => {
            const events = await eventService.getEvents(receiver._id);

            events.forEach(event => {
                // 檢查發送者資訊
                expect(event.sender).toHaveProperty('accountName', 'senderAccount');
                expect(event.sender).toHaveProperty('avatarUrl');
                // 檢查接收者資訊
                expect(event.receiver).toHaveProperty('accountName', 'receiverAccount');
                expect(event.receiver).toHaveProperty('avatarUrl');
            });
        });
    });

    describe('createEvent', () => {
        it('應該成功創建 follow 事件', async () => {
            await eventService.createEvent(
                sender._id,
                receiver._id,
                "follow",
                {}
            );

            const event = await Event.findOne({
                sender: sender._id,
                receiver: receiver._id,
                eventType: "follow"
            });

            expect(event).toBeDefined();
            expect(event?.eventType).toBe("follow");
        });

        it('應該成功創建帶詳細資訊的 comment 事件', async () => {
            const details = {
                commentId: new Types.ObjectId().toString(),
                commentText: "Test comment",
                postId: new Types.ObjectId().toString(),
                postText: "Test post"
            };

            await eventService.createEvent(
                sender._id,
                receiver._id,
                "comment",
                details
            );

            const event = await Event.findOne({
                sender: sender._id,
                receiver: receiver._id,
                eventType: "comment"
            });

            expect(event).toBeDefined();
            expect(event?.details).toMatchObject(details);
        });

        it('創建 comment 事件時缺少必要字段應拋出錯誤', async () => {
            const incompleteDetails = {
                commentText: "Test comment",
                // 缺少 commentId, postId, postText
            };

            await expect(
                eventService.createEvent(
                    sender._id,
                    receiver._id,
                    "comment",
                    incompleteDetails
                )
            ).rejects.toThrow(/Missing required detail field/);
        });
    });
});