---
name: data_migrations_backup_restore
description: Estrategia estándar para migraciones de datos, backups y restauración segura
trigger:
  - migration
  - schema
  - database
  - prisma
  - backup
  - restore
  - rollback
scope: backend
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - prisma_postgres
  - stack_standard_postgres
  - logging_standard
---

## 🎯 Propósito
Definir un **estándar obligatorio** para gestionar **migraciones de datos**, **backups** y **restauraciones**, reduciendo el riesgo de pérdida de datos y downtime.

Esta skill gobierna **cómo se cambia el esquema y se protege la información**, no la lógica de negocio.

---

## 🧠 Responsabilidades
- Establecer reglas para migraciones seguras de base de datos.
- Definir estrategia mínima de backups automáticos.
- Garantizar capacidad de restauración controlada.
- Prevenir migraciones destructivas no auditadas.
- Asegurar trazabilidad de cambios en datos.

---

## 📐 Reglas de Migraciones (obligatorias)

### Principios Generales
- Toda migración debe ser:
  - versionada
  - reproducible
  - reversible (cuando sea posible)
- Nunca modificar datos manualmente en producción.
- No aplicar migraciones sin backup previo.

---

### Migraciones de Esquema
- Usar herramientas de migración versionadas (ej. Prisma Migrate).
- Cada migración debe:
  - tener nombre descriptivo
  - afectar un solo cambio lógico
- Evitar migraciones destructivas:
  - drop de columnas
  - renombre sin copia
  - cambio de tipo incompatible

Si una migración destructiva es inevitable:
- documentar impacto
- crear migración de transición
- validar en entorno previo

---

### Migraciones de Datos
- Migraciones que alteran datos deben:
  - ser explícitas
  - ejecutarse de forma controlada
  - registrar resultados (filas afectadas)
- No mezclar migraciones de esquema y datos complejos en un solo paso.

---

## 💾 Backups

### Reglas Mínimas
- Backups automáticos y periódicos.
- Al menos:
  - backup diario
  - retención mínima definida
- Backups deben:
  - estar cifrados
  - almacenarse fuera del contenedor principal

---

### Verificación de Backups
- Un backup no verificado se considera inexistente.
- Debe existir:
  - procedimiento documentado de restore
  - prueba periódica de restauración (restore drill)

---

## ♻️ Restauración (Restore)

### Principios
- Restaurar es un proceso **controlado**, no improvisado.
- El procedimiento debe:
  - definir punto de restauración
  - minimizar pérdida de datos
  - dejar el sistema en estado consistente

---

### Rollback
- Toda migración debe definir:
  - rollback automático **o**
  - estrategia manual documentada
- Nunca aplicar una migración sin saber cómo volver atrás.

---

## 📦 Entregables Esperados
- Migraciones versionadas y documentadas.
- Estrategia de backup definida.
- Procedimiento de restore documentado.
- Evidencia de prueba de restauración.
- Logs de ejecución de migraciones.

---

## 🧪 Checklist de Validación
- [ ] ¿Existe backup previo a la migración?
- [ ] ¿La migración es versionada y reproducible?
- [ ] ¿El impacto en datos está evaluado?
- [ ] ¿Existe estrategia de rollback?
- [ ] ¿Los backups están verificados?
- [ ] ¿El restore está documentado y probado?
- [ ] ¿Los cambios están logueados?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se modifica el esquema de base de datos
- se crean o aplican migraciones
- se planifica un despliegue con cambios de datos
- se define estrategia de backup o restore

---

## 🚫 Fuera de Alcance
- Elección de proveedor de infraestructura.
- Implementación concreta de herramientas de backup.
- Optimización de queries o performance.
- Decisiones de lógica de negocio.
