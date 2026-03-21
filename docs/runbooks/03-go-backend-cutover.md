# Runbook 03 - Cutover n8n a backend Go

## Objetivo
Activar workflows en `automation-go` de forma gradual, con trazabilidad y rollback inmediato.

> Este runbook aplica cuando los workers y DLQ ya estan operativos (PR4+). En PR2/PR3 solo se usa para preparacion.

Durante PR4, operar en `shadow mode` (`AUTOMATION_WORKER_SHADOW_MODE=true`) con handler noop y sin side effects externos.

## Pre-checks
1. `apps/web` responde `/api/health` y `automation-go` responde `healthz`/`readyz`.
2. Base de datos con migraciones aplicadas y backup reciente.
3. Feature flags disponibles por workflow.
4. Metricas base visibles (`queue depth`, `retry count`, `dlq depth`, `error rate`).
5. Si se habilita scheduler, validar ventana UTC y flags `AUTOMATION_SCHEDULER_*`.

## Secuencia de cutover
1. Activar `AUTOMATION_CUTOVER_ENABLED=true` con 10% para un workflow objetivo.
2. Monitorear 30-60 min con foco en errores, latencia y DLQ.
3. Escalar a 50% si SLO se mantiene.
4. Escalar a 100% si no hay degradacion sostenida.
5. Mantener n8n en standby solo durante ventana excepcional de rollback.

Recomendacion operativa:
- En 10/50 mantener `AUTOMATION_CUTOVER_INCLUDE_USER_REQUESTS=false`.
- Aplicar porcentaje por workflow con `AUTOMATION_CUTOVER_YOUTUBE_SYNC_CHANNELS_PERCENT` y `AUTOMATION_CUTOVER_YOUTUBE_SYNC_VIDEOS_PERCENT`.

## Criterios de rollback
- Error rate superior al umbral acordado.
- Latencia p95 fuera de SLO por ventana sostenida.
- Crecimiento anomalo de DLQ o retries en tormenta.

## Procedimiento de rollback
1. Activar `AUTOMATION_CUTOVER_KILL_SWITCH=true` para rollback inmediato.
2. Rehabilitar ejecucion n8n para ese workflow.
3. Pausar workers Go del flujo afectado.
4. Registrar incidente y conservar DLQ para replay posterior.

## Post-cutover
1. Verificar paridad funcional de resultados.
2. Revisar auditoria y trazas del flujo migrado.
3. Documentar lecciones y ajustar umbrales antes del siguiente workflow.
