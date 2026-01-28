---
name: pr_expert
description: Revisión experta de Pull Requests con foco en calidad, seguridad y coherencia arquitectónica
trigger:
  - pull_request
  - pr
  - code_review
  - review
  - diff
  - merge
scope: repository
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - testing_tdd_fdd
  - security_owasp_auth
---

## 🎯 Propósito
Garantizar que cada Pull Request que entra al repositorio cumpla los estándares de **calidad, seguridad, diseño y mantenibilidad** definidos por CronoStudio.

Esta skill gobierna **la evaluación y validación del cambio**, no la autoría del código.

---

## 🧠 Responsabilidades
- Revisar cambios de código a nivel funcional y estructural.
- Detectar problemas de arquitectura, acoplamiento o deuda técnica.
- Verificar impacto en seguridad, testing y contratos existentes.
- Asegurar coherencia con el stack, convenciones y reglas del repositorio.
- Emitir feedback claro, accionable y priorizado.

---

## 📐 Reglas de Revisión (obligatorias)

### Alcance del análisis
Cada PR debe evaluarse en:
- Corrección funcional.
- Claridad y legibilidad del código.
- Coherencia con la arquitectura existente.
- Impacto en consumidores (API, frontend, automatizaciones).
- Riesgos de seguridad evidentes.
- Cobertura mínima de testing (si aplica).

---

### Convenciones de revisión
- Revisar **el diff completo**, no solo los archivos principales.
- No aprobar PRs con:
  - código comentado innecesario
  - logs temporales
  - TODOs críticos sin tracking
- Evitar introducir deuda técnica sin documentación explícita.

---

### Seguridad
- Verificar:
  - validación de inputs
  - manejo de errores
  - exposición de datos sensibles
- Cualquier cambio en auth, sesiones o permisos debe delegar a `security_owasp_auth`.

---

### Testing
- Cambios en lógica deben:
  - incluir tests nuevos o
  - justificar explícitamente su ausencia
- No aceptar PRs que rompan tests existentes.

---

### Documentación
- Cambios relevantes deben reflejarse en:
  - README
  - RUNBOOK
  - docs técnicas (si aplica)

---

## 📦 Entregables Esperados (por PR)
- Resumen del objetivo del cambio.
- Lista de observaciones (clasificadas):
  - blocking
  - recommended
  - optional
- Identificación de riesgos potenciales.
- Decisión final:
  - approve
  - request changes
  - comment only

---

## 🧪 Checklist de Validación
- [ ] ¿El PR tiene un objetivo claro y acotado?
- [ ] ¿El código es legible y coherente con el repo?
- [ ] ¿No introduce breaking changes no versionados?
- [ ] ¿Se mantienen o mejoran los tests?
- [ ] ¿No expone datos sensibles ni vulnerabilidades obvias?
- [ ] ¿La documentación está actualizada si corresponde?
- [ ] ¿La deuda técnica está explícitamente documentada?

---

## 🔁 Auto-invocación
Esta skill debe activarse automáticamente cuando:
- se abre un Pull Request
- se solicita una code review
- se proponen cambios antes de un merge
- se revisan hotfixes o releases

---

## 🚫 Fuera de Alcance
- Escritura completa del código del PR.
- Decisiones de roadmap o prioridad de producto.
- Gestión de ramas o releases.
- Automatización CI/CD (delegar a `ci_cd_github_actions`).
