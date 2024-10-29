// services/userService.ts
import { User, IUserDocument } from "@src/models/user";
import mongoose from "mongoose";

import { Follow } from "@src/models/follow";
export class UserService {
  // 查找用戶
  async findUserById(userId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
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
    username: string;
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
    data: { username?: string; email?: string }
  ) {
    try {
      // 更新資料
      if (data.username) user.username = data.username;
      if (data.email) user.email = data.email;

      return await user.save();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 關注用戶
  async followUser(user: IUserDocument, followedUser: IUserDocument): Promise<boolean> {
    try {
      // 防止關注自己
      if (user._id.equals(followedUser._id)) {
        return false;
      }

      // 防止重複關注
      const existFollow = await Follow.findOne({
        follower: user._id,
        following: followedUser._id,
      });

      if (existFollow) {
        return false;
      }

      await Follow.create({
        follower: user._id,
        following: followedUser._id,
      });

      return true;
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 取消關注
  async unFollowUser(user: IUserDocument, followedUser: IUserDocument) {
    try {
      // 防止取消關注自己
      if (user._id.equals(followedUser._id)) {
        return false;
      }
      await Follow.findOneAndDelete({
        follower: user._id,
        following: followedUser._id,
      });

      return true;
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }
}
