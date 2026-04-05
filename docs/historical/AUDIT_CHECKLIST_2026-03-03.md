# AUDITORIA - ESTADO Y MEJORAS (2026-03-03)

## Objetivo
Tener una fotografia clara del estado actual y un checklist de mejoras sin romper el flujo actual.

## Estado actual (resumen)
- Frontend y API estan consolidadas en `apps/web/src/app` y `apps/web/src/app/api`.
- Testing con Vitest activo y suite amplia en `apps/web/src/__tests__`.
- Seguridad base activa: CSP/headers, rate limiting, CORS, RBAC y validacion Zod.

## Riesgos identificados
- CSP permite `unsafe-inline` en `style-src`, reduce proteccion ante inyecciones.
- CSRF no esta explicitamente reforzado (mitigado por SameSite=Strict).
- Falta cobertura e2e para flujos criticos (auth y publish).

## Checklist de mejoras (prioridad)

### P0 - Seguridad (sin romper)
- [ ] Revisar CSP y plan de migracion a nonces/hashes sin `unsafe-inline`.
- [ ] Documentar politica CSRF y condiciones para SameSite.
- [ ] Verificar que todos los endpoints usan wrappers de auth + rate limit.

### P1 - Testing
- [ ] Agregar una smoke suite e2e minima (login, dashboard, publicar).
- [ ] Definir matriz de pruebas por modulo (ideas/scripts/seo/thumbnails).

### P2 - Frontend / DX
- [ ] Revisar consistencia de empty/loading states.
- [ ] Auditar accesibilidad basica (labels, focus, contrast).
- [ ] Consolidar patrones de data fetching en UI.

## Quick wins (1-2 dias)
- [ ] Documentar CSP actual y checklist de endurecimiento.
- [ ] Agregar una pagina de checklist QA ejecutable por release.

## Mediano plazo (2-4 semanas)
- [ ] E2E con Playwright y pipelines en CI.
- [ ] Observabilidad frontend (performance budgets).
- [ ] Security regression tests (CORS/RBAC/rate-limit).

## Notas
- Mantener cambios reversibles y sin impacto en UI existente.
- Cualquier hardening de CSP requiere plan de despliegue gradual.
