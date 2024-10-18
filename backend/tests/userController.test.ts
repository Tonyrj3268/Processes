// tests/userController.test.ts

import { Request, Response } from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../src/controllers/userController";
import User from "../src/models/user";

jest.mock("../src/models/user");

describe("UserController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserProfile", () => {
    it("should return user profile when user exists", async () => {
      const req = {
        params: { userId: "123" },
      } as unknown as Request;

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      // 模擬資料庫返回資料
      const mockUser = {
        _id: "123",
        username: "testuser",
        email: "test@example.com",
      };

      // 模擬 User.findById().select()
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 when user does not exist", async () => {
      const req = {
        params: { userId: "123" },
      } as unknown as Request;

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      // 模擬 User.findById().select() 返回 null
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: "使用者不存在" });
    });

    it("should handle errors and return 500", async () => {
      const req = {
        params: { userId: "123" },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      // 模擬抛出錯誤
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      console.error = jest.fn(); // 改變控制台錯誤输出

      await getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("伺服器發生錯誤");
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile when user exists", async () => {
      const req = {
        user: { id: "123" },
        body: { username: "newusername", email: "newemail@example.com" },
      } as unknown as Request;

      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const mockUser = {
        _id: "123",
        username: "oldusername",
        email: "oldemail@example.com",
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await updateUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(mockUser.username).toBe("newusername");
      expect(mockUser.email).toBe("newemail@example.com");
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ msg: "使用者資料已更新" });
    });

    it("should return 404 when user does not exist", async () => {
      const req = {
        user: { id: "123" },
        body: {},
      } as unknown as Request;

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      (User.findById as jest.Mock).mockResolvedValue(null);

      await updateUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: "用户不存在" });
    });

    it("should handle errors and return 500", async () => {
      const req = {
        user: { id: "123" },
        body: {},
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      (User.findById as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      console.error = jest.fn(); // 改變控制台錯誤输出

      await updateUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("伺服器發生錯誤");
    });
  });
});
