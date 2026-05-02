import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

const prefsSchema = z.object({
  enabled: z.boolean(),
  inAppEnabled: z.boolean(),
  reminder24h: z.boolean(),
  reminder3h: z.boolean(),
  reminder30m: z.boolean(),
  defaultHourUtc: z.number().int().min(0).max(23),
  defaultMinuteUtc: z.number().int().min(0).max(59),
  timezone: z.string().min(3).max(64),
});

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

    const prefs = await getOrCreatePreferences(userId);
    return withSecurityHeaders(NextResponse.json({ preferences: prefs }));
  } catch (error) {
    logger.error('notifications.preferences.get.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos cargar preferencias' }, { status: 500 }));
  }
});

export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const payload = await request.json().catch(() => ({}));
    const parsed = prefsSchema.safeParse(payload);
    if (!parsed.success) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos invalidos', details: parsed.error.flatten() }, { status: 400 }));
    }

    const prefs = parsed.data;
    if (!isValidTimeZone(prefs.timezone)) {
      return withSecurityHeaders(NextResponse.json({ error: 'Timezone invalida' }, { status: 400 }));
    }

    const updated = await query(
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
       DO UPDATE SET
         enabled = EXCLUDED.enabled,
         in_app_enabled = EXCLUDED.in_app_enabled,
         reminder_24h = EXCLUDED.reminder_24h,
         reminder_3h = EXCLUDED.reminder_3h,
         reminder_30m = EXCLUDED.reminder_30m,
         default_hour_utc = EXCLUDED.default_hour_utc,
         default_minute_utc = EXCLUDED.default_minute_utc,
         timezone = EXCLUDED.timezone,
         updated_at = NOW()
       RETURNING enabled, in_app_enabled, reminder_24h, reminder_3h, reminder_30m, default_hour_utc, default_minute_utc, timezone`,
      [
        userId,
        prefs.enabled,
        prefs.inAppEnabled,
        prefs.reminder24h,
        prefs.reminder3h,
        prefs.reminder30m,
        prefs.defaultHourUtc,
        prefs.defaultMinuteUtc,
        prefs.timezone,
      ]
    );

    return withSecurityHeaders(NextResponse.json({ preferences: toResponse(updated.rows[0]) }));
  } catch (error) {
    logger.error('notifications.preferences.put.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos guardar preferencias' }, { status: 500 }));
  }
});

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
  return toResponse(result.rows[0]);
}

function isValidTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function toResponse(row: Record<string, unknown>): NotificationPreferences {
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
