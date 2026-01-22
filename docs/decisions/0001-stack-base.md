# ADR-0001: Stack base Crono Studio

## Contexto
Crono Studio es una plataforma para gestionar canales de YouTube automatizados
mediante agentes IA orquestados con n8n.

## Decisión
- Orquestación: n8n
- Base de datos: PostgreSQL
- Infra local: Docker Compose
- UI: app web separada (apps/web)
- Persistencia: Volúmenes Docker

## Motivo
- n8n permite iteración rápida y visual
- PostgreSQL es estable y soportado oficialmente
- Docker garantiza reproducibilidad
- Separación clara entre UI y workflows

## Consecuencias
- Los workflows viven desacoplados del frontend
- La UI solo dispara webhooks / APIs
- Infra portable a VPS más adelante
