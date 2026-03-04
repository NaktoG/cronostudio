import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { openSecret } from '@/lib/crypto/secretBox';
import { fetchPlaylistItems, fetchUploadsPlaylist, refreshAccessToken } from '@/lib/youtube/client';
import {
  endOfIsoWeekInTimeZone,
  getDateFromIsoWeek,
  getWeekdayDateInTimeZone,
  getWeekdayNameInTimeZone,
  setTimeOnDateUtc,
  startOfIsoWeekInTimeZone,
} from '@/lib/dates';

export const dynamic = 'force-dynamic';

const TIME_ZONE = 'Europe/Madrid';

function buildVideoUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function normalizeSlotDate(date: Date, time: string, endOfDay = false) {
  const result = setTimeOnDateUtc(date, time);
  if (endOfDay) {
    result.setUTCSeconds(59, 999);
  }
  return result;
}

export const GET = withAuth(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const isoYear = Number(searchParams.get('isoYear'));
    const isoWeek = Number(searchParams.get('isoWeek'));
    const channelId = searchParams.get('channelId');
    const youtubeChannelId = searchParams.get('youtubeChannelId');

    if (!isoYear || !isoWeek) {
      return withSecurityHeaders(NextResponse.json({ error: 'isoYear e isoWeek son requeridos' }, { status: 400 }));
    }

    const integration = await query(
      youtubeChannelId
        ? `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at
           FROM youtube_integrations
           WHERE user_id = $1 AND youtube_channel_id = $2
           ORDER BY updated_at DESC
           LIMIT 1`
        : `SELECT id, youtube_channel_id, access_token_enc, refresh_token_enc, token_expiry_at
           FROM youtube_integrations
           WHERE user_id = $1
           ORDER BY updated_at DESC
           LIMIT 1`,
      youtubeChannelId ? [userId, youtubeChannelId] : [userId]
    );

    if (integration.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'YouTube no conectado' }, { status: 404 }));
    }

    const row = integration.rows[0];
    let accessToken = openSecret(row.access_token_enc as string);

    const expiry = row.token_expiry_at ? new Date(row.token_expiry_at as string) : null;
    if (expiry && expiry.getTime() <= Date.now() + 60 * 1000) {
      if (!row.refresh_token_enc) {
        return withSecurityHeaders(NextResponse.json({ error: 'Refresh token faltante' }, { status: 400 }));
      }
      const refreshed = await refreshAccessToken(row.refresh_token_enc as string);
      accessToken = openSecret(refreshed.accessTokenEnc);
      const nextExpiry = refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : null;
      await query(
        `UPDATE youtube_integrations
         SET access_token_enc = $1, token_expiry_at = $2, scope = COALESCE($3, scope), updated_at = NOW()
         WHERE id = $4`,
        [refreshed.accessTokenEnc, nextExpiry?.toISOString() ?? null, refreshed.scope ?? null, row.id]
      );
    }

    const uploads = await fetchUploadsPlaylist(accessToken);
    const targetChannelId = youtubeChannelId || uploads.channelId;
    if (youtubeChannelId && uploads.channelId !== youtubeChannelId) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal no coincide' }, { status: 400 }));
    }

    const seedDate = getDateFromIsoWeek(isoYear, isoWeek);
    const weekStart = startOfIsoWeekInTimeZone(seedDate, TIME_ZONE);
    const weekEnd = endOfIsoWeekInTimeZone(seedDate, TIME_ZONE);

    const tuesday = getWeekdayDateInTimeZone(weekStart, 'tuesday');
    const friday = getWeekdayDateInTimeZone(weekStart, 'friday');

    const slots = [
      { key: 'tue', label: 'tuesday', date: tuesday },
      { key: 'fri', label: 'friday', date: friday },
    ];

    const expectedSlots = slots.map((slot) => {
      if (!slot.date) return { key: slot.key, date: null, windowStart: null, windowEnd: null };
      const windowStart = normalizeSlotDate(slot.date, '00:00');
      const windowEnd = normalizeSlotDate(slot.date, '23:59', true);
      return {
        key: slot.key,
        date: slot.date.toISOString().slice(0, 10),
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
      };
    });

    const items = await fetchPlaylistItems(accessToken, uploads.uploadsPlaylistId, 50);
    const weekItems = items.filter((item: { publishedAt: string }) => {
      const published = new Date(item.publishedAt);
      return published >= weekStart && published <= weekEnd;
    });

    const youtubeEvidence: Record<string, { matched: boolean; video: any | null }> = {
      tue: { matched: false, video: null },
      fri: { matched: false, video: null },
    };

    for (const slot of expectedSlots) {
      if (!slot.date || !slot.windowStart || !slot.windowEnd) continue;
      const start = new Date(slot.windowStart);
      const end = new Date(slot.windowEnd);
      const match = weekItems.find((item: { publishedAt: string }) => {
        const published = new Date(item.publishedAt);
        return published >= start && published <= end;
      });
      if (match) {
        youtubeEvidence[slot.key] = {
          matched: true,
          video: {
            videoId: match.videoId,
            title: match.title,
            publishedAt: match.publishedAt,
            url: buildVideoUrl(match.videoId),
          },
        };
      }
    }

    const publishEvents: Record<string, { matched: boolean; eventId: string | null; publishedAt: string | null }> = {
      tue: { matched: false, eventId: null, publishedAt: null },
      fri: { matched: false, eventId: null, publishedAt: null },
    };

    if (channelId) {
      const eventsResult = await query(
        `SELECT id, published_at FROM publish_events
         WHERE user_id = $1 AND channel_id = $2 AND published_at BETWEEN $3 AND $4
         ORDER BY published_at ASC`,
        [userId, channelId, weekStart.toISOString(), weekEnd.toISOString()]
      );
      for (const rowEvent of eventsResult.rows) {
        const publishedAt = new Date(rowEvent.published_at as string);
        const weekday = getWeekdayNameInTimeZone(publishedAt, TIME_ZONE);
        const slotKey = weekday === 'tuesday' ? 'tue' : weekday === 'friday' ? 'fri' : null;
        if (slotKey && !publishEvents[slotKey].matched) {
          publishEvents[slotKey] = {
            matched: true,
            eventId: rowEvent.id as string,
            publishedAt: publishedAt.toISOString(),
          };
        }
      }
    }

    const reconciliation: Record<string, string> = { tue: 'ok', fri: 'ok' };
    const suggestedActions: any[] = [];

    for (const slot of expectedSlots) {
      const key = slot.key as 'tue' | 'fri';
      const youtubeMatch = youtubeEvidence[key];
      const publishMatch = publishEvents[key];

      if (youtubeMatch.matched && publishMatch.matched) {
        reconciliation[key] = 'ok';
      } else if (youtubeMatch.matched && !publishMatch.matched) {
        reconciliation[key] = 'missing_publish_event';
        if (channelId) {
          suggestedActions.push({
            type: 'register_publish_event',
            slot: key,
            payload: {
              channelId,
              targetDay: key === 'tue' ? 'tuesday' : 'friday',
              publishedAt: youtubeMatch.video?.publishedAt,
              platform: 'youtube',
              platformId: youtubeMatch.video?.videoId,
              publishedUrl: youtubeMatch.video?.url,
              source: 'youtube',
              note: 'Imported from YouTube',
            },
          });
        }
      } else if (!youtubeMatch.matched && publishMatch.matched) {
        reconciliation[key] = 'missing_youtube_video';
      } else {
        reconciliation[key] = 'missing_youtube_video';
      }
    }

    return withSecurityHeaders(NextResponse.json({
      isoYear,
      isoWeek,
      youtubeChannelId: targetChannelId,
      internalChannelId: channelId ?? null,
      expectedSlots,
      youtubeEvidence,
      publishEvents,
      reconciliation,
      suggestedActions,
    }));
  } catch (error) {
    logger.error('[youtube.reconcile] Error', { message: error instanceof Error ? error.message : String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al reconciliar YouTube' }, { status: 500 }));
  }
}));
