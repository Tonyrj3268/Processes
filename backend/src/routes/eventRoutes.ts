// routes/eventRoutes.ts
import { Router } from "express";
import { Request, Response } from "express";
import { authenticateJWT } from "@src/middlewares/authenticateJWT";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Event
 *   description: User's events, only accessible to authenticated users
 */

// 獲取用戶的所有事件
/**
 * @swagger
 * /api/event:
 *   get:
 *     summary: Retrieve notifications with pagination
 *     description: Fetch notifications with details about sender, receiver, timestamp, and event information.
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sender:
 *                         type: string
 *                         description: ID of the sender
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Time the notification was created
 *                       event:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: Type of the event
 *                           content:
 *                             type: string
 *                             description: Template or content of the event
 *             example:
 *               events:
 *                 - sender: "5f8f8c44b54764421b7156c9"
 *                   timestamp: "2024-10-30T10:15:30Z"
 *                   event:
 *                     type: "like"
 *                     content: "User xxx liked your post"
 *                 - sender: "5f8f8c44b54764421b7156c9"
 *                   timestamp: "2024-10-30T10:11:30Z"
 *                   event:
 *                     type: "follow"
 *                     content: "User xxx commented on your post"
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 */
router.get("/", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
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
    const limit = parseInt(req.query.limit as string) || 10;

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
});

export default router;