// services/eventService.ts
import { Event, IEventDocument } from '@src/models/event';
import { FilterQuery, Types } from 'mongoose';
import { Redis } from 'ioredis';
import redisClient from '@src/config/redis';
import { IUserDocument } from '@src/models/user';
export class EventService {
    private redisClient: Redis;

    constructor(redisClient: Redis) {
        this.redisClient = redisClient;
    }
    // Type 如果是 comment, details 應該包含 commentText, postId, commentId
    // Type 如果是 like, details 應該包含 contentId, contentType
    // 其他事件不需要特別驗證 details, 但是 get 後 details 會是 {}
    async getEvents(user: Types.ObjectId) {
        const query: FilterQuery<IEventDocument> = { receiver: user };
        const notifications = await Event.find(query)
            .sort({ timestamp: -1 })
            .populate('sender', 'accountName avatarUrl')  // 僅選擇用戶名和圖片
            .populate('receiver', 'accountName avatarUrl')
            .lean();
        return notifications;
    }

    // Event種類：follow, comment, like, friend_request
    // 如果eventType是comment，details應該包含commentText, postId, commentId
    // 如果eventType是like，details應該包含contentId, contentType
    // 其他事件不需要特別驗證details，但是get後details會是{}
    async createEvent(
        sender: Types.ObjectId,
        receiver: Types.ObjectId,
        eventType: "follow" | "comment" | "like" | "friend_request",
        details: Record<string, unknown>
    ) {
        const validateDetails = (requiredFields: string[]) => {
            for (const field of requiredFields) {
                if (!details[field]) {
                    throw new Error(`Missing required detail field: ${field} for event type: ${eventType}`);
                }
            }
        };

        // 根據 eventType 驗證 details 的結構
        switch (eventType) {
            case "comment":
                validateDetails(["commentText", "postId", "commentId"]);
                break;
            case "like":
                validateDetails(["contentId", "contentType"]);
                break;
            default:
                // 其他事件不需要特別驗證 details
                break;
        }
        const eventData = {
            sender,
            receiver,
            eventType,
            details: details,
        };

        const newEvent = await new Event(eventData).save();
        const formattedEvent = this.formatNotification(newEvent);
        const redisKey = `events:${receiver.toString()}`;
        await this.redisClient.lpush(redisKey, JSON.stringify(formattedEvent));
        await this.redisClient.ltrim(redisKey, 0, 99); // 保留最新 100 條事件
        await this.redisClient.expire(redisKey, 600); // 設置過期時間為 10 分鐘

        return;
    }
    private formatNotification(notification: IEventDocument) {
        return {
            _id: notification._id.toString(),
            eventType: notification.eventType,
            timestamp: notification.timestamp.toISOString(),
            sender: {
                _id: (notification.sender as IUserDocument)._id.toString(),
                accountName: (notification.sender as IUserDocument).accountName,
                avatarUrl: (notification.sender as IUserDocument).avatarUrl,
            },
            receiver: {
                _id: (notification.receiver as IUserDocument)._id.toString(),
                accountName: (notification.receiver as IUserDocument).accountName,
                avatarUrl: (notification.receiver as IUserDocument).avatarUrl,
            },
            details: notification.details || {},
        };
    }

    // 格式化多個通知
    private formatNotifications(notifications: IEventDocument[]) {
        return notifications.map(notification => this.formatNotification(notification));
    }
}

export const eventService = new EventService(redisClient);