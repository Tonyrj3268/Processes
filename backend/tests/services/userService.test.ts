// tests/services/userService.test.ts
import { UserService } from "@src/services/userService";
import { User, IUserDocument } from "@src/models/user";
import { Follow } from "@src/models/follow";
import { Types } from "mongoose";
import "@tests/setup";
import redisClient from "@src/config/redis";
import { eventService } from "@src/services/eventService";

// 模擬 Elasticsearch
jest.mock('@src/config/elasticsearch', () => ({
  indices: {
    exists: jest.fn().mockResolvedValue(true),
    create: jest.fn().mockResolvedValue({}),
  },
  index: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
}));

describe("UserService", () => {
  let userService: UserService;
  let testUser: IUserDocument;
  let anotherUser: IUserDocument;

  // 創建測試用戶的輔助函數
  const createTestUser = async (overrides = {}) => {
    const defaultData = {
      userName: "defaultUser",
      accountName: "defaultAccountName",
      email: "default@example.com",
      password: "defaultPassword",
    };
    const userData = { ...defaultData, ...overrides };
    const user = new User(userData);
    return await user.save();
  };

  // 每個測試套件執行前的設置
  beforeAll(() => {
    userService = new UserService(redisClient, eventService);
  });

  // 每個測試案例執行前的設置
  beforeEach(async () => {
    // 創建兩個測試用戶
    testUser = await createTestUser({
      userName: "testuser",
      accountName: "testAccountName",
      email: "test@example.com",
    });

    anotherUser = await createTestUser({
      userName: "anotheruser",
      accountName: "anotherAccountName",
      email: "another@example.com",
    });
  });

  // 查找用戶相關測試
  describe("findUserById", () => {
    it("應該返回用戶資料，如果用戶存在", async () => {
      const foundUser = await userService.findUserById(testUser._id.toString());

      expect(foundUser).not.toBeNull();
      expect(foundUser!.userName).toBe("testuser");
      expect(foundUser!.email).toBe("test@example.com");
    });

    it("應該返回 null，如果用戶不存在", async () => {
      const nonExistentId = new Types.ObjectId();
      const foundUser = await userService.findUserById(nonExistentId.toString());

      expect(foundUser).toBeNull();
    });
  });

  // 關注用戶相關測試
  describe("followUser", () => {
    it("應該成功關注另一個用戶", async () => {
      const result = await userService.followUser(testUser._id, anotherUser._id);

      expect(result).toBe(true);
      const follow = await Follow.findOne({
        follower: testUser._id,
        following: anotherUser._id,
      });
      expect(follow).not.toBeNull();
    });

    it("應該防止用戶關注自己", async () => {
      const result = await userService.followUser(testUser._id, testUser._id);

      expect(result).toBe(false);
      const follow = await Follow.findOne({
        follower: testUser._id,
        following: testUser._id,
      });
      expect(follow).toBeNull();
    });
  });

  // 取消關注相關測試
  describe("unfollowUser", () => {
    beforeEach(async () => {
      // 先建立關注關係
      await userService.followUser(testUser._id, anotherUser._id);
    });

    it("應該成功取消關注另一個用戶", async () => {
      const result = await userService.unfollowUser(testUser._id, anotherUser._id);

      expect(result).toBe(true);
      const follow = await Follow.findOne({
        follower: testUser._id,
        following: anotherUser._id,
      });
      expect(follow).toBeNull();
    });

    it("應該防止取消不存在的關注關係", async () => {
      const nonExistentId = new Types.ObjectId();
      const result = await userService.unfollowUser(testUser._id, nonExistentId);

      expect(result).toBe(false);
    });
  });
});