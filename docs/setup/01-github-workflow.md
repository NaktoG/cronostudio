# Setup GitHub: ramas, reglas y plantillas

## Objetivo
Estandarizar el flujo de trabajo del repo (issues, PRs, ramas) para mantener `main` estable y trabajar en `develop`.

## Estado actual
- Rama de trabajo: `develop`
- Plantillas configuradas:
  - `.github/ISSUE_TEMPLATE/feature.yml`
  - `.github/ISSUE_TEMPLATE/bug.yml`
  - `.github/ISSUE_TEMPLATE/task.yml`
  - `.github/PULL_REQUEST_TEMPLATE.md`
- Se subieron a `origin/develop`.

## Nota sobre reglas de ramas (Rulesets)
Se intentó configurar Rulesets para proteger `main`.
En repos privados, GitHub puede no aplicar ciertas reglas sin plan Team/Org.
De todos modos, se mantiene el flujo recomendado:
- Trabajo diario en `develop`
- PRs hacia `develop`
- Merge a `main` solo cuando esté estable

## Convención de commits (ES)
- `chore:` mantenimiento/config
- `docs:` documentación
- `feat:` funcionalidad
- `fix:` bugfix
