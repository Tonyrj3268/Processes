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
            const eventsArray = await this.formatNotifications(notifications);

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
        // 如果量少且沒有批次需求，可以簡單改成這樣
        return Promise.all(
            notifications.map(async (notification) => {
                const isFollowing = await userService.isFollowing(
                    notification.receiver._id,
                    notification.sender._id
                );
                return {
                    _id: notification._id.toString(),
                    eventType: notification.eventType,
                    timestamp: notification.timestamp.toISOString(),
                    sender: {
                        _id: notification.sender._id.toString(),
                        accountName: notification.sender.accountName,
                        avatarUrl: notification.sender.avatarUrl,
                        isPublic: notification.sender.isPublic,
                        isFollowing, // 使用剛剛 await 的結果
                    },
                    details: notification.details || {},
                };
            })
        );
    }

}

export const eventController = new EventController(eventService);