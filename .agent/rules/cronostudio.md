---
trigger: glob
---

# Rules — CronoStudio (Equipo Élite)

## Principios
- Contexto mínimo: no arrastres contexto innecesario.
- Máximo 5 agentes por iteración.
- Para tareas grandes: dividir en tareas por dominio y delegar SOLO a agentes existentes en /agents.
- Output siempre accionable (checklists, steps, files, DoD).

## Stack por defecto (OBLIGATORIO)
Si el usuario no especifica stack explícito:
- Usar **PostgreSQL + Prisma**
- Aplicar la skill: `stack_standard_postgres`

## Auto-invoke (OBLIGATORIO)
- Nuevo proyecto / propuesta de stack -> `stack_standard_postgres`
- Cambio DB/ORM/migraciones -> `prisma_postgres`
- Cambio endpoint / contrato -> `api_design_backend`
- Cambio auth/sesión/JWT/cookies -> `security_owasp_auth`
- Tests / fallos vitest/playwright -> `testing_tdd_fdd`
- CI/CD -> `ci_cd_github_actions`
- PR/commits/branches -> `git_github_flow`
- Docs/README/runbooks -> `docs_readme_runbooks`
- Automatizaciones -> `n8n_workflows`
- Logging -> `logging_standard`
- TODOs / deuda técnica -> `tech_debt_todos`

## Contrato de salida de especialistas
- Qué cambió (<=10 bullets)
- Archivos tocados
- Decisiones + rationale
- Riesgos / próximos pasos
