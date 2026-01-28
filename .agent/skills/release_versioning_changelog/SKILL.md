---
name: release_versioning_changelog
description: Estándar de versionado, releases y changelog para productos y templates
trigger:
  - release
  - version
  - changelog
  - breaking_change
  - deploy
  - tag
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
  - error_handling_standard
---

## 🎯 Propósito
Definir un **estándar claro y obligatorio de versionado y releases** para garantizar:
- previsibilidad de cambios
- comunicación clara con consumidores
- control de breaking changes
- reutilización segura del template

Esta skill gobierna **cómo se versiona, publica y comunica un cambio**, no cómo se implementa.

---

## 🧠 Responsabilidades
- Establecer convención de versionado (SemVer).
- Definir qué constituye un breaking change.
- Estandarizar el contenido del changelog.
- Garantizar que cada release sea trazable.
- Evitar despliegues sin versión documentada.
- Alinear cambios técnicos con comunicación funcional.

---

## 📐 Reglas de Versionado (obligatorias)

### Esquema de Versionado
Se utiliza **Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: cambios incompatibles o breaking.
- **MINOR**: nuevas funcionalidades compatibles.
- **PATCH**: fixes compatibles sin cambios funcionales.

Ejemplo:
- `1.0.0` → release estable inicial
- `1.1.0` → nueva feature compatible
- `2.0.0` → breaking change

---

### Breaking Change
Se considera breaking change cualquier cambio que:
- rompa contratos de API existentes
- cambie comportamiento esperado por consumidores
- elimine o renombre campos públicos
- modifique reglas de validación de forma incompatible
- altere flujos funcionales existentes

Todo breaking change **requiere incremento de versión MAJOR**.

---

## 📘 Changelog (formato obligatorio)

Cada release debe incluir una entrada de changelog estructurada:

```md
## [1.2.0] - 2026-01-27
### Added
- Nueva funcionalidad de invitaciones automáticas

### Changed
- Mejora en validación de horarios

### Fixed
- Error en envío duplicado de mensajes

### Breaking
- Eliminado campo `player.nickname`
```

Reglas:
- Fechas en formato ISO (`YYYY-MM-DD`).
- Secciones permitidas: `Added`, `Changed`, `Fixed`, `Breaking`, `Deprecated`.
- Todo breaking change debe listarse explícitamente.

---

## 🚀 Release
- Toda release debe:
  - tener versión explícita
  - estar asociada a un tag
  - tener changelog actualizado
- No se permite deploy a producción sin versión definida.
- El número de versión es la **fuente de verdad**, no el branch.

---

## 🔁 Relación con otras Skills
- Cambios en API → coordinar con `api_design_backend`.
- Cambios en errores → coordinar con `error_handling_standard`.
- Cambios funcionales → reflejarse en changelog.

---

## 📦 Entregables Esperados
- Versión actual definida.
- Entrada de changelog por release.
- Identificación explícita de breaking changes.
- Tags de versión consistentes.

---

## 🧪 Checklist de Validación
- [ ] ¿La versión sigue SemVer?
- [ ] ¿El changelog está actualizado?
- [ ] ¿Los breaking changes están documentados?
- [ ] ¿Existe tag asociado a la release?
- [ ] ¿La comunicación del cambio es clara para consumidores?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se prepara una release
- se introduce un breaking change
- se publica una nueva versión
- se realiza un deploy significativo

---

## 🚫 Fuera de Alcance
- Automatización específica de releases.
- Configuración de CI/CD.
- Estrategia de marketing o comunicación externa.
- Naming comercial de versiones.
