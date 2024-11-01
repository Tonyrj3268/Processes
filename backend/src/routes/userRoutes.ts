import { Router } from "express";
import { userController } from "@src/controllers/userController";
import { authenticateJWT } from "@src/middlewares/authenticateJWT"; // 這是一個身份驗證中間件

const router = Router();

// 獲得個人資訊
router.get("/profile/:userId", authenticateJWT, userController.getUserProfile);
router.put("/profile", authenticateJWT, userController.updateUserProfile);
// 關注用戶
router.post("/follow", authenticateJWT, userController.followUser);
router.post("/unfollow", authenticateJWT, userController.unFollowUser);
export default router;
