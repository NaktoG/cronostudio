---
name: frontend_app_logic
description: Lógica de aplicación frontend, consumo de APIs y manejo de estados de UI
trigger:
  - ui_logic
  - api_client
  - hook
  - state
  - form
  - validation
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
  - security_owasp_auth
  - testing_standard
---

## 🎯 Propósito
Definir las **reglas de lógica de aplicación en frontend**, garantizando una integración consistente con el backend, manejo correcto de estados de UI y validación previa al envío de datos.

Esta skill gobierna **cómo el frontend consume contratos**, maneja errores y estados, y organiza su lógica, no el diseño visual.

---

## 🧠 Responsabilidades
- Consumir APIs respetando contratos definidos.
- Centralizar la lógica de acceso a datos.
- Manejar estados de UI de forma consistente.
- Normalizar errores provenientes del backend.
- Validar datos antes de enviarlos.
- Separar lógica de negocio frontend de componentes visuales.

---

## 📐 Reglas de Diseño (obligatorias)

### Consumo de API
- Todo acceso a backend debe realizarse mediante:
  - services o api clients
  - hooks de datos (no directamente en componentes)
- Nunca hacer fetch directo dentro de componentes visuales.
- Cada endpoint debe mapearse a una función explícita.

---

### Manejo de Estados
Todo flujo de datos debe contemplar explícitamente:
- loading
- success
- error
- empty

Los estados deben ser:
- explícitos
- predecibles
- reutilizables

---

### Manejo de Errores
- Los errores deben parsearse según `error.code` del backend.
- No mostrar mensajes crudos del servidor.
- Mapear errores técnicos a mensajes entendibles.
- Diferenciar:
  - errores de validación
  - errores de permisos
  - errores inesperados

---

### Validación de Datos
- Validar inputs **antes** de enviar al backend.
- No confiar en validación backend para UX.
- Mantener validación sincronizada con el contrato.
- No duplicar reglas complejas de negocio.

---

### Organización del Código
- Separar claramente:
  - components (presentación)
  - hooks (estado y lógica)
  - services (API / side effects)
- Los componentes no contienen lógica de dominio.
- La lógica debe ser testeable en aislamiento.

---

### Autenticación y Guards
- Proteger rutas mediante guards explícitos.
- No asumir estado de sesión válido.
- Delegar reglas profundas a `security_owasp_auth`.

---

## 📦 Entregables Esperados
- Servicios de acceso a API por dominio.
- Hooks reutilizables con estados explícitos.
- Manejo uniforme de loading/error/empty.
- Validación previa a requests.
- Mapeo consistente de errores.

---

## 🧪 Checklist de Validación
- [ ] ¿El consumo de API está centralizado?
- [ ] ¿No hay fetch directo en componentes?
- [ ] ¿Todos los estados están contemplados?
- [ ] ¿Los errores están normalizados?
- [ ] ¿La validación ocurre antes del envío?
- [ ] ¿La lógica está separada del UI?
- [ ] ¿La lógica es testeable?

---

## 🔁 Auto-invocación (obligatoria)
Activar esta skill cuando:
- se consume o modifica un endpoint en frontend
- se crean hooks o services de datos
- se maneja estado asíncrono
- se implementa validación de formularios
- se integran flujos frontend-backend

---

## 🚫 Fuera de Alcance
- Diseño visual y estilos (delegar a `ui_design_system_standard`).
- Implementación de backend.
- Configuración de herramientas de build.
- Decisiones de infraestructura.
- Testing de UI visual.
