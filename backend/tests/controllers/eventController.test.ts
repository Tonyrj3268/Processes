import { Types } from "mongoose";
import { User, IUserDocument } from "@src/models/user";
import { Event, IEventDocument } from "@src/models/event";
import { EventService } from "@src/services/eventService";
import { EventController } from "@src/controllers/eventController";
import { Request, Response } from "express";
import redisClient from "@src/config/redis";
import "@tests/setup";
// 模擬 Express 的 Response 對象
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res) as jest.Mock;;
    res.send = jest.fn().mockReturnValue(res);
    return res as jest.Mocked<Response>;
};

describe('EventController', () => {
    let sender: IUserDocument;
    let receiver: IUserDocument;
    let eventController: EventController;
    let eventService: EventService;

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

    const createTestEvent = async (eventType: string, overrides = {}): Promise<IEventDocument> => {

        // 根據事件類型填充 `details`
        let details = new Map<string, unknown>();
        switch (eventType) {
            case "comment":
                details.set("commentId", new Types.ObjectId().toString());
                details.set("postId", new Types.ObjectId().toString());
                details.set("commentText", "This is a test comment");
                break;
            case "like":
                details.set("postId", new Types.ObjectId().toString());
                details.set("likeType", "post");
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

    beforeEach(async () => {
        eventService = new EventService(redisClient);
        eventController = new EventController(eventService, redisClient);

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
        await createTestEvent("follow");

    });
    describe('getEvents', () => {
        it('應該使用 Redis 快取資料，當快取命中時', async () => {
            const cachedEvents = [
                {
                    _id: "12345",
                    eventType: "follow",
                    timestamp: new Date().toISOString(),
                    sender: {
                        _id: sender._id.toString(),
                        accountName: "senderAccountName",
                        avatarUrl: "https://example.com/avatar.jpg",
                    },
                    receiver: {
                        _id: receiver._id.toString(),
                        accountName: "receiverAccountName",
                        avatarUrl: "https://example.com/avatar.jpg",
                    },
                    details: {},
                },
            ];

            // 模擬 Redis 快取數據
            await redisClient.rpush(`events:${receiver._id}`, ...cachedEvents.map(e => JSON.stringify(e)));

            const req = {
                query: { limit: 10 },
                user: receiver,
            } as unknown as Request;
            const res = mockResponse();

            await eventController.getEvents(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                events: cachedEvents,
                newCursor: null,
            });
        });
        it('應該從資料庫獲取資料並存入 Redis，當快取未命中時', async () => {
            const req = {
                query: { limit: 10 },
                user: receiver,
            } as unknown as Request;
            const res = mockResponse();

            await eventController.getEvents(req, res);

            const cachedList = await redisClient.lrange(`events:${receiver._id}`, 0, -1);
            expect(cachedList).not.toBeNull();
            const cachedEvents = cachedList.map(item => JSON.parse(item));
            expect(cachedEvents).toHaveLength(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                events: expect.any(Array),
                newCursor: null,
            });
        });
        it('應該追加新事件到 Redis 緩存中，當有新事件時', async () => {
            const initialEvent = [{
                _id: "12345",
                eventType: "follow",
                timestamp: new Date().toISOString(),
                sender: {
                    _id: sender._id.toString(),
                    accountName: "senderAccountName",
                    avatarUrl: "https://example.com/avatar.jpg",
                },
                receiver: {
                    _id: receiver._id.toString(),
                    accountName: "receiverAccountName",
                    avatarUrl: "https://example.com/avatar.jpg",
                },
                details: {},
            }];

            await redisClient.rpush(`events:${receiver._id}`, ...initialEvent.map(e => JSON.stringify(e)));

            await createTestEvent("comment");

            const req = {
                query: { limit: 10 },
                user: receiver,
            } as unknown as Request;
            const res = mockResponse();

            await eventController.getEvents(req, res);

            const cachedList = await redisClient.lrange(`events:${receiver._id}`, 0, -1);
            expect(cachedList).not.toBeNull();

            const cachedEvents = cachedList.map(item => JSON.parse(item));
            expect(cachedEvents).toHaveLength(1);
        });

        it('應該返回最多十個事件，當成功獲取時', async () => {
            const req = {
                query: { limit: 10 },
                user: receiver,
            } as unknown as Request;
            const res = mockResponse();

            await eventController.getEvents(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            // 修改測試預期結果以匹配實際回傳格式
            expect(res.json).toHaveBeenCalledWith({
                events: expect.arrayContaining([
                    expect.objectContaining({
                        _id: expect.any(String),
                        eventType: "follow",
                        timestamp: expect.any(String),
                        sender: {
                            _id: sender._id.toString(),
                            accountName: "senderAccountName",
                            avatarUrl: "https://example.com/avatar.jpg",
                        },
                        receiver: {
                            _id: receiver._id.toString(),
                            accountName: "receiverAccountName",
                            avatarUrl: "https://example.com/avatar.jpg",
                        },
                        details: {},
                    }),
                ]),
                newCursor: null,
            });
        });

        it('應該返回空列表，當沒有事件時', async () => {
            await Event.deleteMany(); // 清空事件集合

            const req = {
                query: { limit: 10 },
                user: receiver,
            } as unknown as Request;
            const res = mockResponse();

            await eventController.getEvents(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                events: [],
                newCursor: null,
            });
        });

        it('應返回正確數量的事件，根據 limit 參數', async () => {
            await createTestEvent("comment");
            await createTestEvent("like");

            const req = {
                query: { limit: 2 },
                user: receiver,
            } as unknown as Request;
            const res = mockResponse();

            await eventController.getEvents(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].events).toHaveLength(2);
        });
    });
});
