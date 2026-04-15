# Auditoria Profunda Front + UI/UX + Product Experience (2026-04-15)

## Objetivo

Convertir CronoStudio en una plataforma de trabajo diario de punta a punta (idea -> guion -> planificacion -> publicacion -> seguimiento), reduciendo la necesidad de usar GPT/Notion y elevando retencion.

## Vision de producto (North Star)

- Un creador puede operar toda su semana desde CronoStudio sin salir de la app (excepto edicion de video).
- La app guia acciones concretas: que hacer hoy, que esta bloqueado, que vence manana, que riesgo tiene el canal.
- El sistema debe ser simple, rapido, bello y consistente en mobile, tablet y desktop.

## Diagnostico actual

### Fortalezas

- Flujo editorial ya existe: ideas, guiones, miniaturas, SEO, calendario y estado semanal.
- Estructura de RBAC y auth madura para crecer capacidades de plataforma.
- Base de i18n ya implementada en gran parte del frontend.

### Brechas criticas

- Falta capa de plataforma (super admin/billing/riesgo) para operar negocio SaaS.
- UI tiene deuda de consistencia entre vistas (mensajes API mixtos y controles no unificados).
- Responsive no esta sistematizado por breakpoints y componentes compartidos.
- Falta centro de notificaciones operativo para fechas de subida y tareas vencidas.

## Responsive audit (foco prioritario)

### Evidencia automatizada

Se corrio auditoria automatizada por viewport en rutas clave autenticadas.

- `320x568`: overflow en `/configuracion` (texto largo de Redirect URI en OAuth).
- `320x568`: overflow leve en `/ai` (ajustado con contencion horizontal).
- Breakpoints restantes: comportamiento general estable, pero requiere checklist visual manual por componentes complejos.

### Ajustes aplicados en esta iteracion

- `/configuracion`: ruptura de texto largo en bloque de Redirect URI recomendado (`break-all`).
- `/ai`: contencion horizontal en raiz de pantalla (`overflow-x-hidden`) para evitar scroll lateral accidental.
- Landing: simplificacion de header y selector de idioma con desplegable para mejorar UX mobile.

### Checklist responsive obligatorio (proxima pasada)

- Viewports: 320, 360, 375, 390, 412, 768, 820, 1024, 1280, 1440, 1920.
- Revisar: header/nav, formularios largos, tablas, cards KPI, modales, calendario semanal/mensual.
- Criterios: sin scroll horizontal no intencional, tap targets >= 44px, jerarquia visual estable, textos sin truncado critico.

## Estrategia de producto para retencion extrema

## 1) Reemplazar Notion dentro de CronoStudio

- Crear modulo "Workspace" con:
  - notas rapidas por canal,
  - base de ideas con tags/estado/score,
  - plantillas de brief,
  - historial de decisiones por video.
- Integrar con calendario y pipeline (cada idea puede convertirse en produccion en 1 click).

## 2) Reemplazar GPT para guiones (asistido + estructurado)

- Wizard de guion por bloques (hook, promesa, estructura, CTA) con validacion de calidad.
- Libreria de estilos por nicho + presets guardables por usuario.
- Versionado y diff de guiones para iterar sin perder contexto.

## 3) Centro de control diario (home operativo)

- "Hoy debes hacer": lista priorizada con impacto.
- "Riesgos": videos sin miniatura/seo, metas semanales en rojo.
- "Proximo vencimiento": recordatorios de publicacion por canal.

## 4) Notificaciones y calendario accionable

- In-app notifications con categorias: `upload_due`, `task_due`, `risk_alert`, `billing_alert`.
- Opciones de entrega: campana in-app + email (opt-in).
- Recordatorios por anticipacion: 24h, 3h y 30m antes de hora de publicacion.
- Botones rapidos: "Marcar publicado", "Reprogramar", "Abrir checklist".

## 5) Estetica y simplicidad

- Sistema visual consistente (tokens, espaciado, escalas tipograficas, estados).
- Reducir densidad cognitiva: maximo 1 accion primaria por bloque.
- Microcopys accionables: menos texto descriptivo, mas siguientes pasos concretos.

## Backlog por fases (ejecucion sugerida)

### Fase A (1-2 semanas)

- Consolidar responsive en rutas core (`/dashboard`, `/ai`, `/configuracion`, `/ideas`).
- Unificar componentes de formulario y estados vacios/carga/error.
- Crear panel de notificaciones in-app (UI + endpoint inicial).

### Fase B (2-4 semanas)

- Workspace interno (notas + ideas + templates) con linking a pipeline.
- Guionador estructurado con guardado por versiones.
- KPI de adherencia al calendario y disciplina semanal.

### Fase C (4-8 semanas)

- Billing real (planes/suscripciones/cobros) + panel de plataforma.
- Alertas inteligentes (riesgo de incumplir frecuencia, caida de consistencia).
- Automatizaciones de seguimiento (resumen diario/semana).

## KPIs de exito

- WAU/MAU de creadores.
- Tasa de publicacion semanal sostenida.
- % de usuarios que usan calendario + guiones + ideas en la misma semana.
- Reduccion de churn por falta de constancia editorial.
- Tiempo promedio desde idea hasta publicacion.

## Riesgos

- Sobrecargar UI con demasiadas funciones sin IA de priorizacion.
- Hacer notificaciones sin control de frecuencia (fatiga).
- Integrar billing sin observabilidad de eventos de pago.

## Mitigaciones

- Diseño por tareas y no por menus.
- Preferencias de notificaciones por canal y tipo.
- Event log de billing + reconciliacion diaria.
