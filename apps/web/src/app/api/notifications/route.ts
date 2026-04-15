import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

type NotificationPreferences = {
  enabled: boolean;
  inAppEnabled: boolean;
  reminder24h: boolean;
  reminder3h: boolean;
  reminder30m: boolean;
  defaultHourUtc: number;
  defaultMinuteUtc: number;
  timezone: string;
};

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  inAppEnabled: true,
  reminder24h: true,
  reminder3h: true,
  reminder30m: true,
  defaultHourUtc: 18,
  defaultMinuteUtc: 0,
  timezone: 'UTC',
};

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const preferences = await getOrCreatePreferences(userId);
    await createCalendarReminders(userId, preferences);

    const { searchParams } = new URL(request.url);
    const limitParam = Number.parseInt(searchParams.get('limit') ?? '10', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10;

    const result = await query(
      `SELECT id, type, title, body, action_href, metadata, scheduled_for, read_at, created_at
       FROM app_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const unreadResult = await query(
      `SELECT COUNT(*)::int AS unread_count
       FROM app_notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    return withSecurityHeaders(NextResponse.json({
      notifications: result.rows,
      unreadCount: unreadResult.rows[0]?.unread_count ?? 0,
    }));
  } catch (error) {
    logger.error('notifications.list.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos obtener notificaciones' }, { status: 500 }));
  }
});

async function createCalendarReminders(userId: string, preferences: NotificationPreferences) {
  if (!preferences.enabled || !preferences.inAppEnabled) {
    return;
  }

  const windows = [
    { enabled: preferences.reminder24h, type: 'upload_due_24h', title: 'Subida en 24 horas', hoursBefore: 24 },
    { enabled: preferences.reminder3h, type: 'upload_due_3h', title: 'Subida en 3 horas', hoursBefore: 3 },
    { enabled: preferences.reminder30m, type: 'upload_due_30m', title: 'Subida en 30 minutos', hoursBefore: 0.5 },
  ].filter((item) => item.enabled);

  if (windows.length === 0) {
    return;
  }

  for (const window of windows) {
    await createWindowReminders(userId, preferences, window.type, window.title, window.hoursBefore);
  }
}

async function createWindowReminders(
  userId: string,
  preferences: NotificationPreferences,
  reminderType: string,
  reminderTitle: string,
  hoursBefore: number
) {
  const minutesBefore = Math.round(hoursBefore * 60);
  await query(
    `INSERT INTO app_notifications (
      user_id,
      type,
      title,
      body,
      action_href,
      metadata,
      scheduled_for,
      dedupe_key
    )
    SELECT
      p.user_id,
      $2 AS type,
      $3 AS title,
      p.title AS body,
      '/dashboard' AS action_href,
      jsonb_build_object(
        'productionId', p.id,
        'productionTitle', p.title,
        'targetDate', p.target_date::text,
        'status', p.status,
        'minutesBefore', $4,
        'timezone', $7::text
      ) AS metadata,
      (
        (p.target_date::timestamp)
        + ($5::int * INTERVAL '1 hour')
        + ($6::int * INTERVAL '1 minute')
      ) AT TIME ZONE $7::text AS scheduled_for,
      format(
        '%s:%s:%s:%s',
        $2,
        p.id::text,
        p.target_date::text,
        $4::text
      ) AS dedupe_key
    FROM productions p
    WHERE p.user_id = $1
      AND p.target_date IS NOT NULL
      AND p.status <> 'published'
      AND (
        (
          ((p.target_date::timestamp) + ($5::int * INTERVAL '1 hour') + ($6::int * INTERVAL '1 minute'))
          - ($4::int * INTERVAL '1 minute')
        ) <= NOW()
      )
      AND (
        (
          ((p.target_date::timestamp) + ($5::int * INTERVAL '1 hour') + ($6::int * INTERVAL '1 minute'))
          + INTERVAL '90 minutes'
        ) >= NOW()
      )
    ON CONFLICT (user_id, dedupe_key) DO NOTHING`,
    [
      userId,
      reminderType,
      reminderTitle,
      minutesBefore,
      preferences.defaultHourUtc,
      preferences.defaultMinuteUtc,
      preferences.timezone,
    ]
  );
}

async function getOrCreatePreferences(userId: string): Promise<NotificationPreferences> {
  const result = await query(
    `INSERT INTO app_notification_preferences (
       user_id,
       enabled,
       in_app_enabled,
       reminder_24h,
       reminder_3h,
       reminder_30m,
       default_hour_utc,
       default_minute_utc,
       timezone
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (user_id)
     DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING enabled, in_app_enabled, reminder_24h, reminder_3h, reminder_30m, default_hour_utc, default_minute_utc, timezone`,
    [
      userId,
      DEFAULT_PREFS.enabled,
      DEFAULT_PREFS.inAppEnabled,
      DEFAULT_PREFS.reminder24h,
      DEFAULT_PREFS.reminder3h,
      DEFAULT_PREFS.reminder30m,
      DEFAULT_PREFS.defaultHourUtc,
      DEFAULT_PREFS.defaultMinuteUtc,
      DEFAULT_PREFS.timezone,
    ]
  );

  const row = result.rows[0] ?? {};
  return {
    enabled: Boolean(row.enabled),
    inAppEnabled: Boolean(row.in_app_enabled),
    reminder24h: Boolean(row.reminder_24h),
    reminder3h: Boolean(row.reminder_3h),
    reminder30m: Boolean(row.reminder_30m),
    defaultHourUtc: Number(row.default_hour_utc),
    defaultMinuteUtc: Number(row.default_minute_utc),
    timezone: typeof row.timezone === 'string' ? row.timezone : 'UTC',
  };
}
