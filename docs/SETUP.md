# Setup CronoStudio

## ¿Qué es CronoStudio?

CronoStudio es un sistema local para la producción de contenido YouTube, que integra un dashboard web (Next.js), automatización de workflows (n8n), base de datos (PostgreSQL) y almacenamiento de activos en SSD. Es 100% local, reproducible y documentado, sin necesidad de VPS.

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

Variables obligatorias (mínimo):
- `JWT_SECRET` (mínimo 32 caracteres, sin usar valores por defecto)

Variables de logging (opcional):
- `LOG_LEVEL` (debug | info | warn | error)

Variables para analytics (opcional):
- `YOUTUBE_ANALYTICS_ACCESS_TOKEN`
- `YOUTUBE_CHANNEL_IDS`

Servicios adicionales:
- `REDIS_URL` (URL del cluster Redis usado para rate limiting en producción)
- `OBS_ENABLED` / `OBS_ENDPOINT` (ver `docs/OBSERVABILITY.md` para métricas y alertas)

Variables para email (opcional):
- `APP_BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

Control de registro:
- `ALLOW_PUBLIC_SIGNUP=false` (recomendado en producción)

QA recomendado:
- Ver `docs/QA_AUTH_FLOW.md`

**⚠️ IMPORTANTE:** NUNCA commitear `infra/docker/.env` a git si contiene credenciales reales y recuerda que en producción no existen valores de respaldo: cada variable crítica debe establecerse explícitamente.

### 3. Levantar infraestructura (n8n + Postgres)

```bash
cd infra/docker
docker compose up -d
docker ps
```

Verificar que ambos containers están en estado `Up`:
- `cronostudio-postgres`
- `cronostudio-n8n`

### 3.1 Ejecutar migraciones de base de datos

```bash
./scripts/db/migrate.sh
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
docker exec cronostudio-postgres psql -U postgres -c "SELECT 1;"
```
Resultado esperado: `1` (confirma conexión OK).

#### n8n está disponible:
Abrir navegador: **http://localhost:5678**

Deberías ver la interfaz web de n8n.

#### Frontend Next.js está corriendo:
```bash
cd apps/web
npm run dev
```

Abrir navegador: **http://localhost:3000**

Deberías ver página inicial de Next.js.

## Estructura del Proyecto

```
cronostudio/
├── apps/web/               # Frontend Next.js (Dashboard)
│   ├── src/app/           # Componentes y rutas
│   ├── package.json       # Dependencias
│   └── tsconfig.json      # Config TypeScript
├── infra/docker/          # Infraestructura
│   ├── docker-compose.yml # Definición n8n + Postgres
│   └── .env              # Variables (NO commitear)
├── n8n/
│   └── workflows/        # Workflows automáticos
├── docs/                 # Documentación
│   ├── SETUP.md         # Este archivo
│   ├── RUNBOOK.md       # Operación diaria
│   ├── runbooks/        # Guías específicas
│   └── decisions/       # ADRs
└── README.md            # Overview del proyecto
```

## Workflow Típico de Desarrollo

### Iniciar día de desarrollo

```bash
# Levantar infraestructura
cd infra/docker && docker compose up -d

# En otra terminal, iniciar frontend
cd apps/web && npm run dev

# Acceder a:
# - Dashboard Next.js: http://localhost:3000
# - n8n workflows: http://localhost:5678
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
| n8n no conecta a Postgres | Verificar credenciales en `infra/docker/.env` |

## Siguiente Paso

Una vez que todo esté funcionando localmente, leer:
- [RUNBOOK.md](RUNBOOK.md) — operación diaria y mantenimiento
- [docs/decisions/0001-stack-base.md](decisions/0001-stack-base.md) — por qué este stack
- [docs/runbooks/01-docker-n8n-postgres.md](runbooks/01-docker-n8n-postgres.md) — guía Docker detallada
