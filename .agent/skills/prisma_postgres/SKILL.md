
---
name: prisma_postgres
description: Gestión de modelos de datos, schema Prisma y uso de PostgreSQL como base de datos estándar
trigger:
  - database
  - db
  - prisma
  - postgres
  - schema
  - model
  - migration
scope: backend
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - api_design_backend
---

## 🎯 Propósito
Definir y mantener una **capa de datos consistente, segura y versionable** usando **PostgreSQL + Prisma**, alineada con el dominio del negocio.

Esta skill gobierna **el diseño del modelo de datos y su evolución**, no la lógica de negocio ni el acceso desde la API.

---

## 🧠 Responsabilidades
- Diseñar modelos de datos alineados al dominio.
- Mantener el `schema.prisma` como fuente de verdad.
- Definir relaciones, constraints e índices.
- Gestionar migraciones de forma controlada.
- Prevenir breaking changes en producción.
- Asegurar compatibilidad entre schema, datos y contratos API.

---

## 📐 Reglas de Diseño

### Base de Datos
- **PostgreSQL es obligatorio**.
- No se permite MongoDB, SQLite ni otros motores en producción.
- Usar tipos nativos de PostgreSQL cuando aplique.

---

### Modelado
- Un modelo Prisma representa una **entidad del dominio**.
- Nombres de modelos en **PascalCase**.
- Nombres de campos en **camelCase**.
- Claves primarias explícitas (`@id`).
- Usar `@unique` cuando aplique.
- Definir relaciones de forma explícita (`@relation`).

---

### Campos estándar
Todo modelo persistente debe incluir:

- `id`
- `createdAt`
- `updatedAt`

```prisma
model Example {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### Relaciones
- Definir siempre el lado dueño de la relación.
- Usar `onDelete` explícito (`Cascade`, `Restrict`, `SetNull`).
- Evitar relaciones implícitas.
- Evitar ciclos innecesarios.

---

### Migraciones
- Toda modificación del schema requiere migración.
- Nunca editar la base de datos manualmente.
- Migraciones deben ser:
  - pequeñas
  - descriptivas
  - versionadas
- No borrar columnas en caliente sin plan de migración.

---

### Cambios Breaking
Se consideran breaking:
- eliminar tablas o columnas
- cambiar tipos incompatibles
- cambiar semántica de relaciones
- borrar datos sin backup

Todo breaking change debe:
- documentarse
- versionarse
- coordinarse con consumidores

---

### Seeds y Datos Iniciales
- Los seeds deben ser **idempotentes**.
- Separar datos de prueba de datos base.
- Nunca incluir secretos en seeds.

---

## 📦 Entregables Esperados
- Modelos Prisma nuevos o modificados
- Relaciones definidas explícitamente
- Migración generada y versionada
- Nota de impacto (si aplica)
- Coordinación con contratos API afectados

---

## 🧪 Checklist de Validación
- [ ] ¿El modelo representa una entidad real del dominio?
- [ ] ¿Los nombres son claros y consistentes?
- [ ] ¿Las relaciones están explícitas?
- [ ] ¿Existen constraints adecuados?
- [ ] ¿Hay migración generada?
- [ ] ¿El cambio es backward compatible?
- [ ] ¿Se coordinó con la API si aplica?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se crea o modifica un modelo Prisma
- se cambia el `schema.prisma`
- se agregan relaciones o constraints
- se generan migraciones
- se toca la base de datos

---

## 🚫 Fuera de Alcance
- Implementación de lógica de negocio.
- Definición de endpoints o contratos API.
- Decisiones de infraestructura o hosting.
- Consultas específicas en código.
- ORMs alternativos o acceso directo a SQL.
