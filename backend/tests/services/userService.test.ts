import { UserService } from "@src/services/userService";
import { User, IUserDocument } from "@src/models/user";
import { Follow } from "@src/models/follow";
import mongoose from "mongoose";
import "@tests/setup";

describe("UserService with MongoMemoryServer", () => {
  let userService: UserService;
  let testUser: IUserDocument;
  let anotherUser: IUserDocument;

  // 工廠函數來創建用戶
  const createTestUser = async (overrides = {}): Promise<IUserDocument> => {
    const userData = {
      username: "defaultUser",
      email: "default@example.com",
      password: "defaultPassword",
      ...overrides,
    };
    const user = new User(userData);
    await user.save();
    return user;
  };

  beforeAll(() => {
    userService = new UserService();
  });

  beforeEach(async () => {
    testUser = await createTestUser({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    anotherUser = await createTestUser({
      username: "anotheruser",
      email: "anothertest@example.com",
      password: "password123",
    });
  });

  describe("findUserById", () => {
    it("應該返回用戶資料，如果用戶存在", async () => {
      const foundUser = await userService.findUserById(testUser._id.toString());

      expect(foundUser).not.toBeNull();
      expect(foundUser!.userName).toBe("testuser");
      expect(foundUser!.email).toBe("test@example.com");
    });

    it("應該返回 null，如果用戶不存在", async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const foundUser = await userService.findUserById(nonExistentUserId.toString());

      expect(foundUser).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("應該更新並返回更新後的用戶資料", async () => {
      const updatedUser = await userService.updateUserProfile(testUser, {
        username: "newUser",
        email: "new@example.com",
      });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.userName).toBe("newUser");
      expect(updatedUser!.email).toBe("new@example.com");
    });
  });

  describe("followUser", () => {
    it("應該成功關注另一個用戶", async () => {
      const result = await userService.followUser(testUser, anotherUser);
      expect(result).toBe(true);

      const follow = await Follow.findOne({
        follower: testUser._id,
        following: anotherUser._id,
      });
      expect(follow).not.toBeNull();

      const updatedUser = await User.findById(testUser._id);
      const updatedFollowedUser = await User.findById(anotherUser._id);
      expect(updatedUser!.followingCount).toBe(1);
      expect(updatedFollowedUser!.followersCount).toBe(1);
    });

    it("應該防止用戶關注自己", async () => {
      const result = await userService.followUser(testUser, testUser);
      expect(result).toBe(false);

      const followCount = await Follow.countDocuments({
        follower: testUser._id,
        following: testUser._id,
      });
      expect(followCount).toBe(0);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser!.followingCount).toBe(0);
      expect(updatedUser!.followersCount).toBe(0);
    });

    it("應該防止重複關注", async () => {
      // 首次關注應成功
      const firstResult = await userService.followUser(testUser, anotherUser);
      expect(firstResult).toBe(true);

      // 第二次關注應失敗
      const secondResult = await userService.followUser(testUser, anotherUser);
      expect(secondResult).toBe(false);

      const followCount = await Follow.countDocuments({
        follower: testUser._id,
        following: anotherUser._id,
      });
      expect(followCount).toBe(1);

      const updatedUser = await User.findById(testUser._id);
      const updatedFollowedUser = await User.findById(anotherUser._id);
      expect(updatedUser!.followingCount).toBe(1);
      expect(updatedFollowedUser!.followersCount).toBe(1);
    });
  });

  describe("unFollowUser", () => {
    beforeEach(async () => {
      // 建立關注關係
      await userService.followUser(testUser, anotherUser);
    });

    it("應該成功取消關注另一個用戶", async () => {
      const result = await userService.unFollowUser(testUser, anotherUser);
      expect(result).toBe(true);

      const follow = await Follow.findOne({
        follower: testUser._id,
        following: anotherUser._id,
      });
      expect(follow).toBeNull();

      const updatedUser = await User.findById(testUser._id);
      const updatedFollowedUser = await User.findById(anotherUser._id);
      expect(updatedUser!.followingCount).toBe(0);
      expect(updatedFollowedUser!.followersCount).toBe(0);
    });

    it("應該防止用戶取消關注自己", async () => {
      const result = await userService.unFollowUser(testUser, testUser);
      expect(result).toBe(false);

      const followCount = await Follow.countDocuments({
        follower: testUser._id,
        following: testUser._id,
      });
      expect(followCount).toBe(0);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser!.followingCount).toBe(1);
      expect(updatedUser!.followersCount).toBe(0);
    });

    it("應該防止取消不存在的關注關係", async () => {
      // 首先取消一次關注
      const firstResult = await userService.unFollowUser(testUser, anotherUser);
      expect(firstResult).toBe(true);

      // 再次嘗試取消關注
      const secondResult = await userService.unFollowUser(testUser, anotherUser);
      expect(secondResult).toBe(false);

      const followCount = await Follow.countDocuments({
        follower: testUser._id,
        following: anotherUser._id,
      });
      expect(followCount).toBe(0);

      const updatedUser = await User.findById(testUser._id);
      const updatedFollowedUser = await User.findById(anotherUser._id);
      expect(updatedUser!.followingCount).toBe(0);
      expect(updatedFollowedUser!.followersCount).toBe(0);
    });
  });
});
