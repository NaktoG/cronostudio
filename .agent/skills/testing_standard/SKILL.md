---
name: testing_standard
description: Estándares mínimos y obligatorios de testing para proyectos CronoStudio
trigger:
  - test
  - testing
  - coverage
  - qa
  - bug
  - regression
scope: global
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - testing_tdd_fdd
---

## 🎯 Propósito
Definir el **estándar mínimo obligatorio de testing** para cualquier proyecto CronoStudio, garantizando estabilidad, confianza en cambios y detección temprana de errores.

Esta skill establece **qué debe existir**, no cómo implementar cada test específico.

---

## 🧠 Responsabilidades
- Definir el baseline de testing exigido.
- Asegurar cobertura mínima en lógica crítica.
- Prevenir regresiones en features existentes.
- Establecer convenciones comunes de organización de tests.
- Garantizar que el proyecto sea testeable y mantenible.

---

## 📐 Reglas Generales

### Alcance del Testing
Todo proyecto debe contar como mínimo con:
- Tests unitarios de lógica de dominio.
- Tests de integración básicos en flujos críticos.
- Validación de casos límite conocidos.

No se considera aceptable:
- Código crítico sin ningún test.
- Tests que dependan de servicios externos reales.
- Tests frágiles que fallen por timing o estado compartido.

---

### Tipos de Tests

#### Unitarios
- Prueban una unidad aislada de lógica.
- Sin acceso a red, base de datos o filesystem.
- Rápidos y deterministas.

#### Integración
- Validan interacción entre módulos.
- Pueden usar DB o servicios mockeados.
- Cubren flujos críticos end-to-end mínimos.

---

### Cobertura
- La cobertura es un **indicador**, no un objetivo.
- Lógica crítica debe estar cubierta.
- Cobertura baja en código no crítico es aceptable.
- No se permite cobertura 0% en producción.

---

### Organización
- Tests viven junto al código o en carpeta `__tests__`.
- Naming descriptivo y consistente.
- Un archivo de test por unidad o feature.

---

### Datos y Mocks
- Usar datos mínimos y explícitos.
- Evitar fixtures gigantes.
- Mocks claros y controlados.
- Nunca depender de estado global.

---

## 📦 Entregables Esperados
- Tests unitarios para lógica crítica.
- Tests de integración para flujos clave.
- Evidencia de ejecución (local o CI).
- Convenciones documentadas si se apartan del estándar.

---

## 🧪 Checklist de Validación
- [ ] ¿La lógica crítica tiene tests?
- [ ] ¿Los tests son deterministas?
- [ ] ¿No dependen de servicios externos reales?
- [ ] ¿Cubren casos límite relevantes?
- [ ] ¿La organización es clara y consistente?
- [ ] ¿Existe al menos un test de integración clave?
- [ ] ¿El proyecto es confiable ante refactors?

---

## 🔁 Auto-invocación
Esta skill debe activarse automáticamente cuando:
- se introduce lógica nueva
- se corrige un bug
- se refactoriza código existente
- se detectan regresiones
- se evalúa calidad antes de release

---

## 🚫 Fuera de Alcance
- Elección de framework de testing específico.
- Implementación detallada de TDD/FDD (delegar a `testing_tdd_fdd`).
- Testing de performance o carga.
- QA manual o exploratorio.
