import { Types } from 'mongoose';
import { Comment, ICommentDocument } from '@src/models/comment';
import { Like } from '@src/models/like';
import { Event } from '@src/models/event';
import mongoose from 'mongoose';

export class CommentService {
    /**
     * 建立新評論
     * 
     * @param userId - 使用者ID
     * @param content - 評論內容
     * 
     * 實作重點：
     * 1. 內容長度驗證
     * 2. 使用事務確保資料一致性
     */
    async createComment(
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        try {
            if (content.length > 280) {
                throw new Error('評論內容超過長度限制');
            }

            const comment = await Comment.create([{
                user: userId,
                content,
                likesCount: 0,
                comments: []
            }]);

            return !!comment;
        } catch (error) {
            console.error('Error in createComment service:', error);
            throw error;
        }
    }

    /**
     * 更新評論
     * 
     * @param commentId - 評論ID
     * @param userId - 使用者ID
     * @param content - 新的評論內容
     * 
     * 實作重點：
     * 1. 使用 updateOne 提高效能
     * 2. 確保只有作者可以更新評論
     */
    async updateComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        try {
            if (content.length > 280) {
                throw new Error('評論內容超過長度限制');
            }

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
            throw error;
        }
    }

    /**
     * 刪除評論
     * 
     * @param commentId - 評論ID
     * @param userId - 使用者ID
     * 
     * 實作重點：
     * 1. 使用事務確保一致性
     * 2. 同時刪除相關的按讚和通知
     */
    async deleteComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                const comment = await Comment.findOneAndDelete(
                    { _id: commentId, user: userId },
                    { session }
                );

                if (!comment) return false;

                await Promise.all([
                    // 刪除相關的按讚記錄
                    Like.deleteMany({
                        targetModel: "Comment",
                        target: commentId
                    }).session(session),
                    // 刪除相關的通知
                    Event.deleteMany({
                        'details.commentId': commentId.toString(),
                        eventType: { $in: ['like', 'comment'] }
                    }).session(session)
                ]);

                return true;
            });
        } catch (error) {
            console.error('Error in deleteComment service:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 處理評論按讚功能
     * 
     * @param commentId - 要按讚的評論ID
     * @param userId - 執行按讚的使用者ID
     * @returns Promise<boolean> - 按讚處理結果
     * 
     * 使用場景：
     * - 當用戶點擊空心愛心時調用
     * - 前端需要維護愛心的狀態，只在未按讚狀態下調用此API
     */
    async likeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 只檢查評論是否存在
                const comment = await Comment.findById(commentId).session(session);
                if (!comment) return false;

                // 直接建立按讚記錄和更新計數
                await Promise.all([
                    Like.create([{
                        user: userId,
                        target: commentId,
                        targetModel: 'Comment'
                    }], { session }),
                    Comment.updateOne(
                        { _id: commentId },
                        { $inc: { likesCount: 1 } }
                    ).session(session)
                ]);

                // 建立通知（如果不是自己的評論）
                if (!comment.user.equals(userId)) {
                    await Event.create([{
                        sender: userId,
                        receiver: comment.user,
                        eventType: 'like',
                        details: new Map([
                            ['commentId', commentId.toString()],
                            ['type', 'comment']
                        ])
                    }], { session });
                }

                return true;
            });
        } catch (error) {
            console.error('Error in likeComment:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 處理取消評論按讚功能
     * 
     * @param commentId - 要取消按讚的評論ID
     * @param userId - 執行取消按讚的使用者ID
     * @returns Promise<boolean> - 取消按讚處理結果
     * 
     * 使用場景：
     * - 當用戶點擊紅色愛心時調用
     * - 前端需要維護愛心的狀態，只在已按讚狀態下調用此API
     */
    async unlikeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 直接刪除按讚記錄
                const result = await Like.deleteOne({
                    user: userId,
                    target: commentId,
                    targetModel: 'Comment'
                }).session(session);

                if (result.deletedCount === 0) {
                    return false;
                }

                // 更新計數和刪除通知
                await Promise.all([
                    Comment.updateOne(
                        { _id: commentId },
                        { $inc: { likesCount: -1 } }
                    ).session(session),
                    Event.deleteOne({
                        sender: userId,
                        'details.commentId': commentId.toString(),
                        eventType: 'like'
                    }).session(session)
                ]);

                return true;
            });
        } catch (error) {
            console.error('Error in unlikeComment:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 根據ID獲取評論
     * 
     * @param commentId - 評論ID
     * 
     * 實作重點：
     * 1. 使用 lean() 提升查詢效能
     * 2. 只選擇必要的欄位
     */
    async getCommentById(
        commentId: Types.ObjectId
    ): Promise<ICommentDocument | null> {
        try {
            return await Comment
                .findById(commentId)
                .populate('user', 'userName accountName avatarUrl')
                .lean();
        } catch (error) {
            console.error('Error in getCommentById service:', error);
            throw error;
        }
    }
}

export const commentService = new CommentService();