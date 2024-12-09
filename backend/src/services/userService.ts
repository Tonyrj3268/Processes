// services/userService.ts
import { User, IUserDocument } from "@src/models/user";
import { Follow } from "@src/models/follow";
import mongoose, { Types, FilterQuery } from "mongoose";
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
      return await User.findOne({ email }).select("-password").lean();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    try {
      return await User.findOne({ email }).select("+password").lean();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByCondition(condition: FilterQuery<IUserDocument>): Promise<IUserDocument | null> {
    try {
      return await User.findOne(condition
      ).select("-password").lean();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 創建用戶
  async createUser(data: {
    userName: string;
    accountName: string;
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
    data: { userName?: string; email?: string; isPublic?: boolean; bio?: string, avatarUrl?: string }
  ): Promise<IUserDocument> {
    try {
      // 更新資料
      if (data.userName) user.userName = data.userName;
      if (data.email) user.email = data.email;
      if (data.isPublic !== undefined) user.isPublic = data.isPublic;
      if (data.bio) user.bio = data.bio;
      if (data.avatarUrl) user.avatarUrl = data.avatarUrl

      return await user.save();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 關注用戶
  async followUser(userId: Types.ObjectId, followedUserId: Types.ObjectId): Promise<boolean> {
    if (userId.equals(followedUserId)) {
      return false;
    }

    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        // 嘗試創建 Follow 記錄，捕獲重複關注的錯誤
        await Follow.create([{
          follower: userId,
          following: followedUserId,
        }], { session })

        // 更新關注者和被關注者的計數器
        await Promise.all([
          User.updateOne({ _id: userId }, { $inc: { followingCount: 1 } }, { session }),
          User.updateOne({ _id: followedUserId }, { $inc: { followersCount: 1 } }, { session }),
        ]);

        return true;
      });

      return result;
    } catch (error: unknown) {
      if (error instanceof MongoServerError && error.code === 11000) {
        // 重複關注，返回 false
        return false;
      }
      console.error('Error in followUser:', error);
      throw new Error("伺服器錯誤");
    } finally {
      await session.endSession();
    }
  }



  // 取消關注
  async unfollowUser(userId: Types.ObjectId, followedUserId: Types.ObjectId): Promise<boolean> {
    // 防止對自己取消關注
    if (userId.equals(followedUserId)) {
      return false;
    }

    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        // 查找並刪除關注記錄
        const deletedFollow = await Follow.findOneAndDelete({
          follower: userId,
          following: followedUserId,
        }).session(session);

        // 如果沒有找到關注關係，返回 false
        if (!deletedFollow) {
          await session.abortTransaction();
          return false;
        }

        // 同時更新兩個用戶的計數器
        await Promise.all([
          User.updateOne(
            { _id: userId },
            { $inc: { followingCount: -1 } },
            { session }
          ),
          User.updateOne(
            { _id: followedUserId },
            { $inc: { followersCount: -1 } },
            { session }
          ),
        ]);

        return true;
      });

      return result;
    } catch (error: unknown) {
      console.error('Error in unFollowUser:', error);
      throw new Error("伺服器錯誤");
    } finally {
      // 確保 session 被正確結束
      session.endSession();
    }
  }

  async getPublicUserIds(): Promise<Types.ObjectId[]> {
    const now = Date.now();
    const CACHE_DURATION = 60 * 1000; // 1 分鐘
    let cacheTimestamp = 0;
    let cachedPublicUserIds: Types.ObjectId[] = [];

    if (now - cacheTimestamp > CACHE_DURATION) {
      const publicUsers = await User.find({ isPublic: true }).select('_id').lean();
      cachedPublicUserIds = publicUsers.map(user => user._id);
      cacheTimestamp = now;
    }
    return cachedPublicUserIds;
  }
}

export const userService = new UserService();