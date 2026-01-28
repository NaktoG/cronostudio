---
name: frontend_data_fetching_patterns
description: Patrones estándar para obtención, cacheo y sincronización de datos en frontend
trigger:
  - fetch
  - data_fetching
  - api_call
  - hook
  - server_component
  - client_component
  - cache
scope: frontend
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - api_design_backend
  - error_handling_standard
---

## 🎯 Propósito
Definir **patrones claros y obligatorios de data fetching en frontend** para asegurar:
- consumo consistente de APIs
- separación clara de responsabilidades
- manejo correcto de estados
- sincronización estable con el backend

Esta skill gobierna **cómo y dónde se obtienen los datos**, no el diseño visual ni la lógica de dominio.

---

## 🧠 Responsabilidades
- Establecer dónde vive el data fetching.
- Definir separación entre services, hooks y componentes.
- Unificar manejo de estados de carga, error y vacío.
- Garantizar consumo estricto de contratos backend.
- Evitar fetching inconsistente o duplicado.

---

## 📐 Reglas de Data Fetching

### Separación de Capas
- **Services**: llamadas HTTP puras.
- **Hooks**: orquestan fetching y estados.
- **Components**: renderizan UI.

Nunca realizar fetch directo dentro de componentes de UI.

---

### Server vs Client
- Server Components: lectura inicial, SEO.
- Client Components: mutaciones e interacciones.

---

### Estados Obligatorios
Todo consumo de datos debe manejar:
- loading
- error
- empty
- success

---

### Manejo de Errores
- El frontend usa `error.code`, no strings.
- Nunca silenciar errores.

---

### Cache e Invalicación
- Cache explícito.
- Mutaciones invalidan datos relacionados.

---

### Reintentos
- Reintentos limitados y con backoff.
- No reintentar validación o auth.

---

## 📦 Entregables Esperados
- Services de datos.
- Hooks reutilizables.
- Estados manejados explícitamente.

---

## 🧪 Checklist de Validación
- [ ] Fetch fuera del componente UI
- [ ] Separación clara de capas
- [ ] Estados manejados
- [ ] Uso de `error.code`
- [ ] Cache definido

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se consume una API en frontend
- se crean hooks de datos
- se define cache o invalidación

---

## 🚫 Fuera de Alcance
- Elección de librerías específicas.
- Implementación concreta de cache.
- Diseño visual.
