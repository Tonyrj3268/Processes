// controllers/postController.ts
import { Request, Response } from 'express';
import { PostService } from '@src/services/postService';
import { Types } from 'mongoose';
import { IUserDocument } from '@src/models/user';

export class PostController {
    constructor(private postService: PostService = new PostService()) { }

    /**
     * 獲取所有貼文，支援分頁功能
     */
    async getAllPosts(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (page < 1 || limit < 1) {
                res.status(400).json({ msg: '無效的分頁參數' });
                return;
            }

            const { posts, total } = await this.postService.getAllPosts(page, limit);
            
            res.status(200).json({
                posts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalPosts: total,
                    postsPerPage: limit
                }
            });
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 建立新貼文
     */
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
            if (error instanceof Error && error.message === '貼文內容超過長度限制') {
                res.status(400).json({ msg: error.message });
                return;
            }
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 更新貼文內容
     */
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
            if (error instanceof Error && error.message === '貼文內容超過長度限制') {
                res.status(400).json({ msg: error.message });
                return;
            }
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 刪除貼文
     */
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

    /**
     * 獲取特定貼文詳細資訊
     */
    async getPostDetail(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const post = await this.postService.getPostDetail(
                new Types.ObjectId(postId),
                userId
            );

            if (!post) {
                res.status(404).json({ msg: '貼文不存在' });
                return;
            }

            res.status(200).json({ post });
        } catch (error) {
            console.error('Error in getPostDetail:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }
}

export const postController = new PostController();