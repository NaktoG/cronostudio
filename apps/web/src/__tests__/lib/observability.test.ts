import { describe, it, expect, vi } from 'vitest';

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
});
