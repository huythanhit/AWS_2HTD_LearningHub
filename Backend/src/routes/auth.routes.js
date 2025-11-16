// src/routes/auth.routes.js

import express from 'express';
import { register, login, me, debugToken } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Đăng ký với Cognito + DB
router.post('/register', register);

// Login -> trả token Cognito
router.post('/login', login);

// Lấy thông tin người dùng hiện tại (cần token Cognito trong header)
router.get('/me', authMiddleware, me);

// 👇 Route debug: chỉ check token Cognito + groups + role mapping, không đụng DB
router.get('/debug-token', authMiddleware, debugToken);

export default router;
