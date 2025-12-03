// src/controllers/notification.controller.js
import * as notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.js';

// GET /api/notifications
export async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.id; // auth.middleware gán vào
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);

    let isRead;
    if (req.query.isRead === 'true') isRead = true;
    if (req.query.isRead === 'false') isRead = false;

    const data = await notificationService.getNotificationsByUser({
      userId,
      page,
      pageSize,
      isRead
    });

    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
export async function markRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await notificationService.markNotificationRead({
      userId,
      notificationId: id
    });

    return successResponse(res, { message: 'OK' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all
export async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;

    await notificationService.markAllNotificationsRead({ userId });

    return successResponse(res, { message: 'OK' });
  } catch (err) {
    next(err);
  }
}
