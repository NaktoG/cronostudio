import { describe, it, expect, vi } from 'vitest';
import { withEnv } from '@/__tests__/utils/env';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('observability metrics', () => {
  it('ejecuta pumpers registrados y captura errores', async () => {
    vi.resetModules();
    process.env.OBS_ENABLED = 'false';
    const { registerMetricsPumper, emitMetric } = await import('@/lib/observability');
    const success = vi.fn();
    const fail = vi.fn(() => {
      throw new Error('boom');
    });
    registerMetricsPumper(success);
    registerMetricsPumper(fail);

    expect(() => emitMetric({ name: 'test', value: 1 })).not.toThrow();
    expect(success).toHaveBeenCalled();
  });

  it('envía alertas al logger cuando no hay webhook', async () => {
    vi.resetModules();
    await withEnv({
      NODE_ENV: 'development',
      OBS_ALERT_WEBHOOK: undefined,
    }, async () => {
      const { emitAlert } = await import('@/lib/observability');
      const { logger } = await import('@/lib/logger');

      emitAlert(
        {
          title: 'DB down',
          message: 'Pool exhausted',
          severity: 'critical',
        },
        { cooldownMs: 0 }
      );

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[Alert]'), expect.any(Object));
    });
  });
});
