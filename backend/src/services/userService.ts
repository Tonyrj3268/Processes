// services/userService.ts
import { User, IUserDocument } from "@src/models/user";
export class UserService {
  // 查找用戶
  async findUserById(userId: string) {
    try {
      return await User.findById(userId).select("-password");
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmail(email: string) {
    try {
      return await User.findOne({ email }).select("-password");
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmailWithPassword(email: string) {
    try {
      return await User.findOne({ email }).select("+password");
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 創建用戶
  async createUser(data: {
    userName: string;
    email: string;
    password: string;
  }) {
    try {
      return await User.create(data);
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 更新用戶資料
  async updateUserProfile(
    user: IUserDocument,
    data: { userName?: string; email?: string }
  ) {
    try {
      // 更新資料
      if (data.userName) user.userName = data.userName;
      if (data.email) user.email = data.email;

      return await user.save();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }
}