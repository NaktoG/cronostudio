<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.4-black?style=for-the-badge&logo=next.js" alt="Next.js 16.1.4">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Clean_Architecture-Enabled-success?style=for-the-badge&logo=structure" alt="Clean Architecture">
  <img src="https://img.shields.io/badge/n8n-Automation-EA4B71?style=for-the-badge&logo=n8n" alt="n8n">
</p>

<h1 align="center">🎬 CronoStudio</h1>

<p align="center">
  <strong>Sistema de Gestión de Producción para Creadores de Contenido</strong><br>
  Local-first SaaS • Dashboard • Automation • Analytics
</p>

<p align="center">
  <a href="#-sobre-el-proyecto">Proyecto</a> •
  <a href="#-características">Características</a> •
  <a href="#-arquitectura">Arquitectura</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-documentación">Docs</a>
</p>

---

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#-sobre-el-proyecto)
- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura](#-arquitectura)
- [Seguridad](#-seguridad)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Documentación](#-documentación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Mejores Prácticas](#-mejores-prácticas)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 Sobre el Proyecto

**CronoStudio** es un sistema integral de gestión de producción diseñado específicamente para creadores de contenido en YouTube. Proporciona un dashboard unificado para rastrear el flujo de contenido desde la idea inicial hasta la publicación, con automatización integrada vía n8n.

### ¿Por qué este proyecto?

- **100% Local**: Sin dependencias de nube, tus datos permanecen en tu máquina.
- **Pipeline Visual**: Seguimiento visual desde idea → guion → grabación → edición → publicación.
- **Automatización**: Integración nativa con n8n para SEO, miniaturas y scheduling.
- **Multi-Canal**: Gestión centralizada de múltiples canales de YouTube.

---

## 🚀 Características Principales

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| 🏠 **Dashboard** | Vista general del pipeline, acciones prioritarias | ✅ Ready |
| 💡 **Ideas** | Banco de ideas con evaluación IA y categorización | ✅ Ready |
| 📝 **Producción** | Pipeline completo (Scripting, Recording, Editing) | ✅ Ready |
| 📺 **Canales** | Gestión multi-canal y métricas | ✅ Ready |
| 🔐 **Seguridad** | Autenticación JWT, Rate Limiting, Validación Zod | ✅ Ready |
| 🤖 **Automatización** | Workflows de n8n integrados | 🔄 In Progress |

---

## 🛠 Tecnologías Utilizadas

### Frontend
- **Next.js 16.1.4** (App Router)
- **TypeScript** (Strict Mode)
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations)
- **Lucide React** (Icons)

### Backend
- **Next.js API Routes**
- **PostgreSQL 16**
- **JWT** (Stateless Auth)
- **Zod** (Validation)

### Infraestructura
- **Docker Compose**
- **n8n** (Workflow Automation)
- **Vitest** (Unit Testing)

---

## 🏗 Arquitectura

El proyecto sigue una **Clean Architecture** estricta para garantizar mantenibilidad y escalabilidad.

```mermaid
graph TD
    subgraph "Infrastructure Layer (DB, External APIs)"
        DB[(PostgreSQL)]
        YouTube[YouTube API]
        RepoImpl[PostgresRepositories]
    end

    subgraph "Application Layer (Business Rules)"
        AuthService[AuthService]
        UseCases[Use Cases<br/>(CreateIdea, ListProduction...)]
    end

    subgraph "Domain Layer (Enterprise Rules)"
        Entities[Entities<br/>(User, Idea, Production)]
        Repos[Repository Interfaces]
        ValueObjects[Value Objects]
    end

    subgraph "Presentation Layer (Web)"
        Pages[Next.js Pages]
        API[API Routes]
    end

    API --> UseCases
    UseCases --> Repos
    UseCases --> Entities
    RepoImpl -.-> Repos
    RepoImpl --> DB
```

Ver [ARCHITECTURE.md](docs/ARCHITECTURE.md) para más detalles.

---

## 🔒 Seguridad

- **Autenticación**: JWT con rotación y almacenamiento seguro.
- **Validación**: Zod schemas para todos los inputs.
- **Protección**: Rate Limiting (Redis/Memory), Headers de seguridad (Helmet).
- **Base de Datos**: Queries parametrizadas para evitar SQL Injection.

---

## 📦 Requisitos Previos

- [Docker Desktop](https://docker.com/products/docker-desktop) v24+
- [Node.js](https://nodejs.org) v20+ (LTS)
- [npm](https://npmjs.com) v10+

---

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/NaktoG/cronostudio.git
   cd cronostudio
   ```

2. **Iniciar infraestructura**
   ```bash
    docker compose -f infra/docker/docker-compose.yml up -d
   ```

3. **Configurar entorno (Docker)**
   ```bash
   cp infra/docker/.env.example infra/docker/.env
   ```

4. **Configurar entorno (Web)**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

5. **Ejecutar migraciones**
   ```bash
   ./scripts/migrate.sh
   ```

6. **Instalar dependencias**
   ```bash
   cd apps/web
   npm install
   ```

7. **Iniciar desarrollo**
   ```bash
   npm run dev
   ```

---

## 📁 Estructura del Proyecto

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (Presentation Layer)
│   └── (routes)/           # Pages & Layouts
├── application/            # Application Layer
│   ├── usecases/           # Casos de uso de negocio
│   └── services/           # Servicios de aplicación (Auth)
├── domain/                 # Domain Layer (Core)
│   ├── entities/           # Definiciones de entidades
│   ├── repositories/       # Interfaces de repositorios
│   └── value-objects/      # Objetos de valor inmutables
├── infrastructure/         # Infrastructure Layer
│   └── repositories/       # Implementaciones PostgreSQL
├── middleware/             # Middleware de Next.js (Auth, RateLimit)
└── lib/                    # Utilidades compartidas
```

---

## 📚 Documentación

- [Setup](docs/SETUP.md)
- [Runbook](docs/RUNBOOK.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Política de ramas](docs/BRANCHING.md)
- [Script de limpieza de ramas](scripts/branch_cleanup.sh)
- [Runbook Hetzner VPS](docs/runbooks/02-hetzner-vps.md)
- [Observabilidad](docs/OBSERVABILITY.md)
- [Migraciones SQL](docs/DB_MIGRATIONS.md)

---

## ✅ Mejores Prácticas

- **Clean Architecture**: Separación estricta de responsabilidades.
- **FDD (Feature Driven Development)**: Desarrollo guiado por features y tests.
- **SOLID**: Principios de diseño aplicados en el backend.
- **Conventional Commits**: Historial de git estandarizado.

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/mi-feature`)
3. Commit tus cambios (`git commit -m 'feat: descripcion corta'`)
4. Push a la rama (`git push origin feature/mi-feature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Made with ❤️ for Creators<br>
  <strong>CronoStudio</strong> © 2025
</p>
