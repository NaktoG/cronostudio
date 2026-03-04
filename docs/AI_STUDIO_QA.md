# QA - AI Studio (OpenAI)

Checklist breve para validar AI Studio antes de staging/produccion.

## Pre-requisitos
- App corriendo: `npm run dev` en `apps/web`.
- DB con al menos 1 canal.
- Variables OpenAI configuradas:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (default: `gpt-4o-mini`)
  - `OPENAI_MAX_OUTPUT_TOKENS` (default: `1200`)

## 1) Smoke UI (manual)
1. Ir a `/ai` y verificar que cargan perfiles y canales.
2. Seleccionar un canal y un perfil.
3. Click en **Generar prompt**:
   - Debe crear un run con status `awaiting_input`.
   - Debe mostrar el prompt en el panel manual.
4. Click en **Generar y aplicar**:
   - Debe completar el run y mostrar output auto-first.
   - Debe mostrar `Aplicado: ...` en la UI.

## 2) Verificacion de resultados (DB/UI)
### Evergreen Ideas
- Perfil: `evergreen_ideas`
- Esperado: crea 10 ideas con `source='ai'` y `status='draft'`.

### Script Architect
- Perfil: `script_architect`
- Esperado: crea script, actualiza/crea produccion y marca idea `in_production`.

### Retention Editor
- Perfil: `retention_editor`
- Esperado: actualiza `scripts.body`, `full_content`, `word_count` y `estimated_duration_seconds`.

### Titles + Thumbs
- Perfil: `titles_thumbs`
- Esperado: crea/actualiza `seo_data` y enlaza `productions.seo_id`.

## 3) Historial y errores
- En `/ai`, el historial debe listar los runs mas recientes.
- Abrir un run y verificar `input_json` y `output_json`.
- Si falla OpenAI, debe quedar `error` en `ai_runs` y el run debe ser investigable.

## 4) Seguridad basica
- Probar con usuario sin rol `owner`: los endpoints `/api/ai/*` deben devolver 401/403.
- Rate limit: multiples llamadas al endpoint `POST /api/ai/runs/execute` deben activar 429.

## 5) Checklist final
- [ ] No errores en consola del navegador.
- [ ] `ai_runs` muestra ejecuciones y datos correctos.
- [ ] Ideas/Scripts/SEO creados correctamente por AI Studio.
- [ ] Variables OpenAI configuradas en el entorno de deploy.
