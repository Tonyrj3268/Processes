import { UserService } from "@src/services/userService";
import { User } from "@src/models/user";
import mongoose from "mongoose";
import "@tests/setup";

describe("UserService with MongoMemoryServer", () => {
  let userService = new UserService();

  describe("findUserById", () => {
    it("應該返回用戶資料，如果用戶存在", async () => {
      const user = new User({
        userName: "testuser",
        accountName: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      await user.save();

      const foundUser = await userService.findUserById(user._id.toString());

      expect(foundUser).not.toBeNull();
      expect(foundUser!.userName).toBe("testuser");
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
      const user = new User({
        userName: "oldUser",
        accountName: "oldUser",
        email: "old@example.com",
        password: "test1234",
      });
      await user.save();

      const updatedUser = await userService.updateUserProfile(
        user,
        {
          userName: "newUser",
          email: "new@example.com",
        }
      );

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.userName).toBe("newUser");
      expect(updatedUser!.email).toBe("new@example.com");
    });

  });
});
