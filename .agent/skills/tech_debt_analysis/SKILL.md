---
name: tech_debt_analysis
description: Detectar, clasificar y documentar deuda técnica derivada de decisiones o cambios (impacto, riesgo y plan)
trigger:
  - tech_debt_analysis
  - technical_debt
  - tech_debt
  - risk
  - tradeoff
  - shortcut
  - workaround
  - refactor
  - cleanup
  - maintainability
  - complexity
scope: cross
auto_invoke: true
tools:
  - read
  - write
license: internal
author: Agent_Kit
version: 1.0
dependencies:
  - tech_debt_todos
  - docs_readme_runbooks
---

## 🎯 Propósito
Convertir deuda técnica en algo **visible, trazable y accionable**.

Esta skill no “arregla” la deuda: la **identifica**, la **clasifica** y la deja registrada con **plan mínimo**.

---

## 🧠 Responsabilidades
- Detectar deuda técnica durante diseño, implementación o revisión.
- Clasificar la deuda por **tipo**, **impacto** y **prioridad**.
- Documentar trade-offs (qué se gana / qué se pierde).
- Definir “señales de alarma” que indiquen cuándo explota (riesgo).
- Proponer mitigaciones y un plan incremental (siguiente paso pequeño).

---

## 📐 Reglas (obligatorias)
- Si existe deuda: **se documenta hoy**, no “después”.
- La deuda debe quedar en un lugar rastreable:
  - Issue / checklist / TODO estructurado (delegar a `tech_debt_todos`)
  - Documentación técnica si aplica (delegar a `docs_readme_runbooks`)
- Prohibido “deuda vaga” tipo: *“esto está feo”*. Debe incluir:
  - Qué es
  - Dónde está
  - Por qué duele
  - Qué rompe si crece
- Si la deuda impacta seguridad, **delegar** a `security_owasp_auth` / `privacy_data_handling`.
- Si la deuda impacta performance, **coordinar** con `performance_frontend_budget` u observabilidad.

---

## 🧾 Plantilla mínima de registro (obligatoria)
Cada item de deuda debe incluir:

- **Título**
- **Tipo**: arquitectura | testing | performance | seguridad | DX | observabilidad | datos | frontend | devops
- **Ubicación**: módulo / archivo / endpoint / flujo
- **Causa / Trade-off**: por qué se aceptó
- **Impacto**: bajo | medio | alto
- **Riesgo**: qué puede salir mal y cómo se detecta
- **Mitigación mínima**: acción más chica posible
- **Plan**: 1–3 pasos, con orden sugerido

---

## 📦 Entregables esperados
- Lista de deudas detectadas (con la plantilla mínima).
- Priorización (Top 3 por impacto).
- Recomendación de siguiente acción (1 paso).

---

## 🧪 Checklist de validación
- [ ] ¿Cada item tiene ubicación exacta?
- [ ] ¿Está claro el trade-off?
- [ ] ¿Tiene impacto y riesgo definidos?
- [ ] ¿Existe mitigación mínima realista?
- [ ] ¿Está creado/actualizado el registro en `tech_debt_todos`?

---

## 🔁 Auto-invocación (obligatoria)
Esta skill **DEBE** activarse automáticamente cuando:
- se acepta un atajo/shortcut por tiempo
- se introduce acoplamiento o complejidad notable
- se pospone testing o validación
- se detecta falta de observabilidad o trazabilidad
- se reporta “esto lo arreglamos luego”

---

## 🚫 Fuera de alcance
- Resolver la deuda técnica completa.
- Priorizar roadmap global (solo sugerir).
- Cambiar stack o arquitectura por cuenta propia (coordinar con `adr_architecture` si aplica).
EOF
