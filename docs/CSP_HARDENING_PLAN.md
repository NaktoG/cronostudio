# CSP HARDENING PLAN (NO BREAKING)

## Objetivo
Eliminar gradualmente `unsafe-inline` en `style-src` sin romper UI ni builds.

## Estado actual
- CSP configurable via env en `apps/web/src/lib/config.ts`.
- `style-src` incluye `unsafe-inline` por compatibilidad.

## Fase 0 (observacion)
- [ ] Auditar inline styles y librerias que lo requieren.
- [ ] Listar rutas criticas y validar render (dashboard, ai, publish, auth).

## Fase 1 (preparacion)
- [ ] Activar CSP report-only en staging (`CSP_REPORT_ONLY=true`).
- [ ] Verificar reportes en `/api/csp-report`.
- [ ] Agregar soporte para nonces en `style-src` (si se usan estilos inline controlados).
- [ ] Documentar flag de rollback rapido via env.

## Fase 2 (prueba controlada)
- [ ] Activar CSP mas estricta solo en entorno staging.
- [ ] Validar que no hay bloqueos de estilos.

## Fase 3 (produccion)
- [ ] Remover `unsafe-inline` en prod.
- [ ] Monitorear errores de CSP y UI.

## Criterios de salida
- No hay errores en consola relacionados a CSP.
- UI renderiza igual en desktop y mobile.
- Tests pasan sin cambios.
