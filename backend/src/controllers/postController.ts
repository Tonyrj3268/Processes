// controllers/postController.ts
import { Request, Response } from 'express';
import { PostService } from '@src/services/postService';
import { Types } from 'mongoose';
import { IUserDocument } from '@src/models/user';

export class PostController {
    constructor(private postService: PostService = new PostService()) { }

    async getAllPosts(req: Request, res: Response): Promise<void> {
        try {
            const posts = await this.postService.getAllPosts();
            res.status(200).json({ posts });
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    async createPost(req: Request, res: Response): Promise<void> {
        try {
            const { content } = req.body;
            const userId = (req.user as IUserDocument)._id;

            const post = await this.postService.createPost(userId, content);
            res.status(201).json({
                msg: '貼文建立成功',
                post: {
                    _id: post._id,
                    content: post.content,
                    user: post.user,
                    createdAt: post.createdAt,
                    likesCount: post.likesCount,
                    commentCount: post.comments?.length || 0
                }
            });
        } catch (error) {
            console.error('Error in createPost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { content } = req.body;
            const userId = (req.user as IUserDocument)._id;

            const postObjectId = new Types.ObjectId(postId);
            const post = await this.postService.updatePost(postObjectId, userId, content);
            if (!post) {
                res.status(404).json({ msg: '貼文不存在或無權限修改' });
                return;
            }

            res.status(200).json({
                msg: '貼文更新成功',
                post: {
                    _id: post._id,
                    content: post.content,
                    user: post.user,
                    updatedAt: post.updatedAt
                }
            });
        } catch (error) {
            console.error('Error in updatePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    async deletePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const postObjectId = new Types.ObjectId(postId);
            const result = await this.postService.deletePost(postObjectId, userId);

            if (!result) {
                res.status(404).json({ msg: '貼文不存在或無權限刪除' });
                return;
            }

            res.status(200).json({ msg: '貼文刪除成功' });
        } catch (error) {
            console.error('Error in deletePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    async likePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const postObjectId = new Types.ObjectId(postId);
            const result = await this.postService.likePost(postObjectId, userId);

            if (!result) {
                res.status(409).json({ msg: '貼文不存在或已經點讚' });
                return;
            }

            res.status(200).json({ msg: '貼文點讚成功' });
        } catch (error) {
            console.error('Error in likePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    async unlikePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const postObjectId = new Types.ObjectId(postId);
            const result = await this.postService.unlikePost(postObjectId, userId);

            if (!result) {
                res.status(409).json({ msg: '貼文不存在或尚未點讚' });
                return;
            }

            res.status(200).json({ msg: '取消貼文點讚成功' });
        } catch (error) {
            console.error('Error in unlikePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    async addComment(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { content } = req.body;
            const userId = (req.user as IUserDocument)._id;

            const postObjectId = new Types.ObjectId(postId);
            const comment = await this.postService.addComment(postObjectId, userId, content);

            if (!comment) {
                res.status(404).json({ msg: '貼文不存在' });
                return;
            }

            res.status(201).json({
                msg: '評論新增成功',
                comment: {
                    _id: comment._id,
                    content: comment.content,
                    user: comment.user,
                    createdAt: comment.createdAt
                }
            });
        } catch (error) {
            console.error('Error in addComment:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }
}

export const postController = new PostController();