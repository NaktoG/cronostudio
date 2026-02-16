# Fase 2 - Checklist de Validacion y Endurecimiento

Objetivo: validar y endurecer el sistema actual sin cambiar arquitectura base.

## Deploy Automatico
- [ ] Secrets configurados en GitHub (ver `docs/DEPLOY_AUTOMATION.md`)
- [ ] `DEPLOY_CMD` definido si se requiere `up.sh`
- [ ] Confirmar que el deploy no depende de tunel local

## Staging
- [ ] Carpeta y `.env` separados para staging
- [ ] Dominio de staging configurado en Caddy/Nginx
- [ ] Deploy manual via workflow `Deploy` con `environment=staging`

## Backups
- [ ] Script `scripts/hetzner/backup.sh` instalado en el VPS
- [ ] Cron activo (ver `/etc/cron.d/cronostudio-backup`)
- [ ] Verificar archivos en `/var/backups/cronostudio`

## Webhook Security
- [ ] Definir `CRONOSTUDIO_WEBHOOK_SECRET` en CronoStudio
- [ ] Configurar header `x-cronostudio-webhook-secret` en n8n
- [ ] Probar POST/PUT a `/api/automation-runs`

## Smoke Test
- [ ] `scripts/smoke_test.sh` en local o staging
- [ ] `/api/health` retorna `healthy`
- [ ] `/api/auth/login` retorna `400` con payload invalido
