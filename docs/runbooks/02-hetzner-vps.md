# Runbook: Hetzner VPS (CronoStudio + n8n)

> Objetivo: dejar el VPS operativo sin depender de túneles manuales, con TLS automático, reverse proxy estable y tareas de backup/monitoreo.

## 1. Arquitectura

```
Internet
   │
 ┌─HTTPS (80/443)
 │
 │  Nginx (host)
 │    ├─ proxy → CronoStudio (Next.js, puerto 3000)
 │    ├─ proxy → n8n (puerto 5678)
 │    └─ proxy + basic auth → Adminer (puerto 8080)
 │
 │  Docker Compose (infra/docker/docker-compose.yml)
 │    ├─ Postgres 16 (127.0.0.1:5432)
 │    ├─ n8n
 │    └─ Adminer (solo para debug)
 │
 │  CronoStudio (apps/web)
 │    ├─ next build && next start
 │    └─ servicio systemd para reinicios automáticos
```

## 2. Preparación inicial

1. Crear usuario de servicio y carpeta:
   ```bash
   adduser --disabled-password --gecos "" cronostudio
   usermod -aG sudo cronostudio
   mkdir -p /opt/cronostudio && chown cronostudio:cronostudio /opt/cronostudio
   ```
2. Instalar dependencias base: `apt update && apt install -y git docker.io docker-compose-plugin nginx certbot python3-certbot-nginx ufw gnupg2 pass`.
3. Clonar repo en `/opt/cronostudio` y generar `.env` desde `infra/docker/.env.example` (reemplazar todos los `change_me` con valores reales, incluyendo `REDIS_URL`).
4. Habilitar Docker como servicio: `systemctl enable docker --now`.

## 3. Reverse Proxy con Nginx + TLS

1. Copiar el archivo `infra/nginx/cronostudio.conf` a `/etc/nginx/sites-available/cronostudio.conf`.
2. Ajustar los placeholders:
   - `server_name` → dominio real `cronostudio.example.com` y `n8n.example.com` (si se usa subdominio único, agregar bloques `location`).
   - `proxy_pass` apunta por defecto a `http://127.0.0.1:3000` (CronoStudio), `:5678` (n8n) y `:8080` (Adminer).
3. Habilitar sitio: `ln -s /etc/nginx/sites-available/cronostudio.conf /etc/nginx/sites-enabled/` y eliminar `default`.
4. Generar certificados: `certbot --nginx -d cronostudio.example.com -d n8n.example.com`. Certbot añadirá bloques `ssl_certificate` y renovará automáticamente.
5. Reiniciar Nginx: `systemctl reload nginx`. La configuración incluye:
   - Cabeceras seguras (`Strict-Transport-Security`, `X-Frame-Options`, etc.).
   - `proxy_set_header Host` para conservar SNI.
   - Básica para Adminer (`auth_basic` con htpasswd en `/etc/nginx/.adminer_htpasswd`).

### Basic Auth para Adminer

```bash
printf "admin:$(openssl passwd -apr1)" | sudo tee /etc/nginx/.adminer_htpasswd
```
Actualiza las credenciales cuando sea necesario.

### Rotación de credenciales para n8n

> `n8n.atonixdev.com` y `/adminer` comparten el mismo archivo `/etc/nginx/.adminer_htpasswd`.

1. Genera las nuevas credenciales localmente:
   ```bash
   ./scripts/n8n/rotate-basic-auth.sh nuevo_usuario nueva_password
   ```
   Copia la entrada `htpasswd` resultante al VPS (`/etc/nginx/.adminer_htpasswd`) y recarga Nginx (`sudo systemctl reload nginx`).
2. Actualiza `infra/docker/.env` (valores `N8N_BASIC_AUTH_*`) y reinicia el contenedor: `docker compose -f infra/docker/docker-compose.yml up -d n8n`.
3. Si necesitas resetear el usuario owner de n8n, ejecuta `./scripts/n8n/reset-owner.sh owner@example.com` (local o vía SSH). Sigue el enlace temporal que devuelve el comando.

## 4. Servicios de aplicación

### Docker Compose (Postgres + n8n + Adminer)

```
cd /opt/cronostudio/infra/docker
docker compose pull
docker compose up -d
```

Verificar `docker ps` para los tres contenedores.

### CronoStudio (Next.js)

1. Instalar dependencias en `/opt/cronostudio/apps/web`: `npm ci && npm run build`.
2. Crear servicio systemd `cronostudio-web.service`:
   ```ini
   [Unit]
   Description=CronoStudio Next.js
   After=network.target docker.service

   [Service]
   Type=simple
   WorkingDirectory=/opt/cronostudio/apps/web
   Environment=NODE_ENV=production
   ExecStart=/usr/bin/npm run start
   Restart=always
   User=cronostudio

   [Install]
   WantedBy=multi-user.target
   ```
3. `systemctl enable --now cronostudio-web`.

## 5. Firewall y acceso seguro

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Opcional: abrir 8080 solo desde IP específica (`ufw allow from <IP> to any port 8080`).

## 6. Backups Automatizados

Script `scripts/hetzner/backup.sh` (incluido en repo) realiza:

- `pg_dump` comprimido en `/var/backups/cronostudio/postgres/YYYYMMDD.sql.gz`.
- Exportación de workflows n8n (carpeta `.n8n/`).
- Rotación simple (mantiene 7 días por defecto).

### Instalación

1. Copiar script a `/usr/local/bin/cronostudio-backup` y dar permisos (`chmod +x`).
2. Crear cron diario 02:00:
   ```bash
   echo "0 2 * * * cronostudio /usr/local/bin/cronostudio-backup" | sudo tee /etc/cron.d/cronostudio-backup
   ```
3. (Opcional) Sincronizar backups a Object Storage: editar script para ejecutar `rclone copy /var/backups/cronostudio remote:cronostudio-backups`.

## 7. Monitoreo y salud

- Crear `systemd` timer que ejecute `docker ps` + `curl http://127.0.0.1:3000/api/health` y envíe alerta (Slack/Telegram).
- Agregar `fail2ban` con jail `nginx-http-auth` para bloquear intentos de fuerza bruta al basic auth.
- Usar `uptime-kuma` o `Hetzner Monitoring` para ping externos a los dominios.

## 8. Troubleshooting común

| Problema | Solución |
|----------|----------|
| HTTPS cae después de renovar cert | `systemctl reload nginx`; revisar `/var/log/letsencrypt/letsencrypt.log` |
| Nginx muestra bad gateway | verificar `systemctl status cronostudio-web` o `docker logs cronostudio-n8n` |
| Adminer inaccesible | revisar `auth_basic` y `ufw`; si se expone sólo por túnel, comentar bloque `allow 127.0.0.1` |
| Docker contenedores no arrancan en boot | crear `systemd` unit `cronostudio-compose.service` que ejecute `docker compose up -d` |

## 9. Checklist post-deploy

1. `curl -I https://cronostudio.example.com` → 200 y cabeceras de seguridad.
2. `curl -I https://n8n.example.com` → 200 con `Basic realm="n8n"` si se habilita auth.
3. `docker exec cronostudio-postgres psql -U postgres -c "SELECT 1"`.
4. `/usr/local/bin/cronostudio-backup --test` genera dump.
5. Revisar `/var/log/nginx/error.log` y `/var/log/cronostudio-web.log` (si se configura) en busca de errores.

Con esto el VPS queda accesible sin depender de túneles manuales y con procesos de seguridad/backup documentados.
