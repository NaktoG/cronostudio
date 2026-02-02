import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';



interface RouteParams {
    params: Promise<{ videoId: string }>;
}

/**
 * GET /api/analytics/video/[videoId]
 * Obtiene analytics detallados de un video específico (requiere autenticación)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = getAuthUser(request)?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { videoId } = await params;
        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Verificar que el video existe y PERTENECE al usuario (via channel)
        const videoResult = await query(
            `SELECT v.id, v.title, v.youtube_video_id, v.views as current_views, 
                    v.likes as current_likes, v.comments as current_comments,
                    c.name as channel_name
             FROM videos v
             JOIN channels c ON v.channel_id = c.id
             WHERE v.id = $1 AND c.user_id = $2`,
            [videoId, userId]
        );

        if (videoResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Video no encontrado' },
                { status: 404 }
            );
        }

        const video = videoResult.rows[0];

        // Obtener analytics históricos
        let analyticsQuery = `
            SELECT date, views, watch_time_minutes, avg_view_duration_seconds
            FROM analytics
            WHERE video_id = $1
        `;
        const params_arr: (string | Date)[] = [videoId];
        let paramIndex = 2;

        if (startDate) {
            analyticsQuery += ` AND date >= $${paramIndex++}`;
            params_arr.push(new Date(startDate));
        }
        if (endDate) {
            analyticsQuery += ` AND date <= $${paramIndex++}`;
            params_arr.push(new Date(endDate));
        }

        analyticsQuery += ` ORDER BY date DESC LIMIT 365`;

        const analyticsResult = await query(analyticsQuery, params_arr);

        // Calcular totales
        const totals = analyticsResult.rows.reduce(
            (acc, row) => ({
                totalViews: acc.totalViews + (row.views || 0),
                totalWatchTime: acc.totalWatchTime + (row.watch_time_minutes || 0),
                avgDuration: acc.avgDuration + (row.avg_view_duration_seconds || 0),
            }),
            { totalViews: 0, totalWatchTime: 0, avgDuration: 0 }
        );

        if (analyticsResult.rows.length > 0) {
            totals.avgDuration = Math.round(totals.avgDuration / analyticsResult.rows.length);
        }

        const response = NextResponse.json({
            video: {
                id: video.id,
                title: video.title,
                youtubeVideoId: video.youtube_video_id,
                channelName: video.channel_name,
                currentStats: {
                    views: video.current_views,
                    likes: video.current_likes,
                    comments: video.current_comments,
                },
            },
            analytics: {
                period: {
                    start: startDate || (analyticsResult.rows[analyticsResult.rows.length - 1]?.date || null),
                    end: endDate || (analyticsResult.rows[0]?.date || null),
                },
                totals: {
                    views: totals.totalViews,
                    watchTimeMinutes: totals.totalWatchTime,
                    avgViewDurationSeconds: totals.avgDuration,
                },
                daily: analyticsResult.rows,
            },
        });

        return withSecurityHeaders(response);
    } catch (error) {
        console.error('[GET /api/analytics/video/:id] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Error al obtener analytics del video' },
            { status: 500 }
        );
    }
}

/**
 * OPTIONS /api/analytics/video/[videoId]
 */
export async function OPTIONS(request: NextRequest) {
    const { handlePreflight } = await import('@/middleware/cors');
    return handlePreflight(request);
}
