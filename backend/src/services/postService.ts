// services/postService.ts
import { Types } from 'mongoose';
import { Post } from '@src/models/post';
import { Comment } from '@src/models/comment';
import { Like } from '@src/models/like';
import { Event } from '@src/models/events';
import mongoose from 'mongoose';

export class PostService {
    async getAllPosts() {
        try {
            return await Post.find()
                .sort({ createdAt: -1 })
                .populate('user', 'userName accountName avatarUrl')
                .lean();
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            throw error;
        }
    }

    async createPost(userId: Types.ObjectId, content: string) {
        try {
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

    async updatePost(postId: Types.ObjectId, userId: Types.ObjectId, content: string) {
        try {
            return await Post.findOneAndUpdate(
                { _id: postId, user: userId },
                { content },
                { new: true }
            ).populate('user', 'userName accountName avatarUrl');
        } catch (error) {
            console.error('Error in updatePost:', error);
            throw error;
        }
    }

    async deletePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                const post = await Post.findOne({ _id: postId, user: userId }).session(session);
                if (!post) {
                    await session.abortTransaction();
                    return false;
                }

                await Promise.all([
                    Post.findByIdAndDelete(postId).session(session),
                    Comment.deleteMany({ post: postId }).session(session),
                    Like.deleteMany({ target: postId, targetModel: 'Post' }).session(session),
                    Event.deleteMany({
                        'details.postId': postId,
                        eventType: { $in: ['like', 'comment'] }
                    }).session(session)
                ]);

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


    async likePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                // 確保所有操作都關聯到 session
                const [post, existingLike] = await Promise.all([
                    Post.findById(postId).session(session),
                    Like.findOne({ user: userId, target: postId, targetModel: 'Post' }).session(session)
                ]);

                if (!post || existingLike) {
                    // 回滾交易
                    await session.abortTransaction();
                    return false;
                }

                // 創建 Like 並更新 Post 的 likesCount
                await Promise.all([
                    new Like({
                        user: userId,
                        target: postId,
                        targetModel: 'Post'
                    }).save({ session }),
                    Post.findByIdAndUpdate(
                        postId,
                        { $inc: { likesCount: 1 } },
                        { session }
                    )
                ]);

                // 如果用戶不是貼文的作者，則創建 Event
                if (!post.user.equals(userId)) {
                    const details: Record<string, Types.ObjectId> = { postId };

                    await new Event({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'like',
                        details,
                    }).save({ session });
                }

                return true;
            });

            return result;
        } catch (error) {
            console.error('Error in likePost:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }


    async unlikePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                const [post, like] = await Promise.all([
                    Post.findById(postId).session(session),
                    Like.findOne({ user: userId, target: postId, targetModel: 'Post' }).session(session)
                ]);

                if (!post || !like) {
                    await session.abortTransaction();
                    return false;
                }

                await Promise.all([
                    Like.findByIdAndDelete(like._id, { session }),
                    Post.findByIdAndUpdate(
                        postId,
                        { $inc: { likesCount: -1 } },
                        { session }
                    ),
                    Event.deleteOne({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'like',
                        'details.postId': postId
                    }, { session })
                ]);

                return true;
            });

            return result;
        } catch (error) {
            console.error('Error in unlikePost:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }


    async addComment(postId: Types.ObjectId, userId: Types.ObjectId, content: string) {
        const session = await mongoose.startSession();
        try {
            const comment = await session.withTransaction(async () => {
                const post = await Post.findById(postId).session(session);
                if (!post) {
                    await session.abortTransaction();
                    return null;
                }

                const comment = await new Comment({
                    user: userId,
                    content,
                }).save({ session });

                await Post.findByIdAndUpdate(
                    postId,
                    { $push: { comments: comment._id } },
                    { session }
                );

                if (!post.user.equals(userId)) {
                    const details: Record<string, Types.ObjectId> = { postId, commentId: comment._id };

                    await new Event({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'comment',
                        details,
                    }).save({ session });
                }

                return comment;
            });

            return comment;
        } catch (error) {
            console.error('Error in addComment:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

}


export const postService = new PostService();