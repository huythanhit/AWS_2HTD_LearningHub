// src/services/notificationService.js
import apiClient from './https';

/**
 * Lấy danh sách thông báo của user hiện tại
 * @param {Object} params - { page, pageSize, isRead }
 * @returns {Promise<Object>} { notifications, pagination }
 */
export async function getMyNotifications(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.isRead !== undefined) queryParams.append('isRead', params.isRead);

    const queryString = queryParams.toString();
    const url = `/api/notifications${queryString ? `?${queryString}` : ''}`;

    const res = await apiClient.get(url);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || 'Failed to fetch notifications');
    }

    return result.data || result;
  } catch (error) {
    throw error;
  }
}

/**
 * Đánh dấu một thông báo là đã đọc
 * @param {string} notificationId - ID của thông báo
 * @returns {Promise<void>}
 */
export async function markNotificationRead(notificationId) {
  if (!notificationId) {
    throw new Error('notificationId is required');
  }

  try {
    await apiClient.patch(`/api/notifications/${notificationId}/read`);
  } catch (error) {
    throw error;
  }
}

/**
 * Đánh dấu tất cả thông báo là đã đọc
 * @returns {Promise<void>}
 */
export async function markAllNotificationsRead() {
  try {
    await apiClient.patch('/api/notifications/read-all');
  } catch (error) {
    throw error;
  }
}

export default {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
