// controllers/postController.ts
import { Request, Response } from 'express';
import { PostService } from '@src/services/postService';
import { Types } from 'mongoose';
import { IUserDocument } from '@src/models/user';

export class PostController {
    constructor(private postService: PostService = new PostService()) { }

    /**
     * 獲取所有貼文
     * GET /api/post
     * 
     * 實作重點：
     * 1. 支援分頁機制，透過 page 和 limit 參數控制
     * 2. 回傳資料結構經過重新整理，只回傳必要資訊
     * 3. 額外計算並回傳分頁相關資訊，方便前端實作分頁UI
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

            // 重新整理回傳資料結構，只保留必要資訊
            res.status(200).json({
                posts: posts.map(post => ({
                    postId: post._id,
                    author: post.user._id,
                    content: post.content,
                    likesCount: post.likesCount,
                    commentCount: post.comments?.length || 0,
                    createdAt: post.createdAt
                })),
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
     * POST /api/post
     * 
     * 特點：
     * - 從 req.user 取得已認證的使用者資訊，確保安全性
     * - 簡單的錯誤處理，確保系統穩定性
     */
    async createPost(req: Request, res: Response): Promise<void> {
        try {
            const { content } = req.body;
            // 透過 req.user 取得已認證的使用者資訊，這裡的型別斷言是必要的
            const userId = (req.user as IUserDocument)._id;

            await this.postService.createPost(userId, content);
            res.status(201).json({ msg: "Post created successfully" });
        } catch (error) {
            console.error('Error in createPost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 更新貼文
     * PATCH /api/post/:postId
     * 
     * 實作重點：
     * 1. 使用 Types.ObjectId 確保 ID 格式正確
     * 2. 回傳 boolean 值判斷是否更新成功
     * 3. 區分 404 (找不到) 和 500 (伺服器錯誤) 的情況
     */
    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { content } = req.body;
            const userId = (req.user as IUserDocument)._id;

            // 使用 Types.ObjectId 轉換字串 ID，確保格式正確
            const result = await this.postService.updatePost(
                new Types.ObjectId(postId),
                userId,
                content
            );

            // 根據更新結果回傳適當的狀態碼
            if (!result) {
                res.status(404).json({ msg: "Post not found or unauthorized" });
                return;
            }

            res.status(200).json({ msg: "Post updated successfully" });
        } catch (error) {
            console.error('Error in updatePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 刪除貼文
     * DELETE /api/post/:postId
     * 
     * 特點：
     * - 同樣使用 Types.ObjectId 確保 ID 格式正確
     * - 遵循 RESTful API 的設計原則
     */
    async deletePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.postService.deletePost(
                new Types.ObjectId(postId),
                userId
            );

            if (!result) {
                res.status(404).json({ msg: "Post not found or unauthorized" });
                return;
            }

            res.status(200).json({ msg: "Post deleted successfully" });
        } catch (error) {
            console.error('Error in deletePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 對貼文按讚
     * POST /api/post/:postId/like
     * 
     * 特點：
     * - 使用 409 狀態碼表示已經按讚的衝突情況
     * - 回傳簡潔的訊息，符合 REST API 設計原則
     */
    async likePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.postService.likePost(
                new Types.ObjectId(postId),
                userId
            );

            // 使用 409 Conflict 狀態碼表示重複按讚的情況
            if (!result) {
                res.status(409).json({ msg: "Post already liked or not found" });
                return;
            }

            res.status(200).json({ msg: "Post liked successfully" });
        } catch (error) {
            console.error('Error in likePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 取消貼文按讚
     * DELETE /api/post/:postId/like
     * 
     * 特點：
     * - 使用 DELETE 方法符合 REST 設計原則
     * - 狀態碼的使用與 likePost 一致，保持 API 行為一致性
     */
    async unlikePost(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.postService.unlikePost(
                new Types.ObjectId(postId),
                userId
            );

            if (!result) {
                res.status(409).json({ msg: "Post not liked or not found" });
                return;
            }

            res.status(200).json({ msg: "Post unliked successfully" });
        } catch (error) {
            console.error('Error in unlikePost:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }

    /**
     * 新增評論到貼文
     * POST /api/post/:postId/comments
     * 
     * 特點：
     * - 使用 201 Created 狀態碼表示成功建立資源
     * - 錯誤處理區分找不到貼文和伺服器錯誤兩種情況
     */
    async addComment(req: Request, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const { content } = req.body;
            const userId = (req.user as IUserDocument)._id;

            const result = await this.postService.addComment(
                new Types.ObjectId(postId),
                userId,
                content
            );

            if (!result) {
                res.status(404).json({ msg: "Post not found" });
                return;
            }

            res.status(201).json({ msg: "Comment added successfully" });
        } catch (error) {
            console.error('Error in addComment:', error);
            res.status(500).json({ msg: '伺服器錯誤' });
        }
    }
}

export const postController = new PostController();