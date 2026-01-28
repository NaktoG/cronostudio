---
name: ci_cd_github_actions
description: Definición y estandarización de pipelines CI/CD usando GitHub Actions
trigger:
  - ci
  - cd
  - pipeline
  - github_actions
  - workflow
  - build
  - deploy
scope: devops
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - testing_standard
  - security_owasp_auth
---

## 🎯 Propósito
Definir y mantener pipelines de **CI/CD reproducibles, seguros y predecibles** utilizando GitHub Actions.

Esta skill gobierna **cuándo y cómo se valida, construye y despliega el código**, no la lógica de negocio ni la infraestructura final.

---

## 🧠 Responsabilidades
- Definir workflows de integración continua (CI).
- Asegurar validaciones automáticas antes de merge o deploy.
- Estandarizar pipelines de build, test y deploy.
- Garantizar seguridad básica en el pipeline.
- Evitar regresiones mediante automatización obligatoria.

---

## 📐 Reglas de Diseño

### Principios Generales
- Ningún código se integra a `main` sin pasar CI.
- Los workflows deben ser **deterministas** y **reproducibles**.
- Fallos en CI **bloquean merges**.
- CI debe ser rápido, CD puede ser gradual.

---

### Triggers de Workflow
- `pull_request`:
  - lint
  - tests
  - build
- `push` a `main`:
  - tests
  - build
  - deploy (si aplica)
- Triggers manuales (`workflow_dispatch`) solo para operaciones controladas.

---

### Validaciones Obligatorias en CI
- Instalación limpia de dependencias.
- Linting del código.
- Tests automáticos definidos en `testing_standard`.
- Build exitoso del proyecto.

Si alguna validación falla:
- el workflow debe fallar explícitamente
- no se permite continuar el pipeline

---

### Seguridad en CI/CD
- Secrets **solo** en GitHub Secrets.
- Nunca hardcodear credenciales.
- Permisos mínimos en `GITHUB_TOKEN`.
- No imprimir secrets en logs.
- Usar actions oficiales o auditadas.

---

### Convenciones de Workflows
- Ubicación: `.github/workflows/`
- Un workflow por responsabilidad clara.
- Naming explícito:
  - `ci.yml`
  - `deploy.yml`
- Pasos descriptivos y ordenados.

---

### Deploy (si aplica)
- Deploy solo desde ramas permitidas.
- Separar claramente CI (validación) de CD (deploy).
- El pipeline debe fallar si el deploy no es exitoso.
- Rollback debe ser posible o documentado.

---

## 📦 Entregables Esperados
- Archivo(s) de workflow en `.github/workflows/`
- Triggers definidos y documentados
- Jobs y steps claros
- Validaciones explícitas (lint, test, build)
- Uso correcto de secrets
- Condiciones de deploy documentadas

---

## 🧪 Checklist de Validación
- [ ] ¿Existe al menos un workflow de CI?
- [ ] ¿CI corre en `pull_request`?
- [ ] ¿Los tests bloquean merges si fallan?
- [ ] ¿Los workflows son reproducibles?
- [ ] ¿Los secrets están protegidos?
- [ ] ¿Los permisos son mínimos?
- [ ] ¿Deploy está separado o claramente definido?
- [ ] ¿Los fallos detienen el pipeline?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se configura o modifica CI/CD
- se agregan workflows de GitHub Actions
- se define deploy automático
- se introducen validaciones obligatorias

---

## 🚫 Fuera de Alcance
- Definición de infraestructura (VPS, cloud, etc.).
- Implementación de lógica de negocio.
- Configuración específica de servicios externos.
- Monitoreo post-deploy.
