// routes/commentRoutes.ts
import { Router, Request, Response } from "express";
import { authenticateJWT } from "@src/middlewares/authenticateJWT";
import { commentIdValidator, commentId_commentValidator } from "@src/middlewares/commentMiddleware";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API endpoints for managing comments
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
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
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.post("/", authenticateJWT, commentId_commentValidator, (req: Request, res: Response) => {
    // 模擬新增評論
    res.status(201).json({ msg: "Comment created successfully" });
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to update
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
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.patch("/:commentId", authenticateJWT, commentId_commentValidator, (req: Request, res: Response) => {
    // 模擬更新評論
    res.status(200).json({ msg: "Comment updated successfully" });
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.delete("/:commentId", authenticateJWT, commentIdValidator, (req: Request, res: Response) => {
    // 模擬刪除評論
    res.status(200).json({ msg: "Comment deleted successfully" });
});

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   post:
 *     summary: Like a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to like
 *     responses:
 *       200:
 *         description: Comment liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.post("/:commentId/like", authenticateJWT, commentIdValidator, (req: Request, res: Response) => {
    // 模擬點贊評論
    res.status(200).json({ msg: "Comment liked successfully" });
});

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   delete:
 *     summary: Unlike a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to unlike
 *     responses:
 *       200:
 *         description: Comment unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.delete("/:commentId/like", authenticateJWT, commentIdValidator, (req: Request, res: Response) => {
    // 模擬取消點贊評論
    res.status(200).json({ msg: "Comment unliked successfully" });
});

export default router;
