---
name: tech_debt_todos
description: Gestión explícita, visible y priorizada de deuda técnica y TODOs
trigger:
  - todo
  - tech_debt
  - deuda_tecnica
  - refactor
  - pendiente
  - cleanup
scope: cross
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - docs_readme_runbooks
---

## 🎯 Propósito
Asegurar que toda **deuda técnica**, decisiones postergadas y trabajo pendiente quede **explícitamente documentado**, priorizado y rastreable.

Esta skill evita TODOs invisibles, deuda implícita y pérdida de contexto en el tiempo.

---

## 🧠 Responsabilidades
- Detectar deuda técnica durante diseño, implementación o revisión.
- Documentar TODOs de forma estructurada y accionable.
- Clasificar deuda por tipo, impacto y prioridad.
- Mantener la deuda visible y accesible para el equipo.
- Evitar que decisiones temporales se vuelvan permanentes sin registro.

---

## 📐 Reglas de Gestión (obligatorias)

### Qué se considera deuda técnica
- Código temporal o workaround.
- Falta de tests intencional.
- Decisiones de diseño postergadas.
- Hardcodes, flags temporales o mocks.
- Refactors necesarios no abordados.
- Falta de documentación relevante.

---

### Dónde se documenta
- Nunca solo en comentarios sueltos.
- La deuda debe registrarse en al menos uno:
  - archivo TODO.md
  - sección de Tech Debt en README o RUNBOOK
  - issue/ticket (si existe tracker)

---

### Formato de registro (obligatorio)
Cada entrada de deuda debe incluir:

```md
- [ ] Descripción clara del problema
  - Contexto: por qué existe
  - Impacto: bajo | medio | alto
  - Riesgo: funcional | performance | seguridad | mantenimiento
  - Acción sugerida: qué debería hacerse
  - Momento ideal: cuándo resolverlo
```

---

### Prioridad
- La deuda debe clasificarse explícitamente:
  - P1: crítica (bloquea o es riesgosa)
  - P2: importante (afecta calidad o escalabilidad)
  - P3: menor (mejora futura)

---

### Regla anti-olvido
- Ninguna deuda puede quedar solo en la cabeza.
- Ningún TODO puede ser implícito.
- Si no se puede resolver ahora, **se documenta ahora**.

---

## 📦 Entregables Esperados
- Registro actualizado de deuda técnica.
- TODOs claros, accionables y priorizados.
- Contexto suficiente para que otro desarrollador lo entienda.
- Referencia cruzada si aplica (archivo, módulo, endpoint).

---

## 🧪 Checklist de Validación
- [ ] ¿La deuda está documentada explícitamente?
- [ ] ¿Se entiende el contexto y el impacto?
- [ ] ¿Tiene prioridad asignada?
- [ ] ¿Existe acción sugerida?
- [ ] ¿Es rastreable y visible para el equipo?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se detecta deuda técnica o workaround
- se deja un TODO intencional
- se posterga una decisión de diseño
- se omite algo por tiempo o alcance

---

## 🚫 Fuera de Alcance
- Resolver la deuda técnica.
- Priorizar roadmap o planning global.
- Decidir cuándo se ejecuta (solo documentar).
