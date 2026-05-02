# Setup CronoStudio

## ¿Qué es CronoStudio?

CronoStudio es un sistema local para la producción de contenido YouTube, que integra un dashboard web (Next.js), workers internos de automatización (Go), base de datos (PostgreSQL) y almacenamiento de activos en SSD. Es 100% local, reproducible y documentado, sin necesidad de VPS.

## Requisitos Previos

### Hardware
- Máquina con macOS, Linux o Windows (con Docker Desktop)
- Mínimo 4GB RAM libres
- 10GB espacio en disco (SSD recomendado para volúmenes Docker)

### Software
- **Docker Desktop** (v4.0+): https://www.docker.com/products/docker-desktop
- **Node.js** (v18+): https://nodejs.org/
- **npm** o **pnpm** (incluido con Node)
- **Git** (v2.30+)

## Instalación Inicial

### 1. Clonar repositorio

```bash
git clone https://github.com/tu-org/cronostudio.git
cd cronostudio
git checkout develop
```

### 2. Configurar variables de entorno

Copiar template de `infra/docker/.env.example` a `infra/docker/.env`:

```bash
cp infra/docker/.env.example infra/docker/.env
```

Editar `infra/docker/.env` con valores locales. Ver `.env.example` para referencias.

Copiar template de `apps/web/.env.example` a `apps/web/.env.local`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Editar `apps/web/.env.local` con valores locales. Ver `.env.example` para referencias.

**Importante:** Los archivos `.env` reales nunca se versionan. Solo se versionan los templates `.env.example`. Si necesitas un entorno nuevo, copia el template correspondiente y completa los valores localmente.

Variables obligatorias (mínimo):
- `JWT_SECRET` (mínimo 32 caracteres, sin usar valores por defecto)

Variables de logging (opcional):
- `LOG_LEVEL` (debug | info | warn | error)

Variables para analytics (opcional):
- Se gestionan via OAuth en CronoStudio (no requiere tokens manuales).

Servicios adicionales:
- `REDIS_URL` (URL del cluster Redis usado para rate limiting en producción)
- `OBS_ENABLED` / `OBS_ENDPOINT` / `OBS_ALERT_WEBHOOK` / `OBS_ALERT_EMAIL` (ver `docs/OBSERVABILITY.md` para métricas y alertas)
- `ALLOW_PUBLIC_SIGNUP` (por defecto true; pon \"false\" si quieres desactivar registros en producción)

Webhooks (obligatorio si usas integraciones externas):
- `CRONOSTUDIO_SERVICE_USER_ID` (preferido) o `CRONOSTUDIO_SERVICE_USER_EMAIL`
- **Nota:** si no se configuran, los endpoints de webhook responden `503` con `service_user_not_configured`.

Variables para email (opcional):
- `APP_BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

OAuth Google (YouTube + Analytics):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (local: `http://localhost:3000/api/google/oauth/callback`)
- `YOUTUBE_OAUTH_SCOPES` (incluye `youtube.readonly` y `yt-analytics.readonly`)

Conectar YouTube:
- Abrir CronoStudio → Canales → "Conectar YouTube"
- Completar consentimiento y volver a la app

Control de registro:
- `ALLOW_PUBLIC_SIGNUP=false` (recomendado en producción)

QA recomendado:
- Ver `docs/QA_AUTH_FLOW.md`

**⚠️ IMPORTANTE:** NUNCA commitear `infra/docker/.env` ni `apps/web/.env.local` si contienen credenciales reales y recuerda que en producción no existen valores de respaldo: cada variable crítica debe establecerse explícitamente.
**⚠️ IMPORTANTE:** No usar `docker compose down -v` en local salvo reset intencional; borra usuarios y datos.

### 3. Levantar infraestructura (Postgres + Redis + Mailpit)

```bash
./scripts/local_up.sh
```

Verificar que los contenedores están en estado `Up`:
- `cronostudio-postgres`
- `cronostudio-redis` (rate limit)
- `cronostudio-mailpit` (UI en http://localhost:8025, SMTP en 127.0.0.1:1025)

### 3.1 Ejecutar migraciones de base de datos

```bash
./scripts/migrate.sh
```

> Ver `infra/migrations/README.md` para crear nuevas migraciones (`./scripts/db/create-migration.sh <descripcion>`).

### 3.2 Cargar datos de demo (opcional)

```bash
./scripts/db_seed.sh
```

### 4. Instalar dependencias del frontend

```bash
cd apps/web
npm install
```

### 5. Verificación: Primer Smoke Test

#### Postgres está corriendo:
```bash
docker exec cronostudio-postgres psql -U cronostudio -d cronostudio -c "SELECT 1;"
```
Resultado esperado: `1` (confirma conexión OK).

#### n8n (legacy rollback, opcional)
Si necesitas validar rollback n8n:

```bash
ENABLE_LEGACY_N8N=true ./scripts/local_up.sh
```

Luego abrir: **http://localhost:5678**

#### Frontend Next.js está corriendo:
```bash
cd apps/web
npm run dev
```

Abrir navegador: **http://localhost:3000**

Deberías ver página inicial de Next.js.

#### Adminer (DB UI)
- URL: http://localhost:8080
- Sistema: PostgreSQL
- Servidor: postgres
- Usuario y Password: los definidos en `infra/docker/.env`
- Base de datos: `POSTGRES_DB` de `infra/docker/.env`

## Estructura del Proyecto

```
cronostudio/
├── apps/web/               # Frontend Next.js (Dashboard)
│   ├── src/app/           # Componentes y rutas
│   ├── package.json       # Dependencias
│   └── tsconfig.json      # Config TypeScript
├── infra/docker/          # Infraestructura
│   ├── docker-compose.yml # Definición base (Postgres/Redis/Adminer) + profile legacy n8n
│   └── .env              # Variables (NO commitear)
├── n8n/
│   └── workflows/        # Assets legacy para rollback
├── docs/                 # Documentación
│   ├── SETUP.md         # Este archivo
│   ├── RUNBOOK.md       # Operación diaria
│   ├── runbooks/        # Guías específicas
│   └── decisions/       # ADRs
└── README.md            # Overview del proyecto
```

## Workflow Típico de Desarrollo

### Inicio rapido (todo automatico)

```bash
make start
```

Para detener todo:

```bash
./scripts/local_stop.sh
```

### Modo prod-like (recomendado)

Comandos seguros (NO borran datos):

```bash
./scripts/local_up.sh
./scripts/local_down.sh
```

Reset intencional (BORRA datos, requiere override):

```bash
./scripts/local_reset.sh --i-know
```

Backups:

```bash
./scripts/local_backup_db.sh
./scripts/local_backup_n8n.sh
```

`local_backup_n8n.sh` es solo para rollback legacy.

Restore DB:

```bash
./scripts/local_restore_db.sh <archivo.sql>
```

### Ver estado local

```bash
./scripts/local_status.sh
```

### Seed local (datos demo)

```bash
./scripts/local_seed.sh
```

### Reset local (borra datos)

```bash
./scripts/local_reset.sh --i-know
```

### Iniciar día de desarrollo

```bash
# Levantar infraestructura
cd infra/docker && docker compose up -d

# En otra terminal, iniciar frontend
cd apps/web && npm run dev

# Acceder a:
# - Dashboard Next.js: http://localhost:3000
# - n8n legacy (opcional): ENABLE_LEGACY_N8N=true ./scripts/local_up.sh
```

### Crear nueva rama de feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/tu-feature
# ... editar código ...
git add .
git commit -m "feat: descripción en español"
git push origin feature/tu-feature
# Crear PR en GitHub hacia develop
```

### Validar cambios antes de commit

```bash
# Lint
cd apps/web && npm run lint

# Build (verifica que compila)
npm run build
```

## Buenas Prácticas

- **Siempre trabajar en `develop`**, nunca en `main`
- **Seguir la política de ramas**: ver `docs/BRANCHING.md`
- **NO commitear secretos**: `.env`, API keys, tokens
- **Documentar cambios importantes** en `docs/`
- **Hacer commits descriptivos** en español: `feat:`, `fix:`, `docs:`, `chore:`
- **Testing**: Si agregas lógica, incluye tests unitarios
- **PRs claros**: Explicar QUÉ, POR QUÉ y HOW en descripción

## Resetear todo (Desarrollo Local)

Si necesitas "empezar de cero" (elimina todos los datos):

```bash
# Detener containers y eliminar volúmenes
docker compose -f infra/docker/docker-compose.yml down -v

# Levantar nuevamente
docker compose -f infra/docker/docker-compose.yml up -d
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Docker daemon no corre | Abrir Docker Desktop desde Aplicaciones |
| Puerto 5432 ocupado | `lsof -i :5432` para encontrar PID y `kill -9 <PID>` |
| Puerto 3000 ocupado | `lsof -i :3000` para encontrar PID y `kill -9 <PID>` |
| `npm install` tarda mucho | Usar `npm ci` en lugar de `npm install` (más rápido en CI) |
| Postgres no inicia | Ver logs: `docker logs cronostudio-postgres` |
| n8n legacy no conecta a Postgres | Verificar credenciales en `infra/docker/.env` y profile `legacy-n8n` |

## Siguiente Paso

Una vez que todo esté funcionando localmente, leer:
- [RUNBOOK.md](RUNBOOK.md) — operación diaria y mantenimiento
- [LOCAL_HEALTH_CHECKLIST.md](LOCAL_HEALTH_CHECKLIST.md) — checklist rápido local
- [docs/decisions/0001-stack-base.md](decisions/0001-stack-base.md) — por qué este stack
- [docs/runbooks/01-docker-n8n-postgres.md](runbooks/01-docker-n8n-postgres.md) — guía Docker legacy (rollback)
