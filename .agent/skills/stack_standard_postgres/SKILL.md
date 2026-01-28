---
name: stack_standard_postgres
description: Definición del stack backend estándar basado en PostgreSQL como base de datos principal
trigger:
  - new_project
  - database
  - db
  - orm
  - postgres
  - stack
scope: global
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - prisma_postgres
  - security_owasp_auth
---

## 🎯 Propósito
Establecer el **stack backend estándar de CronoStudio**, con PostgreSQL como base de datos principal, garantizando consistencia, escalabilidad y seguridad en todos los proyectos.

Esta skill define **qué tecnologías se usan por defecto**, no cómo se implementan en detalle.

---

## 🧠 Responsabilidades
- Definir PostgreSQL como base de datos relacional obligatoria.
- Establecer Prisma como ORM estándar.
- Garantizar compatibilidad con entornos locales y producción.
- Alinear decisiones técnicas con mantenibilidad y escalado.
- Evitar stacks inconsistentes entre proyectos.

---

## 📐 Stack Estándar (obligatorio)

### Base de Datos
- **PostgreSQL** como única base de datos soportada.
- Versiones soportadas: 14+.
- Configuración orientada a producción desde el inicio.

### ORM
- **Prisma** como ORM obligatorio.
- Uso estricto de schema tipado.
- Migraciones versionadas y auditables.

### Entorno
- Variables de entorno obligatorias (`DATABASE_URL`).
- Separación clara entre:
  - desarrollo
  - staging (si aplica)
  - producción

---

## 📐 Reglas de Diseño

### Persistencia
- Todo acceso a datos debe pasar por Prisma.
- No se permite SQL raw sin justificación explícita.
- Transacciones explícitas para operaciones críticas.

### Migraciones
- Toda modificación del esquema requiere migración.
- Nunca modificar la base manualmente en producción.
- Migraciones deben ser:
  - reproducibles
  - versionadas
  - reversibles cuando sea posible

### Naming
- Tablas en `snake_case`.
- Columnas en `snake_case`.
- Claves primarias como `id`.
- Timestamps estándar:
  - `created_at`
  - `updated_at`

---

## 📦 Entregables Esperados
- Definición del stack seleccionada.
- Justificación si se propone una excepción.
- Variables de entorno documentadas.
- Convenciones de naming aplicadas.
- Estrategia de migraciones definida.

---

## 🧪 Checklist de Validación
- [ ] PostgreSQL definido como base principal.
- [ ] Prisma seleccionado como ORM.
- [ ] Variables de entorno declaradas.
- [ ] Migraciones versionadas.
- [ ] Naming consistente en el esquema.
- [ ] No uso de bases no permitidas.

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se crea un proyecto nuevo
- se define o cambia la base de datos
- se introduce o cambia el ORM
- se discute el stack backend

---

## 🚫 Fuera de Alcance
- Implementación de queries específicas.
- Optimización avanzada de performance.
- Infraestructura de base de datos.
- Backups y replicación.
- Decisiones de hosting.
