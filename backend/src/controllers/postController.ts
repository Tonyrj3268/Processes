// controllers/postController.ts
import { Request, Response } from 'express';
import { PostService } from '@src/services/postService';
import { Types } from 'mongoose';
import { IUserDocument } from '@src/models/user';

export class PostController {
    constructor(private postService: PostService = new PostService()) { }

    /**
     * 獲取所有貼文列表
     * GET /api/post
     *
     * @param {string} [req.query.cursor] - 時間戳記，用於實現無限捲動分頁
     * @param {number} [req.query.limit] - 每頁返回的貼文數量，預設值為 10
     * @returns {Promise<void>} 回傳貼文列表、下一頁游標及是否還有更多資料
     *
     * 功能說明：
     * - 採用游標分頁機制實現無限捲動
     * - 只回傳公開用戶的貼文和當前用戶自己的貼文
     * - 優化回傳資料結構，減少不必要的資料傳輸
     */
    async getAllPosts(req: Request, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const cursor = req.query.cursor as string;  // 上一次請求的最後一篇貼文的 createdAt
            const currentUserId = (req.user as IUserDocument)._id;  // currentUserId 由 authenticateJWT 中間件注入

            if (limit < 1) {
                res.status(400).json({ msg: '無效的參數' });
                return;
            }

            const posts = await this.postService.getAllPosts(limit, cursor, currentUserId);

            // 如果有貼文，取得最後一篇的時間戳作為下一個 cursor）
            const nextCursor = posts.length > 0
                ? posts[posts.length - 1].createdAt.toISOString()
                : null;

            // 重新整理回傳資料結構
            res.status(200).json({
                posts: posts.map(post => ({
                    postId: post._id,
                    author: {
                        id: post.user._id,
                        userName: (post.user as unknown as IUserDocument).userName,
                        accountName: (post.user as unknown as IUserDocument).accountName,
                        avatarUrl: (post.user as unknown as IUserDocument).avatarUrl
                    },
                    content: post.content,
                    likesCount: post.likesCount,
                    commentCount: post.comments?.length || 0,
                    createdAt: post.createdAt
                })),
                nextCursor,  // 提供給前端下次請求使用
                hasMore: posts.length === limit  // 如果回傳的貼文數量等於 limit，表示還有更多貼文
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

            // 這樣可以讓前端立即獲得新建立的貼文資料，不需要再次請求。
            const newPost = await this.postService.createPost(userId, content);
            res.status(201).json({
                msg: "Post created successfully",
                post: {
                    postId: newPost._id,
                    content: newPost.content,
                    createdAt: newPost.createdAt,
                    likesCount: 0,
                    commentCount: 0
                }
            });
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