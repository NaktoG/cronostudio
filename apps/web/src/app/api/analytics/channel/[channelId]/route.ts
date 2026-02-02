import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';



interface RouteParams {
    params: Promise<{ channelId: string }>;
}

/**
 * GET /api/analytics/channel/[channelId]
 * Obtiene analytics agregados de un canal (requiere autenticación)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = getAuthUser(request)?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { channelId } = await params;
        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const groupBy = searchParams.get('groupBy') || 'day';

        // Verificar que el canal existe y pertenece al usuario
        const channelResult = await query(
            `SELECT id, name, youtube_channel_id, subscribers
             FROM channels WHERE id = $1 AND user_id = $2`,
            [channelId, userId]
        );

        if (channelResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Canal no encontrado' },
                { status: 404 }
            );
        }

        const channel = channelResult.rows[0];

        // Contar videos del canal
        const videosCountResult = await query(
            'SELECT COUNT(*) as count FROM videos WHERE channel_id = $1',
            [channelId]
        );
        const videosCount = parseInt(videosCountResult.rows[0].count);

        // Obtener analytics agregados
        let analyticsQuery = `
            SELECT 
                DATE_TRUNC($1, a.date) as period,
                SUM(a.views) as views,
                SUM(a.watch_time_minutes) as watch_time_minutes,
                AVG(a.avg_view_duration_seconds)::int as avg_duration,
                COUNT(DISTINCT a.video_id) as videos_with_data
            FROM analytics a
            JOIN videos v ON a.video_id = v.id
            WHERE v.channel_id = $2
        `;
        const params_arr: (string | Date)[] = [groupBy, channelId];
        let paramIndex = 3;

        if (startDate) {
            analyticsQuery += ` AND a.date >= $${paramIndex++}`;
            params_arr.push(new Date(startDate));
        }
        if (endDate) {
            analyticsQuery += ` AND a.date <= $${paramIndex++}`;
            params_arr.push(new Date(endDate));
        }

        analyticsQuery += ` GROUP BY period ORDER BY period DESC LIMIT 100`;

        const analyticsResult = await query(analyticsQuery, params_arr);

        // Totales generales del canal
        const totalsResult = await query(
            `SELECT 
                SUM(a.views) as total_views,
                SUM(a.watch_time_minutes) as total_watch_time,
                AVG(a.avg_view_duration_seconds)::int as avg_duration
             FROM analytics a
             JOIN videos v ON a.video_id = v.id
             WHERE v.channel_id = $1`,
            [channelId]
        );

        const totals = totalsResult.rows[0];

        // Top videos del canal
        const topVideosResult = await query(
            `SELECT v.id, v.title, v.youtube_video_id, v.views, v.likes,
                    (SELECT SUM(views) FROM analytics WHERE video_id = v.id) as analytics_views
             FROM videos v
             WHERE v.channel_id = $1
             ORDER BY v.views DESC NULLS LAST
             LIMIT 5`,
            [channelId]
        );

        const response = NextResponse.json({
            channel: {
                id: channel.id,
                name: channel.name,
                youtubeChannelId: channel.youtube_channel_id,
                subscribers: channel.subscribers,
                videosCount,
            },
            analytics: {
                totals: {
                    views: parseInt(totals.total_views) || 0,
                    watchTimeMinutes: parseInt(totals.total_watch_time) || 0,
                    avgViewDurationSeconds: totals.avg_duration || 0,
                },
                groupBy,
                periods: analyticsResult.rows,
            },
            topVideos: topVideosResult.rows,
        });

        return withSecurityHeaders(response);
    } catch (error) {
        console.error('[GET /api/analytics/channel/:id] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Error al obtener analytics del canal' },
            { status: 500 }
        );
    }
}

/**
 * OPTIONS /api/analytics/channel/[channelId]
 */
export async function OPTIONS(request: NextRequest) {
    const { handlePreflight } = await import('@/middleware/cors');
    return handlePreflight(request);
}
