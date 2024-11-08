// services/postService.ts
import { Types } from 'mongoose';
import { Post, IPost, IPostDocument } from '@src/models/post';
import { Event, IEvent } from '@src/models/events';
import mongoose from 'mongoose';

export class PostService {
    /**
     * 獲取貼文列表，支援分頁功能
     */
    async getAllPosts(page: number = 1, limit: number = 10): Promise<{ posts: IPost[]; total: number }> {
        try {
            const skip = (page - 1) * limit;

            const [total, posts] = await Promise.all([
                Post.countDocuments(),
                Post.find()
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('user', 'userName accountName avatarUrl')
                    .lean()
            ]);

            return { posts, total };
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            throw error;
        }
    }

    /**
     * 建立新貼文
     */
    async createPost(userId: Types.ObjectId, content: string): Promise<IPostDocument> {
        try {
            if (content.length > 280) {
                throw new Error('貼文內容超過長度限制');
            }

            const post = new Post({
                user: userId,
                content,
                comments: [],
                likesCount: 0
            });
            
            return await post.save();
        } catch (error) {
            console.error('Error in createPost:', error);
            throw error;
        }
    }

    /**
     * 更新貼文內容
     */
    async updatePost(
        postId: Types.ObjectId,
        userId: Types.ObjectId,
        content: string
    ): Promise<IPostDocument | null> {
        try {
            if (content.length > 280) {
                throw new Error('貼文內容超過長度限制');
            }

            return await Post.findOneAndUpdate(
                { _id: postId, user: userId },
                { 
                    content,
                    updatedAt: new Date()
                },
                { new: true }
            ).populate('user', 'userName accountName avatarUrl');
        } catch (error) {
            console.error('Error in updatePost:', error);
            throw error;
        }
    }

    /**
     * 刪除貼文
     * 同時刪除相關的事件記錄
     */
    async deletePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                const post = await Post.findOneAndDelete(
                    { _id: postId, user: userId },
                    { session }
                );

                if (!post) {
                    await session.abortTransaction();
                    return false;
                }

                // 刪除與該貼文相關的所有事件
                await Event.deleteMany({
                    $or: [
                        { 'details.postId': postId },
                        { eventType: { $in: ['comment', 'like'] }, 
                          'details.postId': postId }
                    ]
                }).session(session);

                return true;
            });

            return result;
        } catch (error) {
            console.error('Error in deletePost:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 獲取特定貼文的詳細資訊
     */
    async getPostDetail(postId: Types.ObjectId, currentUserId: Types.ObjectId): Promise<IPost | null> {
        try {
            const post = await Post.findById(postId)
                .populate('user', 'userName accountName avatarUrl')
                .lean();

            if (!post) {
                return null;
            }

            return post;
        } catch (error) {
            console.error('Error in getPostDetail:', error);
            throw error;
        }
    }
}

export const postService = new PostService();