import { Request, Response } from "express";
import { IUserDocument } from "@src/models/user";
import { eventService, EventService } from "@src/services/eventService";
import redisClient from "@src/config/redis";
import { Redis } from "ioredis";

export class EventController {
    constructor(private eventService: EventService, private redisClient: Redis) { }

    getEvents = async (req: Request, res: Response): Promise<void> => {
        try {
            const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : 0;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const user = req.user as IUserDocument;

            const redisKey = `events:${user._id}`;
            let eventsArray = [];
            const cachedLength = await this.redisClient.llen(redisKey);

            if (cachedLength > 0) {
                // 從 Redis 列表中取數據
                const cachedData = await this.redisClient.lrange(redisKey, 0, -1);
                eventsArray = cachedData.map(data => JSON.parse(data));
            } else {
                const notifications = await this.eventService.getEvents(user._id);
                eventsArray = this.formatNotifications(notifications);

                // 存入 Redis 列表
                const pipeline = this.redisClient.pipeline();
                eventsArray.forEach(event =>
                    pipeline.rpush(redisKey, JSON.stringify(event))
                );
                pipeline.expire(redisKey, 600); // 設置過期時間為 10 分鐘
                await pipeline.exec();
            }

            // 根據 cursor 和 limit 取數據
            const slicedEvents = eventsArray.slice(cursor, cursor + limit);

            // 計算新 cursor
            const newCursor = cursor + slicedEvents.length < eventsArray.length
                ? cursor + slicedEvents.length
                : null;
            res.status(200).json({
                events: slicedEvents,
                newCursor,
            });
        } catch (error) {
            console.error("Error fetching events:", error);
            res.status(500).json({
                error: "An error occurred while fetching events.",
            });
        }
    }
    // 格式化通知
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private formatNotifications(notifications: any[]) {
        return notifications.map(notification => ({
            _id: notification._id.toString(),
            eventType: notification.eventType,
            timestamp: notification.timestamp.toISOString(),
            sender: {
                _id: notification.sender._id.toString(),
                accountName: (notification.sender as IUserDocument).accountName,
                avatarUrl: (notification.sender as IUserDocument).avatarUrl,
            },
            receiver: {
                _id: notification.receiver._id.toString(),
                accountName: (notification.receiver as IUserDocument).accountName,
                avatarUrl: (notification.receiver as IUserDocument).avatarUrl,
            },
            details: notification.details || {},
        }));
    }
}

export const eventController = new EventController(eventService, redisClient);