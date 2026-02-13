# Project AgentOS Entry Point

This project uses the GLOBAL AgentOS configuration.

Agents and skills are loaded from:
~/.agentes

## Configuración local

1. Clona o sincroniza el repositorio Global AgentOS en `~/.agentes`.
2. Crea un symlink opcional (`ln -s ~/.agentes .agentes`) si necesitas compatibilidad con tooling legacy.
3. Nunca comitees el directorio `.agentes` dentro del proyecto: está ignorado explícitamente para evitar agentes locales.

Rules:
- No local agents are defined here
- All skills and orchestration come from the global AgentOS
- Conflicts resolved by AgentOS priority rules
