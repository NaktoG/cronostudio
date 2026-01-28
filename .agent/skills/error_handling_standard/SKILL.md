---
name: error_handling_standard
description: Estándar unificado de manejo de errores para backend, frontend y automatizaciones
trigger:
  - error
  - errors
  - status_code
  - http_error
  - exception
  - error_code
scope: global
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - api_design_backend
  - logging_standard
---

## 🎯 Propósito
Definir un **estándar único y consistente de manejo de errores** para todo el sistema, garantizando:
- errores predecibles
- mensajes claros para humanos
- códigos estables para máquinas
- trazabilidad y recuperación controlada

Esta skill gobierna **cómo se representan, propagan y consumen los errores**, no dónde se originan.

---

## 🧠 Responsabilidades
- Definir la estructura canónica de errores.
- Establecer convenciones de `error.code` estables.
- Unificar el manejo de errores entre backend, frontend y workflows.
- Definir cuándo un error es recuperable o fatal.
- Evitar errores silenciosos o ambiguos.
- Garantizar que los errores sean accionables.

---

## 📐 Reglas de Manejo de Errores (obligatorias)

### Estructura Canónica de Error
Todo error expuesto fuera de un límite interno debe respetar esta estructura:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      {
        "path": "fieldName",
        "issue": "must be an email"
      }
    ],
    "requestId": "req_123"
  }
}
```

Reglas:
- `code` es obligatorio y **machine-readable**.
- `message` es obligatorio y **human-readable**.
- `details` es opcional, pero recomendado para validación.
- `requestId` es obligatorio cuando exista logging o tracing.

---

### Clasificación de Errores
Los errores deben clasificarse explícitamente:

- **VALIDATION_ERROR**: input inválido o incompleto.
- **AUTH_ERROR**: autenticación o autorización fallida.
- **NOT_FOUND**: recurso inexistente.
- **CONFLICT**: estado inválido o duplicado.
- **RATE_LIMITED**: límite de uso excedido.
- **EXTERNAL_DEPENDENCY_ERROR**: fallo en servicio externo.
- **INTERNAL_ERROR**: error inesperado no recuperable.

Los códigos deben ser:
- estables en el tiempo
- documentados
- no dependientes del mensaje

---

### Propagación de Errores
- Los errores deben propagarse **sin perder su `error.code`**.
- Nunca lanzar errores genéricos sin clasificación.
- No exponer stack traces ni detalles internos a consumidores.
- Los límites del sistema (API, UI, workflows) deben traducir errores internos al formato estándar.

---

### Errores Recuperables vs Fatales
- **Recuperables**:
  - timeouts temporales
  - errores de dependencias externas
  - rate limits
- **Fatales**:
  - errores de validación
  - errores de autorización
  - inconsistencias de dominio

El comportamiento ante errores recuperables debe estar explícitamente definido (retry, fallback, abort).

---

### Frontend
- El frontend **no interpreta strings**, interpreta `error.code`.
- El `message` se muestra al usuario.
- El `code` gobierna:
  - UI states
  - retries
  - feedback visual
- Nunca mostrar mensajes técnicos al usuario final.

---

### Automatizaciones / Workflows
- Todo workflow debe:
  - capturar errores
  - clasificar errores
  - decidir retry / fallback / abort
- Nunca ignorar errores silenciosamente.
- Los errores deben ser persistidos o logueados.

---

## 📦 Entregables Esperados
- Definición de `error.code` para cada caso de uso.
- Documentación de errores expuestos públicamente.
- Manejo explícito de errores recuperables.
- Consumo consistente de errores en frontend.
- Logs con `requestId` cuando aplique.

---

## 🧪 Checklist de Validación
- [ ] ¿El error sigue la estructura canónica?
- [ ] ¿Existe un `error.code` estable?
- [ ] ¿El mensaje es entendible para humanos?
- [ ] ¿No se filtran detalles internos?
- [ ] ¿El frontend usa `error.code` y no strings?
- [ ] ¿Los workflows capturan y clasifican errores?
- [ ] ¿Se define retry o fallback cuando aplica?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se introduce un nuevo tipo de error
- se maneja una excepción
- se define validación o fallback
- se integran servicios externos
- se diseñan flujos con retry

---

## 🚫 Fuera de Alcance
- Implementación concreta de logging.
- Elección de herramientas de observabilidad.
- Mensajes específicos por producto.
- Detalles de infraestructura.
