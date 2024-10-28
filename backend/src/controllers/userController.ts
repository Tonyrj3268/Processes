// controllers/userController.ts
import { Request, Response } from "express";
import userService from "@src/services/userService";
import { IUserDocument } from "@src/models/user";

// 獲取用戶資料
export async function getUserProfile(req: Request, res: Response) {
  const user = req.user as IUserDocument;
  const requested_userId = req.params.userId;

  try {
    const requestedUser = await userService.findUserById(requested_userId);
    if (!requestedUser) {
      res.status(404).json({ msg: "使用者不存在" });
      return;
    }

    const isOwnProfile = user._id.equals(requestedUser._id);

    if (isOwnProfile) {
      // 當用戶查看自己的資料時，返回完整信息
      res.status(200).json({
        _id: requestedUser._id,
        username: requestedUser.username,
        email: requestedUser.email,
        followersCount: requestedUser.followersCount,
        followingCount: requestedUser.followingCount,
        createdAt: requestedUser.createdAt,
      });
    } else {
      // 當其他用戶查看時，僅返回部分公共信息
      res.status(200).json({
        _id: requestedUser._id,
        username: requestedUser.username,
        followersCount: requestedUser.followersCount,
        followingCount: requestedUser.followingCount,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("伺服器發生錯誤");
  }
}

// 更新用戶資料
export async function updateUserProfile(req: Request, res: Response) {
  const user = req.user as IUserDocument;
  const { username, email } = req.body;
  try {
    const updatedUser = await userService.updateUserProfile(user, {
      username,
      email,
    });

    if (!updatedUser) {
      res.status(404).json({ msg: "用户不存在" });
      return;
    }

    res.json({ msg: "使用者資料已更新", user: updatedUser.toObject() });
  } catch (err) {
    console.error(err);
    res.status(500).send("伺服器發生錯誤");
  }
}
