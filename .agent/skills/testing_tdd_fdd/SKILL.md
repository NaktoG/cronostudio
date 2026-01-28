---
name: testing_tdd_fdd
description: Definición y aplicación de testing TDD/FDD para garantizar calidad funcional
trigger:
  - test
  - testing
  - tdd
  - fdd
  - lógica
  - feature
  - bug
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
Definir y aplicar una estrategia de **testing basada en TDD y FDD** para asegurar que la lógica del sistema cumple el comportamiento esperado y evita regresiones.

Esta skill gobierna **qué se prueba, cuándo y con qué criterio**, no la elección de frameworks concretos.

---

## 🧠 Responsabilidades
- Definir criterios de aceptación claros antes de implementar lógica.
- Garantizar que toda feature o cambio tenga tests asociados.
- Aplicar TDD para lógica crítica.
- Aplicar FDD para validar comportamiento funcional.
- Evitar regresiones mediante tests automatizados.
- Servir como contrato de comportamiento del sistema.

---

## 📐 Reglas de Testing (obligatorias)

### Enfoque TDD
- Escribir tests **antes** de la implementación.
- El test debe fallar primero.
- Implementar la mínima lógica para pasar el test.
- Refactorizar manteniendo tests verdes.

Aplicar TDD especialmente en:
- lógica de dominio
- validaciones
- reglas de negocio
- cálculos
- decisiones condicionales

---

### Enfoque FDD
- Definir el comportamiento desde la perspectiva del usuario/consumidor.
- Cada feature debe tener:
  - escenario principal (happy path)
  - escenarios de error esperados
- El comportamiento esperado debe estar explícito en el test.

Aplicar FDD especialmente en:
- endpoints
- flujos completos
- integraciones
- automatizaciones

---

### Qué se debe testear
- Casos felices.
- Casos límite.
- Casos de error esperados.
- Comportamiento ante inputs inválidos.
- Cambios que afecten a consumidores.

---

### Qué NO se debe testear
- Frameworks o librerías externas.
- Detalles de implementación internos.
- Configuración de infraestructura.
- Estilos o UI (delegar a testing de frontend si aplica).

---

### Principios
- Un test valida **un comportamiento**.
- Tests deben ser:
  - determinísticos
  - rápidos
  - legibles
- No duplicar lógica de negocio en los tests.
- Un test que no falla nunca es deuda técnica.

---

## 📦 Entregables Esperados
- Tests unitarios para lógica de dominio.
- Tests funcionales para features.
- Criterios de aceptación explícitos.
- Casos de error documentados.
- Evidencia de cobertura mínima razonable.

---

## 🧪 Checklist de Validación
- [ ] ¿Existen criterios de aceptación antes de implementar?
- [ ] ¿Los tests cubren happy path y errores?
- [ ] ¿Se aplicó TDD en lógica crítica?
- [ ] ¿El comportamiento esperado es explícito?
- [ ] ¿Los tests son determinísticos y legibles?
- [ ] ¿Evitan regresiones conocidas?
- [ ] ¿No testean implementación ni frameworks?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se implementa o modifica lógica
- se crea una feature nueva
- se corrige un bug
- se refactoriza código existente
- se define comportamiento esperado

---

## 🚫 Fuera de Alcance
- Elección de framework de testing.
- Configuración de CI/CD.
- Testing de UI o estilos visuales.
- Mocking de infraestructura externa.
