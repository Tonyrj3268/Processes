// src/controllers/searchController.ts
import { Request, Response } from "express";
import { searchService, SearchService } from "@src/services/searchService";

export class SearchController {
    constructor(private searchService: SearchService) { }

    /**
     * 搜索貼文
     * GET /api/search/posts?q=關鍵字&cursor=xxx&limit=10
     */
    searchPosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const { q, cursor, limit = "10" } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({ message: "Search query is required" });
                return;
            }

            const result = await this.searchService.searchPosts(
                q,
                cursor as string | undefined,
                parseInt(limit as string)
            );

            res.status(200).json(result);
        } catch (error) {
            console.error('Error in searchPosts controller:', error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * 搜索用戶
     * GET /api/search/users?q=關鍵字&cursor=xxx&limit=10
     */
    searchUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const { q, cursor, limit = "10" } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({ message: "Search query is required" });
                return;
            }

            const result = await this.searchService.searchUsers(
                q,
                cursor as string | undefined,
                parseInt(limit as string)
            );

            res.status(200).json(result);
        } catch (error) {
            console.error('Error in searchUsers controller:', error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * 搜索評論
     * GET /api/search/comments?q=關鍵字&cursor=xxx&limit=10
     */
    searchComments = async (req: Request, res: Response): Promise<void> => {
        try {
            const { q, cursor, limit = "10" } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({ message: "Search query is required" });
                return;
            }

            const result = await this.searchService.searchComments(
                q,
                cursor as string | undefined,
                parseInt(limit as string)
            );

            res.status(200).json(result);
        } catch (error) {
            console.error('Error in searchComments controller:', error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
}

export const searchController = new SearchController(searchService);