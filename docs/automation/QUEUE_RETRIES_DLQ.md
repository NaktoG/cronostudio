# Queue, Retries y DLQ

Este documento resume el comportamiento operativo de cola/reintentos/DLQ en `automation-go`.

## Flujo de ejecución

1. BFF encola job idempotente en `automation_job_queue`.
2. Worker reclama lote con `FOR UPDATE SKIP LOCKED`.
3. Worker marca `running`, incrementa `attempt` y toma lease.
4. Heartbeat extiende `lease_until` durante ejecución.
5. Finalización:
   - `succeeded` si éxito,
   - `queued` con `run_at` futuro si retry,
   - `dead` + inserción en DLQ si terminal.

## Clasificación de errores (base)

- Retryable:
  - timeouts temporales,
  - `5xx` upstream,
  - `429` upstream.
- Non-retryable:
  - payload inválido,
  - errores de configuración,
  - `4xx` funcionales (salvo `429`).

## Política de retries

- Backoff exponencial con jitter.
- `next_run_at` calculado por intento.
- Tope por job con `max_attempts`.
- Al exceder intentos: transición a `dead` y copia en DLQ.

## DLQ

- Entrada en DLQ cuando:
  - fallo no retryable, o
  - se agotaron intentos.
- Cada entrada conserva payload y razón de fallo.
- Replay debe ejecutarse de forma controlada y auditada.

## Guardrails operativos

- No habilitar replay masivo sin umbral de capacidad.
- Monitorear `automation.job.retry`, `automation.job.dlq`, `automation.queue.depth`.
- Usar kill switch de cutover antes de escalar impacto en incidentes.
