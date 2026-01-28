---
name: api_design_backend
description: Diseño y validación de contratos de API y endpoints backend
trigger:
  - api
  - endpoint
  - route
  - request
  - response
  - dto
  - contract
  - versioning
scope: backend
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 0.1
---

## 🎯 Propósito
Definir, validar y mantener contratos de API claros, consistentes, versionables y orientados a dominio.

Esta skill se enfoca **exclusivamente en el diseño del contrato**, no en la implementación técnica final.

---

## 🧠 Responsabilidades
- Definir endpoints REST o RPC claros
- Validar inputs y outputs
- Diseñar contratos estables y versionados
- Detectar breaking changes
- Alinear API con el dominio del negocio

---

## 📐 Reglas de Diseño
- Usar REST claro o RPC explícito (no híbridos confusos)
- No romper compatibilidad sin versionar
- Los nombres deben reflejar el dominio, no la implementación
- Requests y responses deben ser explícitos y completos
- Evitar lógica implícita en el contrato

---

## 📦 Entregables Esperados
- Definición de endpoint (método + path)
- Request schema (DTO / interface)
- Response schema
- Ejemplo request/response
- Decisión documentada (si aplica)

---

## 🧪 Checklist de Validación
- [ ] ¿El endpoint expresa claramente una intención del dominio?
- [ ] ¿Los campos son explícitos y tipados?
- [ ] ¿Hay versionado si corresponde?
- [ ] ¿Se documentan errores posibles?
- [ ] ¿El contrato es estable para frontend/consumidores?

---

## 🔁 Auto-invocación
Esta skill **DEBE** activarse automáticamente cuando:
- Se crea o modifica un endpoint
- Se discute un contrato de API
- Se define request/response
- Se realizan cambios que afectan consumidores

---

## 🚫 Fuera de Alcance
- Implementación de lógica de negocio
- Acceso a base de datos
- Decisiones de infraestructura
- Seguridad profunda (delegar a `security_owasp_auth`)
