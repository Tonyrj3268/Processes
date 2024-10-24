// services/userService.ts
import { User } from "@src/models/user";

export class UserService {
  // 查找用戶
  async findUserById(userId: string) {
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return null;
      }
      return user;
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 更新用戶資料
  async updateUserProfile(userId: string, username?: string, email?: string) {
    try {
      const user = await this.findUserById(userId);
      if (!user) {
        return null;
      }

      // 更新資料
      if (username) {
        user.username = username;
      }
      if (email) {
        user.email = email;
      }

      const updatedUser = await user.save();
      return updatedUser;
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }
}
