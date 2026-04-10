# Checklist de revision - Migracion Go

## Arquitectura
- [ ] El PR referencia `docs/decisions/0003-go-backend-migration.md`.
- [ ] Se respetan los limites Web/BFF publico + servicio Go interno privado.
- [ ] Incluye estrategia de coexistencia n8n+Go y rollback por feature flag.

## Seguridad
- [ ] Auth S2S con JWT Ed25519 validada (`iss`, `aud`, `exp`, `kid`, `scope`).
- [ ] No hay secretos en repo ni en logs.
- [ ] Rate limiting y validacion estricta de payload en endpoints internos.
- [ ] Se registra auditoria de enqueue, replay y acciones operativas.

## Datos
- [ ] Idempotencia persistida con constraint unica (`scope`, `tenant_user_id`, `idempotency_key`).
- [ ] Migraciones siguen estrategia expand/contract, sin cambios destructivos.
- [ ] Existe backup previo y plan de restore validado.

## Resiliencia
- [ ] Politica de retries definida por tipo de error.
- [ ] DLQ operable con replay controlado.
- [ ] No se reintenta en errores no transitorios (validacion/auth/conflict).

## Observabilidad
- [ ] Logs estructurados con `requestId` y, cuando aplique, `traceId`.
- [ ] Metricas de exito/error/retry/DLQ instrumentadas.
- [ ] Alertas minimas configuradas para degradacion y crecimiento de DLQ.

## Deploy y operacion
- [ ] Feature flags por workflow para canary (`10% -> 50% -> 100%`).
- [ ] Criterios de rollback definidos y probados en staging.
- [ ] Runbooks actualizados (`RUNBOOK.md` y `runbooks/03-go-backend-cutover.md`).
