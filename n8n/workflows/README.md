# Workflows n8n (CronoStudio)

## Requisitos
- n8n corriendo en Docker (`http://localhost:5678`).
- API de CronoStudio levantada en `http://localhost:3000`.
- YouTube Data API v3 key (para datos publicos).

## Variables de entorno (contenedor n8n)
Configurar en `infra/docker/.env` y reiniciar n8n:

- `CRONOSTUDIO_API_BASE_URL` (ej: `http://host.docker.internal:3000/api`)
- `CRONOSTUDIO_EMAIL`
- `CRONOSTUDIO_PASSWORD`
- `CRONOSTUDIO_WEBHOOK_SECRET` (opcional, recomendado)
- `YOUTUBE_API_KEY`
- `YOUTUBE_ANALYTICS_ACCESS_TOKEN` (Bearer token OAuth2)
- `YOUTUBE_CHANNEL_IDS` (IDs separados por coma)

> Seguridad y hardening: ver `docs/n8n/SECURITY.md`.

## Workflows incluidos
1) `cronostudio-sync-channels.json`
   - Importa canales por IDs (YouTube Data API) y los crea en CronoStudio.
   - Evita duplicados comparando `youtube_channel_id` existentes.

2) `cronostudio-sync-videos.json`
   - Toma canales de CronoStudio y crea videos recientes desde YouTube.
   - Evita duplicados comparando `youtube_video_id` existentes.

3) `cronostudio-ingest-analytics-daily.json`
   - Registra vistas diarias (views) por video.
   - Usa YouTube Analytics API para `watchTimeMinutes` y `avgViewDurationSeconds`.
   - Procesa en lotes para reducir fallas.

4) `demo-my-first-ai-agent-in-n8n.json`
   - Workflow de ejemplo (plantilla oficial de n8n) usando LangChain/OpenAI.
   - Sirve para probar agentes y no depende de CronoStudio.

## Exportar workflows desde producción
1. Desde el repo `ansible/` ejecutar:
   ```bash
   ansible vps -m shell -a "docker exec postgres_platform psql -U n8n_user -d n8n_db -At -c "SELECT row_to_json(t) FROM workflow_entity t;"" > n8n/workflows/workflows_dump.json
   ```
2. Convertir cada línea del dump en archivos individuales (ya hay un script auxiliar en `n8n/workflows` que hace este parseo, ver `export_workflows` pasos en README del repositorio).
3. Sustituir los JSON existentes si hubo cambios y eliminar `workflows_dump.json`.

> También puedes usar la UI de n8n (`Download` en cada workflow), pero el método anterior garantiza export completo con IDs y metadatos.

## Backups
- El script `scripts/hetzner/backup.sh` se ejecuta diariamente (cron `0 2 * * *`) y guarda:
  - Dump de Postgres (`/home/deploy/backups/postgres/…`)
  - Snapshot de `/home/deploy/agentos/projects/n8n/data` (`/home/deploy/backups/n8n/…`)
- Verifica los archivos tras cada deploy: `ls /home/deploy/backups/{postgres,n8n}` en el VPS.

## Operación diaria
- **Rotar Basic Auth:** usa `./scripts/n8n/rotate-basic-auth.sh <user> <password>` para generar la nueva entrada `htpasswd` y actualizar el `.env`. La misma credencial protege `https://n8n.atonixdev.com/` y `/adminer`.
- **Resetear owner:** si se pierde acceso a la UI, ejecuta `./scripts/n8n/reset-owner.sh correo@example.com` para obtener un enlace temporal de recuperación.

## Tracking de ejecuciones
Los workflows registran ejecuciones en `automation_runs` para mostrarlas en el dashboard y ahora emiten métricas (`automation.run.*`) para observabilidad.

Si `CRONOSTUDIO_WEBHOOK_SECRET` está definido en CronoStudio, los requests a la API deben incluir el header:
```
x-cronostudio-webhook-secret: <valor>
```

## Debug local de mapeos
Para probar los mapeos sin n8n:
```bash
node scripts/n8n_mapping_test.mjs
```

## Importar workflows
1. Abrir n8n: `http://localhost:5678`
2. Importar JSON desde esta carpeta.
3. Ejecutar en manual para validar.
4. Activar el workflow si todo funciona.

## Notas
- `YOUTUBE_CHANNEL_IDS` requiere IDs de canal, no URLs.
- Si no se resuelve `host.docker.internal`, usar la IP local del host.
- Para workflows diarios, asegúrate de que el cron interno de n8n (`Daily Trigger`) esté en timezone correcto (`TZ`).
