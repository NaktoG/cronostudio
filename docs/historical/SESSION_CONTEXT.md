# CONTEXTO DE LA SESION

## Resumen ejecutivo (lectura rapida)
- Se integro la suite de 4 GPTs en AI Studio con schemas internos, prompts y outputs premium (JSON oculto).
- UX de AI Studio ahora es 100% lenguaje natural; render de resultados por secciones y soporte de inputs nuevos.
- Se agregaron validaciones/enriquecimiento de input desde DB para ideas/guiones en AI runs (create/execute).
- Mejoras en SEO para soportar sugerencias nuevas (titles/thumbnail objects).
- Fixes de reconciliacion YouTube (manejo de errores + mensaje visible) y duplicado de channelId.
- Se agrego guia/tour y tutorial inicial tras crear/conectar canal.
- Ajustes de autenticacion/redirect: landing siempre accesible, login -> dashboard, logout -> landing.
- Tests y lint pasaron en apps/web en varias rondas.

Fecha: Mon Mar 09 2026
Repo: /Volumes/SSD-QVO/projects/cronostudio
Rama: develop
Workspace: macOS (darwin)

## Objetivo general del trabajo
- Integrar GPTs personalizados (YouTube Evergreen AI, Script Architect, Retention Editor, Titles & Thumbs) dentro del proyecto con control y seguridad.
- Mejorar UX del AI Studio a lenguaje natural, sin exponer JSON al usuario.
- Mantener historial por canal y validacion fuerte del output.
- Mejorar onboarding/guia para hacer la plataforma vendible.
- Corregir errores de reconciliacion YouTube y mejorar feedback al usuario.
- Alinear flow de landing/login/logout como definio el usuario.

## Reglas e instrucciones clave
- Responder siempre en español.
- Usar agentes/skills cuando corresponda (explore/general) para investigar antes de cambiar.
- No commitear ni pushear salvo pedido expreso.
- No tocar .agentes ni commitear .agentes.

## Estado actual del git
- Rama: develop (adelantada 1 commit local)
- Commit local ya creado:
  - `feat: upgrade AI studio profiles and UX` (f340c46)
- Cambios sin commitear (M):
  - apps/web/src/app/api/integrations/youtube/reconcile/weekly/route.ts
  - apps/web/src/app/channels/page.tsx
  - apps/web/src/app/components/GuidePanel.tsx
  - apps/web/src/app/components/ProtectedRoute.tsx
  - apps/web/src/app/contexts/AuthContext.tsx
  - apps/web/src/app/login/page.tsx
  - apps/web/src/app/page.tsx
- Untracked:
  - CONTEXT.md

## Trabajo completado (resumen tecnico)

### 1) AI Studio (perfiles GPTs) y UX
- Archivos clave:
  - apps/web/src/lib/ai/profiles.ts
  - apps/web/src/app/ai/page.tsx
  - apps/web/src/app/ai/hooks/useAiStudio.ts
  - apps/web/src/app/ai/types.ts
  - apps/web/src/app/content/aiProfileFields.ts
  - apps/web/src/app/content/aiPresets.ts

- Nuevos schemas internos y prompts:
  - evergreen_ideas -> YouTube Evergreen AI
  - script_architect -> Evergreen Script Architect
  - retention_editor -> YouTube Retention Editor
  - titles_thumbs -> Titles & Thumbnails Strategist

- Inputs agregados (brief premium):
  - channelStage, targetAudience, primaryGoal, resources, constraints
  - targetLengthSec, depthLevel, tone, scriptSummary, primaryEmotion

- Render natural de outputs por perfil:
  - ranking de nichos con score/razones/risgo/monetizacion
  - guion por bloques, cambios de retencion, combos top de titulos/miniaturas
  - plan de accion integrado

- Modo manual: ahora permite pegar la respuesta completa y extrae JSON automaticamente.

### 2) Enriquecimiento/validacion de AI runs
- Endpoints actualizados:
  - apps/web/src/app/api/ai/runs/route.ts
  - apps/web/src/app/api/ai/runs/execute/route.ts
- Enriquecen payload con ideaTitle/ideaDescription y scriptContent/originalScript desde DB.
- Validan channel mismatch y script vacio.

### 3) SEO soporta nuevas sugerencias
- Soporta titles/thumbnail objects y fallback a strings:
  - apps/web/src/app/seo/hooks/useSeoData.ts
  - apps/web/src/app/seo/page.tsx

### 4) Fixes YouTube reconcile
- El dashboard ya no duplica channelId en reconcile weekly.
  - apps/web/src/app/page.tsx
- Endpoint de reconcile ahora devuelve errores claros (401/409/429/502) y no 500 generico.
  - apps/web/src/app/api/integrations/youtube/reconcile/weekly/route.ts
- Mensaje visible en dashboard con CTA cuando YouTube falla.
  - apps/web/src/app/page.tsx

### 5) Guia/tour y tutorial inicial
- GuidePanel actualizado con textos nuevos y auto-steps.
  - apps/web/src/app/components/GuidePanel.tsx
- Tutorial luego de crear/conectar canal, CTA a AI Studio.
  - apps/web/src/app/channels/page.tsx

### 6) Auth + flow landing/login/logout
- Landing debe ser siempre accesible.
- Login debe llevar a dashboard.
- Logout debe volver a landing.

Cambios principales:
- Se quito redirect automatico desde / hacia /dashboard.
  - apps/web/src/app/page.tsx
- ProtectedRoute: si no hay sesion, redirige a / (landing).
  - apps/web/src/app/components/ProtectedRoute.tsx
- GuestRoute: si ya hay sesion, redirige a /dashboard.
  - apps/web/src/app/components/ProtectedRoute.tsx
- Login ahora usa window.location.assign('/dashboard') para evitar loading infinito.
  - apps/web/src/app/login/page.tsx
- Logout redirige a /.
  - apps/web/src/app/contexts/AuthContext.tsx

## Tests/lint ejecutados
- npm run lint (apps/web): OK
- npm run test:run (apps/web): OK (29 suites, 97 tests)

Nota: luego de los ultimos cambios de auth/landing/guide/reconcile no se corrieron tests nuevamente.

## Issues resueltos durante la sesion
- Error de GuidePanel: "Cannot access sectionSteps before initialization" -> solucionado.
- Errores 500 en reconcile de YouTube -> mapeo de errores + mensaje UI.
- Duplicado de channelId en reconcile -> fix.
- Warnings lint por variables sin uso y <img> -> resueltos.

## Estado actual y expectativas del usuario
- Usuario quiere:
  - Landing siempre como pagina principal pública (con precios/info).
  - Login -> dashboard.
  - Logout -> landing.
  - App usable sin necesidad de refrescar.
- Ultimo ajuste: login ahora hace navigation completa al dashboard.

## Siguientes pasos sugeridos
1) Probar login/logout y confirmar que no queda loading infinito.
2) Probar dashboard con reconcile YouTube y verificar mensaje claro si falla.
3) Ejecutar lint + test:run tras los ultimos cambios.
4) Preparar commit para los cambios pendientes (si el usuario lo pide).

## Checklist rapido post-reinicio
- Auth:
  - Abrir `/` sin sesion -> landing visible.
  - Login -> dashboard (sin loading eterno).
  - Logout -> landing.
- AI Studio:
  - Evergreen AI -> ranking de nichos, clusters, plan de accion.
  - Script Architect -> hook/promesa/desarrollo/inflexion/cierre.
  - Retention Editor -> V2 + cambios + % reduccion.
  - Titles & Thumbs -> titulos + miniaturas + top combos.
- YouTube reconcile:
  - Si falla token -> mensaje claro en dashboard + CTA.
  - Si no hay integracion -> no rompe UI.
- SEO:
  - Sugerencias de titulos/miniaturas visibles en SEO.

## Comandos utiles
- Instalar deps: `cd apps/web && npm install`
- Lint: `cd apps/web && npm run lint`
- Tests: `cd apps/web && npm run test:run`
- Dev server: `cd apps/web && npm run dev`

## Archivos clave para reanudar rapido
- apps/web/src/lib/ai/profiles.ts
- apps/web/src/app/ai/page.tsx
- apps/web/src/app/ai/hooks/useAiStudio.ts
- apps/web/src/app/ai/types.ts
- apps/web/src/app/api/ai/runs/route.ts
- apps/web/src/app/api/ai/runs/execute/route.ts
- apps/web/src/app/page.tsx
- apps/web/src/app/components/GuidePanel.tsx
- apps/web/src/app/channels/page.tsx
- apps/web/src/app/contexts/AuthContext.tsx
- apps/web/src/app/login/page.tsx

## Notas finales
- CONTEXT.md esta untracked. No commitear a menos que el usuario lo pida.
- La app tiene Guia (GuidePanel) y CTA de canal con flujo a AI Studio.
- Se debe mantener UX en lenguaje natural (JSON solo interno).
