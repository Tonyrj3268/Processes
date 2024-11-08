// services/commentService.ts
import { Types } from 'mongoose';
import { Comment, ICommentDocument } from '@src/models/comment';
import { Like } from '@src/models/like';
import { Event } from '@src/models/events';

export class CommentService {
    /**
     * 建立新評論
     * @param userId 使用者ID
     * @param content 評論內容
     * @returns Promise<boolean> 是否成功建立
     */
    async createComment(
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        try {
            const comment = await Comment.create({
                user: userId,
                content,
                createdAt: new Date(),
                updatedAt: new Date(),
                likesCount: 0,
                comments: []
            });

            return !!comment;
        } catch (error) {
            console.error('Error in createComment service:', error);
            return false;
        }
    }

    /**
     * 更新評論
     * @param commentId 評論ID
     * @param userId 使用者ID
     * @param content 新的評論內容
     * @returns Promise<boolean> 是否成功更新
     */
    async updateComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        try {
            const result = await Comment.updateOne(
                { _id: commentId, user: userId },
                {
                    $set: {
                        content,
                        updatedAt: new Date()
                    }
                }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error in updateComment service:', error);
            return false;
        }
    }

    /**
     * 刪除評論
     * @param commentId 評論ID
     * @param userId 使用者ID
     * @returns Promise<boolean> 是否成功刪除
     */
    async deleteComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<boolean> {
        try {
            const result = await Comment.deleteOne({
                _id: commentId,
                user: userId
            });

            if (result.deletedCount > 0) {
                // 清理相關的按讚記錄
                await Like.deleteMany({
                    targetModel: "Comment",
                    target: commentId
                });

                return true;
            }

            return false;
        } catch (error) {
            console.error('Error in deleteComment service:', error);
            return false;
        }
    }

    /**
     * 對評論按讚
     * @param commentId 評論ID
     * @param userId 使用者ID
     * @returns Promise<boolean> 是否成功按讚
     */
    async likeComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<boolean> {
        try {
            // 檢查評論是否存在
            const comment = await Comment.findById(commentId);
            if (!comment) return false;

            // 檢查是否已經按讚
            const existingLike = await Like.findOne({
                user: userId,
                targetModel: "Comment",
                target: commentId
            });

            if (existingLike) return false;

            // 建立按讚記錄
            await Like.create({
                user: userId,
                targetModel: "Comment",
                target: commentId,
                createdAt: new Date()
            });

            // 更新評論的按讚數
            await Comment.updateOne(
                { _id: commentId },
                { $inc: { likesCount: 1 } }
            );

            // 建立通知事件
            await Event.create({
                sender: userId,
                receiver: comment.user,
                eventType: "like",
                details: new Map([
                    ["commentId", commentId.toString()],
                    ["type", "comment"]
                ]),
                timestamp: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error in likeComment service:', error);
            return false;
        }
    }

    /**
     * 取消評論按讚
     * @param commentId 評論ID
     * @param userId 使用者ID
     * @returns Promise<boolean> 是否成功取消按讚
     */
    async unlikeComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<boolean> {
        try {
            // 檢查評論是否存在
            const comment = await Comment.findById(commentId);
            if (!comment) return false;

            // 刪除按讚記錄
            const result = await Like.deleteOne({
                user: userId,
                targetModel: "Comment",
                target: commentId
            });

            if (result.deletedCount > 0) {
                // 更新評論的按讚數
                await Comment.updateOne(
                    { _id: commentId },
                    { $inc: { likesCount: -1 } }
                );

                return true;
            }

            return false;
        } catch (error) {
            console.error('Error in unlikeComment service:', error);
            return false;
        }
    }

    /**
     * 根據ID獲取評論
     * @param commentId 評論ID
     * @returns Promise<ICommentDocument | null> 評論文件
     */
    async getCommentById(
        commentId: Types.ObjectId
    ): Promise<ICommentDocument | null> {
        try {
            return await Comment.findById(commentId);
        } catch (error) {
            console.error('Error in getCommentById service:', error);
            return null;
        }
    }
}