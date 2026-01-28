---
name: technical_audit
description: Auditoría técnica estructurada de repositorios, código y arquitectura
trigger:
  - audit
  - review
  - refactor
  - quality
  - security
  - performance
  - repository
  - codebase
scope: system
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - security_owasp_auth
  - testing_tdd_fdd
  - ci_cd_github_actions
  - docs_readme_runbooks
---

## 🎯 Propósito
Evaluar de forma sistemática la **calidad técnica real** de un proyecto de software, detectando riesgos, deuda técnica y oportunidades de mejora antes de escalar, mantener o reutilizar el sistema.

Esta skill define **cómo auditar**, no **cómo refactorizar o implementar**.

---

## 🧠 Responsabilidades
- Analizar arquitectura, modularidad y separación de responsabilidades.
- Evaluar calidad de código y convenciones.
- Detectar riesgos de seguridad y malas prácticas comunes.
- Revisar testing, cobertura y estrategia de pruebas.
- Evaluar automatización, CI/CD y calidad operativa.
- Auditar documentación y capacidad de onboarding.
- Producir un informe claro, accionable y priorizado.

---

## 📐 Áreas de Auditoría (obligatorias)

### Arquitectura
- Estructura del repositorio y coherencia modular.
- Acoplamiento entre capas.
- Separación frontend / backend / infra.
- Escalabilidad y extensibilidad básica.

### Código
- Legibilidad y consistencia.
- Convenciones de naming.
- Complejidad innecesaria.
- Duplicación y deuda técnica evidente.

### Seguridad
- Manejo de secretos y variables de entorno.
- Exposición de información sensible.
- Autenticación y autorización (si aplica).
- Vulnerabilidades comunes (OWASP Top 10).

### Testing
- Existencia de tests.
- Tipo de tests (unitarios, integración).
- Cobertura mínima razonable.
- Tests frágiles o inexistentes.

### Automatización y DevOps
- CI/CD existente o ausente.
- Validaciones automáticas.
- Linting, formatting, pre-commit.
- Calidad del pipeline.

### Documentación
- README funcional.
- Setup reproducible.
- RUNBOOK o guías operativas.
- Comentarios útiles en código.

---

## 📦 Entregables Esperados
- Diagnóstico general del proyecto.
- Lista de problemas detectados por categoría.
- Riesgos técnicos priorizados.
- Recomendaciones claras y accionables.
- Lista de issues sugeridos (estilo GitHub).
- Propuesta de próximos pasos técnicos.

---

## 🧪 Checklist de Validación
- [ ] ¿La arquitectura es comprensible y coherente?
- [ ] ¿El código es legible y mantenible?
- [ ] ¿Existen riesgos de seguridad evidentes?
- [ ] ¿Hay una estrategia mínima de testing?
- [ ] ¿La automatización evita errores humanos?
- [ ] ¿La documentación permite onboarding?
- [ ] ¿Las recomendaciones son accionables?
- [ ] ¿Los riesgos están priorizados por impacto?

---

## 🔁 Auto-invocación
Esta skill debe activarse automáticamente cuando:
- se revisa un repositorio existente
- se hereda o reutiliza un proyecto
- se planea escalar un sistema
- se detecta deuda técnica acumulada
- se solicita refactor o mejora de calidad

---

## 🚫 Fuera de Alcance
- Implementar refactors o fixes.
- Escribir código nuevo.
- Cambiar stack tecnológico.
- Ejecutar despliegues.
- Tomar decisiones de negocio.
