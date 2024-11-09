import { Request, Response } from "express";
import { IUserDocument } from "@src/models/user";
import { EventService } from "@src/services/eventService";
import { Types } from "mongoose";

export class EventController {

    constructor(private eventService: EventService = new EventService()) { }

    async getEvents(req: Request, res: Response): Promise<void> {

        const { cursor, limit = 10 } = req.query;
        const user = req.user as IUserDocument;
        const { notifications, newCursor } = await this.eventService.getEvents(user, new Types.ObjectId(cursor as string), Number(limit));

        const formattedNotifications = notifications.map(notification => ({
            _id: notification._id.toString(),
            eventType: notification.eventType,
            timestamp: notification.timestamp.toISOString(),  // 格式化為 ISO 日期字符串
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
            details: notification.details,
        }));

        res.status(200).json({
            events: formattedNotifications,
            newCursor: newCursor ? newCursor.toString() : null,
        });

    }
}

export const eventController = new EventController();