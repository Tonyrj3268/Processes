// controllers/postController.ts
import { Request, Response } from 'express';
import { postService, PostService } from '@src/services/postService';
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
    getAllPosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const cursor = req.query.cursor as string;  // 上一次請求的最後一篇貼文的 _id
            const currentUserId = (req.user as IUserDocument)._id;  // currentUserId 由 authenticateJWT 中間件注入

            if (limit < 1) {
                res.status(400).json({ msg: '無效的參數' });
                return;
            }

            const posts = await this.postService.getAllPosts(limit, cursor, currentUserId);

            // 如果有貼文，取得最後一篇的_id作為下一個 cursor）
            const nextCursor = posts.length > 0
                ? posts[posts.length - 1]._id
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
    createPost = async (req: Request, res: Response): Promise<void> => {
        try {
            const { content } = req.body;
            // 透過 req.user 取得已認證的使用者資訊，這裡的型別斷言是必要的
            const userId = (req.user as IUserDocument)._id;
            // 獲取多張圖片的 URL
            const images = req.files
                ? (req.files as Express.MulterS3.File[]).map(file => file.location)
                : [];

            const newPost = await this.postService.createPost(userId, content, images);
            // 這樣可以讓前端立即獲得新建立的貼文資料，不需要再次請求。
            res.status(201).json({
                msg: "Post created successfully",
                post: {
                    postId: newPost._id,
                    content: newPost.content,
                    images: newPost.images,
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
    updatePost = async (req: Request, res: Response): Promise<void> => {
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
    deletePost = async (req: Request, res: Response): Promise<void> => {
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
     * 處理貼文按讚
     * POST /api/posts/:postId/like
     * 
     * 使用場景：
     * - 當用戶點擊空心愛心時調用
     * - 前端需確保只在未按讚狀態下調用
     * 
     * @param req - 請求物件，需包含 postId 參數和認證用戶資訊
     * @param res - 回應物件
     */
    likePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const success = await this.postService.likePost(
                new Types.ObjectId(postId),
                userId
            );

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: "貼文不存在"
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "已按讚"
            });
        } catch (error) {
            console.error('Error in likePost controller:', error);
            res.status(500).json({
                success: false,
                message: '伺服器錯誤'
            });
        }
    }

    /**
     * 處理取消貼文按讚
     * DELETE /api/posts/:postId/like
     * 
     * 使用場景：
     * - 當用戶點擊紅色愛心時調用
     * - 前端需確保只在已按讚狀態下調用
     * 
     * @param req - 請求物件，需包含 postId 參數和認證用戶資訊
     * @param res - 回應物件
     */
    unlikePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const { postId } = req.params;
            const userId = (req.user as IUserDocument)._id;

            const success = await this.postService.unlikePost(
                new Types.ObjectId(postId),
                userId
            );

            if (!success) {
                res.status(404).json({
                    success: false,
                    message: "找不到按讚記錄"
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "已取消按讚"
            });
        } catch (error) {
            console.error('Error in unlikePost controller:', error);
            res.status(500).json({
                success: false,
                message: '伺服器錯誤'
            });
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
    addComment = async (req: Request, res: Response): Promise<void> => {
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

export const postController = new PostController(postService);