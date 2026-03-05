# CONTEXTO DE LA SESION

## Resumen ejecutivo (lectura rapida)
- Refactor en progreso para mover logica de Ideas/Scripts/SEO a hooks/servicios.
- Nuevos hooks/servicios/helpers creados; pages actualizadas para usarlos.
- Lint OK en apps/web; no hay commit ni push.
- Queda pendiente QA visual y decision de commit.

Fecha: Thu Mar 05 2026
Repo: /Volumes/SSD-QVO/projects/cronostudio
Rama: develop
Workspace: macOS (darwin)

## Objetivo general del trabajo
- Refactorizar la app siguiendo Clean Architecture/SOLID/TS strict.
- Eliminar logica hardcodeada en UI; mover a servicios/hooks/helpers.
- Mejorar UX/UI y responsiveness en diferentes dispositivos.
- Completar QA visual.
- Continuar refactor en secciones restantes (ideas/scripts/dashboard/seo), moviendo logica a servicios/hooks/helpers.

## Reglas e instrucciones clave
- No romper funcionalidad.
- Evitar hardcode en UI; preferir config/modulos/servicios/hooks.
- Mantener TS estricto.
- QA visual en multiples dispositivos.
- No commitear ni pushear hasta que se complete el trabajo (solo si el usuario lo pide).
- .agentes es global en ~/.agentes; no commitear .agentes.
- Responder siempre en espanol.
- Es estricto apoyarse en los agentes y skills correspondientes para programar, documentar y testear.

## Descubrimientos y contexto
- Monorepo; app principal en apps/web.
- CSP: antes estaba report-only; ahora ya esta enforced (ya corregido previamente).
- Repo es git; branch actual develop.
- Lint se ejecuta desde apps/web (package.json en apps/web).

## Trabajo ya completado en sesiones anteriores (ya commiteado/pusheado)
- Fix de CSP report-only y updates de docs.
- Lint errors resueltos, warnings limpiados.
- Headers de seguridad + rate limit mejorado.
- Soporte de proxy confiable para rate limit (RATE_LIMIT_TRUST_PROXY).
- QA checklist AI Studio + docs.
- Onboarding goal wizard (/start) con progreso.
- Presets en AI Studio, paneles de impacto/KPI, checklist de scripts, copy/share/export.
- Invitaciones de colaboracion (migracion + API + UI + pagina de invitacion) con Clean Architecture (service + repos).
- Configs de status centralizadas en app/content/status/* y helper de metricas de scripts.
- Fixes responsive (header menu scroll lock, drawer, guide panel, etc.).

## Refactorizaciones recientes (ya commiteadas/pusheadas)
Commit anterior:
- "refactor: extract ai/ideas/scripts services and hooks"
- Archivos creados:
  - apps/web/src/app/ai/hooks/useAiStudio.ts
  - apps/web/src/app/ai/services/aiStudioService.ts
  - apps/web/src/app/ai/types.ts
  - apps/web/src/app/ideas/services/ideasService.ts
  - apps/web/src/app/ideas/services/ideaPipelineService.ts
  - apps/web/src/app/scripts/services/scriptsService.ts
  - apps/web/src/app/scripts/services/scriptPipelineService.ts
  - apps/web/src/app/hooks/useChannels.ts
  - apps/web/src/app/ai/page.tsx (conectado a hook/service)

## Trabajo actual de esta sesion (sin commit/push)
### Nuevos hooks/servicios/helpers agregados (sin commit)
- apps/web/src/app/ideas/hooks/useIdeas.ts
- apps/web/src/app/scripts/hooks/useScripts.ts
- apps/web/src/app/seo/hooks/useSeoData.ts
- apps/web/src/app/seo/services/seoService.ts
- apps/web/src/app/seo/helpers/seoClipboard.ts
- apps/web/src/lib/clipboard.ts

Detalles funcionales agregados en hooks/helpers:
- useIdeas:
  - fetch/refresh con authFetch y control de AbortSignal.
  - selectedChannel (sync con localStorage), selectedIds, statusErrors, pipelineLoading.
  - tagSuggestions desde ideas (top 12, ordenado por frecuencia).
  - createOrUpdateIdea con normalizacion de tags (comma-separated -> array).
  - deleteIdea.
  - updateStatus con validacion evaluateIdeaReady para approved.
  - updateSelectedStatus con batch + validacion para approved.
  - runPipeline con ideaPipelineService (usa channelId de idea o selectedChannel).

- useScripts:
  - fetch/refresh con authFetch y AbortSignal.
  - selectedChannel (sync localStorage), selectedIds, pipelineLoading.
  - ideaOptions (list de ideas por canal).
  - createOrUpdateScript, deleteScript.
  - updateSelectedStatus (batch).
  - runPipeline con scriptPipelineService (usa selectedChannel; requiere channel).

- useSeoData:
  - fetch/refresh SEO (seoService.fetchSeo) con AbortSignal.
  - selectedChannel (sync localStorage), selectedIds.
  - ideaOptions y scriptOptions para datalist.
  - copySelected y copyItem usando buildSeoClipboardPayload + copyToClipboard.

- seoClipboard helper:
  - buildSeoClipboardPayload con reglas:
    - type=title -> join por \n
    - type=description -> join por \n\n
    - type=tags -> join por ", "

- lib/clipboard:
  - copyToClipboard(value) usa navigator.clipboard.writeText.

### Refactor de paginas (sin commit)
- apps/web/src/app/ideas/page.tsx
  - Eliminada logica local duplicada (seleccion, status, etc.).
  - Usa useIdeas para estado/acciones.
  - Importa evaluateIdeaReady desde lib.
  - openDelete ahora recibe la idea completa.
  - updateStatus tipado con IdeaStatus en onChange.

- apps/web/src/app/scripts/page.tsx
  - Usa type Script desde hook.
  - Removida llamada redundante a refreshScripts en submit.
  - Eliminado wrapper runPublishPipeline; se usa runPipeline directo.
  - Importado useCallback.
  - Mantiene checklist de guion y export/copiar (helpers existentes).

- apps/web/src/app/seo/page.tsx
  - Migrado a useSeoData para loading/data/selection/copy.
  - Eliminada logica local de fetch/estado/canales/opciones.
  - copyItem/copySelected del hook.
  - Copia de presets con helper handlePresetCopy usando copyToClipboard + toasts.
  - Boton de reintentar usa refreshSeo.
  - Mantiene score label/color con SEO_SCORE_THRESHOLDS y getSeoScoreLabel.

## Estado del lint
- npm run lint en repo root fallo por falta de package.json.
- npm run lint en apps/web OK.

Comandos ejecutados:
- git status -sb
- git diff --stat
- npm run lint (repo root -> fallo por falta de package.json)
- npm run lint (apps/web -> OK)

Salida relevante de comandos:
- git status -sb:
  - ## develop...origin/develop
  - M apps/web/src/app/ideas/page.tsx
  - M apps/web/src/app/scripts/page.tsx
  - M apps/web/src/app/seo/page.tsx
  - ?? apps/web/src/app/ideas/hooks/
  - ?? apps/web/src/app/scripts/hooks/
  - ?? apps/web/src/app/seo/helpers/
  - ?? apps/web/src/app/seo/hooks/
  - ?? apps/web/src/app/seo/services/
  - ?? apps/web/src/lib/clipboard.ts

- git diff --stat:
  - apps/web/src/app/ideas/page.tsx | 182 +++-----------------------------------
  - apps/web/src/app/scripts/page.tsx | 135 +++-------------------------
  - apps/web/src/app/seo/page.tsx | 50 ++---------
  - 3 files changed, 30 insertions(+), 337 deletions(-)

- npm run lint (repo root):
  - Error ENOENT: package.json no existe en /Volumes/SSD-QVO/projects/cronostudio

- npm run lint (apps/web):
  - web@0.1.0 lint -> eslint (sin errores)

## Estado del git al final de la sesion (no commiteado)
- Modificados:
  - apps/web/src/app/ideas/page.tsx
  - apps/web/src/app/scripts/page.tsx
  - apps/web/src/app/seo/page.tsx
- Nuevos (untracked):
  - apps/web/src/app/ideas/hooks/
  - apps/web/src/app/scripts/hooks/
  - apps/web/src/app/seo/helpers/
  - apps/web/src/app/seo/hooks/
  - apps/web/src/app/seo/services/
  - apps/web/src/lib/clipboard.ts
  - SESSION_CONTEXT.md

## Archivos clave por area
Ideas:
- apps/web/src/app/ideas/page.tsx
- apps/web/src/app/ideas/hooks/useIdeas.ts
- apps/web/src/app/ideas/services/ideasService.ts
- apps/web/src/app/ideas/services/ideaPipelineService.ts

Scripts:
- apps/web/src/app/scripts/page.tsx
- apps/web/src/app/scripts/hooks/useScripts.ts
- apps/web/src/app/scripts/services/scriptsService.ts
- apps/web/src/app/scripts/services/scriptPipelineService.ts

SEO:
- apps/web/src/app/seo/page.tsx
- apps/web/src/app/seo/hooks/useSeoData.ts
- apps/web/src/app/seo/services/seoService.ts
- apps/web/src/app/seo/helpers/seoClipboard.ts
- apps/web/src/lib/clipboard.ts

AI Studio:
- apps/web/src/app/ai/page.tsx
- apps/web/src/app/ai/hooks/useAiStudio.ts
- apps/web/src/app/ai/services/aiStudioService.ts
- apps/web/src/app/ai/types.ts

Contenido/estados:
- apps/web/src/app/content/status/ideas.ts
- apps/web/src/app/content/status/scripts.ts
- apps/web/src/app/content/status/seo.ts
- apps/web/src/app/content/status/thumbnails.ts
- apps/web/src/app/content/status/weekly.ts
- apps/web/src/app/content/status/automation.ts
- apps/web/src/app/content/status/productions.ts
- apps/web/src/lib/scripts/metrics.ts

## Siguientes pasos recomendados
1) Revisar git diff y validar que no falten imports/usos en ideas/scripts/seo.
2) Decidir si se debe commitear todo este bloque (hooks + refactors + clipboard).
3) Continuar refactor pendiente: dashboard/useDashboardData y servicios adicionales (scheduling/publishing/productions) si aplica.
4) Ejecutar QA visual post-refactor en diferentes breakpoints.

## Guia de reanudacion rapida
1) Abrir este repo y revisar git status.
2) Si todo sigue igual, revisar diffs en:
   - apps/web/src/app/ideas/page.tsx
   - apps/web/src/app/scripts/page.tsx
   - apps/web/src/app/seo/page.tsx
   - apps/web/src/app/ideas/hooks/useIdeas.ts
   - apps/web/src/app/scripts/hooks/useScripts.ts
   - apps/web/src/app/seo/hooks/useSeoData.ts
3) Ejecutar lint en apps/web: npm run lint
4) Si esta OK, hacer commit cuando el usuario lo pida.

## Checklist de QA visual sugerido (pendiente de ejecucion)
- Ideas: modal crear/editar, validacion checklist, badge de status, seleccion masiva, pipeline, delete modal.
- Scripts: modal crear/editar, checklist rapido, export/clipboard, pipeline, delete modal, share link.
- SEO: filtros por canal, copy masivo, presets, score bar, empty state.
- Responsive: mobile (<640px), tablet (~768px), desktop (>=1024px).

## Riesgos y edge cases a verificar
- Ideas: aprobar sin descripcion/hook/bullets debe mostrar errores y no cambiar status.
- Ideas: runPipeline sin canal seleccionado debe mostrar toast de error.
- Scripts: runPipeline sin canal seleccionado debe mostrar toast de error.
- Scripts: editar guion con ideaId manual vs por titulo (sincronizacion).
- SEO: copy masivo de tags debe deduplicar correctamente.
- SEO: item sin descripcion o sin tags no debe romper botones de copia.
- LocalStorage: cambio de canal persiste y refresca listas sin loops.

## Logs/capturas
- No se guardaron logs externos ni capturas de pantalla durante la sesion.

## Checklist por archivo (pendiente)
- apps/web/src/app/ideas/page.tsx
  - Modal crear/editar abre con ?new=1 y limpia estado.
  - Checklist de aprobacion muestra errores correctos.
  - Update status individual (select) tipado y refleja badge.
  - Seleccion masiva: aprobar/archivar/limpiar funciona.
  - Delete modal abre/cierra correctamente y confirma.
  - Pipeline deshabilita boton mientras carga.

- apps/web/src/app/ideas/hooks/useIdeas.ts
  - refreshIdeas respeta AbortSignal.
  - updateSelectedStatus usa validacion de approved.
  - tagSuggestions devuelve top 12.

- apps/web/src/app/scripts/page.tsx
  - Modal crear/editar abre con ?new=1.
  - Checklist rapido calcula score y estados.
  - Copiar/descargar/exportar funcionan.
  - Seleccion masiva de status funciona.
  - Pipeline y links AI correctos.
  - Delete modal funciona y respeta disabled.

- apps/web/src/app/scripts/hooks/useScripts.ts
  - refreshScripts respeta AbortSignal.
  - ideaOptions carga al cambiar canal.
  - updateSelectedStatus limpia seleccion y refresca.

- apps/web/src/app/seo/page.tsx
  - Copiar seleccionado (titulo/descripcion/tags) funciona.
  - Copiar item individual usa copyItem.
  - Presets copy con handlePresetCopy.
  - Score bar se anima con score.
  - Empty state botones navegan.

- apps/web/src/app/seo/hooks/useSeoData.ts
  - refreshSeo respeta AbortSignal.
  - ideaOptions/scriptOptions cargan por canal.
  - copySelected y copyItem usan buildSeoClipboardPayload.

- apps/web/src/app/seo/helpers/seoClipboard.ts
  - title -> join con \n
  - description -> join con \n\n
  - tags -> join con ", "

- apps/web/src/lib/clipboard.ts
  - copyToClipboard usa navigator.clipboard.writeText.

## Matriz de pruebas por flujo/rol (pendiente)
Roles:
- Usuario autenticado con canales configurados.
- Usuario autenticado sin canales.

Flujos:
- Ideas (auth + con canales)
  - Crear idea sin canal -> se guarda y lista.
  - Crear idea con canal seleccionado -> canal se aplica.
  - Editar idea existente -> datos precargados y guardado.
  - Aprobar idea incompleta -> bloquea con errores.
  - Aprobar idea completa -> status cambia y toast success.
  - Pipeline -> dispara y actualiza lista.
  - Seleccion masiva -> status cambia y limpia seleccion.
  - Delete -> confirma y elimina.

- Ideas (auth sin canales)
  - Selector de canal oculto o vacio.
  - Pipeline sin canal -> toast error.

- Scripts (auth + con canales)
  - Crear guion con ideaId manual.
  - Crear guion con idea por titulo (autocomplete).
  - Editar guion -> valores precargados.
  - Cambiar status masivo.
  - Pipeline publicar -> actualiza lista.
  - Exportar .md / PDF / copiar guion.
  - Compartir link -> copia URL.
  - Delete -> elimina.

- Scripts (auth sin canales)
  - Pipeline -> toast error por canal faltante.

- SEO (auth + con canales)
  - Listado con score y etiquetas.
  - Copiar item individual (titulo/descripcion/tags).
  - Copiar seleccionado masivo.
  - Presets de sugerencias -> copy.
  - Score bar animada.

- SEO (auth sin canales)
  - Estado vacio con CTAs.
  - Selector de canal oculto o vacio.

Navegacion:
- BackToDashboard funcional.
- Links a AI (ideas/scripts) con parametros correctos.

## Regresion minima obligatoria (pendiente)
- Ideas: crear, editar, aprobar (con validacion), pipeline, delete.
- Scripts: crear, editar, exportar/copiar, pipeline, delete.
- SEO: listado, copias individuales y masivas, presets, score bar.
- Responsive: mobile/tablet/desktop sin overflow ni elementos fuera de pantalla.

## Criterios de aceptacion (pendiente)
- No hay logica hardcodeada en UI para fetch/estado/negocio (usa hooks/servicios).
- UI funcional y consistente con estados de carga/error/vacio.
- Acciones clave muestran toasts correctos.
- Lint en apps/web sin errores.
- QA visual completo en 3 breakpoints.
- Sin cambios en funcionalidad existente.

## Plan de commit (cuando el usuario lo solicite)
1) Revisar git diff completo.
2) Verificar lint en apps/web.
3) Preparar mensaje de commit enfocado en el "por que".
4) Hacer git add de hooks/servicios/helpers y pages refactor.
5) Crear commit.
6) Si el usuario lo pide, push a origin/develop.

## Riesgos de deploy (pendiente)
- Cambios en hooks pueden afectar flujos si authFetch devuelve datos inesperados.
- Dependencia de localStorage para selectedChannel en varias pantallas.
- Clipboard API puede fallar por permisos del navegador.

## Plan de rollback (si algo falla)
- Revertir el commit de refactor (cuando exista).
- Restaurar behavior anterior de pages (si se detecta regresion).
- Verificar lints/tests y estado visual tras rollback.

## Metricas de verificacion y smoke tests post-deploy (pendiente)
Metricas:
- Lint OK (apps/web).
- Error rate en consola JS = 0 en flujos principales.
- Tiempo de carga percibido sin degradacion visible.

Smoke tests:
- Ideas: crear + aprobar + pipeline.
- Scripts: crear + exportar + pipeline.
- SEO: copiar individual + masivo + presets.
- Navegacion: dashboard <-> ideas/scripts/seo.

## Checklist de seguridad (pendiente)
- CSP sigue en modo enforced.
- Headers de seguridad activos.
- Rate limit operativo con proxy confiable.
- No se exponen datos sensibles en UI.

## Compatibilidad de navegador (pendiente)
- Chrome/Edge: ok.
- Safari: validar clipboard + dialog focus.
- Firefox: validar animaciones y clipboard.

## Sin preguntas pendientes
- No hay bloqueos ni preguntas abiertas.

## Nota sobre idioma
- El usuario pidio responder siempre en espanol.
