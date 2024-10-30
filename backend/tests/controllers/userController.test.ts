import mongoose from "mongoose";
import { User } from "@src/models/user";
import {
  getUserProfile,
  updateUserProfile,
} from "@src/controllers/userController";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import "@tests/setup";

// 模擬 Express 的 Response 對象
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

// 測試案例
describe("UserController", () => {
  describe("getUserProfile", () => {
    it("應該返回用戶資料，當用戶存在時", async () => {
      const user = new User({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      await user.save();

      const req: Request<ParamsDictionary> = {
        params: { userId: user._id.toString() },
        user: user,
      } as unknown as Request<ParamsDictionary>;

      const res = mockResponse();

      await getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: user._id,
          username: "testuser",
          email: "test@example.com",
          followersCount: 0,
          followingCount: 0,
        })
      );
      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it("應該回傳 404，當用戶不存在時", async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();

      const req = {
        params: { userId: nonExistentUserId.toString() },
      } as unknown as Request;

      const res = mockResponse();

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: "使用者不存在" });
    });
  });

  describe("updateUserProfile", () => {
    it("應該成功更新用戶資料", async () => {
      const user = new User({
        username: "oldusername",
        email: "old@example.com",
        password: "password123",
      });
      await user.save();

      const req = {
        user: user,
        body: { username: "newusername", email: "new@example.com" },
      } as unknown as Request;

      const res = mockResponse();

      await updateUserProfile(req, res);

      const updatedUser = await User.findById(user._id).lean();
      expect(res.json).toHaveBeenCalledWith({
        msg: "使用者資料已更新",
        user: expect.objectContaining({
          _id: updatedUser!._id,
          username: updatedUser!.username,
          email: updatedUser!.email,
        }),
      });
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.username).toBe("newusername");
      expect(updatedUser!.email).toBe("new@example.com");
    });
  });
});
