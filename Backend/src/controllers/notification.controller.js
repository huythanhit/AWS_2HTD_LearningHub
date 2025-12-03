import * as notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.js';

// GET /api/notifications
export async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.localUserId; // ✅ dùng localUserId trong DB

    if (!userId) {
      const err = new Error('LOCAL_USER_NOT_FOUND');
      err.status = 401;
      throw err;
    }

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
    const userId = req.user.localUserId; 
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
    const userId = req.user.localUserId; // ✅

    await notificationService.markAllNotificationsRead({ userId });

    return successResponse(res, { message: 'OK' });
  } catch (err) {
    next(err);
  }
}
