// services/eventService.ts
import { Event, IEventDocument } from '@src/models/event';
import { IUserDocument } from '@src/models/user';
import { FilterQuery, Types } from 'mongoose';

export class EventService {
    async getEvents(user: IUserDocument, cursor: Types.ObjectId | null, limit: number = 10) {
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
}

export const eventService = new EventService();