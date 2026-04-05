# CronoStudio - Session Context (2026-03-07)

## Estado general
- Rama: `develop`
- Ultimo commit: `19bc9183f0a46a01edc6b92d7979e4a80a02a5d1`
- Mensaje: `feat: add per-user oauth settings and harden app behavior`
- Working tree limpio: si

## Objetivo principal
1) Auditar y corregir errores runtime, endurecer seguridad y comportamiento local/prod.
2) Resolver problemas de OAuth YouTube (redirect mismatch, cuenta incorrecta, salir de la app).
3) Implementar configuracion tipo n8n para credenciales OAuth por usuario (con cifrado).
4) Documentar y preparar UX para conectar YouTube desde la app sin salir.

## Resultados clave
- App ya no se cae por `AbortError` y `runs.map`.
- Conectar YouTube abre popup y no saca de la app.
- Se corrigio `redirect_uri_mismatch` y ahora el redirect se calcula por origen.
- Se agrego configuracion OAuth por usuario con secrets cifrados en DB.
- Se agrego UI en Configuracion para cargar Client ID/Secret/Redirect/Scopes + boton de prueba.

## Cambios principales (resumen)
### Fixes runtime
- Normalizacion de arrays en fetch (evita `.map` sobre no-array).
  - `apps/web/src/app/ai/services/aiStudioService.ts`
  - `apps/web/src/app/analytics/page.tsx`
  - `apps/web/src/app/thumbnails/page.tsx`
  - `apps/web/src/app/channels/page.tsx`
- Abort handling en hooks:
  - `apps/web/src/app/hooks/useChannels.ts`
  - `apps/web/src/app/start/page.tsx`
  - `apps/web/src/app/seo/hooks/useSeoData.ts`

### Seguridad / Hardening
- Links de verificacion/reset solo en local via `ALLOW_DEBUG_LINKS`.
  - `apps/web/src/app/api/auth/register/route.ts`
  - `apps/web/src/app/api/auth/request-password-reset/route.ts`
  - `apps/web/src/app/api/auth/resend-verification/route.ts`
- Se dejo de escribir `refresh_token` en `channels`.
  - `apps/web/src/app/api/channels/route.ts`
  - `apps/web/src/lib/validation.ts`
- Health endpoint oculta detalles en prod y usa logger:
  - `apps/web/src/app/api/health/route.ts`
- Se reemplazo `console.*` en APIs y DB por `logger.*`.

### Rate limit y CSP
- Rate limit: por defecto NO se aplica en non-prod, se activa con `RATE_LIMIT_ENFORCE=true`.
- Limites configurables por env:
  - `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`,
  - `RATE_LIMIT_LOGIN_MAX_REQUESTS`, `RATE_LIMIT_LOGIN_WINDOW_MS`,
  - `RATE_LIMIT_FILE_MAX_REQUESTS`, `RATE_LIMIT_FILE_WINDOW_MS`.
  - `apps/web/src/middleware/rateLimit.ts`, `apps/web/.env.example`
- CSP para HTML agregado via middleware de Next (report-only en local por defecto).
  - `apps/web/src/middleware.ts`
- CSP baseline tambien agregado en nginx:
  - `infra/nginx/cronostudio.conf`

### OAuth YouTube (flujo + configuracion)
- Se agrego store de OAuth client por usuario con cifrado (AES-256-GCM) usando key dedicada.
- OAuth flow usa config por usuario si existe, con fallback a env.
- Se corrige `redirect_uri_mismatch` usando redirect basado en origen actual y/o config almacenada.
- Se agrego popup OAuth y polling para no salir de la app.

## Nuevos modulos / arquitectura (SOLID)
- Entidad:
  - `apps/web/src/domain/entities/OAuthClientSetting.ts`
- Repositorio:
  - `apps/web/src/domain/repositories/OAuthClientRepository.ts`
  - `apps/web/src/infrastructure/repositories/PostgresOAuthClientRepository.ts`
- Servicio:
  - `apps/web/src/application/services/OAuthClientService.ts`
- Factory:
  - `apps/web/src/application/factories/oauthClientServiceFactory.ts`
- Cifrado dedicado:
  - `apps/web/src/lib/crypto/oauthSecretBox.ts`

## API nueva
- `GET/PUT/DELETE /api/oauth/settings?provider=youtube`
  - Solo `owner`.
  - Secret nunca se devuelve.
  - Scopes validados (solo youtube.readonly + yt-analytics.readonly).
  - Redirect URI validado (mismo origen + termina en `/api/google/oauth/callback`).

## UI nueva
- Seccion "Integracion YouTube" en `Configuracion`.
  - Client ID / Client Secret / Redirect URI / Scopes
  - Botones: Guardar, Guardar y probar, Probar conexion, Restablecer
  - Badge: Fuente (user/env) + Configurado
  - Muestra redirect recomendado + boton copiar
  - Autocompleta redirect recomendado si vacio y actualiza si host cambia (sin pisar si el usuario lo edito)

## Flujo OAuth actualizado
- `connect`:
  - Usa config del usuario.
  - Calcula redirect seguro segun origen/config.
  - Guarda redirect en cookie `yt_oauth_redirect`.
- `callback`:
  - Usa redirect guardado para exchange.
  - Limpia cookies al finalizar.

## Migraciones
- Nueva migracion: `infra/migrations/202603060000__oauth_client_settings.sql`
  - FK a `app_users` (no `users`).
- Se ejecutaron todas las migraciones en el Postgres docker.
- Nota: se intento ejecutar via script local, pero `psql` no estaba instalado en host.
  - Se aplico via `docker exec`.

## DB / Docker
- Contenedores activos:
  - `cronostudio-postgres`, `cronostudio-redis`, `cronostudio-n8n`, `cronostudio-adminer`, `cronostudio-mailpit`
- DB usada:
  - host: `localhost:5432`
  - user: `cronostudio`
  - db: `cronostudio`

## Ajustes en .env.local (NO commiteados)
- `YOUTUBE_OAUTH_REDIRECT_URI` => `http://localhost:3000/api/google/oauth/callback`
- `OAUTH_CLIENT_SECRET_ENCRYPTION_KEY` agregado (base64 32 bytes)
- `YOUTUBE_OAUTH_CLIENT_ID/SECRET` ya estaban

## Datos sembrados
- Se insertaron registros en `oauth_client_settings` para usuarios existentes.
  - Provider: `youtube`
  - Redirect: `http://localhost:3000/api/google/oauth/callback`
  - Scopes: youtube.readonly + yt-analytics.readonly

## Problemas resueltos
- `AbortError` en `useChannels`.
- `runs.map is not a function` en AI Studio.
- 404 repetidos en integraciones YouTube (se retorno 204).
- `redirect_uri_mismatch` en Google OAuth.
- La app no sale al conectar YouTube (popup).

## Recomendaciones para continuar
1) Abrir Configuracion > Integracion YouTube y validar credenciales reales (si cambian).
2) Probar "Guardar y probar" para verificar OAuth.
3) Si hay problemas de scopes, revisar validacion backend y Google Cloud Console.
4) A mediano plazo: agregar endpoint de "test config" que valide scopes sin guardar.

## Archivos clave
- OAuth / Config:
  - `apps/web/src/app/configuracion/page.tsx`
  - `apps/web/src/app/api/oauth/settings/route.ts`
  - `apps/web/src/lib/youtube/oauth.ts`
  - `apps/web/src/app/api/integrations/youtube/connect/route.ts`
  - `apps/web/src/app/api/integrations/youtube/callback/route.ts`
- Seguridad:
  - `apps/web/src/app/api/health/route.ts`
  - `apps/web/src/middleware.ts`
  - `infra/nginx/cronostudio.conf`

## Notas operativas
- `psql` no esta instalado en host; migraciones se aplicaron via docker.
- Nunca commitear `.env.local`.
