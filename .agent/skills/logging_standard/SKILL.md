---
name: logging_standard
description: Estándar unificado de logging estructurado, trazable y seguro para backend y automatizaciones
trigger:
  - logging
  - audit
  - request_id
  - correlation_id
scope: system
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - security_owasp_auth
---

## 🎯 Propósito
Definir un **estándar único de logging** que permita observar, depurar y auditar el sistema sin exponer información sensible ni introducir ruido innecesario.

El logging es una **herramienta operativa**, no un mecanismo de debugging informal.

---

## 🧠 Responsabilidades
- Definir qué se loguea y qué **no** se loguea.
- Establecer formato estructurado y consistente.
- Garantizar trazabilidad entre requests, jobs y workflows.
- Facilitar debugging en producción sin exponer datos sensibles.
- Servir como base para métricas, alertas y auditoría.

---

## 📐 Reglas de Logging (obligatorias)

### Principios generales
- Todo log debe tener **contexto mínimo pero suficiente**.
- Logs deben ser **estructurados** (JSON), no texto libre.
- Cada evento relevante debe generar **un solo log claro**.
- No usar logs como mecanismo de control de flujo.

---

### Niveles de Log
Usar exclusivamente los siguientes niveles:

- `debug`: información detallada solo para desarrollo.
- `info`: eventos normales del sistema.
- `warn`: situaciones anómalas no críticas.
- `error`: fallos controlados que afectan una operación.
- `fatal`: fallos irrecuperables que detienen el sistema.

No inventar niveles adicionales.

---

### Formato estándar del Log
Todo log debe seguir esta estructura mínima:

```json
{
  "level": "info",
  "message": "Invitation sent",
  "context": {
    "requestId": "req_123",
    "userId": "usr_456",
    "entity": "invitation",
    "entityId": "inv_789",
    "action": "send"
  },
  "timestamp": "ISO-8601"
}
```

Reglas:
- `message`: corto, humano y descriptivo.
- `context`: solo datos relevantes para trazabilidad.
- `timestamp`: siempre en formato ISO-8601.

---

### Request / Trace ID
- Todo request, job o workflow debe tener un `requestId`.
- El `requestId` debe propagarse entre:
  - API → servicios → automatizaciones (n8n).
- Nunca generar múltiples IDs para el mismo flujo.

---

### Errores y Excepciones
- Todo error debe loguearse con nivel `error`.
- El stack trace **no** debe exponerse en producción.
- El log debe incluir:
  - tipo de error
  - origen lógico
  - requestId
- El mensaje al cliente nunca debe incluir detalles internos.

---

### Datos Sensibles (prohibido)
Nunca loguear:
- contraseñas
- tokens
- cookies
- headers de autorización
- datos personales completos
- payloads sin sanitizar

Si un dato es sensible, se omite o se enmascara.

---

### Volumen y Ruido
- Evitar logs dentro de loops sin control.
- No loguear estados intermedios irrelevantes.
- Priorizar logs de:
  - entrada
  - salida
  - error
  - decisión relevante

---

## 📦 Entregables Esperados
- Convención de niveles de log aplicada.
- Formato estructurado consistente.
- Propagación de `requestId`.
- Logs sanitizados.
- Logs suficientes para reproducir un fallo.

---

## 🧪 Checklist de Validación
- [ ] ¿Todos los logs usan niveles estándar?
- [ ] ¿El formato es estructurado (JSON)?
- [ ] ¿Existe `requestId` en flujos relevantes?
- [ ] ¿No se exponen datos sensibles?
- [ ] ¿El volumen de logs es controlado?
- [ ] ¿Los errores están claramente identificados?
- [ ] ¿Los logs permiten reconstruir el flujo?

---

## 🔁 Auto-invocación (obligatoria)
Esta skill debe activarse cuando:
- se agregan logs nuevos
- se manejan errores o excepciones
- se crean endpoints, jobs o workflows
- se integran servicios externos
- se requiere observabilidad o auditoría

---

## 🚫 Fuera de Alcance
- Elección de proveedor de logging.
- Configuración de infraestructura de observabilidad.
- Visualización de métricas o dashboards.
- Alerting y monitoreo avanzado.
