import { Router } from "express";
import { getUserProfile, updateUserProfile, followUser, unFollowUser } from "@src/controllers/userController";
import { authenticateJWT } from "@src/middlewares/authenticateJWT"; // 這是一個身份驗證中間件

const router = Router();

// 獲得個人資訊
router.get("/profile/:userId", authenticateJWT, getUserProfile);
router.put("/profile", authenticateJWT, updateUserProfile);
// 關注用戶
router.post("/follow", authenticateJWT, followUser);
router.post("/unfollow", authenticateJWT, unFollowUser);
export default router;
