---
name: observability_tracing
description: Definición y estandarización de observabilidad, logging estructurado y tracing distribuido
trigger:
  - observability
  - tracing
  - metrics
  - monitoring
  - debug
scope: cross
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - logging_standard
  - security_owasp_auth
---

## 🎯 Propósito
Definir reglas claras y consistentes para **observabilidad**, incluyendo **logging estructurado**, **tracing distribuido** y **correlación de eventos**, con el objetivo de diagnosticar problemas, auditar comportamiento y operar el sistema en producción de forma confiable.

Esta skill gobierna **qué se observa y cómo se correlaciona**, no la herramienta concreta utilizada.

---

## 🧠 Responsabilidades
- Establecer convenciones de logging estructurado.
- Definir uso obligatorio de `requestId` / `traceId`.
- Garantizar correlación entre frontend, backend y automatizaciones.
- Definir qué eventos deben loguearse y cuáles no.
- Asegurar que los logs no filtren información sensible.
- Facilitar debugging y auditoría en producción.

---

## 📐 Reglas de Observabilidad (obligatorias)

### Identificadores de Correlación
- Toda request debe tener un `requestId` único.
- Si el sistema participa en flujos distribuidos, debe existir un `traceId`.
- `requestId` y `traceId` deben:
  - propagarse entre servicios
  - incluirse en logs y errores
  - devolverse al consumidor cuando aplique

---

### Logging Estructurado
- Logs siempre en formato estructurado (JSON o equivalente).
- Campos mínimos obligatorios:
  - `level`
  - `message`
  - `timestamp`
  - `service`
  - `requestId`
- Campos recomendados:
  - `traceId`
  - `userId` (si aplica)
  - `action`
  - `durationMs`

---

### Niveles de Log
- `debug`: información detallada para desarrollo.
- `info`: eventos normales del sistema.
- `warn`: estados anómalos no fatales.
- `error`: fallos esperados o controlados.
- `fatal`: fallos críticos que requieren intervención inmediata.

---

### Errores y Excepciones
- Todo error debe:
  - loguearse una sola vez
  - incluir contexto mínimo necesario
  - referenciar `requestId`
- Nunca loguear:
  - passwords
  - tokens
  - secrets
  - datos personales sensibles

---

### Tracing Distribuido
- Los límites de cada operación deben ser trazables:
  - inicio
  - fin
  - duración
- Operaciones largas o críticas deben registrar spans.
- Integraciones externas deben:
  - generar spans propios
  - capturar errores y latencia

---

### Métricas (si aplica)
- Registrar métricas agregables:
  - latencia
  - tasa de error
  - throughput
- Las métricas no reemplazan los logs.
- Logs y métricas deben ser coherentes entre sí.

---

## 📦 Entregables Esperados
- Convención documentada de campos de logging.
- Uso consistente de `requestId` / `traceId`.
- Logs estructurados en puntos críticos.
- Spans definidos para flujos relevantes.
- Evidencia de no filtrado de datos sensibles.

---

## 🧪 Checklist de Validación
- [ ] ¿Todas las requests generan `requestId`?
- [ ] ¿Existe correlación entre servicios?
- [ ] ¿Los logs son estructurados y consistentes?
- [ ] ¿Los niveles de log están bien usados?
- [ ] ¿Errores incluyen contexto sin filtrar secretos?
- [ ] ¿Flujos críticos tienen tracing?
- [ ] ¿Observabilidad funciona en producción?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se diagnostican errores o bugs
- se añade logging o tracing
- se integran servicios externos
- se operan flujos en producción
- se requiere auditoría o debugging

---

## 🚫 Fuera de Alcance
- Elección de proveedor de observabilidad.
- Configuración específica de herramientas.
- Dashboards concretos.
- Alerting detallado (puede delegarse).
