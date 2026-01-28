---
name: accessibility_a11y_standard
description: Estándar de accesibilidad (a11y) para interfaces frontend y experiencias de usuario
trigger:
  - accessibility
  - a11y
  - aria
  - keyboard
  - focus
  - form
scope: frontend
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:

  - frontend_app_logic
---

## 🎯 Propósito
Definir un **estándar mínimo obligatorio de accesibilidad (a11y)** para todas las interfaces, garantizando que el producto sea usable por personas con distintas capacidades y contextos.

Esta skill gobierna **cómo se diseñan y construyen interfaces accesibles**, no el diseño visual ni la implementación concreta de componentes.

---

## 🧠 Responsabilidades
- Establecer reglas base de accesibilidad para UI.
- Garantizar navegación usable con teclado.
- Asegurar feedback accesible para errores y estados.
- Definir convenciones para formularios accesibles.
- Evitar barreras comunes de accesibilidad.
- Alinear UI con buenas prácticas WCAG AA.

---

## 📐 Reglas de Accesibilidad (obligatorias)

### Navegación por Teclado
- Toda acción debe ser accesible con teclado.
- Orden de tabulación lógico y predecible.
- No bloquear `Tab`, `Shift+Tab`, `Enter`, `Esc`.
- Estados de foco **visibles** siempre.

---

### Semántica y Roles
- Usar elementos semánticos HTML siempre que sea posible.
- Evitar `div` y `span` para acciones interactivas.
- Usar roles ARIA **solo cuando la semántica nativa no sea suficiente**.
- No duplicar semántica (no mezclar botón + role button).

---

### Formularios
- Todo input debe tener `label` asociado.
- Errores deben:
  - ser visibles
  - ser anunciables (aria-live cuando aplique)
  - indicar claramente qué corregir
- No usar solo color para indicar error.
- Placeholder **no reemplaza** al label.

---

### Estados y Feedback
- Estados de loading, error y éxito deben ser perceptibles.
- Usar `aria-busy`, `aria-disabled`, `aria-live` cuando aplique.
- Feedback debe ser comprensible sin depender solo de iconos o color.

---

### Contraste y Legibilidad
- Contraste mínimo WCAG AA.
- Texto escalable sin romper layout.
- No bloquear zoom del navegador.
- Evitar texto embebido en imágenes.

---

### Componentes Reutilizables
- Componentes base deben ser accesibles por defecto.
- La accesibilidad no debe depender del consumidor del componente.
- Documentar comportamiento accesible esperado.

---

## 📦 Entregables Esperados
- Componentes accesibles por defecto.
- Formularios con validación accesible.
- Estados de error y feedback perceptibles.
- Navegación usable solo con teclado.
- Uso consistente de semántica HTML.

---

## 🧪 Checklist de Validación
- [ ] ¿La interfaz es usable solo con teclado?
- [ ] ¿Los estados de foco son visibles?
- [ ] ¿Todos los inputs tienen label?
- [ ] ¿Los errores son claros y accesibles?
- [ ] ¿El contraste cumple WCAG AA?
- [ ] ¿No se depende solo del color?
- [ ] ¿La semántica HTML es correcta?
- [ ] ¿ARIA se usa solo cuando es necesario?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se crea o modifica UI
- se construyen formularios
- se desarrollan componentes reutilizables
- se introducen estados de error o feedback
- se implementa navegación o flujos interactivos

---

## 🚫 Fuera de Alcance
- Diseño visual o branding.
- Elección de librerías de UI.
- Testing automatizado de accesibilidad.
- Cumplimiento legal específico por país.
