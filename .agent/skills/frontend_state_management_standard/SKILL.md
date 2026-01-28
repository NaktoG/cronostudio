---
name: frontend_state_management_standard
description: Estándar de gestión de estado en frontend para aplicaciones escalables y predecibles
trigger:
  - state
  - ui_state
  - global_state
  - local_state
  - optimistic_update
  - refactor_frontend
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
  - api_design_backend
  - error_handling_standard
---

## 🎯 Propósito
Definir un **estándar claro y disciplinado de gestión de estado en frontend** para evitar complejidad innecesaria, estados inconsistentes y bugs difíciles de depurar.

Esta skill gobierna **qué es estado, dónde vive y cómo se sincroniza**, no la librería concreta utilizada.

---

## 🧠 Responsabilidades
- Definir la separación entre estado local, global y derivado.
- Evitar duplicación de estado.
- Establecer reglas para sincronización UI ↔ backend.
- Definir uso correcto de optimistic updates.
- Mantener el estado predecible y depurable.
- Reducir re-renders y efectos colaterales.

---

## 📐 Reglas de Gestión de Estado

### Tipos de Estado
Todo estado debe clasificarse explícitamente como:

- **Estado Local**
  - Vive en el componente.
  - No se comparte.
  - Ejemplo: toggle, input, modal abierto.

- **Estado Global**
  - Compartido entre múltiples vistas.
  - Debe ser mínimo.
  - Ejemplo: sesión, usuario autenticado, flags.

- **Estado Derivado**
  - Calculado a partir de otros estados.
  - Nunca se persiste.
  - Ejemplo: filtros aplicados, contadores.

---

### Reglas Generales
- No duplicar estado local en estado global.
- No almacenar datos remotos crudos como estado global.
- El estado debe tener **una única fuente de verdad**.
- Eliminar estado antes de agregar uno nuevo.
- Preferir derivar antes que almacenar.

---

### Sincronización con Backend
- El backend es la fuente de verdad de los datos persistentes.
- El frontend refleja estado remoto, no lo reemplaza.
- Actualizaciones deben manejar loading, success y error.
- El estado debe resetearse ante errores no recuperables.

---

### Optimistic Updates
- Solo aplicar cuando el fallo es poco probable.
- Debe existir rollback explícito.
- Nunca asumir éxito silenciosamente.

---

### Qué NO es Estado
No se debe guardar como estado:
- datos derivados
- constantes
- props sin modificación
- resultados de cálculos simples
- flags temporales sin impacto UI

---

### Principios de Calidad
- El estado debe ser predecible y serializable.
- Debe ser fácil de resetear.
- Menos estado implica menos bugs.

---

## 📦 Entregables Esperados
- Clasificación clara de estados.
- Estado global mínimo y justificado.
- Flujos de sincronización definidos.
- Uso consciente de optimistic updates.

---

## 🧪 Checklist de Validación
- [ ] ¿Cada estado tiene tipo definido?
- [ ] ¿Existe una única fuente de verdad?
- [ ] ¿No hay duplicación de estado?
- [ ] ¿El backend es autoridad?
- [ ] ¿Optimistic updates tienen rollback?
- [ ] ¿El estado es fácil de depurar?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se introduce nuevo estado en frontend
- se añade estado global
- se implementan optimistic updates
- se refactoriza lógica de UI

---

## 🚫 Fuera de Alcance
- Elección de librería de estado.
- Implementación concreta de hooks.
- Cache de datos remotos.
- Decisiones de backend.
