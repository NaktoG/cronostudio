# SETUP: CronoStudio - Guía de instalación inicial

## ¿Qué es CronoStudio?

CronoStudio es una plataforma de automatización para creadores de contenido YouTube. Automatiza publicación, monitoreo de métricas, gestión de comentarios y amplificación de alcance mediante workflows en n8n, con un dashboard React para visualización de datos.

**Stack:**
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind + Framer Motion
- **Automatización**: n8n (workflows open-source)
- **Base de datos**: PostgreSQL 16
- **Infraestructura**: Docker Compose (local) → escalable a VPS

## Requisitos

### Hardware

- 4 GB RAM mínimo (8+ recomendado)
- 10 GB espacio disco libre
- Mac, Linux o Windows (con WSL2)

### Software

- **Git**: [git-scm.com](https://git-scm.com/)
  ```bash
  git --version
  ```

- **Docker Desktop**: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
  ```bash
  docker --version
  docker compose version  # v2.x o superior
  ```

- **Node.js + npm**: [nodejs.org](https://nodejs.org/) (v18+ recomendado)
  ```bash
  node --version
  npm --version
  ```

- **Visual Studio Code** (opcional pero recomendado):
  ```bash
  code --version
  ```

## Setup Local - Paso a paso

### 1. Clonar repositorio

```bash
cd ~/Projects  # o donde prefieras
git clone <repo-url>
cd cronostudio
git checkout develop  # trabajar en develop, NO main
```

### 2. Configurar variables de entorno

```bash
# Copiar plantilla
cp .env.example infra/docker/.env

# Editar con tus valores
nano infra/docker/.env
# O abre en editor:
code infra/docker/.env
```

**Variables críticas a definir:**

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_fuerte_aqui  # ⚠️ NO usar "password"
POSTGRES_DB=cronostudio
POSTGRES_HOST=cronostudio-postgres
POSTGRES_PORT=5432

# n8n
N8N_ENCRYPTION_KEY=tu_key_generada_con_openssl  # ver abajo
N8N_USER_MANAGEMENT_DISABLED=false
N8N_WEBHOOK_URL=http://localhost:5678

# URLs para desarrollo
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Generar N8N_ENCRYPTION_KEY segura:**

```bash
openssl rand -hex 32
# Copia el output a N8N_ENCRYPTION_KEY en .env
```

⚠️ **IMPORTANTE**: `infra/docker/.env` **NO se commitea**. Ver `.gitignore`:
```bash
git check-ignore -v infra/docker/.env
# Debe mostrar: .gitignore:XX:infra/docker/.env
```

### 3. Levantar infraestructura (n8n + PostgreSQL)

```bash
cd infra/docker
docker compose up -d

# Verificar
docker compose ps
```

Esperado:
```
NAME                  STATUS
cronostudio-postgres  Up X seconds
cronostudio-n8n       Up X seconds
```

**Si hay error**, ver [RUNBOOK.md](./RUNBOOK.md) → Troubleshooting.

### 4. Setup Frontend (Next.js)

```bash
# Volver a raíz
cd ../..

# Instalar dependencias web
cd apps/web
npm install

# Verificar build
npm run build
```

Sin errores = ✅ listo.

### 5. Iniciar dev server (Next.js)

```bash
cd apps/web
npm run dev
```

Output esperado:
```
  ▲ Next.js 16.1.4
  - Local:        http://localhost:3000
```

### 6. First Smoke Test

Abre en navegador:

#### a) Dashboard Frontend
- URL: `http://localhost:3000`
- Esperado: Página con header animado + cards de canales (datos mock)
- ¿Funciona? ✅

#### b) n8n UI
- URL: `http://localhost:5678`
- Paso 1: Crear usuario admin (primera vez)
  - Email: tu_email
  - Password: segura
- Paso 2: Login
- Esperado: Dashboard n8n vacío (sin workflows aún)
- ¿Funciona? ✅

#### c) PostgreSQL (desde terminal)

```bash
docker exec -it cronostudio-postgres psql -U postgres -d cronostudio

# Dentro de psql:
cronostudio=# \dt  # listar tablas (vacío por ahora)
cronostudio=# \l   # listar bases de datos
cronostudio=# SELECT version();
cronostudio=# \q   # salir
```

Esperado: Base `cronostudio` existe y es accesible.

**Si todo pasó ✅ → Setup completado.**

## Estructura de directorios

```
cronostudio/
├── apps/web/                    ← Frontend Next.js
│   ├── src/app/
│   │   ├── page.tsx            ← Dashboard
│   │   ├── api/channels/route.ts ← API mock (TODO: conectar PostgreSQL)
│   │   └── components/          ← Header, ChannelCard, etc.
│   ├── package.json
│   └── next.config.ts
├── infra/docker/               ← Infraestructura
│   ├── docker-compose.yml       ← Definición servicios
│   └── .env                     ← Variables (NO versionar)
├── n8n/                         ← Workflows n8n
│   └── workflows/               ← Archivos JSON de workflows
├── docs/                        ← Documentación
│   ├── SETUP.md                 ← Este archivo
│   ├── RUNBOOK.md               ← Operación diaria
│   └── runbooks/01-docker-n8n-postgres.md ← Detalle Docker
├── .env.example                 ← Plantilla variables
└── README.md
```

## Flujo de desarrollo diario

### Terminal 1: Infraestructura (solo primera vez)

```bash
cd infra/docker
docker compose up -d
docker compose logs -f  # para monitorear
```

Dejar corriendo.

### Terminal 2: Frontend (en paralelo)

```bash
cd apps/web
npm run dev
```

Abre `http://localhost:3000`.

### Editar código

- Cambios en `apps/web/src/` → auto-reload en navegador
- Cambios en workflows → editá en n8n UI o pushá JSON a `n8n/workflows/`
- Cambios en database schema → scripts SQL en `docs/`

### Hacer commit (en develop)

```bash
git checkout develop
git add <archivos>
git commit -m "feat: descripción en español" # conventional commits
git push origin develop
```

**NO commitear**:
- `infra/docker/.env`
- `.env` en raíz
- `node_modules/`
- `.next/` build
- `.env*.local`

Ver `.gitignore` para lista completa.

## Buenas prácticas

### 1. Siempre trabajar en develop

```bash
git checkout develop
git pull origin develop  # antes de empezar
```

### 2. No pushear a main

Main = código estable en producción. PRs siempre → develop → QA → main.

### 3. Mensajes de commit en español

```bash
git commit -m "feat: agregar autenticación"    ✅
git commit -m "feat: add authentication"       ❌

git commit -m "fix: corregir bug en API"       ✅
git commit -m "docs: actualizar SETUP.md"      ✅
git commit -m "chore: actualizar deps"         ✅
```

### 4. Secretos en .env, NO en código

```python
# ❌ MAL
PASSWORD = "mi_contraseña_123"

# ✅ BIEN
PASSWORD = os.getenv("POSTGRES_PASSWORD")
```

### 5. Documentación sincronizada

Cambios de arquitectura/infra → actualizar `docs/`.

Ejemplo:
- Cambio en docker-compose.yml → actualizar `docs/runbooks/01-docker-n8n-postgres.md`
- Cambio en vars de entorno → actualizar `.env.example` y este archivo

## Troubleshooting Inicial

### "Module not found: Can't resolve 'framer-motion'"

```bash
cd apps/web
npm install
npm run dev
```

### Puerto 5678 (n8n) o 5432 (PostgreSQL) ocupado

Ver [RUNBOOK.md](./RUNBOOK.md) → Troubleshooting.

### Docker daemon no está corriendo

- macOS: Abre Docker Desktop desde Applications
- Linux: `sudo systemctl start docker`

### "POSTGRES_PASSWORD is empty or too short"

Edita `infra/docker/.env` con contraseña de 12+ caracteres:

```bash
POSTGRES_PASSWORD=MiPasswordSeguro123!
```

Luego restart:
```bash
docker compose down -v
docker compose up -d
```

## Sigientes pasos

1. ✅ Setup local completado
2. 📝 Revisar [docs/decisions/0001-stack-base.md](./docs/decisions/0001-stack-base.md) — arquitectura
3. 🔧 Leer [RUNBOOK.md](./RUNBOOK.md) — operación diaria
4. 🚀 Crear primera feature en rama: `git checkout -b feature/nombre`
5. 📊 Conectar API a PostgreSQL (task: implementar schema de canales)
6. 🔌 Crear primer workflow n8n (task: fetch YouTube API)

## Referencias

- [Docker Compose runbook](./docs/runbooks/01-docker-n8n-postgres.md)
- [Operación diaria (RUNBOOK.md)](./RUNBOOK.md)
- [Decisiones arquitectura](./docs/decisions/0001-stack-base.md)
- n8n docs: https://docs.n8n.io
- PostgreSQL docs: https://www.postgresql.org/docs

## Contacto / Ayuda

Si hay problemas:
1. Revisar [RUNBOOK.md](./RUNBOOK.md) → Troubleshooting
2. Revisar logs: `docker compose logs <servicio>`
3. Resetear (desarrollo): `docker compose down -v` + volver a empezar
4. Abrir issue en GitHub

---

**Última actualización**: 22 de enero de 2026  
**Mantenedor**: CronoStudio Team
