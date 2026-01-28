---
name: performance_frontend_budget
description: Estándares y presupuestos de performance para frontend (Next.js) orientados a experiencia de usuario
trigger:
  - performance
  - perf
  - slow
  - lcp
  - cls
  - ttfb
  - bundle
  - hydration
  - image
  - caching
scope: frontend
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - frontend_app_logic

  - observability_tracing
---

## 🎯 Propósito
Definir un **presupuesto de performance** y reglas operativas para el frontend, priorizando:
- tiempos de carga percibidos
- estabilidad visual
- navegación fluida
- coste de JavaScript controlado

Esta skill gobierna **criterios y decisiones de performance**, no la implementación de optimizaciones específicas.

---

## 🧠 Responsabilidades
- Establecer presupuestos (budgets) medibles de rendimiento.
- Definir reglas de caching y fetching orientadas a App Router.
- Controlar tamaño de bundle y coste de hidratación.
- Definir buenas prácticas de imágenes, fuentes y assets.
- Definir criterios de medición y gates de PR.
- Asegurar degradación elegante en redes lentas.

---

## 📐 Presupuestos (budgets) obligatorios

> Los budgets son objetivos operativos. Si se superan, se debe justificar o corregir.

### Core Web Vitals (objetivo)
- **LCP** ≤ 2.5s (P75)
- **CLS** ≤ 0.1 (P75)
- **INP** ≤ 200ms (P75) *(si aplica medición)*
- **TTFB** ≤ 800ms (P75)

### JavaScript y bundle (objetivo)
- Evitar hidratar páginas completas sin necesidad.
- Minimizar JS en páginas públicas/marketing.
- Preferir Server Components cuando sea posible.
- Mantener dependencias de UI bajo control.

---

## 📐 Reglas de Implementación (decisiones obligatorias)

### Rendering y App Router
- Preferir **Server Components** por defecto.
- Usar **Client Components** solo cuando:
  - haya interacciones locales
  - haya uso de estado en el cliente
  - sea necesaria una librería client-only
- Evitar “client boundary” alto (no envolver layouts enteros en `use client`).

---

### Data Fetching y Caching
- Definir claramente por endpoint/página:
  - `no-store` cuando sea real-time
  - `revalidate` cuando sea semi-estático
  - cache por defecto para recursos estables
- Evitar waterfalls:
  - agrupar fetches cuando sea posible
  - paralelizar requests
- Respetar estados UX:
  - loading / error / empty (delegar a `frontend_app_logic`)

---

### Imágenes y Assets
- Usar imágenes optimizadas y responsivas.
- Definir tamaños explícitos (evita CLS).
- No cargar imágenes grandes sin lazy-loading cuando aplica.
- Evitar GIFs pesados; preferir video/animated webp cuando aplica.

---

### Fuentes
- Cargar fuentes de forma controlada:
  - evitar múltiples variantes innecesarias
  - limitar weights
  - preferir local o provider confiable con caching

---

### Navegación y UX de Performance
- Priorizar rendimiento percibido:
  - skeletons y placeholders
  - prefetch cuando tenga sentido
  - transiciones suaves
- En redes lentas:
  - no bloquear UI por requests largos
  - timeouts explícitos y mensajes claros (coordinado con `error_handling_standard`)

---

### Third-party Scripts
- Minimizar scripts externos.
- Todo script third-party requiere:
  - justificación de valor
  - carga diferida cuando sea posible
- No introducir trackers “por defecto”.

---

## 📊 Medición y Gates (reglas operativas)

### Qué medir
- Core Web Vitals (P75)
- TTFB por ruta crítica
- tamaño de bundle por ruta
- número de requests críticos

### Gates de PR (cuando aplique)
- Si se introduce una dependencia nueva, se debe justificar.
- Si se degrada LCP/TTFB o aumenta bundle significativamente:
  - justificar o corregir antes de mergear.

---

## 📦 Entregables Esperados
- Presupuesto definido y aceptado por el equipo.
- Decisiones de caching documentadas por página/flujo.
- Lista de dependencias “permitidas” para UI/estado.
- Checklist de performance aplicado en PRs.
- Evidencia mínima de medición en rutas críticas (cuando aplica).

---

## 🧪 Checklist de Validación
- [ ] ¿Se respeta preferencia por Server Components?
- [ ] ¿Los Client Components están justificados?
- [ ] ¿No hay waterfalls de fetching?
- [ ] ¿Caching y revalidación están definidos?
- [ ] ¿Las imágenes tienen tamaño y carga apropiados?
- [ ] ¿Fuentes y assets están controlados?
- [ ] ¿No se agregaron scripts externos sin razón?
- [ ] ¿Se mantienen budgets de Web Vitals y TTFB?
- [ ] ¿Hay degradación elegante en red lenta?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se agregan pantallas nuevas o layouts
- se introduce una dependencia nueva en frontend
- hay quejas de lentitud o “lag”
- se cambian estrategias de caching/fetching
- se agregan scripts externos o assets pesados

---

## 🚫 Fuera de Alcance
- Implementación concreta de optimizaciones (código específico).
- Configuración detallada de infraestructura/CDN.
- Observabilidad específica (delegar a `observability_tracing`).
- Reglas de UI (delegar a `ui_design_system_standard`).
