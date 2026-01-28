---
name: feature_flags_experiments
description: Gestión de feature flags y experimentos controlados para despliegues seguros y validación de hipótesis
trigger:
  - feature_flag
  - flag
  - experiment
  - rollout
  - ab_test
  - toggle
scope: cross
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - frontend_app_logic
  - api_design_backend
  - testing_tdd_fdd
---

## 🎯 Propósito
Definir reglas operativas para el uso de **feature flags y experimentos** que permitan activar, desactivar y validar funcionalidades de forma segura, reversible y medible.

Esta skill gobierna **cuándo y cómo se expone una feature**, sin modificar el contrato base del sistema.

---

## 🧠 Responsabilidades
- Definir cuándo una feature debe ir detrás de un flag.
- Establecer tipos de flags (on/off, gradual, experimento).
- Garantizar activación y rollback seguros.
- Evitar forks de lógica no controlados.
- Alinear flags con validación de hipótesis y métricas.
- Coordinar frontend y backend bajo una misma semántica de flag.

---

## 📐 Reglas de Uso (obligatorias)

### Cuándo usar un Feature Flag
- Features nuevas no validadas.
- Cambios con riesgo funcional.
- Rollouts progresivos.
- Experimentos A/B.
- Comportamiento condicionado por tipo de usuario o plan.

No usar flags para:
- Bugs urgentes (hotfix directo).
- Lógica permanente.
- Configuración sensible de seguridad.

---

### Tipos de Flags
- **Boolean**: activado / desactivado.
- **Gradual**: porcentaje de usuarios.
- **Segmentado**: por rol, plan o cohort.
- **Experimento**: variantes A/B con métrica definida.

Cada flag debe declarar su tipo explícitamente.

---

### Convención de Naming
- Formato: `domain.feature.action`
- Ejemplo: `invitations.ai_editor.enabled`
- Nombres deben ser:
  - estables
  - legibles
  - orientados a dominio
  - sin referencias técnicas

---

### Reglas de Implementación
- La lógica principal **no debe depender estructuralmente del flag**.
- El flag decide **exposición**, no **arquitectura**.
- Evitar flags anidados.
- Un flag debe poder eliminarse sin refactor mayor.

---

### Experimentos
- Todo experimento debe definir:
  - hipótesis
  - métrica principal
  - duración
  - criterio de éxito
- Las variantes no deben romper contratos ni tests existentes.
- El experimento debe ser reversible en cualquier momento.

---

## 📦 Entregables Esperados
- Definición del flag:
  - nombre
  - tipo
  - alcance
- Condición de activación.
- Métrica o hipótesis asociada (si experimento).
- Plan de rollback.
- Nota de eliminación futura (tech debt).

---

## 🧪 Checklist de Validación
- [ ] ¿La feature justifica el uso de un flag?
- [ ] ¿El naming sigue la convención?
- [ ] ¿El flag es reversible sin riesgo?
- [ ] ¿No introduce forks de lógica complejos?
- [ ] ¿El experimento tiene métrica clara?
- [ ] ¿Existe plan de cleanup del flag?
- [ ] ¿No afecta contratos ni seguridad?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se introduce una feature nueva no validada
- se requiere rollout progresivo
- se diseña un experimento A/B
- se condiciona comportamiento por usuario o plan

---

## 🚫 Fuera de Alcance
- Implementación concreta de sistemas de flags.
- Elección de proveedor o librería.
- Instrumentación de analytics.
- Decisiones de pricing o negocio.
- Lógica de seguridad o permisos.
