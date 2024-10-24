import { UserService } from "@src/services/userService";
import { User } from "@src/models/user";
import mongoose from "mongoose";
// 導入 setup.ts 文件來初始化和清理 MongoMemoryServer
import "@tests/setup";

describe("UserService with MongoMemoryServer", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe("findUserById", () => {
    it("應該返回用戶資料，如果用戶存在", async () => {
      const user = new User({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      await user.save();

      // 測試是否能夠找到該用戶
      const foundUser = await userService.findUserById(user._id.toString());

      expect(foundUser).not.toBeNull();
      expect(foundUser!.username).toBe("testuser");
      expect(foundUser!.email).toBe("test@example.com");
    });

    it("應該返回 null，如果用戶不存在", async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const foundUser = await userService.findUserById(
        nonExistentUserId.toString()
      );

      expect(foundUser).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("應該更新並返回更新後的用戶資料", async () => {
      // 創建一個測試用戶
      const user = new User({
        username: "oldUser",
        email: "old@example.com",
        password: "test1234",
      });
      await user.save();

      // 更新用戶資料
      const updatedUser = await userService.updateUserProfile(
        user._id.toString(),
        "newUser",
        "new@example.com"
      );

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.username).toBe("newUser");
      expect(updatedUser!.email).toBe("new@example.com");
    });

    it("應該返回 null，如果用戶不存在", async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const updatedUser = await userService.updateUserProfile(
        nonExistentUserId.toString(),
        "newUser",
        "new@example.com"
      );

      expect(updatedUser).toBeNull();
    });
  });
});
