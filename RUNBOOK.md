# RUNBOOK: Operación diaria de CronoStudio

Guía rápida para tareas operacionales comunes: iniciar/detener servicios, troubleshooting, backups.

---

## ⚡ Quick Start (diario)

### Iniciar todo (primera vez del día)

```bash
cd cronostudio
cd infra/docker
docker compose up -d
cd ../../apps/web
npm run dev
```

Abre navegador:
- Frontend: `http://localhost:3000`
- n8n: `http://localhost:5678`
- PostgreSQL: `localhost:5432` (desde terminal o n8n UI)

### Detener todo (fin del día)

```bash
cd infra/docker
docker compose down  # preserva datos
```

Servicios se detienen pero PostgreSQL y n8n datos persisten en volúmenes Docker.

### Ver logs

```bash
cd infra/docker

# n8n
docker compose logs -f n8n

# PostgreSQL
docker compose logs -f postgres

# Ambos
docker compose logs -f

# Últimas 50 líneas sin seguimiento
docker compose logs --tail=50
```

Presiona `Ctrl+C` para salir.

---

## 📊 Monitoreo

### Estado de servicios

```bash
cd infra/docker
docker compose ps
```

Esperado:
```
NAME                  STATUS          PORTS
cronostudio-postgres  Up X minutes    0.0.0.0:5432->5432/tcp
cronostudio-n8n       Up X minutes    0.0.0.0:5678->5678/tcp
```

Si alguno está `Exited` → revisar logs: `docker compose logs <servicio>`

### Health checks

```bash
# PostgreSQL está respondiendo
docker exec cronostudio-postgres pg_isready -U postgres
# Esperado: accepting connections

# n8n está respondiendo
curl http://localhost:5678/healthz
# Esperado: HTTP 200
```

### Espacio en disco usado por Docker

```bash
docker system df
```

Muestra tamaño de imágenes, contenedores, volúmenes.

---

## 💾 Backups

### Backup manual de PostgreSQL (completo)

```bash
# Dump de toda la DB
docker exec cronostudio-postgres pg_dump -U postgres cronostudio > backup_$(date +%Y%m%d_%H%M%S).sql

# Resultado: backup_20260122_120000.sql (~varios MB)
```

**Guardar archivo en lugar seguro** (OneDrive, S3, GitHub con encrypt, etc.).

### Backup de volúmenes Docker (alternativa)

```bash
# Ver volúmenes
docker volume ls | grep cronostudio

# Backup de volumen PostgreSQL
docker run --rm -v cronostudio-postgres:/data -v $(pwd):/backup alpine tar czf /backup/postgres-volume.tar.gz /data

# Resultado: postgres-volume.tar.gz en directorio actual
```

### Restaurar backup (si es necesario)

```bash
# Restaurar DB desde SQL dump
docker exec -i cronostudio-postgres psql -U postgres cronostudio < backup_20260122_120000.sql

# O restaurar volumen (más invasivo):
docker compose down -v
docker run --rm -v cronostudio-postgres:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-volume.tar.gz -C /

docker compose up -d
```

**⚠️ NOTA**: Restaurar volumen requiere bajar y volver a levantar servicios.

### Automatizar backups (cron, opcional)

```bash
# Crear script backup.sh
#!/bin/bash
cd /ruta/a/cronostudio/infra/docker
docker exec cronostudio-postgres pg_dump -U postgres cronostudio > /backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql

# Agregar a crontab (cada día a las 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * bash /ruta/a/backup.sh") | crontab -
```

---

## 🛠️ Troubleshooting

### Problema: Puerto 5678 (n8n) ocupado

**Error:**
```
Error: bind: address already in use :::5678
```

**Soluciones:**

Opción 1: Ver qué usa el puerto
```bash
lsof -i :5678
# Muestra: COMMAND PID USER ...

# Matar proceso
kill -9 <PID>

# Reintentar
docker compose down
docker compose up -d
```

Opción 2: Cambiar puerto en `.env`
```bash
# infra/docker/.env
N8N_PORT=5679

docker compose down
docker compose up -d
# Ahora n8n en http://localhost:5679
```

### Problema: Puerto 5432 (PostgreSQL) ocupado

**Error:**
```
Error: bind: address already in use :::5432
```

**Solución**: (igual que arriba)
```bash
lsof -i :5432
kill -9 <PID>
docker compose down && docker compose up -d
```

Alternativa:
```bash
# En .env
POSTGRES_PORT=5433

docker compose down && docker compose up -d
```

### Problema: "Cannot connect to Docker daemon"

**Síntomas:**
```
error during connect: This error may indicate that the docker daemon is not running.
```

**Soluciones:**

- **macOS**: Abre Docker Desktop desde Applications
- **Linux**: `sudo systemctl start docker`
- **Windows + WSL2**: Inicia Docker Desktop desde menú Inicio

Verifica:
```bash
docker ps
docker compose --version
```

### Problema: PostgreSQL no responde

**Síntomas:**
```
psql: error: connection to server at "127.0.0.1", port 5432 failed
```

**Solución:**
```bash
# Reiniciar servicio
docker compose restart postgres

# Esperar 5 segundos
sleep 5

# Reintentar
docker exec -it cronostudio-postgres psql -U postgres -c "SELECT 1;"
```

### Problema: n8n no levanta (Exited)

**Síntomas:**
```
cronostudio-n8n   Exited (1)
```

**Solución:**
```bash
# Ver error
docker compose logs n8n

# Posibles causas:
# 1. N8N_ENCRYPTION_KEY inválida/faltante
# 2. PostgreSQL no está listo
# 3. Puerto ocupado

# Limpiar y reintentar
docker compose down
docker compose up -d

# Si persiste
docker compose down -v  # ⚠️ borra volúmenes
docker compose up -d
```

### Problema: "POSTGRES_PASSWORD is empty or too short"

**Error:**
```
Error response from daemon: ... POSTGRES_PASSWORD is empty or too short ...
```

**Solución:**
```bash
# Editar .env
nano infra/docker/.env

# Cambiar:
POSTGRES_PASSWORD=MiPasswordSeguro123!  # min 12 caracteres

# Guardar (Ctrl+O, Enter, Ctrl+X en nano)

docker compose down -v
docker compose up -d
```

### Problema: next.js dev server falla (Module not found)

**Error:**
```
Error: Can't resolve 'framer-motion'
```

**Solución:**
```bash
cd apps/web
npm install
npm run dev
```

### Problema: Base de datos vacía después de restore

**Síntomas**: Tables no existen después de restaurar backup.

**Solución**:
```bash
# Verificar que backup tiene la estructura
grep -i "CREATE TABLE" backup_20260122.sql

# Si tiene tablas, reintentar restore con verbose
docker exec -i cronostudio-postgres psql -U postgres cronostudio < backup.sql 2>&1 | head -20

# Si sigue vacío, crear schema manualmente
# (ver SETUP.md → Database schema)
```

---

## 🔄 Incidentes comunes

### Escenario: Cambié .env pero no se aplica

**Problema**: Cambié `POSTGRES_PASSWORD` en `.env` pero sigue usando la antigua.

**Causa**: Docker Compose cachea valores al levantar.

**Solución**:
```bash
cd infra/docker
docker compose down -v  # ⚠️ borra volúmenes (datos)
docker compose up -d
```

**Prevención**: Definir contraseña correcta ANTES de `docker compose up -d` inicial.

### Escenario: Volumen lleno de logs

**Síntoma**: Espacio en disco se llena rápido.

**Causa**: Logs de contenedores acumulados.

**Solución**:
```bash
# Ver tamaño
docker system df

# Limpiar logs viejos
docker system prune -a  # ⚠️ borra contenedores/imágenes sin usar

# O limitar logs de futuro en docker-compose.yml:
# services:
#   n8n:
#     logging:
#       driver: "json-file"
#       options:
#         max-size: "100m"
#         max-file: "3"
```

### Escenario: "connection refused" desde app web

**Síntoma**: Frontend no puede conectar a API.

**Causa**: Servidor web o contenedor n8n no está corriendo.

**Solución**:
```bash
# Verificar servicios
docker compose ps

# Si alguno está down
docker compose logs <servicio>
docker compose up -d

# Verificar API manualmente
curl http://localhost:3000/api/channels
# Debe devolver JSON o 200 OK
```

---

## 🔐 Seguridad

### Contraseña PostgreSQL

- Mínimo 12 caracteres
- Usar caracteres especiales: `!@#$%^&*`
- NO usar palabras comunes o datos personales
- Cambiar anualmente

```bash
# Generar password segura
openssl rand -base64 12
# Resultado: EjqP3KxL9mWq
```

### N8N_ENCRYPTION_KEY

- Generar UNA SOLA VEZ y guardar
- Si se pierde, no hay forma de recuperar credentials en n8n
- Generar con:

```bash
openssl rand -hex 32
# Resultado: a1b2c3d4e5f6...
```

### No versionear secretos

Verificar `.gitignore`:
```bash
git check-ignore -v infra/docker/.env
# Debe mostrar: .gitignore:XX:infra/docker/.env
```

Si por error commiteás secretos:
```bash
# Eliminar de histórico
git rm --cached infra/docker/.env
git commit --amend --no-edit
git push origin develop --force  # ⚠️ solo si no hay otros

# LUEGO cambiar contraseña en PostgreSQL
```

---

## 📈 Performance

### Monitora consumo

```bash
# CPU y RAM por contenedor
docker stats cronostudio-n8n cronostudio-postgres

# Presiona Ctrl+C para salir
```

Valores normales:
- **PostgreSQL**: 100-200 MB RAM en reposo, 300+ con queries complejas
- **n8n**: 200-400 MB RAM en reposo, 500+ durante ejecución workflow

Si excede: revisar queries lentas, workflows pesados, volúmenes fragmentados.

### Aumentar recursos

Editar `docker-compose.yml`:

```yaml
services:
  postgres:
    environment:
      # Aumentar buffer pool
      POSTGRES_INITDB_ARGS: "-c max_connections=200"
    
  n8n:
    environment:
      # Más workers
      EXECUTIONS_PROCESS_TRIGGER_count=5
```

Luego:
```bash
docker compose down
docker compose up -d
```

---

## 📝 Mantención regular

### Cada semana
- [ ] Verificar `docker system df` (espacio en disco)
- [ ] Revisar logs de errores: `docker compose logs | grep -i error`
- [ ] Hacer backup: `docker exec cronostudio-postgres pg_dump ...`

### Cada mes
- [ ] Actualizar imagenes: `docker compose pull`
- [ ] Revisar credenciales n8n expiradas
- [ ] Limpiar volúmenes huérfanos: `docker volume prune`

### Cada trimestre
- [ ] Revisar security updates
- [ ] Cambiar POSTGRES_PASSWORD
- [ ] Test restore de backup

### Cada año
- [ ] Migración a nueva VPS (si aplica)
- [ ] Audit de workflows n8n
- [ ] Limpieza de datos históricos

---

## 📚 Documentación relacionada

- [SETUP.md](./SETUP.md) — Guía instalación inicial
- [docs/runbooks/01-docker-n8n-postgres.md](./docs/runbooks/01-docker-n8n-postgres.md) — Docker Compose detallado
- [docs/decisions/0001-stack-base.md](./docs/decisions/0001-stack-base.md) — Decisiones arquitectura

---

**Última actualización**: 22 de enero de 2026  
**Versión**: 1.0  
**Mantenedor**: CronoStudio Team
