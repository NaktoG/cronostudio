# OPENCLAW Handoff - Estado Actual de CronoStudio

Ultima actualizacion: 2026-04-05

## 1) Estado real del repositorio (importante)

- Este proyecto esta actualmente en entorno local, no en estado final de release.
- Branch local actual: `develop`.
- Remote principal: `origin` -> `https://github.com/NaktoG/cronostudio`.
- Divergencia remota entre ramas: `origin/main...origin/develop = 7/5` (main ahead 7, develop ahead 5).
- Hay cambios locales sin commit al momento de este handoff (codigo y documentacion).

### Cambios locales sin commit detectados en esta sesion

- Build fix Next.js + TypeScript en web:
  - `apps/web/middleware.ts` eliminado (reexport de `config` incompatible con Next.js).
  - `apps/web/src/app/ai/page.tsx` ajustado para tipado seguro (`unknown`).
  - `apps/web/src/app/api/thumbnails/route.ts` validacion de `status` en query.
  - `apps/web/src/app/seo/page.tsx` normalizacion de strings con type guards.
- Reorganizacion documental:
  - Documentos de sesion/auditoria historica movidos a `docs/historical/`.
  - Nuevo documento maestro: este archivo.

## 2) Objetivo del sistema

CronoStudio es una suite local-first para operacion editorial y produccion de contenido YouTube:

- Planeacion y pipeline (ideas, guiones, producciones, miniaturas, SEO).
- Integracion OAuth YouTube + ingesta de metricas.
- Automatizaciones internas migradas progresivamente de n8n hacia workers Go (`automation-go`).

## 3) Arquitectura y componentes

### Monorepo

- `apps/web`: Next.js App Router (frontend + API BFF).
- `apps/automation-go`: API interna + worker + scheduler para jobs de automatizacion.
- `infra/docker`: stack local (PostgreSQL, Redis, Adminer, Mailpit opcional, legacy n8n opcional).
- `infra/migrations`: migraciones SQL versionadas.
- `docs`: documentacion canónica e historica.

### Patrón de capas (web)

- `src/app`: UI y rutas API.
- `src/application`: servicios/casos de uso.
- `src/domain`: entidades y contratos.
- `src/infrastructure`: repositorios Postgres y adaptadores.

## 4) Estado de automatizacion (n8n -> Go)

- Estrategia de migracion por PRs documentada en `docs/ROADMAP.md` y ADR `docs/decisions/0003-go-backend-migration.md`.
- `automation-go` ya cubre enqueue + worker + scheduler + DLQ para flujos iniciales.
- n8n queda en modo legacy/rollback (desactivado por defecto en operacion local recomendada).

## 5) API real vigente (fuente desde codigo)

Fuente de verdad de endpoints: `apps/web/src/app/api/**/route.ts`.

Inventario actual detectado:

```text
/api/ai/profiles
/api/ai/runs
/api/ai/runs/[id]/apply
/api/ai/runs/[id]/submit
/api/ai/runs/execute
/api/analytics
/api/analytics/channel/[channelId]
/api/analytics/video/[videoId]
/api/auth/login
/api/auth/logout
/api/auth/me
/api/auth/password
/api/auth/profile
/api/auth/refresh
/api/auth/register
/api/auth/request-password-reset
/api/auth/resend-verification
/api/auth/reset-password
/api/auth/verify-email
/api/automation-runs
/api/channels
/api/collaborators
/api/collaborators/accept
/api/collaborators/invites
/api/contact
/api/csp-report
/api/discipline/publish
/api/discipline/weekly
/api/google/oauth/callback
/api/google/oauth/start
/api/health
/api/ideas
/api/integrations/youtube/analytics/video
/api/integrations/youtube/callback
/api/integrations/youtube/connect
/api/integrations/youtube/diagnostics
/api/integrations/youtube/disconnect
/api/integrations/youtube/reconcile/weekly
/api/integrations/youtube/status
/api/integrations/youtube/sync/channels
/api/integrations/youtube/sync/videos
/api/integrations/youtube/videos/recent
/api/internal/automation/youtube/analytics/ingest-daily
/api/internal/automation/youtube/sync/channels
/api/internal/automation/youtube/sync/videos
/api/oauth/settings
/api/productions
/api/productions/publish
/api/scripts
/api/seo
/api/thumbnails
/api/videos
/api/videos/[id]
/api/weekly-goals
/api/weekly-plan/generate
/api/weekly-status
```

## 6) Seguridad y autenticacion

- Autenticacion principal en web: cookies httpOnly (`access_token`, `refresh_token`).
- JWT tambien se usa para flujos de servicio internos.
- Rate limiting via Redis o memoria segun entorno.
- Validacion de input con Zod en rutas criticas.
- OAuth YouTube soporta configuracion principal y fallback legacy de variables.

Documentos base:

- `docs/SECURITY.md`
- `docs/OBSERVABILITY.md`
- `docs/INTEGRATIONS_YOUTUBE.md`

## 7) Variables de entorno clave

Plantillas:

- `apps/web/.env.example`
- `infra/docker/.env.example`

Criticas para operar:

- `JWT_SECRET`
- `DATABASE_URL` o `POSTGRES_*` equivalentes
- `CRONOSTUDIO_WEBHOOK_SECRET` (si se usan webhooks internos)
- `CRONOSTUDIO_SERVICE_USER_ID` o `CRONOSTUDIO_SERVICE_USER_EMAIL`
- OAuth YouTube/Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (con fallback `YOUTUBE_OAUTH_*`)
- `YOUTUBE_TOKEN_ENCRYPTION_KEY`

## 8) Ejecucion local recomendada

1. Levantar infraestructura:

```bash
./scripts/local_up.sh
```

2. Aplicar migraciones:

```bash
./scripts/migrate.sh
```

3. Levantar web:

```bash
cd apps/web
npm install
npm run dev
```

4. Validar build:

```bash
cd apps/web
npm run build
```

## 9) Estado documental canónico

Leer en este orden:

1. `docs/OPENCLAW_HANDOFF.md` (este archivo)
2. `docs/SETUP.md`
3. `docs/ARCHITECTURE.md`
4. `docs/API.md` (referencia funcional; contrastar con rutas reales)
5. `docs/SECURITY.md`
6. `docs/RUNBOOK.md`
7. `docs/ROADMAP.md`

Documentacion historica y de sesiones fue movida a `docs/historical/` para evitar ruido operativo.

## 10) Riesgos y notas para OpenClaw

- No asumir que `main` refleja el estado de desarrollo mas reciente: revisar `develop` y working tree local.
- `docs/API.md` contiene secciones utiles, pero puede estar atrasado respecto a endpoints y contratos reales; priorizar codigo fuente en `apps/web/src/app/api`.
- Hay deprecacion de middleware en Next 16 hacia `proxy`; no bloquea build actual, pero conviene planificar migracion.

## 11) Definicion de "estado actual"

Para esta transferencia, "estado actual" significa:

- Codigo en el workspace local de esta maquina.
- Branch activa `develop`.
- Incluye cambios aun no comiteados.

Si se va a entrenar o analizar con OpenClaw, exportar desde este estado local o consolidar primero en commits y PR.
