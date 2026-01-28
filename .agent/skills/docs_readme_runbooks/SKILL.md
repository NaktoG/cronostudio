---
name: docs_readme_runbooks
description: Definición y mantenimiento de documentación técnica mínima, clara y operativa
trigger:
  - readme
  - documentation
  - docs
  - runbook
  - onboarding
  - setup
scope: project
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - api_design_backend
  - logging_standard
---

## 🎯 Propósito
Garantizar que todo proyecto tenga **documentación mínima, clara y accionable** para que cualquier persona pueda:
- entender qué es el sistema,
- cómo se ejecuta,
- cómo se mantiene,
- y cómo se opera en producción.

Esta skill define **qué documentación debe existir** y **qué estándar debe cumplir**, no el contenido específico del negocio.

---

## 🧠 Responsabilidades
- Definir la estructura obligatoria de README y RUNBOOK.
- Establecer estándares de claridad, brevedad y orientación a acción.
- Evitar documentación obsoleta, duplicada o decorativa.
- Garantizar que la documentación refleje el estado real del sistema.
- Facilitar onboarding técnico rápido.

---

## 📐 Reglas de Documentación (obligatorias)

### Principios generales
- La documentación debe ser:
  - breve
  - accionable
  - mantenible
- Preferir ejemplos reales sobre explicaciones largas.
- Si no se puede ejecutar siguiendo la documentación, está incompleta.

---

### README.md (obligatorio)
Todo proyecto debe tener un `README.md` que incluya, como mínimo:

- Descripción del producto (1–2 párrafos).
- Objetivo del sistema.
- Stack tecnológico principal.
- Requisitos previos.
- Instalación y ejecución local.
- Variables de entorno necesarias (sin secretos).
- Comandos principales.
- Estructura básica del repositorio.

---

### RUNBOOK.md (obligatorio en sistemas operables)
Todo sistema que corra en staging o producción debe incluir un `RUNBOOK.md` con:

- Cómo levantar el sistema.
- Cómo detenerlo.
- Cómo reiniciarlo.
- Health checks disponibles.
- Logs y dónde encontrarlos.
- Procedimiento ante errores comunes.
- Procedimiento ante caídas.
- Contactos o responsables (si aplica).

---

### SETUP.md (si aplica)
Cuando el setup sea no trivial, debe existir un `SETUP.md` que documente:

- Primer arranque del proyecto.
- Dependencias externas.
- Configuración inicial.
- Pasos manuales necesarios.

---

## 📦 Entregables Esperados
- README.md actualizado y ejecutable.
- RUNBOOK.md claro y operativo (si aplica).
- SETUP.md cuando el setup no sea trivial.
- Documentación consistente con el estado real del sistema.

---

## 🧪 Checklist de Validación
- [ ] ¿El README explica claramente qué es el sistema?
- [ ] ¿Una persona nueva puede correr el proyecto solo con el README?
- [ ] ¿Las instrucciones están actualizadas?
- [ ] ¿RUNBOOK cubre escenarios operativos reales?
- [ ] ¿Se evita duplicar información?
- [ ] ¿La documentación es accionable y no decorativa?

---

## 🔁 Auto-invocación
Esta skill debe activarse automáticamente cuando:
- se crea un nuevo proyecto o repositorio
- se modifica arquitectura o stack
- se agregan servicios o flujos operativos
- se detecta falta de documentación mínima

---

## 🚫 Fuera de Alcance
- Documentación de negocio o marketing.
- Manuales extensos o tutoriales largos.
- Comentarios inline de código.
- Wikis externas no versionadas.
