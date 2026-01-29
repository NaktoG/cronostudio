# Politica de ramas

Esta politica define el flujo de trabajo y el proposito de cada tipo de rama.

## Ramas base
- `main`: versiones estables y publicables.
- `develop`: rama de trabajo integrada diaria.

## Tipos de ramas
- `feature/*`: nuevas funcionalidades por dominio.
- `fix/*`: correcciones de bugs.
- `hotfix/*`: correcciones urgentes sobre `main`.
- `chore/*`: mantenimiento tecnico, dependencias y tooling.
- `docs/*`: cambios de documentacion.
- `refactor/*`: refactors sin cambio funcional.
- `release/*`: preparacion de releases (versionado, notas, estabilizacion).
- `spike/*`: investigacion o pruebas exploratorias.
- `experiment/*`: experimentos y A/B tests.
- `ops/*`: observabilidad y operaciones.
- `support/*`: tareas de soporte y mantenimiento menor.

## Reglas de uso
- Todo trabajo parte desde `develop` (salvo `hotfix/*` desde `main`).
- Merge a `develop` via PR con revision.
- `release/*` se crea desde `develop` y se mergea a `main` y `develop`.
- `hotfix/*` se mergea a `main` y `develop`.
- Eliminar ramas al finalizar (local y remoto).

## Flujo recomendado
1. Crear rama desde `develop`.
2. Abrir PR hacia `develop`.
3. Revisar y mergear.
4. Borrar rama en local y remoto.
5. Para release: crear `release/*`, estabilizar, mergear a `main` y `develop`.
6. Para hotfix: crear `hotfix/*` desde `main`, mergear a `main` y `develop`.

## Convenciones
- Nombres cortos y descriptivos en minusculas y con guiones.
- Un tema por rama y por PR.
