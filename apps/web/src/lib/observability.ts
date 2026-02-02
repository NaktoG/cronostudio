import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

interface MetricsEvent {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

const pumpers: Array<(event: MetricsEvent) => void> = [];

export function registerMetricsPumper(pumper: (event: MetricsEvent) => void) {
  pumpers.push(pumper);
}

export function emitMetric(event: MetricsEvent) {
  try {
    pumpers.forEach((p) => p(event));
  } catch (error) {
    logger.error('[Observability] metric dispatch failed', { error });
  }
}

if (config.observability.enabled && config.observability.endpoint) {
  registerMetricsPumper((event) => {
    fetch(config.observability.endpoint as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch((error) => logger.error('[Observability] remote sink failed', { error }));
  });
}
