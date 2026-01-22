# RUNBOOK: Operación Diaria CronoStudio

## Inicio de Sesión de Desarrollo

### Levantar infraestructura

```bash
cd /Volumes/SSD-QVO/cronostudio/infra/docker
docker compose up -d
docker ps
```

### Levantar frontend

En otra terminal:

```bash
cd /Volumes/SSD-QVO/cronostudio/apps/web
npm run dev
```

Acceso:
- **n8n**: http://localhost:5678
- **Dashboard**: http://localhost:3000

## Parar Servicios

```bash
cd infra/docker
docker compose down
```

Nota: Los datos en volúmenes persisten. Los containers van a estado `Exited`.

## Ver Logs en Tiempo Real

```bash
# n8n
docker logs -f cronostudio-n8n

# Postgres
docker logs -f cronostudio-postgres

# Ambos
docker compose -f infra/docker/docker-compose.yml logs -f
```

## Backup de Base de Datos

### Crear backup

```bash
docker exec cronostudio-postgres pg_dump -U postgres cronostudio > backup_$(date +%Y%m%d_%H%M%S).sql
```

Resultado: archivo `backup_20250122_143015.sql` en directorio actual.

### Restaurar desde backup

```bash
docker exec -i cronostudio-postgres psql -U postgres cronostudio < backup_20250122_143015.sql
```

**Nota:** Reemplazar fecha con el archivo correcto.

## Resetear Todo (⚠️ DESTRUCTIVO)

Si quieres "empezar de cero" (borra todos los datos de n8n y Postgres):

```bash
cd infra/docker
docker compose down -v
docker compose up -d
```

El flag `-v` elimina volúmenes. Usar solo en desarrollo local.

## Incidentes Comunes

### Puerto 5432 ya está en uso

```bash
# Identificar proceso
lsof -i :5432

# Matar proceso (si es seguro)
kill -9 <PID>

# Alternativa: cambiar puerto en docker-compose.yml
# Editar línea: ports: ["5433:5432"]
```

### Puerto 5678 ya está en uso

```bash
lsof -i :5678
kill -9 <PID>
```

### Docker daemon no corre

**Síntoma:** Error `Cannot connect to Docker daemon`

**Solución:**
1. Abrir Docker Desktop desde Aplicaciones (macOS)
2. Esperar a que inicie completamente
3. Reintentar `docker compose up -d`

### n8n no conecta a Postgres

**Síntoma:** Logs de n8n muestran `connection refused` a localhost:5432

**Verificar:**
1. ¿Postgres está corriendo? `docker ps | grep postgres`
2. ¿Credenciales en `.env` son correctas?
   ```bash
   grep POSTGRES infra/docker/.env
   ```
3. ¿Postgres está healthy?
   ```bash
   docker exec cronostudio-postgres psql -U postgres -c "SELECT 1;"
   ```

### Container en estado "Exited" o "Dead"

```bash
# Ver logs para entender qué pasó
docker logs cronostudio-postgres

# Reiniciar container
docker restart cronostudio-postgres

# Si sigue fallando, resetear volumen
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d
```

### Permisos negados en volúmenes

```bash
# En macOS/Linux, puede ser permisos
docker exec cronostudio-postgres chown -R postgres:postgres /var/lib/postgresql/data

# O simplemente resetear
docker compose down -v && docker compose up -d
```

## Monitoreo

### Estado de servicios

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Esperado:
```
NAME                    STATUS
cronostudio-postgres    Up 2 hours
cronostudio-n8n         Up 2 hours
```

### Recursos consumidos

```bash
docker stats --no-stream
```

Postgres y n8n no deberían consumir > 1GB RAM en desarrollo.

### Conectarse a Postgres directo

```bash
docker exec -it cronostudio-postgres psql -U postgres cronostudio
```

Luego puedes escribir SQL:
```sql
SELECT version();
SELECT COUNT(*) FROM information_schema.tables;
\dt  -- listar tablas
```

## Actualizar Stack

### Actualizar n8n a versión más nueva

1. Editar `infra/docker/docker-compose.yml`
2. Cambiar `n8nio/n8n:latest` → `n8nio/n8n:1.45.0` (versión específica)
3. Recrear container:
   ```bash
   docker compose -f infra/docker/docker-compose.yml pull
   docker compose -f infra/docker/docker-compose.yml up -d --force-recreate
   ```

### Actualizar Postgres

⚠️ Cambiar versión Mayor de Postgres (15→16) requiere migración de datos.

Para Minor updates (16.1→16.2):
```bash
docker compose pull
docker compose up -d --force-recreate
```

## Verificaciones Periódicas

### Cada inicio de jornada

```bash
# ¿Containers arriba?
docker ps

# ¿Postgres responde?
docker exec cronostudio-postgres psql -U postgres -c "SELECT 1;"

# ¿n8n accesible?
curl http://localhost:5678/api/v1/health

# ¿Desarrollo Next.js OK?
# (debe estar corriendo en otra terminal)
curl http://localhost:3000
```

### Semanal

- Revisar logs para errores recurrentes
- Hacer backup de datos: `docker exec cronostudio-postgres pg_dump ... > backup_semanal.sql`

### Mensual

- Limpiar Docker (imágenes no usadas): `docker image prune -a`
- Revisar espacio en disco: `df -h`

## Finalizar Sesión

```bash
# Guardar cambios en git
git add .
git commit -m "docs: cambios de desarrollo"
git push origin develop

# Parar containers
docker compose -f infra/docker/docker-compose.yml down

# Opcional: hacer backup antes de apagar
docker exec cronostudio-postgres pg_dump -U postgres cronostudio > backup_end_of_day.sql
```

## Referencias Rápidas

- Documentación Setup: [SETUP.md](SETUP.md)
- Docker Runbook detallado: [runbooks/01-docker-n8n-postgres.md](runbooks/01-docker-n8n-postgres.md)
- Decisiones de arquitectura: [decisions/0001-stack-base.md](decisions/0001-stack-base.md)
- n8n Docs: https://docs.n8n.io/
- PostgreSQL Docs: https://www.postgresql.org/docs/16/
