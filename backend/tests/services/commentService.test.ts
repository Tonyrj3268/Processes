// tests/services/commentService.test.ts
import { CommentService } from '@src/services/commentService';
import { Comment, ICommentDocument } from '@src/models/comment';
import { User, IUserDocument } from '@src/models/user';
import { Types } from 'mongoose';
import "@tests/setup";

// 模擬 Elasticsearch
jest.mock('@src/config/elasticsearch', () => ({
    indices: {
        exists: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue({}),
    },
    index: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
}));

describe('CommentService', () => {
    let commentService: CommentService;
    let testUser: IUserDocument;
    let testComment: ICommentDocument;

    // 創建測試用戶
    const createTestUser = async (overrides = {}) => {
        const userData = {
            userName: "testUser",
            accountName: "testAccount",
            email: "test@example.com",
            password: "password123",
            ...overrides
        };
        return await User.create(userData);
    };

    // 創建測試評論
    const createTestComment = async (userId: Types.ObjectId, overrides = {}) => {
        const commentData = {
            user: userId,
            content: "Test comment content",
            likesCount: 0,
            comments: [],
            ...overrides
        };
        return await Comment.create(commentData);
    };

    beforeAll(() => {
        commentService = new CommentService();
    });

    beforeEach(async () => {
        testUser = await createTestUser();
        testComment = await createTestComment(testUser._id);
    });

    describe('createComment', () => {
        it('應該成功創建評論', async () => {
            const content = "New test comment";
            const result = await commentService.createComment(testUser._id, content);

            expect(result).toBe(true);

            const comment = await Comment.findOne({
                user: testUser._id,
                content: content
            });

            expect(comment).toBeDefined();
            expect(comment?.content).toBe(content);
            expect(comment?.user.toString()).toBe(testUser._id.toString());
        });

        it('評論內容超過限制時應拋出錯誤', async () => {
            const longContent = 'a'.repeat(281);

            await expect(
                commentService.createComment(testUser._id, longContent)
            ).rejects.toThrow('評論內容超過長度限制');
        });
    });

    describe('updateComment', () => {
        it('應該成功更新評論', async () => {
            const newContent = "Updated comment content";

            const result = await commentService.updateComment(
                testComment._id,
                testUser._id,
                newContent
            );

            expect(result).toBe(true);

            const updatedComment = await Comment.findById(testComment._id);
            expect(updatedComment?.content).toBe(newContent);
        });

        it('不應該允許其他用戶更新評論', async () => {
            const anotherUser = await createTestUser({
                email: "another@example.com",
                accountName: "anotherAccount"
            });

            const result = await commentService.updateComment(
                testComment._id,
                anotherUser._id,
                "Unauthorized update"
            );

            expect(result).toBe(false);

            const comment = await Comment.findById(testComment._id);
            expect(comment?.content).toBe("Test comment content");
        });
    });

    describe('deleteComment', () => {
        it('應該成功刪除評論', async () => {
            const result = await commentService.deleteComment(
                testComment._id,
                testUser._id
            );

            expect(result).toBe(true);

            const deletedComment = await Comment.findById(testComment._id);
            expect(deletedComment).toBeNull();
        });

        it('不應該允許其他用戶刪除評論', async () => {
            const anotherUser = await createTestUser({
                email: "another@example.com",
                accountName: "anotherAccount"
            });

            const result = await commentService.deleteComment(
                testComment._id,
                anotherUser._id
            );

            expect(result).toBe(false);

            const comment = await Comment.findById(testComment._id);
            expect(comment).not.toBeNull();
        });
    });

    describe('likeComment', () => {
        it('應該成功對評論按讚', async () => {
            const result = await commentService.likeComment(
                testComment._id,
                testUser._id
            );

            expect(result).toBe(true);

            const comment = await Comment.findById(testComment._id);
            expect(comment?.likesCount).toBe(1);
        });

        it('不應該重複按讚', async () => {
            // 第一次按讚
            await commentService.likeComment(testComment._id, testUser._id);

            // 第二次按讚應該失敗
            const result = await commentService.likeComment(
                testComment._id,
                testUser._id
            );

            expect(result).toBe(false);

            const comment = await Comment.findById(testComment._id);
            expect(comment?.likesCount).toBe(1);
        });
    });

    describe('unlikeComment', () => {
        beforeEach(async () => {
            // 先按讚，再測試取消按讚
            await commentService.likeComment(testComment._id, testUser._id);
        });

        it('應該成功取消評論按讚', async () => {
            const result = await commentService.unlikeComment(
                testComment._id,
                testUser._id
            );

            expect(result).toBe(true);

            const comment = await Comment.findById(testComment._id);
            expect(comment?.likesCount).toBe(0);
        });

        it('不應該取消不存在的按讚', async () => {
            const anotherUser = await createTestUser({
                email: "another@example.com",
                accountName: "anotherAccount"
            });

            const result = await commentService.unlikeComment(
                testComment._id,
                anotherUser._id
            );

            expect(result).toBe(false);

            const comment = await Comment.findById(testComment._id);
            expect(comment?.likesCount).toBe(1);
        });
    });
});