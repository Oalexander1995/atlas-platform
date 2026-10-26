import { query } from './db';
import { ClockService } from './clock';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
}): Promise<NotificationRecord> {
  const { userId, type, title, message, payload = {} } = params;
  const now = await ClockService.now();

  const res = await query<{
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    payload: any;
    read_at: string | null;
    created_at: string;
  }>(
    `INSERT INTO notifications (user_id, type, title, message, payload, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, type, title, message, JSON.stringify(payload), now.toISOString()]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    payload: row.payload,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function getUserNotifications(
  userId: string,
  limit: number = 20
): Promise<{ notifications: NotificationRecord[]; unreadCount: number }> {
  const res = await query<{
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    payload: any;
    read_at: string | null;
    created_at: string;
  }>(
    `SELECT id, user_id, type, title, message, payload, read_at, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM notifications
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  const unreadCount = Number(countRes.rows[0]?.count || 0);

  const notifications: NotificationRecord[] = res.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    payload: row.payload,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const now = await ClockService.now();
  const res = await query(
    `UPDATE notifications
     SET read_at = $1
     WHERE id = $2 AND user_id = $3 AND read_at IS NULL`,
    [now.toISOString(), notificationId, userId]
  );
  return (res.rowCount || 0) > 0;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const now = await ClockService.now();
  const res = await query(
    `UPDATE notifications
     SET read_at = $1
     WHERE user_id = $2 AND read_at IS NULL`,
    [now.toISOString(), userId]
  );
  return res.rowCount || 0;
}
