import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { sendEmail } from '@/lib/email';

interface MetricsEvent {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

const pumpers: Array<(event: MetricsEvent) => void> = [];
type AlertSeverity = 'info' | 'warning' | 'critical';

interface AlertEvent {
  title: string;
  message: string;
  severity: AlertSeverity;
  tags?: Record<string, string>;
  context?: Record<string, unknown>;
  source?: string;
}

type AlertHandler = (event: AlertEvent) => void;

const alertHandlers: AlertHandler[] = [];
const alertCooldowns = new Map<string, number>();
const DEFAULT_ALERT_COOLDOWN = 60_000;

export function registerMetricsPumper(pumper: (event: MetricsEvent) => void) {
  pumpers.push(pumper);
}

export function registerAlertSink(handler: AlertHandler) {
  alertHandlers.push(handler);
}

export function emitMetric(event: MetricsEvent) {
  try {
    pumpers.forEach((p) => p(event));
  } catch (error) {
    logger.error('[Observability] metric dispatch failed', { error });
  }
}

interface AlertOptions {
  dedupeKey?: string;
  cooldownMs?: number;
}

export function emitAlert(event: AlertEvent, options?: AlertOptions) {
  try {
    const key = options?.dedupeKey ?? `${event.severity}:${event.title}`;
    const cooldown = options?.cooldownMs ?? DEFAULT_ALERT_COOLDOWN;
    if (cooldown > 0) {
      const last = alertCooldowns.get(key) ?? 0;
      const now = Date.now();
      if (now - last < cooldown) {
        return;
      }
      alertCooldowns.set(key, now);
    }
    alertHandlers.forEach((handler) => handler(event));
  } catch (error) {
    logger.error('[Observability] alert dispatch failed', { error });
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
} else if (process.env.NODE_ENV !== 'test') {
  registerMetricsPumper((event) => {
    logger.debug('[Observability] metric', { event });
  });
}

if (config.observability.alertWebhook) {
  registerAlertSink((event) => {
    fetch(config.observability.alertWebhook as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch((error) => logger.error('[Observability] alert webhook failed', { error }));
  });
}

if (process.env.NODE_ENV !== 'test') {
  const fallbackEmail = config.observability.alertEmail;
  registerAlertSink((event) => {
    const contextEmail = typeof event.context?.userEmail === 'string' ? event.context.userEmail : null;
    const recipient = contextEmail || fallbackEmail;
    if (!recipient) {
      return;
    }

    void sendEmail({
      to: recipient,
      subject: `[CronoStudio] ${event.severity.toUpperCase()}: ${event.title}`,
      html: `
        <h2>${event.title}</h2>
        <p><strong>Severidad:</strong> ${event.severity}</p>
        <p>${event.message}</p>
        ${event.tags ? `<pre>Tags: ${JSON.stringify(event.tags, null, 2)}</pre>` : ''}
        ${event.context ? `<pre>Context: ${JSON.stringify(event.context, null, 2)}</pre>` : ''}
      `,
    }).catch((error) => logger.error('[Observability] alert email failed', { error }));
  });
}

if (process.env.NODE_ENV !== 'test') {
  registerAlertSink((event) => {
    const logMethod = event.severity === 'critical' ? logger.error : logger.warn;
    logMethod('[Alert] event captured', { event });
  });
}
