// services/userService.ts
import { User, IUserDocument, IUserModel } from "@src/models/user";
import { Follow } from "@src/models/follow";
class UserService {
  private userModel: IUserModel;

  constructor(userModel: IUserModel) {
    this.userModel = userModel;
  }
  // 查找用戶
  async findUserById(userId: string) {
    try {
      return await this.userModel.findById(userId).select("-password");
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmail(email: string) {
    try {
      return await this.userModel.findOne({ email }).select("-password");
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmailWithPassword(email: string) {
    try {
      return await this.userModel.findOne({ email }).select("+password");
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
      return await this.userModel.create(data);
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
}

const userService = new UserService(User);
export default userService;