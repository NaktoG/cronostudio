---
name: n8n_workflows
description: Diseño, validación y gobierno de workflows de automatización en n8n
trigger:
  - n8n
  - workflow
  - automation
  - webhook
  - integration
  - async
scope: automation
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - security_owasp_auth
  - logging_standard
---

## 🎯 Propósito
Definir y gobernar workflows de **automatización en n8n** de forma segura, observable, reutilizable y alineada al dominio del negocio.

Esta skill gobierna **el diseño lógico del workflow**, no la infraestructura ni la implementación de clientes externos.

---

## 🧠 Responsabilidades
- Diseñar workflows claros, deterministas y mantenibles.
- Definir entradas (inputs) y salidas (outputs) explícitas.
- Controlar efectos secundarios y reintentos.
- Garantizar observabilidad mínima (logs y estados).
- Alinear automatizaciones con reglas de dominio.

---

## 📐 Reglas de Diseño

### Estructura del Workflow
- Cada workflow debe tener:
  - **Trigger explícito** (Webhook, Cron, Manual, etc.).
  - Flujo principal claro (happy path).
  - Manejo explícito de errores.
- Un workflow debe resolver **una sola responsabilidad**.
- No mezclar lógica de negocio compleja dentro de nodos individuales.

---

### Inputs y Outputs
- Todos los inputs deben estar documentados:
  - tipo
  - obligatoriedad
  - origen
- El output del workflow debe ser **predecible y estable**.
- No depender de datos implícitos del contexto de ejecución.

---

### Idempotencia y Reintentos
- Workflows que producen efectos (envíos, escrituras, pagos):
  - deben ser idempotentes **o**
  - definir comportamiento ante reintentos.
- Nunca duplicar acciones ante re-ejecuciones.

---

### Manejo de Errores
- Los errores deben:
  - ser capturados explícitamente
  - clasificarse (validación, externo, inesperado)
- No exponer secretos ni stack interno.
- Los workflows deben finalizar en estado conocido.

---

### Observabilidad
- Todo workflow debe:
  - loggear eventos clave (inicio, éxito, fallo)
  - devolver estado final al consumidor si aplica
- Correlation / request ID debe propagarse cuando exista.

---

### Seguridad
- Secrets y credenciales:
  - siempre en credenciales de n8n o variables de entorno
  - nunca hardcodeados en nodos
- Validar inputs provenientes de webhooks.
- Delegar reglas profundas a `security_owasp_auth`.

---

## 📦 Entregables Esperados (por workflow)
- Nombre del workflow
- Trigger definido
- Inputs esperados (schema lógico)
- Outputs esperados
- Descripción del flujo principal
- Manejo de errores definido
- Comportamiento ante reintentos
- Ejemplo de payload de entrada y salida

---

## 🧪 Checklist de Validación
- [ ] ¿El workflow tiene una responsabilidad única?
- [ ] ¿El trigger está claramente definido?
- [ ] ¿Inputs y outputs son explícitos y estables?
- [ ] ¿Existe manejo de errores?
- [ ] ¿Idempotencia o reintentos están definidos?
- [ ] ¿Hay logs o estados observables?
- [ ] ¿No hay secretos hardcodeados?
- [ ] ¿La automatización respeta el dominio?

---

## 🔁 Auto-invocación
Esta skill debe activarse automáticamente cuando:
- se crea o modifica un workflow de n8n
- se define un webhook o trigger asíncrono
- se agregan integraciones externas
- se automatizan procesos de negocio

---

## 🚫 Fuera de Alcance
- Infraestructura de n8n o despliegue.
- Implementación de APIs externas.
- Lógica de negocio compleja.
- Decisiones de frontend.
