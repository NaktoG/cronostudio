---
name: git_github_flow
description: Estándar operativo para flujo de trabajo Git y GitHub (branches, commits, PRs y releases)
trigger:
  - git
  - github
  - branch
  - commit
  - pull_request
  - pr
  - merge
  - release
scope: repository
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - pr_expert
---

## 🎯 Propósito
Definir un **flujo Git/GitHub consistente, predecible y auditable** para todos los repositorios, asegurando calidad, trazabilidad y colaboración segura.

Esta skill gobierna **cómo se trabaja con Git y GitHub**, no **qué código se escribe**.

---

## 🧠 Responsabilidades
- Definir estrategia de ramas obligatoria.
- Establecer convenciones de commits.
- Regular el uso de Pull Requests.
- Definir reglas de merge y releases.
- Garantizar trazabilidad entre cambios, PRs y versiones.
- Reducir errores humanos en flujos colaborativos.

---

## 🌳 Estrategia de Ramas

### Ramas principales
- `main`: rama estable, siempre deployable.
- `develop` (opcional): integración previa a `main`.

### Ramas de trabajo
- `feature/*`: nuevas funcionalidades.
- `fix/*`: correcciones de bugs.
- `chore/*`: tareas técnicas, refactors, tooling.
- `hotfix/*`: correcciones urgentes en producción.

Reglas:
- Nunca trabajar directamente sobre `main`.
- Toda rama debe nacer desde `main` o `develop`.
- El nombre debe ser descriptivo y corto.

---

## ✍️ Convención de Commits
Se utiliza **Conventional Commits**:

Formato:
```
type(scope): short description
```

Tipos permitidos:
- `feat`: nueva funcionalidad
- `fix`: bugfix
- `chore`: mantenimiento
- `refactor`: refactor sin cambio funcional
- `test`: tests
- `docs`: documentación
- `ci`: CI/CD
- `perf`: mejoras de performance

Reglas:
- Mensajes en inglés.
- Imperativo presente.
- Un commit = un cambio lógico.

---

## 🔀 Pull Requests (PR)

### Reglas obligatorias
- Todo cambio entra vía PR.
- Un PR debe tener:
  - título claro
  - descripción del cambio
  - contexto del porqué
- PR pequeño > PR gigante.

### Checklist mínimo del PR
- [ ] Compila y pasa tests
- [ ] No rompe contratos existentes
- [ ] Código legible y consistente
- [ ] Impacto documentado (si aplica)

---

## 🔒 Reglas de Merge
- Merge solo vía GitHub (no local).
- Estrategia preferida:
  - `Squash and merge` para features/fixes.
  - `Merge commit` para ramas largas (si aplica).
- No se permite merge con checks fallando.

---

## 🏷️ Versionado y Releases
## 🏷️ Versionado y Releases
- Las reglas de versionado (SemVer), releases y changelog se definen exclusivamente en `release_versioning_changelog`.
- **Regla de oro**: No deployar a producción sin versión/tag definido.

---

## 📦 Entregables Esperados
- Ramas con naming correcto.
- Commits siguiendo convención.
- Pull Requests documentados.
- Historial Git limpio y trazable.
- Tags de versión coherentes.

---

## 🧪 Checklist de Validación
- [ ] ¿La rama sigue la estrategia definida?
- [ ] ¿El commit sigue Conventional Commits?
- [ ] ¿El cambio entra por PR?
- [ ] ¿El PR es pequeño y entendible?
- [ ] ¿Los checks automáticos pasan?
- [ ] ¿El merge respeta la estrategia?
- [ ] ¿La versión/release es coherente?

---

## 🔁 Auto-invocación
Esta skill debe activarse automáticamente cuando:
- se crean o renombran ramas
- se realizan commits
- se abre o revisa un Pull Request
- se realiza un merge
- se crea una release o tag

---

## 🚫 Fuera de Alcance
- Implementación de CI/CD específico (delegar a `ci_cd_github_actions`).
- Reglas de calidad de código internas.
- Decisiones de arquitectura o negocio.
- Gestión de issues o roadmap.
