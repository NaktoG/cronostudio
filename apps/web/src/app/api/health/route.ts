import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';
import { validateConfig } from '@/lib/config';
import { emitMetric } from '@/lib/observability';

/**
 * GET /api/health
 * Health check endpoint - verifica el estado de los servicios
 */
export async function GET() {
    try {
        validateConfig();
        // Verificar PostgreSQL
        const dbHealthy = await testConnection();

        // Verificar n8n (opcional, con timeout)
        let n8nHealthy = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const n8nResponse = await fetch('http://localhost:5678/healthz', {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            n8nHealthy = n8nResponse.ok;
        } catch {
            n8nHealthy = false;
        }

        const allHealthy = dbHealthy && n8nHealthy;
        const status = allHealthy ? 'healthy' : dbHealthy ? 'degraded' : 'unhealthy';

        emitMetric({ name: `health.${status}`, value: 1 });
        return NextResponse.json({
            status,
            timestamp: new Date().toISOString(),
            services: {
                config: 'ok',
                database: dbHealthy ? 'up' : 'down',
                n8n: n8nHealthy ? 'up' : 'down',
            },
        }, {
            status: allHealthy ? 200 : 503,
        });
    } catch (error) {
        console.error('[GET /api/health] Error:', error);
        emitMetric({ name: 'health.error', value: 1 });

        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Service check failed',
            },
            { status: 503 }
        );
    }
}
