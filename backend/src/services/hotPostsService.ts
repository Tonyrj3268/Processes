// src/services/hotPostsService.ts
import cron from 'node-cron';
import redisClient from '@src/config/redis';
import { Post, IPostDocument } from '@src/models/post';
import { IUserDocument } from '@src/models/user';

class HotPostsService {
    constructor() {
        // 每天凌晨 2 點更新熱門貼文
        cron.schedule('0 0 * * *', this.updateHotPosts);
    }

    updateHotPosts = async () => {
        try {
            const hotPostsKey = 'hot:posts';
            // 根據點讚數和評論數排序，獲取前 1000 條熱門貼文
            const hotPosts = await Post.find({})
                .sort({ likesCount: -1, comments: -1, createdAt: -1 })
                .limit(1000)
                .populate('user', 'userName accountName avatarUrl')
                .lean<IPostDocument[]>();

            // 清空當前的熱門貼文有序集合
            await redisClient.del(hotPostsKey);

            // 重新添加熱門貼文到有序集合
            const pipeline = redisClient.pipeline();
            hotPosts.forEach(post => {
                const hotScore = post.likesCount + (post.comments?.length || 0); // 熱度分數
                const userData = post.user as IUserDocument;
                // 將整個貼文物件序列化
                const postData = JSON.stringify({
                    postId: post._id.toString(),
                    author: {
                        id: userData._id.toString(),
                        userName: userData.userName,
                        accountName: userData.accountName,
                        avatarUrl: userData.avatarUrl
                    },
                    content: post.content,
                    likesCount: post.likesCount,
                    commentCount: post.comments?.length || 0,
                    createdAt: post.createdAt
                });
                pipeline.zadd(hotPostsKey, hotScore, postData);
            });
            await pipeline.exec();

            console.log('熱門貼文已更新');
        } catch (error) {
            console.error('更新熱門貼文失敗:', error);
        }
    }
}

export const hotPostController = new HotPostsService();
