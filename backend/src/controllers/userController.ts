import User, { IUser } from "../models/user";
import { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function getUserProfile(req: Request, res: Response) {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "使用者不存在" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("伺服器發生錯誤");
  }
}

export async function updateUserProfile(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.user!.id;

  const { username, email } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "用户不存在" });
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    res.json({ msg: "使用者資料已更新" });
  } catch (err) {
    console.error(err);
    res.status(500).send("伺服器發生錯誤");
  }
}
