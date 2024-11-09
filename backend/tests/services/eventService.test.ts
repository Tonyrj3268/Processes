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
        await createTestEvent("follow", { sender: sender._id, receiver: receiver._id, eventType: 'follow' });
        await createTestEvent("comment", { sender: sender._id, receiver: receiver._id, eventType: 'comment' });
    });


    it('應返回帶有完整 sender 和 receiver 信息的事件列表', async () => {
        const result = await eventService.getEvents(receiver, null, 10);

        expect(result.notifications).toHaveLength(2);

        const firstNotification = result.notifications[0];

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


    it('應在有 cursor 時返回之前的事件列表', async () => {
        // 使用第一個查詢結果的最後一個事件的 `_id` 作為 cursor
        const initialResult = await eventService.getEvents(receiver, null, 1);
        const cursor = initialResult.newCursor;

        const result = await eventService.getEvents(receiver, cursor, 10);

        expect(result.notifications).toHaveLength(1);
        expect(result.notifications[0].eventType).toBe('follow');
        expect(result.newCursor).toEqual(result.notifications[0]._id);
    });

    it('當無任何事件時應返回空列表', async () => {
        await Event.deleteMany(); // 清空事件集合

        const result = await eventService.getEvents(receiver, null, 10);

        expect(result.notifications).toHaveLength(0);
        expect(result.newCursor).toBeNull();
    });
});
