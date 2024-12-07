// tests/services/eventService.test.ts
import { EventService } from '@src/services/eventService';
import { Event, IEventDocument } from '@src/models/event';
import { User, IUserDocument } from '@src/models/user';
import { Types } from 'mongoose';
import "@tests/setup";

describe('EventService', () => {
    let eventService: EventService;
    let receiver: IUserDocument;
    let sender: IUserDocument;

    const createTestEvent = async (eventType: string, overrides = {}): Promise<IEventDocument> => {

        // 根據事件類型填充 `details`
        let details = new Map<string, unknown>();
        switch (eventType) {
            case "follow":
                details.set("followerId", sender._id.toString());
                details.set("followerName", sender.userName);
                break;
            case "comment":
                details.set("commentId", new Types.ObjectId().toString());
                details.set("postId", new Types.ObjectId().toString());
                details.set("commentText", "This is a test comment");
                break;
            case "like":
                details.set("postId", new Types.ObjectId().toString());
                details.set("likeType", "post");
                break;
            case "friend_request":
                details.set("senderId", sender._id.toString());
                details.set("senderName", sender.userName);
                break;
            default:
                break;
        }

        const eventData = {
            sender: sender._id,
            receiver: receiver._id,
            eventType,
            details,
            timestamp: new Date(),
            ...overrides,
        };

        const event = new Event(eventData);
        await event.save();
        return event;
    };

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
    beforeAll(() => {
        eventService = new EventService();
    });

    beforeEach(async () => {
        receiver = await createTestUser({
            userName: "receiver",
            accountName: "receiverAccountName",
            email: "receiver@example.com",
            password: "password123",
            avatarUrl: "https://example.com/avatar.jpg",
        });
        sender = await createTestUser({
            userName: "sender",
            accountName: "senderAccountName",
            email: "sender@example.com",
            password: "password123",
            avatarUrl: "https://example.com/avatar.jpg",
        });
    });

    describe('getEvents', () => {
        beforeEach(async () => {
            await createTestEvent("follow", { sender: sender._id, receiver: receiver._id, eventType: 'follow' });
            await createTestEvent("comment", { sender: sender._id, receiver: receiver._id, eventType: 'comment' });
        });
        it('應返回帶有完整 sender 和 receiver 信息的事件列表', async () => {
            const result = await eventService.getEvents(receiver._id);

            expect(result).toHaveLength(2);

            const firstNotification = result[0];

            expect(firstNotification.sender).toHaveProperty("accountName", "senderAccountName");
            expect(firstNotification.sender).toHaveProperty("avatarUrl", "https://example.com/avatar.jpg");
            expect(firstNotification.receiver).toHaveProperty("accountName", "receiverAccountName");
            expect(firstNotification.receiver).toHaveProperty("avatarUrl", "https://example.com/avatar.jpg");

            expect(firstNotification.eventType).toBe('comment');
            expect(firstNotification.details).toMatchObject({
                commentId: expect.any(String),
                postId: expect.any(String),
                commentText: "This is a test comment",
            });
        });

        it('當無任何事件時應返回空列表', async () => {
            await Event.deleteMany(); // 清空事件集合

            const result = await eventService.getEvents(receiver._id);
            expect(result).toHaveLength(0);
        });
    });

    describe('createEvent', () => {
        it('應成功創建 comment 事件，並驗證 details 欄位', async () => {
            const details = {
                commentText: "This is a test comment",
                postId: new Types.ObjectId().toString(),
                commentId: new Types.ObjectId().toString(),
            };

            await eventService.createEvent(sender._id, receiver._id, "comment", details);

            const createdEvent = await Event.findOne({ eventType: "comment" }).lean();

            expect(createdEvent).toBeTruthy();
            expect(createdEvent!.sender.toString()).toBe(sender._id.toString());
            expect(createdEvent!.receiver.toString()).toBe(receiver._id.toString());
            expect(createdEvent!.details).toMatchObject(details);
        });

        it('應成功創建 like 事件，並驗證 details 欄位', async () => {
            const details = {
                contentId: new Types.ObjectId().toString(),
                contentType: "post",
            };

            await eventService.createEvent(sender._id, receiver._id, "like", details);

            const createdEvent = await Event.findOne({ eventType: "like" }).lean();

            expect(createdEvent).toBeTruthy();
            expect(createdEvent!.sender.toString()).toBe(sender._id.toString());
            expect(createdEvent!.receiver.toString()).toBe(receiver._id.toString());
            expect(createdEvent!.details).toMatchObject(details);
        });

        it('應在 comment 事件缺少必要的 details 欄位時拋出錯誤', async () => {
            const incompleteDetails = {
                commentText: "Missing postId and commentId",
            };

            await expect(
                eventService.createEvent(sender._id, receiver._id, "comment", incompleteDetails)
            ).rejects.toThrow("Missing required detail field: postId for event type: comment");
        });

        it('應在 like 事件缺少必要的 details 欄位時拋出錯誤', async () => {
            const incompleteDetails = {
                contentType: "post",
            };

            await expect(
                eventService.createEvent(sender._id, receiver._id, "like", incompleteDetails)
            ).rejects.toThrow("Missing required detail field: contentId for event type: like");
        });

        it('應成功創建 follow 事件，並不要求 details 欄位', async () => {
            await eventService.createEvent(sender._id, receiver._id, "follow", {});

            const createdEvent = await Event.findOne({ eventType: "follow" }).lean();
            expect(createdEvent).toBeTruthy();
            expect(createdEvent!.sender.toString()).toBe(sender._id.toString());
            expect(createdEvent!.receiver.toString()).toBe(receiver._id.toString());
        });

        it('應成功創建 friend_request 事件，並不要求 details 欄位', async () => {
            await eventService.createEvent(sender._id, receiver._id, "friend_request", {});

            const createdEvent = await Event.findOne({ eventType: "friend_request" }).lean();

            expect(createdEvent).toBeTruthy();
            expect(createdEvent!.sender.toString()).toBe(sender._id.toString());
            expect(createdEvent!.receiver.toString()).toBe(receiver._id.toString());
        });
    });
});
