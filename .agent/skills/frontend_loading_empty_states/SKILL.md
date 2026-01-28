---
name: frontend_loading_empty_states
description: Estándar de manejo de estados de carga, vacío y deshabilitado en frontend
trigger:
  - loading
  - empty
  - skeleton
  - ui_state
  - async
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
  - error_handling_standard
---

## 🎯 Propósito
Definir un **estándar obligatorio** para el manejo de estados de interfaz relacionados con:
- carga de datos
- ausencia de datos
- acciones en progreso
- estados deshabilitados

Esta skill asegura **feedback inmediato**, **UX consistente** y **comportamiento predecible** en el frontend.

---

## 🧠 Responsabilidades
- Definir cuándo y cómo mostrar estados de loading.
- Establecer criterios claros para empty states.
- Evitar pantallas en blanco o cambios bruscos de UI.
- Garantizar feedback visual durante operaciones asíncronas.
- Unificar patrones de skeletons y placeholders.
- Mejorar percepción de rendimiento.

---

## 📐 Reglas de Estados (obligatorias)

### Loading State
- Todo fetch asíncrono debe tener estado de loading.
- El loading debe mostrarse **antes** de que el usuario perciba latencia.
- Preferir skeletons sobre spinners para contenido estructural.
- El loading debe reflejar la forma final del contenido.

Ejemplos válidos:
- tablas → skeleton de filas
- cards → skeleton de cards
- formularios → campos deshabilitados

---

### Empty State
- Un empty state **no es un error**.
- Se muestra cuando:
  - la respuesta es válida
  - pero no hay datos para mostrar
- Todo empty state debe incluir:
  - mensaje claro
  - explicación breve
  - acción sugerida (si aplica)

Nunca usar:
- pantallas en blanco
- mensajes genéricos tipo “No data”

---

### Disabled / Pending State
- Acciones en progreso deben:
  - deshabilitar el trigger
  - mostrar feedback visual
- Nunca permitir doble submit.
- El estado disabled debe ser reversible al finalizar la acción.

---

### Error vs Empty
- Error:
  - fallo en fetch
  - error.code presente
  - delegar presentación a `error_handling_standard`
- Empty:
  - fetch exitoso
  - data vacía
  - UI informativa

Nunca mezclar ambos estados.

---

### Consistencia
- El mismo tipo de contenido debe reutilizar el mismo patrón visual.
- No inventar estados ad-hoc por pantalla.
- Los estados deben vivir cerca de la lógica de datos, no del layout.

---

## 📦 Entregables Esperados
- Componentes reutilizables de loading.
- Empty states definidos por dominio.
- Estados disabled consistentes.
- Documentación visual o textual del patrón.
- Uso consistente en toda la aplicación.

---

## 🧪 Checklist de Validación
- [ ] ¿Toda operación asíncrona tiene loading?
- [ ] ¿El loading refleja la estructura final?
- [ ] ¿Los empty states son claros y accionables?
- [ ] ¿No existen pantallas en blanco?
- [ ] ¿No se confunden empty con error?
- [ ] ¿Se evita el doble submit?
- [ ] ¿El feedback visual es inmediato?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se consume data asíncrona
- se implementan listas o tablas
- se realizan acciones con latencia
- se diseñan nuevas pantallas
- se refactoriza UI existente

---

## 🚫 Fuera de Alcance
- Diseño visual específico.
- Implementación concreta de componentes.
- Animaciones o microinteracciones.
- Manejo de errores técnicos.
