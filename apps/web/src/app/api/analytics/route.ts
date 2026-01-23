import { NextRequest, NextResponse } from 'next/server';
import { validateInput, CreateAnalyticsSchema, AnalyticsQuerySchema } from '@/lib/validation';
import { withSecurityHeaders, withAuth, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';

/**
 * GET /api/analytics
 * Obtiene analytics con filtros y agregación
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Parsear y validar query params
        const queryParams = validateInput(AnalyticsQuerySchema, {
            videoId: searchParams.get('videoId') || undefined,
            channelId: searchParams.get('channelId') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            groupBy: searchParams.get('groupBy') || 'day',
        });

        let queryText = '';
        const params: (string | Date)[] = [];
        let paramIndex = 1;
        const groupBy = queryParams.groupBy ?? 'day';

        if (queryParams.channelId) {
            // Analytics por canal (agregado de todos los videos del canal)
            queryText = `
                SELECT 
                    DATE_TRUNC($1, a.date) as period,
                    SUM(a.views) as total_views,
                    SUM(a.watch_time_minutes) as total_watch_time,
                    AVG(a.avg_view_duration_seconds)::int as avg_duration,
                    COUNT(DISTINCT a.video_id) as videos_count
                FROM analytics a
                JOIN videos v ON a.video_id = v.id
                WHERE v.channel_id = $2
            `;
            params.push(groupBy, queryParams.channelId);
            paramIndex = 3;

            if (queryParams.startDate) {
                queryText += ` AND a.date >= $${paramIndex++}`;
                params.push(queryParams.startDate);
            }
            if (queryParams.endDate) {
                queryText += ` AND a.date <= $${paramIndex++}`;
                params.push(queryParams.endDate);
            }

            queryText += ` GROUP BY period ORDER BY period DESC LIMIT 100`;

        } else if (queryParams.videoId) {
            // Analytics por video específico
            queryText = `
                SELECT 
                    DATE_TRUNC($1, a.date) as period,
                    SUM(a.views) as total_views,
                    SUM(a.watch_time_minutes) as total_watch_time,
                    AVG(a.avg_view_duration_seconds)::int as avg_duration
                FROM analytics a
                WHERE a.video_id = $2
            `;
            params.push(groupBy, queryParams.videoId);
            paramIndex = 3;

            if (queryParams.startDate) {
                queryText += ` AND a.date >= $${paramIndex++}`;
                params.push(queryParams.startDate);
            }
            if (queryParams.endDate) {
                queryText += ` AND a.date <= $${paramIndex++}`;
                params.push(queryParams.endDate);
            }

            queryText += ` GROUP BY period ORDER BY period DESC LIMIT 100`;

        } else {
            // Summary general (todos los canales)
            queryText = `
                SELECT 
                    DATE_TRUNC($1, a.date) as period,
                    SUM(a.views) as total_views,
                    SUM(a.watch_time_minutes) as total_watch_time,
                    AVG(a.avg_view_duration_seconds)::int as avg_duration,
                    COUNT(DISTINCT a.video_id) as videos_count,
                    COUNT(DISTINCT v.channel_id) as channels_count
                FROM analytics a
                JOIN videos v ON a.video_id = v.id
                WHERE 1=1
            `;
            params.push(groupBy);
            paramIndex = 2;

            if (queryParams.startDate) {
                queryText += ` AND a.date >= $${paramIndex++}`;
                params.push(queryParams.startDate);
            }
            if (queryParams.endDate) {
                queryText += ` AND a.date <= $${paramIndex++}`;
                params.push(queryParams.endDate);
            }

            queryText += ` GROUP BY period ORDER BY period DESC LIMIT 100`;
        }

        const result = await query(queryText, params);

        const response = NextResponse.json({
            data: result.rows,
            query: {
                videoId: queryParams.videoId,
                channelId: queryParams.channelId,
                startDate: queryParams.startDate?.toISOString(),
                endDate: queryParams.endDate?.toISOString(),
                groupBy: queryParams.groupBy,
            },
        });

        return withSecurityHeaders(response);
    } catch (error) {
        if (error instanceof Error && error.message.includes('Validation error')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        console.error('[GET /api/analytics] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Error al obtener analytics' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/analytics
 * Registra métricas de analytics (requiere autenticación)
 */
export const POST = rateLimit(API_RATE_LIMIT)(
    withAuth(async (request: NextRequest) => {
        try {
            const body = await request.json();

            // Validar input
            const validatedData = validateInput(CreateAnalyticsSchema, body);

            // Verificar que el video existe
            const videoCheck = await query(
                'SELECT id FROM videos WHERE id = $1',
                [validatedData.videoId]
            );

            if (videoCheck.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Video no encontrado' },
                    { status: 404 }
                );
            }

            // Upsert: insertar o actualizar si ya existe para esa fecha
            const result = await query(
                `INSERT INTO analytics (video_id, date, views, watch_time_minutes, avg_view_duration_seconds) 
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (video_id, date) 
                 DO UPDATE SET 
                    views = $3,
                    watch_time_minutes = $4,
                    avg_view_duration_seconds = $5
                 RETURNING id, video_id, date, views, watch_time_minutes, avg_view_duration_seconds, created_at`,
                [
                    validatedData.videoId,
                    validatedData.date,
                    validatedData.views,
                    validatedData.watchTimeMinutes,
                    validatedData.avgViewDurationSeconds,
                ]
            );

            const user = getAuthUser(request);
            console.log('[POST /api/analytics] Analytics registrado:', {
                id: result.rows[0].id,
                videoId: validatedData.videoId,
                date: validatedData.date,
                by: user?.email,
            });

            const response = NextResponse.json(result.rows[0], { status: 201 });
            return withSecurityHeaders(response);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Validation error')) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }

            console.error('[POST /api/analytics] Error:', error instanceof Error ? error.message : 'Unknown error');

            return NextResponse.json(
                { error: 'Error al registrar analytics' },
                { status: 500 }
            );
        }
    })
);

/**
 * OPTIONS /api/analytics
 * Manejar preflight requests
 */
export async function OPTIONS(request: NextRequest) {
    const { handlePreflight } = await import('@/middleware/cors');
    return handlePreflight(request);
}
