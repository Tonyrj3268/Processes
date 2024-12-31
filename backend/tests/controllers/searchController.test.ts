// tests/controllers/searchController.test.ts
import { Request, Response } from "express";
import { SearchController } from "@src/controllers/searchController";
import { SearchService } from "@src/services/searchService";
import { Types } from "mongoose";
import "@tests/setup";

// 模擬 Response 對象
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe("SearchController", () => {
    let controller: SearchController;
    let mockSearchService: SearchService;

    beforeEach(() => {
        mockSearchService = new SearchService();
        controller = new SearchController(mockSearchService);
    });

    describe("searchPosts", () => {
        it("應該返回搜索到的貼文列表", async () => {
            // 創建新的 ObjectId
            const postId = new Types.ObjectId();
            const userId = new Types.ObjectId();

            // 模擬搜索結果，包含所有必要字段
            const mockResult = {
                posts: [
                    {
                        postId: postId,
                        content: "test content",
                        author: {
                            id: userId,
                            userName: "testUser",
                            accountName: "test",
                            avatarUrl: "test.jpg"
                        },
                        likesCount: 0,
                        commentCount: 0,
                        createdAt: new Date(),
                        highlight: {
                            content: "highlighted content"
                        }
                    }
                ],
                nextCursor: postId // 使用最後一個貼文的 ID 作為游標
            };

            jest.spyOn(mockSearchService, "searchPosts").mockResolvedValue(mockResult);

            const req = {
                query: { q: "test", limit: "10" }
            } as unknown as Request;

            const res = mockResponse();

            await controller.searchPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it("應該在缺少搜索關鍵字時返回 400", async () => {
            const req = {
                query: { limit: "10" }
            } as unknown as Request;

            const res = mockResponse();

            await controller.searchPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Search query is required"
            });
        });
    });

    describe("searchUsers", () => {
        it("應該返回搜索到的用戶列表", async () => {
            const userId = new Types.ObjectId();
            const mockResult = {
                users: [
                    {
                        id: userId,
                        userName: "testUser",
                        accountName: "test",
                        avatarUrl: "test.jpg",
                        bio: "test bio",
                        followersCount: 0,
                        followingCount: 0
                    }
                ],
                nextCursor: userId
            };

            jest.spyOn(mockSearchService, "searchUsers").mockResolvedValue(mockResult);

            const req = {
                query: { q: "test", limit: "10" }
            } as unknown as Request;

            const res = mockResponse();

            await controller.searchUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });
    });

    describe("searchComments", () => {
        it("應該返回搜索到的評論列表", async () => {
            const commentId = new Types.ObjectId();
            const userId = new Types.ObjectId();
            const mockResult = {
                comments: [
                    {
                        commentId: commentId,
                        content: "test comment",
                        author: {
                            id: userId,
                            userName: "testUser",
                            accountName: "test",
                            avatarUrl: "test.jpg"
                        },
                        likesCount: 0,
                        repliesCount: 0,
                        createdAt: new Date(),
                        highlight: {
                            content: "highlighted content"
                        }
                    }
                ],
                nextCursor: commentId
            };

            jest.spyOn(mockSearchService, "searchComments")
                .mockResolvedValue(mockResult);

            const req = {
                query: { q: "test", limit: "10" }
            } as unknown as Request;

            const res = mockResponse();

            await controller.searchComments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });
    });
});