import { Request, Response } from "express";
import { IUserDocument } from "@src/models/user";
import { eventService, EventService } from "@src/services/eventService";
import { userService } from "@src/services/userService";
export class EventController {
    constructor(private eventService: EventService) { }

    getEvents = async (req: Request, res: Response): Promise<void> => {
        try {
            const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : 0;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const user = req.user as IUserDocument;

            const notifications = await this.eventService.getEvents(user._id);
            const eventsArray = this.formatNotifications(notifications);

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
                _id: (notification.sender as IUserDocument)._id.toString(),
                accountName: (notification.sender as IUserDocument).accountName,
                avatarUrl: (notification.sender as IUserDocument).avatarUrl,
                isPublic: (notification.sender as IUserDocument).isPublic,
            },
            details: notification.details || {},
        }));
    }
}

export const eventController = new EventController(eventService);