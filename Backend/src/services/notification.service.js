// src/services/notification.service.js
import { sql, getPool } from '../config/db.js';

// Tạo 1 notification cho 1 user
export async function createNotification({
  userId,
  type,
  payload = {},
  sendChannel = 'in_app'
}) {
  const pool = await getPool();

  await pool.request()
    .input('user_id', sql.UniqueIdentifier, userId)
    .input('type', sql.NVarChar(50), type)
    .input('payload', sql.NVarChar(sql.MAX), JSON.stringify(payload || {}))
    .input('send_channel', sql.NVarChar(50), sendChannel)
    .query(`
      INSERT INTO notifications (user_id, type, payload, send_channel)
      VALUES (@user_id, @type, @payload, @send_channel)
    `);
}

// Tạo notification cho danh sách user (loop cho đơn giản)
export async function createNotificationsForUsers({
  userIds,
  type,
  payloadBuilder,
  sendChannel = 'in_app'
}) {
  if (!userIds || userIds.length === 0) return;

  const pool = await getPool();

  for (const userId of userIds) {
    const payload = payloadBuilder ? payloadBuilder(userId) : {};
    await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('type', sql.NVarChar(50), type)
      .input('payload', sql.NVarChar(sql.MAX), JSON.stringify(payload || {}))
      .input('send_channel', sql.NVarChar(50), sendChannel)
      .query(`
        INSERT INTO notifications (user_id, type, payload, send_channel)
        VALUES (@user_id, @type, @payload, @send_channel)
      `);
  }
}

// Lấy danh sách notification của 1 user (đang đăng nhập)
export async function getNotificationsByUser({
  userId,
  page = 1,
  pageSize = 20,
  isRead
}) {
  const pool = await getPool();
  const offset = (page - 1) * pageSize;

  let filterRead = '';
  if (isRead === true) filterRead = 'AND is_read = 1';
  if (isRead === false) filterRead = 'AND is_read = 0';

  const result = await pool.request()
    .input('user_id', sql.UniqueIdentifier, userId)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, pageSize)
    .query(`
      SELECT
        id,
        type,
        payload,
        is_read,
        send_channel,
        created_at
      FROM notifications
      WHERE user_id = @user_id
        ${filterRead}
      ORDER BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;

      SELECT COUNT(*) AS total
      FROM notifications
      WHERE user_id = @user_id
        ${filterRead};
    `);

  const rows = result.recordsets[0] || [];
  const total = result.recordsets[1][0].total;

  return {
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      payload: n.payload ? JSON.parse(n.payload) : null,
      isRead: n.is_read,
      sendChannel: n.send_channel,
      createdAt: n.created_at
    })),
    pagination: {
      page,
      pageSize,
      total
    }
  };
}

// Đánh dấu 1 notification đã đọc
export async function markNotificationRead({ userId, notificationId }) {
  const pool = await getPool();

  const result = await pool.request()
    .input('id', sql.UniqueIdentifier, notificationId)
    .input('user_id', sql.UniqueIdentifier, userId)
    .query(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = @id AND user_id = @user_id;

      SELECT @@ROWCOUNT AS affected;
    `);

  const affected = result.recordset[0].affected;
  if (!affected) {
    throw new Error('NOTIFICATION_NOT_FOUND');
  }
}

// Đánh dấu tất cả đã đọc
export async function markAllNotificationsRead({ userId }) {
  const pool = await getPool();

  await pool.request()
    .input('user_id', sql.UniqueIdentifier, userId)
    .query(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = @user_id AND is_read = 0;
    `);
}
