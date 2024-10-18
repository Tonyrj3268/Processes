import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../src/models/user";
import {
  getUserProfile,
  updateUserProfile,
  AuthenticatedRequest,
} from "../src/controllers/userController";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";

let mongoServer: MongoMemoryServer;

// 模擬 Express 的 Response 對象
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

// 在所有測試之前，啟動 MongoMemoryServer 並建立 MongoDB 連接
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

// 在每個測試之間清空數據庫
beforeEach(async () => {
  await User.deleteMany(); // 清空所有數據，確保每次測試都是獨立的
});

// 在所有測試之後，關閉數據庫和 MongoMemoryServer
afterAll(async () => {
  await mongoose.disconnect(); // 斷開與 MongoDB 的連接
  await mongoServer.stop(); // 停止 MongoMemoryServer
});

// 測試案例
describe("UserController", () => {
  it("should update user profile when user exists", async () => {
    const user = new User({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    await user.save();

    // 2. 模擬請求和響應對象
    const req: Request<ParamsDictionary> = {
      params: { userId: user._id },
    } as unknown as Request<ParamsDictionary>;

    const res = mockResponse();

    await getUserProfile(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: user._id,
        username: "testuser",
        email: "test@example.com",
        // 確保 password 不在回應中
        password: undefined,
      })
    );
    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it("應該回傳 404 當用戶不存在時", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();

    const req = {
      params: { userId: nonExistentUserId },
    } as unknown as Request;

    const res = mockResponse();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: "使用者不存在" });
  });

  it("處理伺服器錯誤", async () => {
    const req = {
      params: { userId: "errorid" },
    } as unknown as Request;

    const res = mockResponse();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("伺服器發生錯誤");
  });
});

describe("updateUserProfile", () => {
  it("應該成功更新用戶資料", async () => {
    // 創建一個用戶
    const user = new User({
      username: "oldusername",
      email: "old@example.com",
      password: "password123",
    });
    await user.save();

    // 模擬 AuthenticatedRequest
    const req = {
      user: { id: user._id },
      body: { username: "newusername", email: "new@example.com" },
    } as AuthenticatedRequest;

    const res = mockResponse();

    await updateUserProfile(req, res);

    expect(res.json).toHaveBeenCalledWith({ msg: "使用者資料已更新" });

    // 驗證數據庫中的用戶已更新
    const updatedUser = await User.findById(user._id);
    expect(updatedUser).toBeDefined();
    expect(updatedUser!.username).toBe("newusername");
    expect(updatedUser!.email).toBe("new@example.com");
  });

  it("應該回傳 404 當用戶不存在時", async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();

    const req = {
      user: { id: nonExistentUserId },
      body: { username: "newusername" },
    } as unknown as AuthenticatedRequest;

    const res = mockResponse();

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: "用户不存在" });
  });

  it("應該處理伺服器錯誤", async () => {
    const req = {
      user: { id: "errorid" },
      body: { username: "newusername" },
    } as AuthenticatedRequest;

    const res = mockResponse();

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("伺服器發生錯誤");
  });
});
