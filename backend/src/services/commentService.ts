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
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                if (content.length > 280) {
                    throw new Error('評論內容超過長度限制');
                }

                const comment = await Comment.create([{
                    user: userId,
                    content,
                    likesCount: 0,
                    comments: []
                }], { session });

                return !!comment;
            });
        } catch (error) {
            console.error('Error in createComment service:', error);
            throw error;
        } finally {
            session.endSession();
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
     * @returns Promise<boolean> - 如果按讚成功返回true，如果評論不存在或已經按過讚則返回false
     * 
     * 實作重點：
     * 1. 使用 MongoDB 事務確保資料一致性
     * 2. 避免重複按讚
     * 3. 同時處理：
     *    - 建立按讚記錄
     *    - 更新評論的按讚計數
     *    - 建立互動通知（如果不是自己的評論）
     * 
     * 可能的失敗情況：
     * 1. 評論不存在
     * 2. 已經按過讚
     * 3. 資料庫操作異常
     */
    async likeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        // 開始一個新的資料庫事務
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 同時查詢評論是否存在和是否已按讚
                // 使用 Promise.all 提升查詢效能
                const [comment, existingLike] = await Promise.all([
                    Comment.findById(commentId).session(session),
                    Like.findOne({
                        user: userId,
                        target: commentId,
                        targetModel: 'Comment'
                    }).session(session)
                ]);

                // 如果評論不存在或已經按過讚，返回 false
                if (!comment || existingLike) {
                    return false;
                }

                // 同時處理按讚記錄的建立和評論按讚數的更新
                await Promise.all([
                    // 建立新的按讚記錄
                    Like.create([{
                        user: userId,
                        target: commentId,
                        targetModel: 'Comment'  // 指定目標類型為評論
                    }], { session }),
                    // 增加評論的按讚計數
                    Comment.updateOne(
                        { _id: commentId },
                        { $inc: { likesCount: 1 } }
                    ).session(session)
                ]);

                // 如果不是自己的評論，則建立通知
                if (!comment.user.equals(userId)) {
                    await Event.create([{
                        sender: userId,
                        receiver: comment.user,
                        eventType: 'like',
                        details: new Map([
                            ['commentId', commentId.toString()],
                            ['type', 'comment']  // 標記這是評論的按讚
                        ])
                    }], { session });
                }

                return true;
            });
        } catch (error) {
            console.error('Error in likeComment:', error);
            throw error;  // 向上拋出錯誤，由 controller 統一處理
        } finally {
            // 確保事務結束，釋放資源
            session.endSession();
        }
    }

    /**
     * 處理取消評論按讚功能
     * 
     * @param commentId - 要取消按讚的評論ID
     * @param userId - 執行取消按讚的使用者ID
     * @returns Promise<boolean> - 如果取消按讚成功返回true，如果找不到按讚記錄則返回false
     * 
     * 實作重點：
     * 1. 使用 MongoDB 事務確保資料一致性
     * 2. 使用 findOneAndDelete 高效處理按讚記錄
     * 3. 同時處理：
     *    - 刪除按讚記錄
     *    - 更新評論的按讚計數
     *    - 刪除相關通知
     * 
     * 可能的失敗情況：
     * 1. 找不到按讚記錄（可能從未按讚）
     * 2. 資料庫操作異常
     * 
     * 注意：這個方法不需要先檢查評論是否存在，
     * 因為如果找到了按讚記錄，就表示評論必定存在過
     */
    async unlikeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 一次性查找並刪除按讚記錄
                // 這比分開查詢和刪除更有效率
                const like = await Like.findOneAndDelete({
                    user: userId,
                    target: commentId,
                    targetModel: 'Comment'
                }).session(session);

                // 如果找不到按讚記錄，表示之前沒有按過讚
                if (!like) {
                    return false;
                }

                // 同時處理評論計數更新和通知刪除
                // 使用 Promise.all 並行處理以提升效能
                await Promise.all([
                    // 減少評論的按讚計數
                    Comment.updateOne(
                        { _id: commentId },
                        { $inc: { likesCount: -1 } }
                    ).session(session),
                    // 刪除相關的通知記錄
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
            throw error;  // 向上拋出錯誤，由 controller 統一處理
        } finally {
            // 確保事務結束，釋放資源
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