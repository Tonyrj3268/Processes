// services/eventService.ts
import { Event, IEventDocument } from '@src/models/event';
import { FilterQuery, Types } from 'mongoose';

export class EventService {
    // Type 如果是 comment, details 應該包含 commentText, postId, commentId
    // Type 如果是 like, details 應該包含 contentId, contentType
    // 其他事件不需要特別驗證 details, 但是 get 後 details 會是 {}
    async getEvents(user: Types.ObjectId, cursor: Types.ObjectId | null, limit: number = 10) {
        const query: FilterQuery<IEventDocument> = { receiver: user };
        if (cursor) {
            query._id = { $lt: cursor };
        }

        const notifications = await Event.find(query)
            .sort({ _id: -1 })
            .limit(Number(limit))
            .populate('sender', 'accountName avatarUrl')  // 僅選擇用戶名和圖片
            .populate('receiver', 'accountName avatarUrl')
            .lean();
        const newCursor = notifications.length > 0 ? notifications[notifications.length - 1]._id : null;

        return { notifications, newCursor };
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

        await new Event(eventData).save();
    }
}

export const eventService = new EventService();