import { NextRequest, NextResponse } from 'next/server';
import { validateInput, CreateAnalyticsSchema, AnalyticsQuerySchema } from '@/lib/validation';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics
 * Obtiene analytics con filtros y agregación
 */
/**
 * GET /api/analytics
 * Obtiene analytics con filtros y agregación, limitado a los recursos del usuario autenticado
 */
export async function GET(request: NextRequest) {
    try {
        // Autenticación requerida
        const userId = getAuthUser(request)?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
            // Analytics por canal -> Verificar pertenencia
            queryText = `
                SELECT 
                    DATE_TRUNC($1, a.date) as period,
                    SUM(a.views) as total_views,
                    SUM(a.watch_time_minutes) as total_watch_time,
                    AVG(a.avg_view_duration_seconds)::int as avg_duration,
                    COUNT(DISTINCT a.video_id) as videos_count
                FROM analytics a
                JOIN videos v ON a.video_id = v.id
                JOIN channels c ON v.channel_id = c.id
                WHERE c.id = $2 AND c.user_id = $3
            `;
            params.push(groupBy, queryParams.channelId, userId);
            paramIndex = 4;

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
            // Analytics por video -> Verificar pertenencia del canal del video
            queryText = `
                SELECT 
                    DATE_TRUNC($1, a.date) as period,
                    SUM(a.views) as total_views,
                    SUM(a.watch_time_minutes) as total_watch_time,
                    AVG(a.avg_view_duration_seconds)::int as avg_duration
                FROM analytics a
                JOIN videos v ON a.video_id = v.id
                JOIN channels c ON v.channel_id = c.id
                WHERE a.video_id = $2 AND c.user_id = $3
            `;
            params.push(groupBy, queryParams.videoId, userId);
            paramIndex = 4;

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
            // Summary general -> Todos los canales del usuario
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
                JOIN channels c ON v.channel_id = c.id
                WHERE c.user_id = $2
            `;
            params.push(groupBy, userId);
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
export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getAuthUser(request)?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validar input
        const validatedData = validateInput(CreateAnalyticsSchema, body);

        // Verificar que el video existe Y pertenece al usuario
        const videoCheck = await query(
            `SELECT v.id FROM videos v 
             JOIN channels c ON v.channel_id = c.id
             WHERE v.id = $1 AND c.user_id = $2`,
            [validatedData.videoId, userId]
        );

        if (videoCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Video no encontrado o no autorizado' },
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

        console.log('[POST /api/analytics] Analytics registrado:', {
            id: result.rows[0].id,
            videoId: validatedData.videoId,
            date: validatedData.date,
            userId: userId,
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
}));
