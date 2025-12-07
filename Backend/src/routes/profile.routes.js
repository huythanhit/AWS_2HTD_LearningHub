// src/routes/profile.routes.js
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as profileController from '../controllers/profile.controller.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET /api/my/profile - Lấy thông tin profile của user hiện tại
router.get('/my/profile', profileController.getMyProfile);

// PATCH /api/my/profile - Cập nhật thông tin profile của user hiện tại
router.patch('/my/profile', profileController.updateMyProfile);

export default router;
