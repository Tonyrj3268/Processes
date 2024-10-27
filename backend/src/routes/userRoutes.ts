import { Router } from "express";
import { getUserProfile, updateUserProfile } from "@src/controllers/userController";
import { authenticateJWT } from "@src/middlewares/authenticateJWT"; // 這是一個身份驗證中間件

const router = Router();

// 需要身份驗證才能獲得個人資訊
router.get("/profile/:userId", authenticateJWT, getUserProfile);
router.put("/profile", authenticateJWT, updateUserProfile);

export default router;
