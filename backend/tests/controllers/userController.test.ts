import mongoose from "mongoose";
import { User, IUserDocument } from "@src/models/user";
import { UserService } from "@src/services/userService";
import {
  UserController
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
  let testUser: IUserDocument;
  let anotherUser: IUserDocument;
  let controller: UserController;
  let mockUserService: UserService;

  const createTestUser = async (overrides = {}): Promise<IUserDocument> => {
    const userData = {
      accountName: "defaultAccountName",
      userName: "defaultUser",
      email: "default@example.com",
      password: "defaultPassword",
      ...overrides,
    };
    const user = new User(userData);
    await user.save();
    return user;
  };

  beforeEach(async () => {
    mockUserService = new UserService();
    controller = new UserController(mockUserService);
    testUser = await createTestUser({
      userName: "testuser",
      accountName: "testAccountName",
      email: "test@example.com",
      password: "password123",
      bio: "test bio",
      avatarUrl: "test-avatar.jpg",
    });
    anotherUser = await createTestUser({
      userName: "anotheruser",
      accountName: "anotherAccountName",
      email: "anothertets@example.com",
      password: "password123",
    });
  });

  describe("getUserProfile", () => {
    it("應該返回用戶資料，當用戶存在時", async () => {

      const req: Request<ParamsDictionary> = {
        params: { userId: testUser._id.toString() },
        user: testUser,
      } as unknown as Request<ParamsDictionary>;

      const res = mockResponse();

      await controller.getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: testUser._id,
          userName: "testuser",
          accountName: "testAccountName",
          email: "test@example.com",
          bio: "test bio",
          avatarUrl: "test-avatar.jpg",
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

      await controller.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: "使用者不存在" });
    });
  });

  describe("updateUserProfile", () => {
    it("應該成功更新用戶資料", async () => {

      const req = {
        user: testUser,
        body: { userName: "newuserName", email: "new@example.com" },
      } as unknown as Request;

      const res = mockResponse();

      await controller.updateUserProfile(req, res);

      const updatedUser = await User.findById(testUser._id).lean();
      expect(res.json).toHaveBeenCalledWith({
        msg: "使用者資料已更新",
        user: expect.objectContaining({
          _id: updatedUser!._id,
          accountName: updatedUser!.accountName,
          userName: updatedUser!.userName,
          email: updatedUser!.email,
        }),
      });
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.userName).toBe("newuserName");
      expect(updatedUser!.email).toBe("new@example.com");
    });
  });

  describe("followUser", () => {
    it("應該成功關注另一個用戶", async () => {

      const req: Request = {
        body: { userId: anotherUser._id.toString() },
        user: testUser,
      } as Request;

      const res = mockResponse();
      jest.spyOn(mockUserService, 'findUserById').mockResolvedValue(anotherUser);
      jest.spyOn(mockUserService, 'followUser').mockResolvedValue(true);
      await controller.followUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: "成功追蹤使用者" });
    });

    it("應該回傳 404，當被關注的用戶不存在時", async () => {

      const nonExistentUserId = new mongoose.Types.ObjectId().toString();

      const req: Request = {
        body: { userId: nonExistentUserId },
        user: testUser,
      } as Request;

      const res = mockResponse();
      jest.spyOn(mockUserService, 'findUserById').mockResolvedValue(null);
      await controller.followUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: "使用者不存在" });
    });

    it("應該回傳 409，當已經關注該用戶時", async () => {

      const req: Request = {
        body: { userId: anotherUser._id.toString() },
        user: testUser,
      } as Request;

      const res = mockResponse();
      jest.spyOn(mockUserService, 'findUserById').mockResolvedValue(anotherUser);
      jest.spyOn(mockUserService, 'followUser').mockResolvedValue(false);
      await controller.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ msg: "已經追蹤該使用者" });
    });

    it("應該回傳 500，當發生伺服器錯誤時", async () => {

      const req: Request = {
        body: { userId: anotherUser._id.toString() },
        user: testUser,
      } as Request;

      const res = mockResponse();
      jest.spyOn(mockUserService, 'followUser').mockRejectedValue(new Error("伺服器錯誤"));
      await controller.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("unFollowUser", () => {
    it("應該成功取消關注另一個用戶", async () => {

      const req: Request = {
        body: { userId: anotherUser._id.toString() },
        user: testUser,
      } as Request;

      const res = mockResponse();
      jest.spyOn(mockUserService, 'findUserById').mockResolvedValue(anotherUser);
      jest.spyOn(mockUserService, 'unFollowUser').mockResolvedValue(true);
      await controller.unFollowUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ msg: "成功取消追蹤使用者" });
    });

    it("應該回傳 404，當被取消關注的用戶不存在時", async () => {

      const nonExistentUserId = new mongoose.Types.ObjectId().toString();

      const req: Request = {
        body: { userId: nonExistentUserId },
        user: testUser,
      } as Request;

      const res = mockResponse();
      jest.spyOn(mockUserService, 'findUserById').mockResolvedValue(null);
      await controller.unFollowUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: "使用者不存在" });
    });

    it("應該回傳 400，當尚未關注該用戶時", async () => {

      const req: Request = {
        body: { userId: anotherUser._id.toString() },
        user: testUser,
      } as Request;

      const res = mockResponse();
      jest.spyOn(mockUserService, "findUserById").mockResolvedValue(anotherUser);
      jest.spyOn(mockUserService, 'unFollowUser').mockResolvedValue(false);
      await controller.unFollowUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ msg: "尚未追蹤該使用者" });
    }
    );

  });
});

