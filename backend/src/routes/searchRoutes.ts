// routes/searchRoutes.ts
// routes/searchRoutes.ts
import { Router } from "express";
import { Request, Response } from "express";
import { authenticateJWT } from "@src/middlewares/authenticateJWT";
import { postService } from "@src/services/postService";
import { IUserDocument } from "@src/models/user";


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search API endpoints
 */

/**
 * @swagger
 * /api/search/posts:
 *   get:
 *     summary: Search posts using cursor pagination
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ID of the last item from previous page)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response with posts and next cursor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId: 
 *                         type: string
 *                       author:
 *                         type: string
 *                         description: ID of the post author
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Time the post was created
 *                       content:
 *                         type: string
 *                       likesCount:
 *                         type: integer
 *                       commentCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Cursor for the next page, null if no more results
 */
router.get("/", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            res.status(400).json({ message: "Query parameter is required." });
            return;
        }

        const searchResults = await postService.searchPosts(query);

        res.status(200).json({
            posts: searchResults
                .filter((post): post is NonNullable<typeof post> => post !== undefined)
                .map(post => ({
                    postId: post._id,
                    author: {
                        id: post.user._id,
                        userName: (post.user as IUserDocument).userName,
                        accountName: (post.user as IUserDocument).accountName,
                        avatarUrl: (post.user as IUserDocument).avatarUrl
                    },
                    content: post.content,
                    likesCount: post.likesCount,
                    commentCount: post.comments?.length || 0,
                    createdAt: post.createdAt
                }))
        });
    } catch (error) {
        console.error('Error in search route:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
