---
name: ui_design_system_standard
description: Definición, composición y consistencia de interfaces UI orientadas a producto
trigger:
  - ui
  - component
  - screen
  - layout
  - design
  - figma
  - ux
scope: frontend
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - testing_standard
---

## 🎯 Propósito
Definir y mantener **interfaces de usuario coherentes, reutilizables y orientadas a producto**, asegurando consistencia visual, semántica y de comportamiento entre pantallas y componentes.

Esta skill gobierna **qué UI se construye y cómo se compone**, no la implementación técnica específica.

---

## 🧠 Responsabilidades
- Definir estructura de pantallas y layouts.
- Componer componentes reutilizables y consistentes.
- Asegurar coherencia visual (spacing, colores, tipografía).
- Garantizar estados explícitos (loading, empty, error).
- Alinear la UI con el flujo real del usuario y el objetivo del producto.

---

## 📐 Reglas de Diseño (obligatorias)

### Composición de UI
- Toda pantalla debe componerse a partir de **componentes reutilizables**.
- No duplicar componentes con variaciones mínimas.
- Cada componente tiene una única responsabilidad visual/funcional.

---

### Estados de Interfaz
Toda vista o componente que consuma datos **debe** contemplar:
- `loading`
- `empty`
- `error`
- `success`

Nunca se asume estado implícito.

---

### Naming y Semántica
- Componentes en **PascalCase**.
- Props semánticas, no técnicas.
  - Correcto: `isDisabled`, `hasError`
  - Incorrecto: `flag1`, `tmpValue`
- El nombre refleja **qué representa**, no cómo se implementa.

---

### Consistencia Visual
- Usar tokens de diseño centralizados.
- Spacing, colores y tipografía no se definen ad-hoc.
- Variantes explícitas (`primary`, `secondary`, `danger`).

---

### UX y Flujo
- Una pantalla = un objetivo principal.
- Un CTA dominante por vista.
- Feedback visual inmediato ante acciones del usuario.
- Evitar saturación visual y cognitiva.

---

## 📦 Entregables Esperados (por pantalla o componente)
- Objetivo de la vista/componente (1 frase).
- Jerarquía visual clara.
- Lista de componentes utilizados o creados.
- Estados definidos (loading/empty/error).
- Interacciones principales documentadas.

---

## 🧪 Checklist de Validación
- [ ] ¿La pantalla tiene un objetivo claro?
- [ ] ¿Los componentes son reutilizables?
- [ ] ¿Existen estados explícitos?
- [ ] ¿El naming es semántico y consistente?
- [ ] ¿La UI respeta tokens y sistema de diseño?
- [ ] ¿El flujo es claro para el usuario?
- [ ] ¿Hay un CTA principal identificable?

---

## 🔁 Auto-invocación (obligatoria)
Activar esta skill cuando:
- se crea o modifica una pantalla
- se crea o ajusta un componente UI
- se definen layouts o flujos de usuario
- se conectan vistas con lógica de negocio

---

## 🚫 Fuera de Alcance
- Implementación técnica específica (framework, CSS, librerías).
- Lógica de negocio.
- Acceso a APIs o datos.
- Decisiones de infraestructura.
