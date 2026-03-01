# YouTube OAuth (Read-only)

## Requisitos
- Tener un OAuth Client configurado en Google Cloud Console.
- Redirect URI exacto: `http://localhost:3000/api/integrations/youtube/callback`.

## Variables de entorno (local)
Agregar en `apps/web/.env.local`:

```
YOUTUBE_OAUTH_CLIENT_ID=...
YOUTUBE_OAUTH_CLIENT_SECRET=...
YOUTUBE_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/youtube/callback
YOUTUBE_TOKEN_ENCRYPTION_KEY=BASE64_32_BYTES
YOUTUBE_OAUTH_SCOPES=https://www.googleapis.com/auth/youtube.readonly
```

Notas:
- `YOUTUBE_TOKEN_ENCRYPTION_KEY` debe ser estable. Si se rota, se deben reautorizar cuentas para regenerar tokens.
- El scope es solo lectura.

## Conectar
1) Abrir en navegador:
   - `/api/integrations/youtube/connect`
2) Autorizar en Google.
3) El callback guardará tokens cifrados y redirigirá a `/?youtube=connected`.
4) Verificar estado:
   - `GET /api/integrations/youtube/status`

## Desconectar
- `POST /api/integrations/youtube/disconnect`
- Confirmar con `GET /api/integrations/youtube/status`.

## Refresh token
Google puede no devolver `refresh_token` si ya se autorizó antes.
Si no llega en el callback y no existe uno previo, hay que re-consentir:
- Asegurar `prompt=consent` (ya aplicado)
- Desconectar y repetir el flujo

## Rotación de encryption key
Si se rota `YOUTUBE_TOKEN_ENCRYPTION_KEY`, los tokens cifrados existentes no podrán descifrarse.
Solución: desconectar y reconectar para regenerar tokens cifrados con la nueva clave.
