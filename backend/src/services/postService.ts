import { FilterQuery, Types } from 'mongoose';
import { Post, IPostDocument } from '@src/models/post';
import { Comment } from '@src/models/comment';
import { Like } from '@src/models/like';
import { Event } from '@src/models/event';
import mongoose from 'mongoose';
import { User } from '@src/models/user';

export class PostService {
    /**
     * 獲取所有貼文，支援無限捲動分頁
     * 
     * @param limit - 每頁返回的貼文數量
     * @param cursor - 分頁游標，為上一頁最後一篇貼文的時間戳
     * @param userId - 當前用戶ID，用於獲取私密貼文
     * 
     * 實現要點：
     * 1. 使用 lean() 提升查詢效能，因為不需要完整的 Mongoose 文檔
     * 2. 只選擇必要的欄位，減少資料傳輸量
     * 3. 同時獲取公開用戶的貼文和用戶自己的貼文
     */
    async getAllPosts(limit: number, cursor?: string, userId?: Types.ObjectId): Promise<IPostDocument[]> {
        try {
            const query: FilterQuery<IPostDocument> = {};

            // 添加游標條件，實現分頁
            if (cursor) {
                query.createdAt = { $lt: new Date(cursor) };
            }

            // 構建訪問權限查詢條件
            query.$or = [
                { user: userId }, // 用戶自己的貼文
                { user: { $in: await User.find({ isPublic: true }).select('_id') } } // 公開用戶的貼文
            ];

            return await Post.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('user', 'userName accountName avatarUrl isPublic')
                .select('-comments') // 排除 comments 欄位，減少資料量
                .lean(); // 使用 lean() 提升效能
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            throw error;
        }
    }

    /**
     * 建立新貼文
     * 
     * @param userId - 發文用戶ID
     * @param content - 貼文內容
     * 
     * 實現要點：
     * 1. 驗證內容長度限制
     * 2. 初始化必要欄位，確保資料完整性
     */
    async createPost(userId: Types.ObjectId, content: string): Promise<IPostDocument> {
        try {
            if (content.length > 280) {
                throw new Error('貼文內容超過長度限制');
            }

            const post = new Post({
                user: userId,
                content,
            });

            return await post.save();
        } catch (error) {
            console.error('Error in createPost:', error);
            throw error;
        }
    }

    /**
     * 更新貼文內容
     * 
     * @param postId - 貼文ID
     * @param userId - 當前用戶ID
     * @param content - 新的貼文內容
     * 
     * 實現要點：
     * 1. 使用 updateOne 而非 findOneAndUpdate，因為不需要返回更新後的文檔
     * 2. 通過 modifiedCount 判斷更新是否成功
     * 3. 確保只有貼文作者可以更新內容
     */
    async updatePost(
        postId: Types.ObjectId,
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        try {
            if (content.length > 280) {
                throw new Error('貼文內容超過長度限制');
            }

            // 使用 updateOne 進行高效更新
            const result = await Post.updateOne(
                { _id: postId, user: userId }, // 確保只有作者可以更新
                { content },
                { new: true }
            );

            return result.modifiedCount > 0; // 根據實際修改數判斷是否成功
        } catch (error) {
            console.error('Error in updatePost:', error);
            throw error;
        }
    }

    /**
     * 刪除貼文及相關資料
     * 
     * @param postId - 貼文ID
     * @param userId - 當前用戶ID
     * 
     * 實現要點：
     * 1. 使用事務確保資料一致性
     * 2. 同時刪除貼文相關的所有資料（評論、按讚、通知）
     * 3. 確保只有作者可以刪除貼文
     */
    async deletePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 刪除貼文並確認作者身份
                const post = await Post.findOneAndDelete(
                    { _id: postId, user: userId },
                    { session }
                );

                if (!post) return false;

                // 並行處理相關資料的刪除
                await Promise.all([
                    // 刪除所有相關評論
                    Comment.deleteMany({ post: postId }).session(session),
                    // 刪除所有相關按讚記錄
                    Like.deleteMany({
                        target: postId,
                        targetModel: 'Post'
                    }).session(session),
                    // 刪除所有相關通知
                    Event.deleteMany({
                        'details.postId': postId,
                        eventType: { $in: ['like', 'comment'] }
                    }).session(session)
                ]);

                return true;
            });
        } catch (error) {
            console.error('Error in deletePost:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 處理貼文按讚功能
     * 
     * @param postId - 要按讚的貼文ID
     * @param userId - 執行按讚的使用者ID
     * @returns Promise<boolean> - 如果按讚成功返回true，如果貼文不存在或已經按過讚則返回false
     * 
     * 實作重點：
     * 1. 使用 MongoDB 事務確保資料一致性
     * 2. 避免重複按讚
     * 3. 同時處理：
     *    - 建立按讚記錄
     *    - 更新貼文的按讚計數
     *    - 建立通知（如果不是自己的貼文）
     */
    async likePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        // 開始一個新的資料庫事務
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 同時檢查貼文是否存在和是否已經按過讚
                // 使用 Promise.all 平行處理兩個查詢以提升效能
                const [post, existingLike] = await Promise.all([
                    Post.findById(postId).session(session),
                    Like.findOne({
                        user: userId,
                        target: postId,
                        targetModel: 'Post'
                    }).session(session)
                ]);

                // 如果貼文不存在或已經按過讚，返回 false
                if (!post || existingLike) {
                    return false;
                }

                // 同時處理建立按讚記錄和更新貼文的按讚計數
                // 使用 Promise.all 確保兩個操作同時完成
                await Promise.all([
                    // 建立新的按讚記錄
                    Like.create([{
                        user: userId,
                        target: postId,
                        targetModel: 'Post'
                    }], { session }),
                    // 增加貼文的按讚計數
                    Post.updateOne(
                        { _id: postId },
                        { $inc: { likesCount: 1 } }
                    ).session(session)
                ]);

                // 如果不是自己的貼文，建立通知
                if (!post.user.equals(userId)) {
                    await Event.create([{
                        sender: userId,
                        receiver: post.user,
                        eventType: 'like',
                        details: new Map([['postId', postId]])
                    }], { session });
                }

                return true;
            });
        } catch (error) {
            console.error('Error in likePost:', error);
            throw error;  // 向上拋出錯誤，由 controller 處理
        } finally {
            // 確保事務結束，釋放資源
            session.endSession();
        }
    }

    /**
     * 處理取消貼文按讚功能
     * 
     * @param postId - 要取消按讚的貼文ID
     * @param userId - 執行取消按讚的使用者ID
     * @returns Promise<boolean> - 如果取消按讚成功返回true，如果找不到按讚記錄則返回false
     * 
     * 實作重點：
     * 1. 使用 MongoDB 事務確保資料一致性
     * 2. 使用 findOneAndDelete 一次性完成查詢和刪除
     * 3. 同時處理：
     *    - 刪除按讚記錄
     *    - 更新貼文的按讚計數
     *    - 刪除相關通知
     */
    async unlikePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 使用 findOneAndDelete 一次性完成查詢和刪除按讚記錄
                // 這比分開查詢和刪除更有效率
                const like = await Like.findOneAndDelete({
                    user: userId,
                    target: postId,
                    targetModel: 'Post'
                }).session(session);

                // 如果找不到按讚記錄，表示之前沒有按過讚
                if (!like) {
                    return false;
                }

                // 同時處理更新貼文計數和刪除通知
                await Promise.all([
                    // 減少貼文的按讚計數
                    Post.updateOne(
                        { _id: postId },
                        { $inc: { likesCount: -1 } }
                    ).session(session),
                    // 刪除相關的通知記錄
                    Event.deleteOne({
                        sender: userId,
                        'details.postId': postId,
                        eventType: 'like'
                    }).session(session)
                ]);

                return true;
            });
        } catch (error) {
            console.error('Error in unlikePost:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 新增評論到貼文
     * 
     * @param postId - 貼文ID
     * @param userId - 當前用戶ID
     * @param content - 評論內容
     * 
     * 實現要點：
     * 1. 使用 updateOne 高效更新貼文的評論列表
     * 2. 只在真正需要時建立通知
     * 3. 使用事務確保資料一致性
     */
    async addComment(
        postId: Types.ObjectId,
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                if (content.length > 280) {
                    throw new Error('評論內容超過長度限制');
                }

                // 檢查貼文是否存在
                const post = await Post.findById(postId).session(session);
                if (!post) return false;

                // 建立新評論
                const comment = await new Comment({
                    user: userId,
                    content,
                    post: postId,
                    comments: [],    // 支援巢狀評論
                    likesCount: 0
                }).save({ session });

                // 更新貼文的評論列表
                await Post.updateOne(
                    { _id: postId },
                    { $push: { comments: comment._id } },
                    { session }
                );

                // 如果不是自己的貼文，建立通知
                if (!post.user.equals(userId)) {
                    await new Event({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'comment',
                        details: new Map([
                            ['postId', postId],
                            ['commentId', comment._id]
                        ])
                    }).save({ session });
                }

                return true;
            });
        } catch (error) {
            console.error('Error in addComment:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export const postService = new PostService();