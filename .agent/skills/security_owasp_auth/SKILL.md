---
name: security_owasp_auth
description: Seguridad de autenticación, autorización y protección OWASP Top 10 para APIs y aplicaciones web
trigger:
  - auth
  - authentication
  - authorization
  - login
  - signup
  - jwt
  - session
  - token
  - cookie
  - endpoint
scope: security
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
Definir y aplicar reglas obligatorias de **seguridad de autenticación y autorización**, alineadas con **OWASP Top 10**, para proteger APIs, aplicaciones web y flujos automatizados.

Esta skill gobierna **cómo se protege el acceso**, no la lógica de negocio ni la infraestructura física.

---

## 🧠 Responsabilidades
- Definir estándares de autenticación (JWT, sesiones, cookies).
- Establecer reglas de autorización por rol/permiso.
- Prevenir vulnerabilidades OWASP Top 10.
- Asegurar manejo correcto de secretos y credenciales.
- Garantizar exposición mínima de información sensible.
- Proteger endpoints públicos y privados.

---

## 📐 Reglas de Seguridad (obligatorias)

### Autenticación
- Todo endpoint no público **DEBE** requerir autenticación.
- Métodos permitidos:
  - JWT con expiración corta
  - Sesiones con cookies seguras
- Prohibido:
  - tokens sin expiración
  - credenciales en URL
  - auth basada solo en frontend

---

### JWT y Tokens
- JWT debe incluir:
  - `sub` (user id)
  - `exp` (expiration)
  - `iat` (issued at)
- Reglas:
  - expiración corta
  - rotación cuando aplique
  - firma segura
- Nunca exponer JWT en logs o responses.

---

### Cookies de Sesión
- Flags obligatorios:
  - `httpOnly`
  - `secure`
  - `sameSite`
- Prohibido usar cookies sin flags de seguridad.

---

### Autorización
- La autenticación **no implica** autorización.
- Todo endpoint debe definir:
  - roles permitidos o
  - permisos requeridos
- El control de acceso se valida siempre en backend.

---

### Protección OWASP Top 10
Mitigaciones mínimas obligatorias:
- Validación estricta de inputs
- Prevención de:
  - SQL Injection
  - XSS
  - CSRF
  - Broken Auth
- Rate limiting en endpoints sensibles.
- CORS restrictivo (no `*`).

---

### Manejo de Errores de Seguridad
- No exponer:
  - stack traces
  - detalles internos
  - razones específicas de auth
- Respuesta genérica para auth fallida.

Ejemplo:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

---

### Gestión de Secretos
- Secrets solo en:
  - variables de entorno
  - vaults seguros
- Prohibido:
  - hardcodear secretos
  - versionar `.env`
  - exponer claves en workflows

---

## 📦 Entregables Esperados
- Estrategia de autenticación definida.
- Estrategia de autorización documentada.
- Definición de endpoints públicos vs privados.
- Convención de errores de seguridad.
- Reglas de manejo de tokens/cookies.

---

## 🧪 Checklist de Validación
- [ ] ¿Todos los endpoints sensibles requieren autenticación?
- [ ] ¿Los tokens tienen expiración y rotación?
- [ ] ¿Las cookies usan flags seguros?
- [ ] ¿La autorización está validada en backend?
- [ ] ¿No se exponen datos sensibles en errores/logs?
- [ ] ¿Se mitigan riesgos OWASP Top 10?
- [ ] ¿Secrets gestionados fuera del código?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se implementa autenticación o sesiones
- se agregan endpoints protegidos
- se manejan tokens o cookies
- se exponen datos sensibles
- se integran servicios externos

---

## 🚫 Fuera de Alcance
- Lógica de negocio.
- Infraestructura física o hardening del servidor.
- Implementación específica de librerías.
- Decisiones de UX de autenticación.
