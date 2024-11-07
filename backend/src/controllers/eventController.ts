import { Request, Response } from "express";

export class EventController {
    async getEvents(req: Request, res: Response): Promise<void> {
        const mockEvents = [
            {
                sender: "5f8f8c44b54764421b7156c9",
                timestamp: "2024-10-30T10:15:30Z",
                event: {
                    type: "like",
                    content: "User xxx liked your post",
                },
            },
            {
                sender: "5f8f8c44b54764421b7156c9",
                timestamp: "2024-10-30T10:11:30Z",
                event: {
                    type: "follow",
                    content: "User xxx commented on your post",
                },
            },
            // Add more events as needed
        ];

        // Get query parameters for pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Calculate total items and total pages
        const totalItems = mockEvents.length;
        const totalPages = Math.ceil(totalItems / limit);

        // Validate page number
        if (page < 1 || page > totalPages) {
            res.status(400).json({ message: "Invalid page number." });
            return;
        }

        res.status(200).json({
            totalItems,
            totalPages,
            currentPage: page,
            mockEvents,
        });

    }
}

export const eventController = new EventController();