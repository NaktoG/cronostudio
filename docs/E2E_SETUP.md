# E2E SETUP (Playwright)

## Requisitos
- Node + dependencias instaladas en `apps/web`.
- App corriendo en `http://localhost:3000` o definir `E2E_BASE_URL`.

## Instalacion de browsers
```
cd apps/web
npx playwright install
```

## Variables de entorno
- `E2E_BASE_URL` (opcional, default `http://localhost:3000`)
- `E2E_USER_EMAIL` (opcional, habilita smoke de login)
- `E2E_USER_PASSWORD` (opcional)

## Ejecutar
```
cd apps/web
npm run test:e2e
```

## Notas
- Si no se setean credenciales, el test autenticado se omite.
