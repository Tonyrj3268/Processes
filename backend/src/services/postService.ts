import { FilterQuery, Types } from 'mongoose';
import { Post, IPostDocument } from '@src/models/post';
import { Comment } from '@src/models/comment';
import { Like } from '@src/models/like';
import { Event } from '@src/models/event';
import mongoose from 'mongoose';
import { User } from '@src/models/user';
import { MongoServerError } from "mongodb";
import { Follow } from '@src/models/follow';
import redisClient from '@src/config/redis';

export class PostService {
    async getPersonalPosts(limit: number, userId: Types.ObjectId, cursor?: string): Promise<IPostDocument[]> {
        try {
            const query: FilterQuery<IPostDocument> = {};

            // 添加游標條件，實現分頁
            if (cursor) {
                query._id = { $lt: cursor }; // _id 必須小於游標
            }

            // 構建訪問權限查詢條件
            query.$or = [
                { user: userId },
            ];

            const posts = await Post.find(query)
                .sort({ createdAt: -1, _id: -1 }) // 按 createdAt 和 _id 排序
                .limit(limit)
                .select('-comments') // 排除 comments 欄位，減少資料量
                .lean(); // 使用 lean() 提升效能

            return posts;
        } catch (error) {
            console.error('Error in getPersonalPosts:', error);
            throw error;
        }
    }
    getFollowPosts = async (userId: Types.ObjectId, limit: number): Promise<IPostDocument[]> => {
        try {
            const feedKey = `user:${userId.toString()}:feed`;

            // 嘗試從 Redis 獲取快取
            const cachedFeed = await redisClient.get(feedKey);
            if (cachedFeed) {
                const posts: IPostDocument[] = JSON.parse(cachedFeed);
                return posts;
            }

            const following = await Follow.find({ follower: userId }).select('following').lean();
            const followingIds = following.map(f => f.following);
            if (followingIds.length === 0) {
                return [];
            }

            // 為了避免過多數據，只獲取七天內的貼文
            const sevenDayAgo = new Date();
            sevenDayAgo.setDate(sevenDayAgo.getDate() - 7);

            const aggregatedPosts = await Post.aggregate([
                { $match: { user: { $in: followingIds }, createdAt: { $gte: sevenDayAgo } } },
                { $addFields: { random: { $rand: {} } } },
                { $sort: { user: 1, random: 1 } },
                { $group: { _id: "$user", post: { $first: "$$ROOT" } } },
                { $replaceRoot: { newRoot: "$post" } },
                { $sort: { createdAt: -1 } },
                { $limit: limit }
            ]);

            // 隨機打亂貼文順序
            const shuffledPosts = this.shuffleArray(aggregatedPosts);

            // 將結果存入 Redis 快取，設定過期時間為 10 分鐘
            await redisClient.setex(feedKey, 600, JSON.stringify(shuffledPosts));

            return shuffledPosts;
        }
        catch (error) {
            console.error('Error in getFollowPosts:', error);
            throw error;
        }
    }
    /**
     * 隨機打亂陣列順序
     * @param array - 需要打亂的陣列
     * @returns 打亂後的陣列
     */
    private shuffleArray = <T>(array: T[]): T[] => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
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
                query._id = { $lt: cursor }; // _id 必須小於游標
            }

            // 限制只回傳一天內的貼文
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 365);
            query.createdAt = {
                ...query.createdAt,
                $gte: oneDayAgo // createdAt 必須在一天以內
            };

            // 構建訪問權限查詢條件
            query.$or = [
                { user: userId }, // 用戶自己的貼文
                { user: { $in: await User.find({ isPublic: true }).select('_id') } } // 公開用戶的貼文
            ];

            const posts = await Post.find(query)
                .sort({ createdAt: -1, _id: -1 }) // 按 createdAt 和 _id 排序
                .limit(limit)
                .populate('user', 'userName accountName avatarUrl isPublic')
                .lean(); // 使用 lean() 提升效能

            return posts;
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
    async createPost(userId: Types.ObjectId, content: string, images: string[]): Promise<IPostDocument> {
        try {
            if (content.length > 280) {
                throw new Error('貼文內容超過長度限制');
            }
            const post = new Post({
                user: userId,
                content,
                images,
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

                // 刪除所有相關評論
                Comment.deleteMany({ post: postId }).session(session)
                // 刪除所有相關按讚記錄
                Like.deleteMany({
                    target: postId,
                    targetModel: 'Post'
                }).session(session)
                // 刪除所有相關通知
                Event.deleteMany({
                    'details.postId': postId,
                    eventType: { $in: ['like', 'comment'] }
                }).session(session)

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
     * @returns Promise<boolean> - 按讚處理結果
     * 
     * 使用場景：
     * - 當用戶點擊空心愛心時調用此 API
     * - 前端需要維護愛心的狀態
     * - 只在未按讚狀態下調用此 API
     * 
     * 實作重點：
     * 1. 使用 MongoDB 事務確保資料一致性
     * 2. 不檢查重複按讚（由前端控制）
     * 3. 同時處理：
     *    - 建立按讚記錄
     *    - 更新貼文的按讚計數
     *    - 建立通知（若非自己的貼文）
     */
    async likePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                // 檢查貼文是否存在
                const post = await Post.findById(postId).session(session);
                if (!post) {
                    throw new Error("Post not found");
                }

                // 嘗試插入按讚記錄
                await Like.create(
                    [{
                        user: userId,
                        target: postId,
                        targetModel: 'Post'
                    }],
                    { session }
                );

                // 更新貼文按讚計數
                const postUpdateResult = await Post.updateOne(
                    { _id: postId },
                    { $inc: { likesCount: 1 } }
                ).session(session);

                if (postUpdateResult.modifiedCount === 0) {
                    throw new Error("Failed to increment like count");
                }

                // 如果不是自己的貼文，建立通知
                if (!post.user._id.equals(userId)) {
                    await Event.create(
                        [{
                            sender: userId,
                            receiver: post.user,
                            eventType: 'like',
                            details: { postId }
                        }],
                        { session }
                    );
                }

                // 所有操作成功，返回 true
                return true;
            });

            return result; // 返回事務結果
        } catch (error: unknown) {
            if (error instanceof MongoServerError && error.code === 11000) {
                // 重複點讚，返回 false
                return false;
            }
            // 其他錯誤
            throw error;
        } finally {
            session.endSession(); // 確保 session 始終關閉
        }
    }

    /**
     * 處理取消貼文按讚功能
     * 
     * @param postId - 要取消按讚的貼文ID
     * @param userId - 執行取消按讚的使用者ID
     * @returns Promise<boolean> - 取消按讚處理結果
     * 
     * 使用場景：
     * - 當用戶點擊紅色愛心時調用此 API
     * - 前端需要維護愛心的狀態
     * - 只在已按讚狀態下調用此 API
     * 
     * 實作重點：
     * 1. 使用 MongoDB 事務確保資料一致性
     * 2. 使用 deleteOne 直接刪除按讚記錄
     * 3. 同時處理：
     *    - 刪除按讚記錄
     *    - 更新貼文的按讚計數
     *    - 刪除相關通知
     */
    async unlikePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // 檢查按讚記錄是否存在
                const likeRecord = await Like.findOne({
                    user: userId,
                    target: postId,
                    targetModel: 'Post'
                }).session(session);

                // 如果按讚記錄不存在，直接返回 false
                if (!likeRecord) {
                    return false;
                }

                // 刪除按讚記錄
                await Like.deleteOne({
                    _id: likeRecord._id
                }).session(session);

                // 更新貼文按讚計數
                const postUpdateResult = await Post.updateOne(
                    { _id: postId },
                    { $inc: { likesCount: -1 } }
                ).session(session);

                // 如果貼文不存在或更新失敗，拋出錯誤回滾事務
                if (postUpdateResult.modifiedCount === 0) {
                    throw new Error('Failed to decrement like count');
                }

                // 刪除通知（如果存在）
                await Event.deleteOne({
                    sender: userId,
                    'details.postId': postId,
                    eventType: 'like'
                }).session(session);

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
                if (!post.user._id.equals(userId)) {
                    await new Event({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'comment',
                        details: { postId, commentId: comment._id }
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