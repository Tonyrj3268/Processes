// services/userService.ts
import { User, IUserDocument } from "@src/models/user";
import { Follow } from "@src/models/follow";
import mongoose, { Error as MongooseError } from "mongoose";
import { MongoServerError } from "mongodb";

export class UserService {
  // 查找用戶
  async findUserById(userId: string): Promise<IUserDocument | null> {
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

  async findUserByEmail(email: string): Promise<IUserDocument | null> {
    try {
      return await User.findOne({ email }).select("-password");
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmailWithPassword(email: string): Promise<IUserDocument | null> {
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
  }): Promise<IUserDocument> {
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
  ): Promise<IUserDocument> {
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
    // 防止關注自己
    if (user._id.equals(followedUser._id)) {
      return false;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Follow.create([{
        follower: user._id,
        following: followedUser._id,
      }], { session });

      await Promise.all([
        User.updateOne(
          { _id: user._id },
          { $inc: { followingCount: 1 } },
          { session }
        ),
        User.updateOne(
          { _id: followedUser._id },
          { $inc: { followersCount: 1 } },
          { session }
        ),
      ]);

      // 提交交易
      await session.commitTransaction();
      session.endSession();

      return true;
    } catch (error: unknown) {
      await session.abortTransaction();
      session.endSession();
      if (error instanceof MongooseError.ValidationError) {
        console.error("驗證錯誤:", error.message);
        return false;
      } else if (error instanceof MongoServerError) {
        if (error.code === 11000) {
          // 重複鍵錯誤，表示已經關注過
          return false;
        }
        console.error("MongoServerError:", error.message);
        throw new Error("伺服器錯誤");
      } else {
        console.error("未知錯誤:", error);
        throw new Error("伺服器錯誤");
      }
    }
  }

  // 取消關注
  async unFollowUser(user: IUserDocument, followedUser: IUserDocument) {
    // 防止對自己取消關注
    if (user._id.equals(followedUser._id)) {
      return false;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const deletedFollow = await Follow.findOneAndDelete({
        follower: user._id,
        following: followedUser._id,
      }).session(session);

      // 如果沒有找到關注關係，返回 false
      if (!deletedFollow) {
        await session.abortTransaction();
        session.endSession();
        return false;
      }

      // 同時更新兩個用戶的計數器
      await Promise.all([
        User.updateOne(
          { _id: user._id },
          { $inc: { followingCount: -1 } },
          { session }
        ),
        User.updateOne(
          { _id: followedUser._id },
          { $inc: { followersCount: -1 } },
          { session }
        ),
      ]);

      // 提交交易
      await session.commitTransaction();
      session.endSession();

      return true;
    } catch (error: unknown) {
      // 回滾交易並結束會話
      await session.abortTransaction();
      session.endSession();

      if (error instanceof MongooseError.ValidationError) {
        console.error("驗證錯誤:", error.message);
        return false;
      } else if (error instanceof MongoServerError) {
        console.error("MongoServerError:", error.message);
        throw new Error("伺服器錯誤");
      } else {
        console.error("未知錯誤:", error);
        throw new Error("伺服器錯誤");
      }
    }
  }
}

export const userService = new UserService();