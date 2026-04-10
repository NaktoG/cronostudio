# ADR-0003: Migracion de orquestacion n8n a backend Go interno

## Estado
Proposed

## Contexto
- CronoStudio usa n8n para workflows criticos de sync y analytics.
- El objetivo de la migracion es eliminar n8n de los flujos core y mover la ejecucion a workers internos con mayor control operativo.
- Las prioridades de esta fase son ciberseguridad, idempotencia, retries con DLQ, observabilidad y despliegue online sin downtime.
- `docs/decisions/0002-architecture-governance.md` exige ADR previo para cambios estructurales.

## Decision
- Mantener Next.js/TS como Web + BFF publico.
- Introducir `automation-go` como servicio interno privado para ejecutar workflows asincronos.
- Migrar por fases con coexistencia controlada n8n + Go mediante feature flags por workflow.
- Definir contrato de ejecucion con:
  - idempotency key obligatoria en comandos de automatizacion,
  - retries con backoff exponencial y jitter,
  - DLQ para fallos terminales,
  - auditoria y trazabilidad por `requestId` y `traceId`.
- Usar autenticacion servicio-a-servicio con JWT asimetrico Ed25519 en fase inicial:
  - BFF firma,
  - Go verifica,
  - TTL corto,
  - rotacion de clave por `kid`.
- Ejecutar cutover online en canary (10% -> 50% -> 100%) con rollback inmediato a n8n por flag.

## Alternativas consideradas
1. Mantener n8n como motor principal.
2. Reemplazo total en una sola fase (big-bang).
3. Adoptar broker de colas dedicado desde el primer PR.

## Consecuencias
- Se agrega un servicio critico nuevo (`automation-go`) y complejidad temporal por coexistencia.
- Se gana control directo de seguridad, resiliencia e instrumentacion de automatizaciones.
- Se requieren nuevas tablas SQL, runbooks, alertas y checklist de revision para PRs de migracion.

## Impacto
- Modulos: `apps/web`, nuevo `apps/automation-go`, `infra/migrations`.
- APIs: BFF mantiene contratos publicos y delega ejecucion a API interna Go.
- Datos: esquema/logica `automation` para jobs, idempotencia por tenant (`scope + tenant + key`), attempts, DLQ y auditoria.
- Seguridad: auth S2S obligatoria, rotacion de claves, rate limiting y logs sanitizados.
- Performance: procesamiento asincrono con control de reintentos para reducir fallos intermitentes.

## Plan de adopcion
1. PR1: ADR, checklist y runbook de cutover.
2. PR2: bootstrap de `automation-go`, health checks, auth JWT S2S y enqueue idempotente.
3. PR3: migraciones SQL base para jobs, DLQ y auditoria.
4. PR4-PR9: implementacion de workers por workflow, observabilidad completa y cutover gradual.
5. PR10: decomision de n8n para workflows CronoStudio.

## Referencias
- `docs/decisions/0002-architecture-governance.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/OBSERVABILITY.md`
- `docs/DEPLOY_AUTOMATION.md`
- `docs/runbooks/03-go-backend-cutover.md`
