import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';
import { validateConfig, config } from '@/lib/config';
import { emitMetric, emitAlert } from '@/lib/observability';

/**
 * GET /api/health
 * Health check endpoint - verifica el estado de los servicios
 */
export async function GET() {
    try {
        validateConfig();
        // Verificar PostgreSQL
        const dbHealthy = await testConnection();

        // Verificar n8n (opcional, con timeout configurable)
        let n8nHealthy = true;
        const n8nBaseUrl = config.automation.n8nBaseUrl;
        if (n8nBaseUrl) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const n8nResponse = await fetch(new URL('/healthz', n8nBaseUrl), {
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                n8nHealthy = n8nResponse.ok;
            } catch {
                n8nHealthy = false;
            }
        }

        const allHealthy = dbHealthy && n8nHealthy;
        const status = allHealthy ? 'healthy' : dbHealthy ? 'degraded' : 'unhealthy';

        emitMetric({ name: `health.${status}`, value: 1 });

        if (!allHealthy) {
            const degradedServices = [];
            if (!dbHealthy) degradedServices.push('database');
            if (!n8nHealthy) degradedServices.push('n8n');
            emitAlert(
                {
                    title: 'Health check degraded',
                    message: `Servicios con problemas: ${degradedServices.join(', ') || 'desconocido'}`,
                    severity: dbHealthy ? 'warning' : 'critical',
                    tags: { component: 'healthcheck' },
                    context: { database: dbHealthy, n8n: n8nHealthy },
                },
                { dedupeKey: `health:${status}`, cooldownMs: 300000 }
            );
        }
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
        emitAlert(
            {
                title: 'Health check failure',
                message: 'Service check failed',
                severity: 'critical',
                tags: { component: 'healthcheck' },
                context: { error: error instanceof Error ? error.message : String(error) },
            },
            { dedupeKey: 'health:error', cooldownMs: 300000 }
        );

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
