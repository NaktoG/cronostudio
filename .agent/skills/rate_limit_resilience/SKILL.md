---
name: rate_limit_resilience
description: Estándar de rate limiting y resiliencia (timeouts, retries, backoff, circuit breaker) para APIs y workflows
trigger:
  - rate_limit
  - rate_limit
  - retry
  - retries
  - backoff
  - timeout
  - circuit_breaker
  - resilience
  - 429
  - external_api
  - integration
scope: global
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - error_handling_standard
  - logging_standard
  - observability_tracing
---

## 🎯 Propósito
Definir un estándar único para **proteger el sistema** frente a picos de tráfico, abuso, fallos intermitentes y límites de terceros, mediante:
- rate limiting consistente
- timeouts obligatorios
- retries controlados con backoff
- circuit breaker para dependencias externas
- degradación (fallback) y protección anti-tormentas

Esta skill gobierna **políticas y contratos de resiliencia**, no la implementación específica por framework.

---

## 🧠 Responsabilidades
- Definir límites por actor (usuario, IP, token, club, integration key).
- Establecer política de retries/backoff y cuándo NO reintentar.
- Definir timeouts por tipo de operación.
- Estandarizar circuit breaker para servicios externos.
- Asegurar trazabilidad y observabilidad de reintentos y bloqueos.
- Evitar duplicación de efectos (idempotencia) en operaciones con side-effects.

---

## 📐 Reglas (obligatorias)

### 1) Rate limiting (API pública y endpoints sensibles)
- Todo endpoint público o susceptible de abuso debe tener rate limiting.
- El rate limiting debe definirse por **dimensión** (una o varias):
  - `ip`
  - `userId`
  - `tenantId/clubId`
  - `apiKey/integrationKey`
- La política debe ser explícita por endpoint o por grupo de endpoints.

Convención mínima recomendada:
- Lecturas: límite más alto.
- Escrituras / acciones: límite más bajo.
- Autenticación / recovery: límite estricto.

Cuando se aplica limitación:
- responder `429 Too Many Requests`
- incluir metadata mínima cuando sea posible:
  - `Retry-After` (segundos) si aplica
  - `error.code = RATE_LIMITED` siguiendo `error_handling_standard`

**Formato de error:** usar exactamente `error_handling_standard` (este ejemplo solo ilustra el `error.code` esperado).

Ejemplo error:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": [
      { "path": "retryAfter", "issue": "30" }
    ],
    "requestId": "<request_id>"
  }
}
```

---

### 2) Timeouts (obligatorios)
- Ninguna llamada a dependencia externa debe ser “sin límite”.
- Todo request server-side debe tener un timeout explícito.

Guía mínima:
- llamadas internas rápidas: 1–3s
- dependencias externas (HTTP): 3–10s según criticidad
- operaciones largas: usar async/job, no bloquear request

---

### 3) Retries (controlados)
Reglas:
- Retries solo para errores **transitorios**:
  - timeouts
  - 5xx intermitentes
  - 429 de terceros (con Retry-After)
  - errores de red (conexión / DNS intermitente)
- NO reintentar:
  - 4xx (excepto 408/429) por defecto
  - VALIDATION_ERROR, AUTH_ERROR, CONFLICT, NOT_FOUND
  - operaciones no idempotentes sin idempotency key definida

Política estándar:
- Máximo de retries: 2–3 (nunca infinito)
- Backoff exponencial con jitter
- Respetar `Retry-After` si existe
- Registrar cada intento con contexto (intento, delay, causa)

---

### 4) Backoff + jitter (anti tormentas)
- Todo retry debe usar backoff exponencial.
- Debe incluir jitter para evitar thundering herd.

Guía:
- delay base: 250–500ms
- crecimiento: x2
- jitter: aleatorio hasta un % del delay
- máximo delay: 5–10s

---

### 5) Circuit breaker (dependencias externas)
Cuando una dependencia externa falla repetidamente:
- abrir circuito para evitar saturación
- responder con:
  - error estándar `EXTERNAL_DEPENDENCY_ERROR` o `RATE_LIMITED` según caso
  - fallback si existe (degradación)

Estados mínimos:
- CLOSED: normal
- OPEN: bloquea llamadas por ventana
- HALF_OPEN: prueba controlada

Guía mínima:
- umbral: N fallos consecutivos en ventana
- ventana OPEN: 30–120s según servicio
- HALF_OPEN: 1–3 requests de prueba

---

### 6) Idempotencia y side-effects
- Cualquier operación con side-effects (send, charge, create con efectos) debe ser idempotente o definir comportamiento de reintentos.
- Si hay retries, debe existir:
  - idempotency key
  - o deduplicación por (actor + payload hash + ventana)

Si el endpoint es RPC “acción”, exigir idempotencia por defecto.

---

### 7) Degradación (fallback) y colas
- Si una integración externa no es crítica en tiempo real:
  - preferir cola/job async en lugar de bloquear request.
- Fallback permitido solo si:
  - se documenta impacto
  - se registra evento de degradación
  - se preserva experiencia mínima

---

## 📦 Entregables Esperados
- Política de rate limiting por endpoint/grupo (dimensión + umbral).
- Política de timeouts por tipo de operación.
- Política de retries (cuándo sí/cuándo no, max intentos, backoff).
- Definición de circuit breaker para cada dependencia externa crítica.
- Contrato de errores (`RATE_LIMITED`, `EXTERNAL_DEPENDENCY_ERROR`) según `error_handling_standard`.
- Evidencia de logging/metrics/tracing de:
  - rate limited
  - retries
  - circuit open/half-open

---

## 🧪 Checklist de Validación
- [ ] ¿Endpoints públicos/sensibles tienen rate limiting?
- [ ] ¿La dimensión (ip/user/tenant/apiKey) está definida?
- [ ] ¿Se responde 429 con `error.code = RATE_LIMITED`?
- [ ] ¿Todas las llamadas externas tienen timeout?
- [ ] ¿Retries solo para errores transitorios?
- [ ] ¿Existe backoff exponencial con jitter?
- [ ] ¿Hay circuit breaker para dependencias críticas?
- [ ] ¿No hay retries infinitos?
- [ ] ¿Operaciones con side-effects son idempotentes o deduplicadas?
- [ ] ¿Se registran métricas/logs/traces de bloqueos y reintentos?

---

## 🔁 Auto-invocación (obligatoria)
Activar esta skill cuando:
- se expone un endpoint público o sensible
- se integra un servicio externo (HTTP, email, WhatsApp, pagos, etc.)
- se implementan retries, backoff, timeouts o fallbacks
- aparece un `429` o se reporta abuso/picos
- se detectan fallos intermitentes en producción

---

## 🚫 Fuera de Alcance
- Implementación específica (middleware, librería, proveedor).
- Configuración concreta de WAF/CDN.
- Diseño de modelo de datos o migraciones.
- Seguridad profunda de autenticación/autorización (delegar a `security_owasp_auth`).
