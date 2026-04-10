# CronoStudio · Project AgentOS Entry Point

CronoStudio usa **AgentOS global** para agentes y skills, y define en este repositorio
el contexto local obligatorio para trabajar correctamente en VS Code, OpenCode y Codex.

## Fuente de verdad

- Catálogo global de agentes y skills: `~/.agentes`
- Compatibilidad local: `.agentes -> ~/.agentes`
- Contexto operativo local adicional:
  - `AI.md`
  - `docs/AGENTOS_ENFORCEMENT.md`
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/SECURITY.md`
  - `docs/OBSERVABILITY.md`
  - `docs/RUNBOOK.md`
  - `docs/SETUP.md`

## Qué es este proyecto

**CronoStudio** es una suite de producción para creadores de contenido / YouTube con
enfoque local-first. El sistema cubre pipeline editorial, dashboard, automatización,
analytics e integraciones operativas.

## Stack y arquitectura base

- Frontend principal: `apps/web`
  - Next.js
  - TypeScript
  - App Router
- Backend principal:
  - Next.js API routes
  - PostgreSQL
  - Zod para validación
  - JWT / auth
- Automatización interna:
  - `apps/automation-go`
  - workers y procesos en Go
- Automatización complementaria:
  - `n8n/workflows`
- Infraestructura y operación:
  - `infra/docker`
  - `infra/migrations`
  - `infra/nginx`
  - `infra/observability`

No inventes otro stack ni asumas tecnologías no documentadas.

## Estructura local a respetar

- `apps/web`: producto principal web
- `apps/automation-go`: workers / automatizaciones internas
- `n8n/workflows`: workflows de n8n
- `infra/*`: Docker, nginx, migraciones, observabilidad
- `docs/*`: arquitectura, seguridad, setup, runbooks, automatización
- `scripts/*`: tareas operativas, DB, observabilidad, n8n, infraestructura

## Reglas locales obligatorias

1. Identificar el tipo de tarea antes de actuar.
2. Activar solo los agentes pertinentes, máximo 5.
3. Auto-invocar las skills aplicables por trigger.
4. Si no hay skill aplicable, decirlo explícitamente.
5. La respuesta final debe incluir siempre:
   - agentes activados
   - skills activadas
   - resumen
   - archivos tocados
   - decisiones
   - riesgos
   - próximo paso

## Criterios de trabajo para este repo

- Leer contexto del repo antes de proponer cambios.
- No inventar contratos, flujos ni decisiones arquitectónicas.
- Respetar Clean Architecture y separación de responsabilidades.
- Para cambios en frontend, considerar accesibilidad, estados, consumo de API y
  consistencia de UX.
- Para cambios en backend, considerar contratos, validación, auth, errores,
  observabilidad y persistencia.
- Para automatizaciones, distinguir claramente:
  - cuándo corresponde `apps/automation-go`
  - cuándo corresponde `n8n/workflows`
- Para cambios de infraestructura, seguridad o despliegue, incluir validación y rollback.
- Para cambios relevantes de arquitectura, documentar la decisión si aplica.
- Los modos Plan y Build se cambian manualmente por el usuario.
- En Plan Mode, priorizar auditoría, análisis, troubleshooting, diseño técnico y plan de ejecución.
- En Build Mode, ejecutar cambios reales, validar resultados y reportar archivos tocados.
- No asumir cambio automático entre modos.
- Si el usuario pasa de Plan a Build después de un análisis suficiente, continuar con la ejecución sin repetir innecesariamente el plan.

## Prioridad de reglas

1. Contexto local del repo (`AGENTS.md`, `AI.md`, `docs/AGENTOS_ENFORCEMENT.md`)
2. Catálogo global de AgentOS (`~/.agentes`)
3. Suposiciones generales del agente

Si hay conflicto, manda la regla local del proyecto.

## Qué no hacer

- No crear una copia local del catálogo dentro del repo.
- No commitear `.agentes`.
- No asumir que n8n reemplaza backend o lógica de negocio core.
- No asumir que infraestructura, seguridad o automatización están “resueltas” sin leer docs.
- No cambiar stack o contratos por preferencia personal.

## Referencias rápidas

- Root orchestration: `.agentes/agents/agent.md`
- Skills index: `.agentes/skills/SKILLS_INDEX.md`
- Política local IA: `AI.md`
- Enforcement local: `docs/AGENTOS_ENFORCEMENT.md`

