# QA - Flujo de autenticacion

Checklist para validar registro, verificacion y recuperacion de cuenta.

## Pre-requisitos
- Migraciones aplicadas: `./scripts/db_migrate.sh`
- SMTP configurado en `infra/docker/.env` (o se usaran logs y no se enviara email real)
- App corriendo: `npm run dev` en `apps/web`

## Registro + verificacion de email
1. Ir a `/register` y crear cuenta con email valido.
2. Verificar que la API responda 201 y devuelva `token` + `refreshToken`.
3. Revisar email recibido y abrir el link `/verify-email?token=...`.
4. Confirmar que la pagina muestre "Email verificado".
5. Confirmar en DB: `email_verified_at` no es null.

## Login + refresh token
1. Ir a `/login` y autenticarse.
2. Confirmar acceso al dashboard.
3. Borrar `cronostudio_token` de localStorage y recargar.
4. Confirmar que se renueva sesion usando `refreshToken`.

## Logout
1. Ejecutar logout (o borrar token desde UI si aplica).
2. Confirmar que ya no hay acceso a rutas protegidas.

## Recuperacion de contrasena
1. Ir a `/forgot-password` y solicitar reset.
2. Abrir el link `/reset-password?token=...`.
3. Definir nueva contrasena y confirmar exito.
4. Intentar login con contrasena nueva.

## Reenvio de verificacion
1. Ir a `/resend-verification`.
2. Enviar email con cuenta no verificada.
3. Abrir link de verificacion y confirmar.

## Endpoints clave (curl)
```bash
curl -s -X POST http://localhost:3000/api/auth/request-password-reset \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com"}'

curl -s -X POST http://localhost:3000/api/auth/resend-verification \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com"}'
```
