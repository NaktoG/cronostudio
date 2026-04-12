# Seguridad (Estado Actual)

Este documento describe el estado actual de seguridad de CronoStudio (Atonix).

## Controles implementados
- **Autenticación**: JWT + refresh tokens.
- **Cookies seguras**: HTTPOnly + SameSite.
- **Rate limiting**: Redis o memoria (según entorno).
- **Validación de input**: Zod en endpoints críticos.
- **Headers de seguridad**: CSP report-only, CORS explícito, X-Frame-Options.
- **OAuth YouTube**: refresh automático y tokens cifrados en DB.
- **Logging**: redacción de campos sensibles.

## Plan de hardening
- CSP estricta en modo report-only → enforcement.
- Revisión periódica de permisos y scopes.
- Rotación de secretos y keys.
- Fase 2 (pendiente, priorizada para mas tarde): eliminar `unsafe-inline` de `style-src`, activar Trusted Types y agregar pruebas automáticas de regresión CSP.

## Controles obligatorios para migracion n8n -> Go
- **Auth servicio-a-servicio**: JWT asimetrico Ed25519 entre BFF y `automation-go` con `iss`, `aud`, `exp`, `kid` y `scope` obligatorios.
- **Autorizacion de tenant**: el token debe autorizar explicitamente el `tenantUserId` del enqueue (`tenantUserId` o `tenantIds` en claims).
- **Rotacion de claves**: politica de rotacion por `kid` con ventana de convivencia controlada.
- **Red interna**: `automation-go` no se expone publicamente; acceso solo por red privada y allowlist.
- **Idempotencia**: operaciones de enqueue deben exigir `Idempotency-Key` y deduplicacion persistida (en staging/prod usar `AUTOMATION_DB_URL`).
- **Rate limiting**: en PR2 se aplica por IP y por tenant/workflow en enqueue; en fases siguientes se endurece por actor y endpoint.
- **Logs seguros**: prohibido loguear JWT, refresh tokens o secretos; mantener redaccion activa.

## Auditorías históricas
- [SECURITY_AUDIT (2026-01-23)](historical/SECURITY_AUDIT_2026-01-23.md) (histórico)
