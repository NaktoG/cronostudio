---
name: config_env_secrets
description: Estándar de configuración, variables de entorno y gestión segura de secretos (local, CI/CD y producción)
trigger:
  - env
  - dotenv
  - config
  - secrets
  - credential
  - api_key
  - token
  - private_key
  - github_actions
  - docker_compose
  - n8n_credentials
scope: global
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - ci_cd_github_actions
  - security_owasp_auth
  - logging_standard
---

## 🎯 Propósito
Definir un estándar único para **configuración por entorno** y **gestión segura de secretos**, asegurando:
- consistencia entre local/CI/producción
- cero secretos en repositorio
- rotación y mínimos privilegios
- trazabilidad sin filtrado de información sensible

Esta skill gobierna **cómo se declaran, validan, almacenan y rotan** variables de entorno y secretos.

---

## 🧠 Responsabilidades
- Definir convención de naming para variables de entorno.
- Separar configuración pública vs secreta.
- Establecer reglas de almacenamiento de secretos (local, CI, VPS).
- Definir validación estricta de configuración al boot.
- Establecer política de rotación, permisos y exposición.
- Evitar filtrado de secretos en logs, errores o workflows.

---

## 📐 Reglas (obligatorias)

### 1) No secretos en repositorio
- Prohibido commitear:
  - `.env`, `.env.*` reales
  - tokens, API keys, passwords
  - private keys, certificados
  - credenciales en workflows n8n exportados
- El repositorio solo puede contener:
  - `.env.example` (sin valores reales)
  - documentación de variables necesarias

---

### 2) Naming y organización de variables
- Variables en `SCREAMING_SNAKE_CASE`.
- Prefijos por dominio:
  - `APP_` configuración general
  - `DB_` base de datos
  - `AUTH_` autenticación/sesión
  - `EMAIL_` proveedores de correo
  - `SMS_` proveedores SMS
  - `WHATSAPP_` integración WhatsApp
  - `N8N_` automatizaciones
  - `S3_` o `STORAGE_` storage
  - `PAYMENTS_` pagos
- Una variable = un propósito (no multipropósito).

---

### 3) Públicos vs secretos
- **Públicas**: pueden ir al cliente (solo si es estrictamente necesario).
  - En Next.js: `NEXT_PUBLIC_*`
- **Secretas**: nunca deben llegar al cliente.
  - Prohibido exponer secrets en `NEXT_PUBLIC_*`.

---

### 4) Validación al arranque (fail fast)
- La app debe fallar en boot si falta configuración crítica.
- Las variables deben validarse por:
  - presencia
  - tipo/formato
  - rango (si aplica)

---

### 5) Almacenamiento por entorno
#### Local
- Usar `.env.local` (no commiteado).
- Mantener `.env.example` actualizado.

#### CI/CD (GitHub Actions)
- Usar `GitHub Secrets` y/o `GitHub Environments`.
- Nunca imprimir valores de secrets en logs.
- Rotación obligatoria si un secreto se expone.

#### Producción (VPS / Docker)
- Secrets vía:
  - variables de entorno del servicio
  - archivos montados fuera del repo (si aplica)
- Prohibido hardcodear secrets en `docker-compose.yml` commiteado.
- Preferir `docker compose --env-file` con archivo fuera del repo.

#### n8n
- Credenciales siempre en **n8n Credentials Store**.
- Prohibido pegar secrets dentro de nodos o expresiones.
- Variables sensibles solo vía `.env` del contenedor o credenciales n8n.

---

### 6) Rotación y mínimos privilegios
- Todo secreto debe tener:
  - dueño (owner)
  - propósito
  - fecha de creación
  - política de expiración/rotación
- Principio de mínimos privilegios:
  - scopes mínimos en tokens
  - usuarios DB con permisos mínimos
- Si un secreto se filtra:
  - revocar y rotar inmediatamente

---

### 7) No filtrado en logs / errores
- Logs nunca deben contener:
  - tokens
  - passwords
  - headers sensibles (Authorization)
  - dumps de env completos
- Errores expuestos deben ser sanitizados (delegar a `error_handling_standard` si existe).

---

## 📦 Entregables Esperados
- `.env.example` actualizado (sin secretos).
- Lista documentada de variables requeridas por entorno.
- Validación de configuración al boot (fail fast).
- Política de manejo de secretos en CI y VPS.
- Convención aplicada en n8n (credenciales fuera de workflows).

---

## 🧪 Checklist de Validación
- [ ] ¿No hay secretos commiteados en repo?
- [ ] ¿Existe `.env.example` completo y actualizado?
- [ ] ¿Naming consistente y por prefijos?
- [ ] ¿No hay secrets en `NEXT_PUBLIC_*`?
- [ ] ¿La app falla en boot si falta config crítica?
- [ ] ¿CI/CD usa secrets/environments y no expone logs?
- [ ] ¿Producción no hardcodea secrets en compose commiteado?
- [ ] ¿n8n usa credenciales y no secrets en nodos?
- [ ] ¿No se filtran secrets en logs/errores?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se agregan variables de entorno nuevas
- se integra un proveedor externo (API keys)
- se configura CI/CD o despliegue
- se toca Docker Compose / Nginx / VPS config
- se crean workflows n8n con credenciales

---

## 🚫 Fuera de Alcance
- Implementación concreta de un gestor de secretos (Vault, etc.).
- Hardening del servidor (delegar a `security_owasp_auth`).
- Observabilidad avanzada (delegar a `observability_tracing` si aplica).
- Diseño de endpoints (delegar a `api_design_backend`).
