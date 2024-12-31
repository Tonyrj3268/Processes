// tests/controllers/authController.test.ts
import { Request, Response } from 'express';
import { userService } from '@src/services/userService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@src/config/config';
import "@tests/setup";

// 模擬 userService
jest.mock('@src/services/userService', () => ({
    userService: {
        findUserByEmailWithPassword: jest.fn(),
        findUserByCondition: jest.fn(),
        createUser: jest.fn()
    }
}));

// 模擬 jwt 和 bcrypt
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('test-token')
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true)
}));

// 模擬 Response 對象
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

describe('AuthController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('應該成功註冊新用戶', async () => {
            const mockUser = {
                userName: 'testuser',
                accountName: 'testaccount',
                email: 'test@example.com',
                password: 'password123'
            };

            const req = {
                body: mockUser
            } as Request;

            const res = mockResponse();

            // 模擬 userService 的行為
            (userService.findUserByCondition as jest.Mock).mockResolvedValueOnce(null);
            (userService.createUser as jest.Mock).mockResolvedValueOnce({
                _id: 'test-id',
                ...mockUser,
                password: 'hashed-password'
            });

            // 處理註冊請求
            await handleRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: '註冊成功'
            });
            expect(bcrypt.hash).toHaveBeenCalled();
        });

        it('應該在郵箱已存在時返回錯誤', async () => {
            const req = {
                body: {
                    userName: 'testuser',
                    accountName: 'testaccount',
                    email: 'test@example.com',
                    password: 'password123'
                }
            } as Request;

            const res = mockResponse();

            (userService.findUserByCondition as jest.Mock).mockResolvedValueOnce({
                email: 'test@example.com'
            });

            await handleRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: '此信箱已被註冊'
            });
        });
    });

    describe('login', () => {
        it('應該成功登入並返回 JWT', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'password123'
                }
            } as Request;

            const res = mockResponse();

            const mockUser = {
                _id: 'test-id',
                email: 'test@example.com',
                password: 'hashed-password'
            };

            (userService.findUserByEmailWithPassword as jest.Mock).mockResolvedValueOnce(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

            await handleLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                token: 'test-token'
            });
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser._id },
                JWT_SECRET,
                { expiresIn: "1h" }
            );
        });

        it('應該在用戶不存在時返回錯誤', async () => {
            const req = {
                body: {
                    email: 'nonexistent@example.com',
                    password: 'password123'
                }
            } as Request;

            const res = mockResponse();

            (userService.findUserByEmailWithPassword as jest.Mock).mockResolvedValueOnce(null);

            await handleLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: '找不到使用者'
            });
        });

        it('應該在密碼錯誤時返回錯誤', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'wrongpassword'
                }
            } as Request;

            const res = mockResponse();

            (userService.findUserByEmailWithPassword as jest.Mock).mockResolvedValueOnce({
                _id: 'test-id',
                email: 'test@example.com',
                password: 'hashed-password'
            });
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            await handleLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: '密碼錯誤'
            });
        });
    });
});

// 處理函數
async function handleRegister(req: Request, res: Response): Promise<void> {
    try {
        const { userName, accountName, email, password } = req.body;

        const existingUser = await userService.findUserByCondition({
            $or: [{ email }, { accountName }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                res.status(400).json({ error: '此信箱已被註冊' });
                return;
            }
            if (existingUser.accountName === accountName) {
                res.status(400).json({ error: '此帳號名稱已被註冊' });
                return;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await userService.createUser({
            userName,
            accountName,
            email,
            password: hashedPassword,
        });

        res.status(201).json({ message: '註冊成功' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '伺服器發生錯誤' });
    }
}

async function handleLogin(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;
        const user = await userService.findUserByEmailWithPassword(email);

        if (!user) {
            res.status(404).json({ error: '找不到使用者' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ error: '密碼錯誤' });
            return;
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '伺服器發生錯誤' });
    }
}