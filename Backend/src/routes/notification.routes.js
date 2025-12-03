// src/routes/notification.routes.js
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = express.Router();

// Tất cả route notification yêu cầu đăng nhập
router.use(authMiddleware);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

export default router;
