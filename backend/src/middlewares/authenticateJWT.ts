import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@src/config/config";
import userService from "@src/services/userService";

export const authenticateJWT = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ msg: "缺少身份驗證標頭" });
            return;
        }

        const token = authHeader.split(' ')[1]; // 'Bearer <token>'

        // 將 jwt.verify 轉換為 Promise
        const decoded = await new Promise<JwtPayload>((resolve, reject) => {
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) reject(err);
                resolve(decoded as JwtPayload);
            });
        });

        if (!decoded || !("id" in decoded)) {
            res.status(403).json({ msg: "無效的身份驗證標頭" });
            return;
        }

        const userId = decoded.id as string;
        const user = await userService.findUserById(userId);

        if (!user) {
            res.status(404).json({ msg: "用戶不存在" });
            return;
        }

        req.user = user;
        next();

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "伺服器錯誤" });
    }
};