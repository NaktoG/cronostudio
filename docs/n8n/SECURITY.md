# Seguridad para n8n

Objetivo: evitar que los workflows expongan credenciales o accedan a CronoStudio sin controles.

## 1. Autenticación y acceso
- Habilitar `N8N_BASIC_AUTH_ACTIVE=true`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD` en `infra/docker/.env`.
- Para entornos públicos, exponer n8n sólo detrás de Nginx + Basic Auth + HTTPS (ver `docs/runbooks/02-hetzner-vps.md`).
- Nunca abrir el puerto 5678 a Internet sin proxy.

## 2. Variables sensibles
- Usar credenciales nativas de n8n (se almacenan cifradas con `N8N_ENCRYPTION_KEY`).
- Tokens como `CRONOSTUDIO_EMAIL`/`PASSWORD`, `YOUTUBE_API_KEY`, `YOUTUBE_ANALYTICS_ACCESS_TOKEN` deben configurarse vía env vars (ver `n8n/workflows/README.md`).
- Revisar los JSON exportados antes de commit: si contienen valores reales, rotar las credenciales inmediatamente.

## 3. Roles y permisos
- Crear una cuenta dedicada de CronoStudio para n8n (rol “Automation”) con permisos mínimos.
- Limitar `APP_BASE_URL` a HTTPS y validar que el token de sesión tiene vencimientos cortos.

## 3.1 Webhook secret (recomendado)
- Configurar `CRONOSTUDIO_WEBHOOK_SECRET` en el entorno de CronoStudio.
- En los requests desde n8n hacia la API, enviar el header `x-cronostudio-webhook-secret` con ese valor.
- Esto agrega una capa de protección adicional aunque el workflow use login/password.

## 4. Auditoría
- Habilitar logging de ejecuciones en la base de datos (`automation_runs`); los workflows incluidos ya lo hacen.
- Configurar notificaciones de error en n8n (ej. webhook a Slack) para saber cuando falla un workflow programado.

## 5. Backups
- Incluir `/home/node/.n8n` en los backups (ver `scripts/hetzner/backup.sh`). Esto contiene credenciales cifradas y configuraciones.
- Antes de restaurar un backup, rotar las credenciales (especialmente claves OAuth) si el VPS pudo estar comprometido.

## 6. Actualizaciones
- Mantener la imagen `n8nio/n8n` actualizada (`docker compose pull n8n`).
- Revisar changelog en cada upgrade mayor y probar en staging antes de producción.

## 7. Rotación de credenciales y acceso
- **Basic Auth para n8n/adminer (`n8n.atonixdev.com`):** corre `./scripts/n8n/rotate-basic-auth.sh <usuario> <password>` para generar la entrada `htpasswd`. Copia la línea resultante en `/etc/nginx/.adminer_htpasswd`, recarga Nginx (`sudo systemctl reload nginx`) y actualiza `infra/docker/.env`. Finalmente reinicia el contenedor `n8n`.
- **Reset del owner en la UI:** `./scripts/n8n/reset-owner.sh correo@example.com` ejecuta `n8n user-management:reset` dentro del contenedor (puedes lanzarlo vía SSH). Sigue el enlace que imprime el comando para elegir una contraseña nueva.
- Documenta cada rotación (quién, cuándo, por qué) y guarda los secretos en el gestor corporativo (Vault/1Password).

Cumpliendo estos pasos minimizamos el riesgo de comprometer los tokens que permiten automatizar el canal de YouTube.
