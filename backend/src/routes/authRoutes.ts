// routes/authRoutes.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { userService } from "@src/services/userService";
import { Request, Response } from "express";
import { JWT_SECRET } from "@src/config/config";
import { body, validationResult } from "express-validator";
const router = Router();

// 本地登錄
router.post("/login",
  [
    body("email").isEmail().withMessage("請提供有效的郵箱地址。"),
    body("password").isLength({ min: 6 }).withMessage("密碼長度至少為6位。"),
  ],
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await userService.findUserByEmailWithPassword(email);
      if (!user) {
        res.status(400).json({ error: "Invalid email or password." });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ error: "Invalid email or password." });
        return;
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
      res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  });

// 註冊新用戶
router.post("/register",
  [
    body("username").notEmpty().withMessage("用戶名不能為空。"),
    body("email").isEmail().withMessage("請提供有效的郵箱地址。"),
    body("password").isLength({ min: 6 }).withMessage("密碼長度至少為6位。"),
  ],
  async (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { username, email, password } = req.body;

    try {
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "User already exists." });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await userService.createUser({
        username,
        email,
        password: hashedPassword,
      });

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  });

export default router;
