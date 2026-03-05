# AI Operating Context

Este proyecto usa **AgentOS**.

## Fuente de verdad
- Agentes y skills viven en: `.agentes/`
- No inventes reglas ni stacks.
- Leé contracts antes de actuar.

## Cómo operar
1. Identificá el tipo de tarea.
2. Activá agentes mínimos (máx 5).
3. Auto-invocá skills por trigger.
4. Pedí contexto si falta.
5. Output: resumen, archivos tocados, decisiones, riesgos y próximo paso.

## Política obligatoria (aplica siempre)
- En toda tarea se debe activar el/los agentes pertinentes y auto-invocar las skills aplicables por trigger.
- La respuesta final debe listar explícitamente: agentes activados y skills activadas.
- Si no hay skill aplicable, se debe indicarlo y justificar por qué no aplica.
- Checklist de cumplimiento: `docs/AGENTOS_ENFORCEMENT.md`.

## Ejemplos de mapeo
- Crear UI o componentes: agentes frontend + ui; skills ui_design_system_standard, accessibility_a11y_standard.
- Lógica y consumo en frontend: agente frontend; skills frontend_app_logic, frontend_data_fetching_patterns, frontend_state_management_standard.
- API/contratos backend: agente backend; skill api_design_backend.
- Flujos/automations (n8n): agente automation; skill n8n_workflows.

## Pistas
- Root rules: `.agentes/agents/agent.md`
- Skills index: `.agentes/skills/SKILLS_INDEX.md`
