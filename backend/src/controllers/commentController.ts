// controllers/commentController.ts
import { Request, Response } from "express";
import { CommentService } from "@src/services/commentService";
import { IUserDocument } from "@src/models/user";
import { Types } from 'mongoose';

export class CommentController {
    constructor(private commentService: CommentService = new CommentService()) { }

    /**
     * 建立新評論
     * POST /api/comments
     */
    async createComment(req: Request, res: Response): Promise<void> {
        try {
            const { content } = req.body;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.commentService.createComment(userId, content);

            if (!result) {
                res.status(400).json({ msg: "無法建立評論" });
                return;
            }

            res.status(201).json({ msg: "Comment created successfully" });
        } catch (error) {
            console.error('Error in createComment:', error);
            res.status(500).json({ msg: "伺服器錯誤" });
        }
    }

    /**
     * 更新評論
     * PATCH /api/comments/:commentId
     */
    async updateComment(req: Request, res: Response): Promise<void> {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.commentService.updateComment(
                new Types.ObjectId(commentId),
                userId,
                content
            );

            if (!result) {
                res.status(404).json({ msg: "評論不存在或無權限修改" });
                return;
            }

            res.status(200).json({ msg: "Comment updated successfully" });
        } catch (error) {
            console.error('Error in updateComment:', error);
            res.status(500).json({ msg: "伺服器錯誤" });
        }
    }

    /**
     * 刪除評論
     * DELETE /api/comments/:commentId
     */
    async deleteComment(req: Request, res: Response): Promise<void> {
        try {
            const { commentId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.commentService.deleteComment(
                new Types.ObjectId(commentId),
                userId
            );

            if (!result) {
                res.status(404).json({ msg: "評論不存在或無權限刪除" });
                return;
            }

            res.status(200).json({ msg: "Comment deleted successfully" });
        } catch (error) {
            console.error('Error in deleteComment:', error);
            res.status(500).json({ msg: "伺服器錯誤" });
        }
    }

    /**
     * 對評論按讚
     * POST /api/comments/:commentId/like
     */
    async likeComment(req: Request, res: Response): Promise<void> {
        try {
            const { commentId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.commentService.likeComment(
                new Types.ObjectId(commentId),
                userId
            );

            if (!result) {
                res.status(409).json({ msg: "已經按讚過或評論不存在" });
                return;
            }

            res.status(200).json({ msg: "Comment liked successfully" });
        } catch (error) {
            console.error('Error in likeComment:', error);
            res.status(500).json({ msg: "伺服器錯誤" });
        }
    }

    /**
     * 取消評論按讚
     * DELETE /api/comments/:commentId/like
     */
    async unlikeComment(req: Request, res: Response): Promise<void> {
        try {
            const { commentId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.commentService.unlikeComment(
                new Types.ObjectId(commentId),
                userId
            );

            if (!result) {
                res.status(409).json({ msg: "尚未按讚或評論不存在" });
                return;
            }

            res.status(200).json({ msg: "Comment unliked successfully" });
        } catch (error) {
            console.error('Error in unlikeComment:', error);
            res.status(500).json({ msg: "伺服器錯誤" });
        }
    }
}

// 預設導出一個實例，方便直接使用
export const commentController = new CommentController();