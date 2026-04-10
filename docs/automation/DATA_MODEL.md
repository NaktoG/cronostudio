# Automation Data Model

Este documento describe el modelo de datos de automatización usado por `automation-go`.

## Objetivo

- Procesar workflows en forma asíncrona y segura.
- Garantizar idempotencia por tenant.
- Proveer trazabilidad operativa (attempts, errores, DLQ, auditoría).

## Tablas principales

### `automation_job_queue`

- Cola principal de ejecución.
- Estado del job: `queued | running | succeeded | failed | dead`.
- Campos operativos: `attempt`, `max_attempts`, `run_at`, `lease_until`, `locked_by`.
- Trazabilidad: `request_id`, `trace_id`, `last_error_code`, `last_error_message`.

### `automation_job_idempotency`

- Dedupe persistente por tenant.
- Constraint de unicidad: `(scope, tenant_user_id, idempotency_key)`.
- Guarda `request_hash` y `response_snapshot` para replay consistente.

### `automation_job_attempts`

- Historial por intento de ejecución.
- Campos: `attempt`, `started_at`, `finished_at`, `outcome`, `error_class`, `error_detail`.

### `automation_job_dlq`

- Almacena fallos terminales o agotamiento de reintentos.
- Campos: `failure_reason`, `retryable`, `replay_count`, `replayed_at`.

### `automation_audit_log`

- Auditoría de acciones críticas (enqueue/replay/operación).
- Incluye `actor_type`, `actor_id`, `resource_type`, `request_id`, `trace_id`.

## State machine del job

- `queued -> running` (claim del worker con lease).
- `running -> succeeded` (ejecución exitosa).
- `running -> queued` (retry programado).
- `running -> dead` (fallo terminal; replica en DLQ).

## Consultas operativas útiles

```sql
-- Profundidad de cola pendiente
SELECT count(*)
FROM automation_job_queue
WHERE state = 'queued';

-- Jobs corriendo con lease vencido
SELECT id, job_type, tenant_user_id, lease_until
FROM automation_job_queue
WHERE state = 'running'
  AND lease_until <= now();

-- DLQ por tipo de workflow
SELECT job_type, count(*)
FROM automation_job_dlq
GROUP BY job_type
ORDER BY count(*) DESC;
```
