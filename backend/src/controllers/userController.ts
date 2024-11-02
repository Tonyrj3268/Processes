// controllers/userController.ts
import { Request, Response } from "express";
import { UserService } from "@src/services/userService";
import { IUserDocument } from "@src/models/user";

export class UserController {
  constructor(private userService: UserService = new UserService()) { }

  // 獲取用戶資料
  async getUserProfile(req: Request, res: Response): Promise<void> {
    const user = req.user as IUserDocument;
    const requested_userId = req.params.userId;
    try {
      const requestedUser = await this.userService.findUserById(requested_userId);
      if (!requestedUser) {
        res.status(404).json({ msg: "使用者不存在" });
        return;
      }

      const isOwnProfile = user._id.equals(requestedUser._id);
      if (isOwnProfile) {
        res.status(200).json({
          _id: requestedUser._id,
          accountName: requestedUser.accountName,
          userName: requestedUser.userName,
          email: requestedUser.email,
          bio: requestedUser.bio,
          avatarUrl: requestedUser.avatarUrl,
          followersCount: requestedUser.followersCount,
          followingCount: requestedUser.followingCount,
          createdAt: requestedUser.createdAt,
        });
      } else {
        res.status(200).json({
          _id: requestedUser._id,
          accountName: requestedUser.accountName,
          username: requestedUser.userName,
          bio: requestedUser.bio,
          avatarUrl: requestedUser.avatarUrl,
          followersCount: requestedUser.followersCount,
          followingCount: requestedUser.followingCount,
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500);
    }
  }

  // 更新用戶資料
  async updateUserProfile(req: Request, res: Response): Promise<void> {
    const user = req.user as IUserDocument;
    const { userName, email, isPublic, bio } = req.body;
    try {
      const updatedUser = await this.userService.updateUserProfile(user, {
        userName,
        email,
        isPublic,
        bio
      });
      if (!updatedUser) {
        res.status(404).json({ msg: "用户不存在" });
        return;
      }
      res.json({ msg: "使用者資料已更新", user: updatedUser.toObject() });
    } catch (err) {
      console.error(err);
      res.status(500);
    }
  }

  // 關注用戶
  async followUser(req: Request, res: Response): Promise<void> {
    const user = req.user as IUserDocument;
    const { userId } = req.body;
    try {
      const followedUser = await this.userService.findUserById(userId);
      if (!followedUser) {
        res.status(404).json({ msg: "使用者不存在" });
        return;
      }
      const result = await this.userService.followUser(user, followedUser);
      if (!result) {
        res.status(409).json({ msg: "已經追蹤該使用者" });
        return;
      }
      res.status(200).json({ msg: "成功追蹤使用者" });
    } catch (err) {
      console.error(err);
      res.status(500);
    }
  }

  // 取消關注用戶
  async unFollowUser(req: Request, res: Response): Promise<void> {
    const user = req.user as IUserDocument;
    const { userId } = req.body;
    try {
      const followedUser = await this.userService.findUserById(userId);
      if (!followedUser) {
        res.status(404).json({ msg: "使用者不存在" });
        return;
      }
      const result = await this.userService.unFollowUser(user, followedUser);
      if (!result) {
        res.status(409).json({ msg: "尚未追蹤該使用者" });
        return;
      }
      res.status(200).json({ msg: "成功取消追蹤使用者" });
    } catch (err) {
      console.error(err);
      res.status(500);
    }
  }
}

// 預設導出一個實例，方便直接使用
export const userController = new UserController();
