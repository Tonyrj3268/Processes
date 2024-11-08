// routes/postRoutes.ts
import { Router, Request, Response } from "express";
import { authenticateJWT } from "@src/middlewares/authenticateJWT";
import { postIdValidator, postId_postValidator, postValidator } from "@src/middlewares/postMiddleware";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API endpoints for managing posts
 */

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: Retrieve all posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of posts
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
 *                       content:
 *                         type: string
 *                       likesCount:
 *                         type: number
 *                       commentCount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/", authenticateJWT, (req: Request, res: Response) => {
    // 模擬數據
    const mockPosts = [
        {
            postId: "5p8f8cakf54764421b715613",
            author: "au8f8cakf54764421b715613",
            content: "這是一篇模擬貼文！",
            likesCount: 10,
            commentCount: 2,
            createdAt: "2024-11-01T10:00:00Z",
        },
        {
            postId: "5p8f8cakf54764421b715612",
            author: "au8f8cakf54764421b715612",
            content: "另一篇模擬貼文內容。",
            likesCount: 5,
            commentCount: 1,
            createdAt: "2024-11-02T12:30:00Z",
        },
    ];

    res.status(200).json({ posts: mockPosts });
});

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 */
router.post("/", authenticateJWT, postValidator, (req: Request, res: Response) => {
    // 模擬創建貼文
    res.status(201).json({ msg: "Post created successfully" });
});

/**
 * @swagger
 * /api/post/{postId}:
 *   patch:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 */
router.patch("/:postId", authenticateJWT, postId_postValidator, (req: Request, res: Response) => {
    // 模擬更新貼文
    res.status(200).json({ msg: "Post updated successfully" });
});

/**
 * @swagger
 * /api/post/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.delete("/:postId", authenticateJWT, postIdValidator, (req: Request, res: Response) => {
    // 模擬刪除貼文
    res.status(200).json({ msg: "Post deleted successfully" });
});

/**
 * @swagger
 * /api/post/{postId}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to like
 *     responses:
 *       200:
 *         description: Post liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.post("/:postId/like", authenticateJWT, postIdValidator, (req: Request, res: Response) => {
    // 模擬點贊貼文
    res.status(200).json({ msg: "Post liked successfully" });
});

/**
 * @swagger
 * /api/post/{postId}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to unlike
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.delete("/:postId/like", authenticateJWT, postIdValidator, (req: Request, res: Response) => {
    // 模擬取消點贊貼文
    res.status(200).json({ msg: "Post unliked successfully" });
});

/**
 * @swagger
 * /api/post/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.post("/:postId/comments", authenticateJWT, postId_postValidator, (req: Request, res: Response) => {
    // 模擬添加評論
    res.status(201).json({ msg: "Comment added successfully" });
});

export default router;