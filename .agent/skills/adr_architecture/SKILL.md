---
name: adr_architecture
description: Crear y mantener ADRs (Architecture Decision Records) para decisiones estructurales del sistema
trigger:
  - adr
  - architecture
  - decision
  - design_decision
  - structural_change
  - refactor_architecture
  - module_boundary
  - dependency
  - layering
scope: architecture
auto_invoke: true
tools:
  - read
  - write
license: internal
author: Agent_Kit
version: 1.0
dependencies:
  - docs_readme_runbooks
  - tech_debt_todos
---

## 🎯 Propósito
Capturar decisiones de arquitectura de forma **explícita, versionable y revisable** para evitar conocimiento implícito y regresiones de diseño.

Un ADR describe **qué se decidió, por qué, y cuáles son las consecuencias**.

---

## 🧠 Responsabilidades
- Crear ADRs ante decisiones estructurales relevantes.
- Documentar alternativas consideradas y trade-offs.
- Registrar impacto en módulos, contratos y dependencias.
- Mantener historial de decisiones (sin reescribir la historia).
- Señalar riesgos, deuda técnica y próximos pasos.

---

## 📐 Reglas (obligatorias)
- Un ADR se crea **antes o junto con** el cambio arquitectónico (no después “cuando haya tiempo”).
- El ADR debe ser **corto, específico y accionable**.
- Prohibido “ADR genérico” sin decisión concreta.
- Si la decisión implica riesgo o deuda, **debe** registrarse explícitamente (delegar a `tech_debt_todos`).
- Si impacta contratos API o consumidores, coordinar con:
  - `api_design_backend`
  - `release_versioning_changelog`
- Si impacta seguridad, coordinar con:
  - `security_owasp_auth`
  - `privacy_data_handling`

---

## 🧾 Formato mínimo del ADR
Debe incluir estas secciones (en este orden):

1. **Título** (1 línea)
2. **Estado**: Proposed | Accepted | Deprecated | Superseded
3. **Contexto**
4. **Decisión**
5. **Alternativas consideradas**
6. **Consecuencias**
7. **Impacto** (módulos / APIs / datos / seguridad / performance)
8. **Plan de adopción** (si aplica)
9. **Referencias** (PRs, issues, docs)

---

## 📦 Entregables esperados
- ADR creado o actualizado.
- Decisión claramente formulada (1–3 bullets).
- Lista de impactos y riesgos.
- Enlace o referencia cruzada a PR/issue si aplica.

---

## 🧪 Checklist de validación
- [ ] ¿La decisión está expresada claramente en 1–3 bullets?
- [ ] ¿Se entiende el contexto sin leer el PR?
- [ ] ¿Se listan alternativas y por qué se descartaron?
- [ ] ¿Se explican consecuencias y trade-offs?
- [ ] ¿Se documenta impacto en módulos/contratos/seguridad?
- [ ] ¿Existe plan de adopción si el cambio es gradual?

---

## 🔁 Auto-invocación (obligatoria)
Esta skill **DEBE** activarse automáticamente cuando:
- se introduce un cambio estructural (capas, módulos, boundaries)
- se define una dependencia nueva significativa
- se decide una estrategia (cache, colas, eventos, modularización)
- se propone un refactor arquitectónico grande

---

## 🚫 Fuera de alcance
- Implementar el cambio técnico completo.
- Elegir herramientas específicas sin necesidad.
- Redactar documentación general del proyecto (delegar a `docs_readme_runbooks`).
EOF
