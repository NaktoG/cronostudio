# Roadmap (Now / Next / Later)

## Now
- Migración por PRs de automatizaciones: n8n -> backend Go interno (PR1-PR10).
- Coexistencia controlada n8n+Go con cutover por feature flags.
- Hardening de seguridad S2S (JWT Ed25519), idempotencia y retries + DLQ.
- Decomisión n8n por defecto (operación legacy solo para rollback controlado).
- Onboarding y documentación profesional (ES/EN).
- QA mínimo para auth, ideas y producciones.

## Estado PRs Migración Go

- PR1: ADR y guardrails de migración.
- PR2: bootstrap `automation-go` + auth S2S + enqueue.
- PR3: esquema SQL base (`automation_job_queue`, idempotencia, attempts, DLQ).
- PR4: worker shadow con lease/heartbeat/retry pipeline.
- PR5: handler real `youtube.sync.channels`.
- PR6: handler real `youtube.sync.videos`.
- PR7: scheduler + `youtube.analytics.ingest.daily`.
- PR8: observabilidad operativa worker/scheduler.
- PR9: cutover gradual (10/50/100) + kill switch global.
- PR10: decommission n8n por defecto + rollback legacy documentado.

## Criterios de cierre de migración

- Jobs críticos en `automation-go` con SLO estable.
- DLQ bajo umbral operativo definido.
- n8n apagado por defecto en todos los entornos.
- Runbooks y docs actualizados y consistentes.

## Next
- Editor de guiones avanzado con plantillas.
- Panel de rendimiento con insights semanales.
- Integraciones adicionales (Instagram/TikTok).
- Internacionalizacion completa de la app (ES/EN) con selector de idioma, rutas/locales y textos traducidos en UI + emails.

## Later
- Multi‑tenant para agencias.
- Automatizaciones avanzadas con IA (sugerencias SEO + thumbnails).
- Exportación y reporting PDF.
- Hardening de seguridad fase 2 (post-online): CSP estricta sin `unsafe-inline` en estilos, Trusted Types, SRI en assets criticos y pruebas E2E de seguridad.
