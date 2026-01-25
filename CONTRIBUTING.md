# Guía de Contribución

¡Gracias por tu interés en contribuir a CronoStudio! Este documento detalla el proceso para contribuir al proyecto.

## workflow de Desarrollo

1. **Fork** el repositorio.
2. **Clona** tu fork localmente.
3. Crea una nueva **rama** para tu feature o bugfix:
   ```bash
   git checkout -b feat/nombre-feature
   # o
   git checkout -b fix/nombre-bug
   ```

## Estándares de Código

### Commits
Usamos **Conventional Commits**:

- `feat:` Nuevas características
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `style:` Formato, puntos y comas faltantes, etc.
- `refactor:` Refactorización de código
- `test:` Añadir o corregir tests
- `chore:` Tareas de mantenimiento

Ejemplo: `feat(api): create idea use case`

### Clean Architecture
Si añades lógica de negocio:
1. Define la **Entity** o **Interface** en `domain/`.
2. Implementa el **Use Case** en `application/`.
3. Implementa la persistencia en `infrastructure/`.
4. Exponlo en `app/api/` o `actions/`.

### Testing
- Añade tests unitarios para nuevos Use Cases y utilidades.
- Ejecuta `npm run test` antes de hacer push.

## Pull Requests

1. Haz push de tu rama a tu fork.
2. Abre un Pull Request hacia `main`.
3. Describe tus cambios detalladamente.
4. Espera a la revisión de código.
