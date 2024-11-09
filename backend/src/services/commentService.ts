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
     * 對評論按讚
     * 
     * @param commentId - 評論ID
     * @param userId - 使用者ID
     * 
     * 實作重點：
     * 1. 使用事務確保資料一致性
     * 2. 使用 findOneAndUpdate 配合 upsert 實現原子性操作
     * 3. 只在新建立按讚時更新計數和通知
     */
    async likeComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                const comment = await Comment.findById(commentId).session(session);
                if (!comment) return false;

                const like = await Like.findOneAndUpdate(
                    {
                        user: userId,
                        target: commentId,
                        targetModel: "Comment"
                    },
                    {
                        $setOnInsert: {
                            user: userId,
                            target: commentId,
                            targetModel: "Comment"
                        }
                    },
                    {
                        upsert: true,
                        new: true,
                        session
                    }
                );

                // 如果是新建立的like，才增加計數和建立通知
                if (like && like.createdAt.getTime() === new Date().getTime()) {
                    await Comment.updateOne(
                        { _id: commentId },
                        { $inc: { likesCount: 1 } },
                        { session }
                    );

                    if (!comment.user.equals(userId)) {
                        await Event.create([{
                            sender: userId,
                            receiver: comment.user,
                            eventType: "like",
                            details: new Map([
                                ["commentId", commentId.toString()],
                                ["type", "comment"]
                            ])
                        }], { session });
                    }

                    return true;
                }

                return false;
            });
        } catch (error) {
            console.error('Error in likeComment service:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 取消評論按讚
     * 
     * @param commentId - 評論ID
     * @param userId - 使用者ID
     * 
     * 實作重點：
     * 1. 使用事務確保資料一致性
     * 2. 使用 findOneAndDelete 一次完成查詢和刪除
     * 3. 並行處理計數更新和通知刪除
     */
    async unlikeComment(
        commentId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                const like = await Like.findOneAndDelete({
                    user: userId,
                    target: commentId,
                    targetModel: "Comment"
                }).session(session);

                if (!like) return false;

                await Promise.all([
                    Comment.updateOne(
                        { _id: commentId },
                        { $inc: { likesCount: -1 } },
                        { session }
                    ),
                    Event.deleteOne({
                        sender: userId,
                        'details.commentId': commentId.toString(),
                        eventType: "like"
                    }).session(session)
                ]);

                return true;
            });
        } catch (error) {
            console.error('Error in unlikeComment service:', error);
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