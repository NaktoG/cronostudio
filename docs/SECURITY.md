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

## Auditorías históricas
- [SECURITY_AUDIT (2026-01-23)](historical/SECURITY_AUDIT_2026-01-23.md) (histórico)
