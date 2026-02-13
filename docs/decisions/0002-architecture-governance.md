# ADR-0002: Gobernanza de arquitectura actual

## Contexto
- La base de código ya aplica Clean Architecture (dominio, aplicación e infraestructura) tal como se describe en `docs/ARCHITECTURE.md`.
- Existen trabajos pendientes para refactors profundos (p. ej. mover SQL de API routes a Use Cases), pero priorizamos estabilidad en producción y despliegues en el VPS.
- Cambios estructurales sin alineación previa han generado inconsistencias en la documentación y en los flujos operativos.

## Decisión
- **Mantener la arquitectura actual sin refactors estructurales** hasta nuevo aviso.
- **Todo cambio arquitectónico significativo** (crear/renombrar capas, mover módulos entre dominios, introducir nuevas dependencias críticas) **debe documentarse primero mediante un ADR** aprobado por el equipo.
- Se permite trabajo incremental (bugs, optimizaciones locales) siempre que no altere el diseño aprobado ni requiera mover fronteras entre capas.

## Motivación
- Evitar desviaciones entre implementación y documentación durante la estabilización del producto en el VPS.
- Asegurar que las decisiones de arquitectura se evalúen considerando seguridad, costos operativos y compatibilidad con AgentOS.
- Reducir riesgo de deuda técnica introducida accidentalmente mientras se priorizan tareas de seguridad y despliegue.

## Consecuencias
- Cualquier PR que mueva límites de capas o agregue nuevas dependencias debe incluir un ADR previo y ser revisado con foco en arquitectura.
- Las propuestas de refactor (p. ej. “mover lógica SQL a Use Cases”) se registrarán como ADRs futuros antes de ejecutar cambios en código.
- El equipo puede continuar entregando features menores sin bloqueo, pero se rechazarán modificaciones estructurales que no tengan ADR asociado.
