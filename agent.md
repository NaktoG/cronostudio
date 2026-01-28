# 🎯 CronoStudio - Sistema de Agentes Root

## Descripción del Proyecto
**CronoStudio** es un sistema profesional de gestión de producción de contenido para YouTube, construido con arquitectura hexagonal (Clean Architecture) y metodología Feature-Driven Development (FDD).

## Arquitectura del Proyecto

### Estructura de Directorios
```
cronostudio/
├── apps/web/src/
│   ├── app/                    # Next.js App Router + UI Components
│   │   ├── components/         # Componentes React (Atomic Design)
│   │   ├── api/               # API Routes
│   │   └── [pages]/           # Páginas de la aplicación
│   ├── application/           # Casos de Uso (Use Cases)
│   │   └── usecases/
│   ├── domain/                # Entidades y Lógica de Negocio
│   │   ├── entities/
│   │   └── repositories/
│   ├── infrastructure/        # Implementaciones concretas
│   │   └── repositories/
│   ├── lib/                   # Utilidades y configuraciones
│   └── middleware/            # Middlewares de Next.js
├── skills/                    # Skills de los agentes especializados
├── docs/                      # Documentación del proyecto
└── infra/                     # Infraestructura (Docker, CI/CD)
```

## Sistema de 15 Agentes Especializados

### Agentes Core
1. **Orquestador**: Dirección técnica y decisiones clave
2. **Arquitecto**: Estructura modular y escalable
3. **DevOps**: Despliegues, Docker, CI/CD
4. **Backend**: APIs, lógica, base de datos
5. **Frontend**: Interfaces y experiencia de usuario

### Agentes de Calidad
6. **IA/LLM**: Automatización con modelos de lenguaje
7. **QA**: Validación funcional
8. **Testing**: TDD, FDD, pruebas unitarias

### Agentes de Documentación y Diseño
9. **Documentación**: README, flujos, arquitectura
10. **Product Manager**: Roadmap, MVP, valor de negocio
11. **Notion/Docs**: Organización exportable
12. **Figma/UI**: Diseño de componentes, UX

### Agentes de Automatización y Seguridad
13. **n8n**: Automatizaciones e integraciones
14. **Ciberseguridad**: Auditoría OWASP, sesiones
15. **Git & GitHub**: Versionado, ramas, PRs

## Delegación de Contexto

### UI Components → Agentes 05 y 12
**Directorio**: `apps/web/src/app/components/`
**Contexto**: Ver `apps/web/src/app/components/agent.md`
**Skills**: `stitch-ui.md`

### Application Logic → Agentes 02, 04, 08
**Directorio**: `apps/web/src/application/`
**Contexto**: Ver `apps/web/src/application/agent.md`
**Skills**: `testing-standard.md`, `technical-audit.md`

### Infrastructure → Agentes 03, 04, 14
**Directorio**: `apps/web/src/infrastructure/`
**Contexto**: Implementaciones de repositorios, servicios externos
**Skills**: `technical-audit.md`

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Stitches (CSS-in-JS)
- **State**: React Hooks + Context API
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js
- **Validation**: Zod

### Testing
- **Unit/Integration**: Vitest
- **Component**: Testing Library
- **E2E**: Playwright (futuro)

### DevOps
- **CI/CD**: GitHub Actions
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **Containerization**: Docker (futuro)

## Reglas de Comportamiento del Orquestador

### Cuando recibas una solicitud:
1. **Analiza el contexto**: ¿Es UI, lógica, infraestructura o auditoría?
2. **Activa agentes relevantes**: Máximo 5 por iteración
3. **Verifica skills aplicables**: Autoinvoca la skill correspondiente
4. **Delega al contexto correcto**: Usa los archivos `agent.md` específicos
5. **Mantén coherencia**: Evita alucinaciones usando contexto segmentado

### Ejemplo de Delegación
```
Usuario: "Necesito crear un componente de lista de ideas"
→ Orquestador activa: Agente 05 (Frontend), Agente 12 (UI)
→ Contexto: apps/web/src/app/components/agent.md
→ Skill: skills/stitch-ui.md
→ Acción: Crear componente siguiendo Atomic Design
```

## Skills Disponibles

### 1. technical-audit.md
**Agentes**: 02 (Arquitecto), 14 (Ciberseguridad)
**Uso**: Auditorías técnicas, análisis OWASP, deuda técnica

### 2. pr-expert.md
**Agente**: 15 (Git & GitHub)
**Uso**: Pull Requests, commits semánticos, code review

### 3. stitch-ui.md
**Agentes**: 05 (Frontend), 12 (Figma/UI)
**Uso**: Diseño de componentes, Design Tokens, Atomic Design

### 4. testing-standard.md
**Agente**: 08 (Testing)
**Uso**: TDD/FDD, Vitest, Testing Library

## Comandos Útiles

```bash
# Desarrollo
cd apps/web && npm run dev

# Testing
npm run test
npm run test:coverage

# Linting
npm run lint
npm run format

# Build
npm run build
```

## Próximos Pasos
1. Completar implementación de módulos de contenido (Ideas, Scripts, Thumbnails, SEO)
2. Implementar autenticación completa con NextAuth
3. Configurar CI/CD con GitHub Actions
4. Añadir tests E2E con Playwright
5. Dockerizar la aplicación

---

**Versión**: 1.0.0
**Última actualización**: 2026-01-26
**Mantenido por**: Sistema de 15 Agentes
