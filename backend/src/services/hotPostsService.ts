// src/services/hotPostsService.ts
import cron from 'node-cron';
import redisClient from '@src/config/redis';
import { Post, IPostDocument } from '@src/models/post';

export class HotPostsService {
    constructor() {
        // 每天凌晨 2 點更新熱門貼文
        cron.schedule('0 0 * * *', this.updateHotPosts);
    }
    getHotPosts = async (): Promise<IPostDocument[]> => { // 明確回傳類型為 IPostDocument[] 或更具體的型別
        try {
            const hotPostsKey = 'hot:posts';
            // 獲取熱門貼文，帶有分數
            const hotPosts = await redisClient.get(hotPostsKey);
            if (hotPosts) {
                const posts: IPostDocument[] = JSON.parse(hotPosts);
                return posts;
            }
            this.updateHotPosts();
            return [];
        } catch (error) {
            console.error('獲取熱門貼文失敗:', error);
            return [];
        }
    }

    updateHotPosts = async () => {
        try {
            const hotPostsKey = 'hot:posts';
            // 根據點讚數和評論數排序，獲取前 1000 條熱門貼文
            const hotPosts = await Post.find({})
                .sort({ likesCount: -1, comments: -1, createdAt: -1 })
                .limit(100)
                .populate('user', 'userName accountName avatarUrl')
                .select('-comments') // 排除 comments 欄位，減少資料量
                .lean();

            // 清空當前的熱門貼文有序集合
            await redisClient.del(hotPostsKey);

            await redisClient.setex(hotPostsKey, 600, JSON.stringify(hotPosts));

            console.log('熱門貼文已更新');
        } catch (error) {
            console.error('更新熱門貼文失敗:', error);
        }
    }
}

export const hotPostsService = new HotPostsService();
