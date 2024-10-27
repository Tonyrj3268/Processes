import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@src/config/config";
import { UserService } from "@src/services/userService";
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ msg: "缺少身份驗證標頭" });
            return;
        }

        const token = authHeader.split(' ')[1];  // 'Bearer <token>'

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ msg: "無效的身份驗證標頭" });
            }

            if (typeof decoded !== "string" && decoded !== undefined && "id" in decoded) {
                const payload = decoded as JwtPayload;
                const userId = payload.id as string;
                const userService = new UserService();

                userService.findUserById(userId)
                    .then(user => {
                        if (!user) {
                            return res.status(404).json({ msg: "用戶不存在" });
                        }

                        req.user = user;
                        next();
                    })
                    .catch(err => {
                        console.error(err);
                        return res.status(500).json({ msg: "伺服器錯誤" });
                    });
            } else {
                return res.status(403).json({ msg: "無效的身份驗證標頭" });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "伺服器錯誤" });
        return;
    }
};
