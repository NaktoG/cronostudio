# Observabilidad y Alertas

CronoStudio puede emitir métricas ligeras desde el backend (API Routes) cada vez que se llama a `emitMetric`. Este documento explica cómo activar el flujo y enviar los eventos hacia tu sistema preferido (Prometheus, Datadog, etc.).

## Variables de entorno

En `apps/web/.env` o variables del hosting define:

| Variable | Descripción |
|----------|-------------|
| `OBS_ENABLED` | `true` para activar el envío de métricas. Por defecto `false`. |
| `OBS_ENDPOINT` | URL HTTP(S) que recibirá los eventos JSON. |

Cada métrica enviada tiene el siguiente formato:

```json
{
  "name": "health.healthy",
  "value": 1,
  "tags": {
    "service": "web"
  }
}
```

## Opción A: Endpoint local para pruebas

Ejecuta el servidor incluido para imprimir los eventos:

```bash
OBS_ENABLED=true \
OBS_ENDPOINT=http://localhost:7071 \
node scripts/observability/local-metrics-server.mjs
```

El servidor escucha en `7071` y vuelca cada métrica en consola/archivo `./metrics.log`.

## Opción B: Integración con Datadog

1. Despliega el worker `infra/observability/datadog-worker.js` (Cloudflare Workers, Vercel Edge o similar) con las variables:
   - `DD_API_KEY`: API key de Datadog
   - `DD_SITE`: `datadoghq.com`, `datadoghq.eu`, etc.
2. Consulta la URL pública del worker y configúrala como `OBS_ENDPOINT`.

El worker convierte el evento de CronoStudio al formato `series` de Datadog para que puedas crear dashboards/alertas.

## Opción C: Prometheus Pushgateway

Si ya tienes un Pushgateway accesible, crea un pequeño proxy (ejemplo en TypeScript):

```ts
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
  const { name, value, tags } = req.body;
  const job = tags?.service ?? 'cronostudio';
  await fetch('https://pushgateway.example.com/metrics/job/' + job, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: `${name} ${value}\n`,
  });
  res.json({ ok: true });
});

app.listen(8080);
```

Publica ese proxy y apúntalo desde `OBS_ENDPOINT`. De este modo podrás crear alertas en Prometheus/Alertmanager (ej. `increase(health.error[5m]) > 0`).

## Métricas disponibles (por ahora)

| Nombre | Descripción |
|--------|-------------|
| `health.healthy` | Resultado OK del endpoint `/api/health`. |
| `health.degraded` | Healthcheck respondió 503 pero la DB sigue operativa. |
| `health.unhealthy` / `health.error` | Excepción o fallo general durante healthcheck. |
| `healthcheck.ok` | Alias usado por el middleware legacy (se emite en paralelo mientras migramos). |
| `healthcheck.fail` | Alias de error legacy. |

Puedes añadir más invocando `emitMetric({ name: 'nombre', value: 1, tags: { ... } })` en cualquier caso de uso crítico (p.ej. creación de ideas, ingesta de n8n, etc.).

## Alertas recomendadas

- **Disponibilidad API:** alerta si `sum(rate(health.error[5m])) > 0` o no llega ningún `health.healthy` en 5 minutos.
- **Automatizaciones:** emite métricas desde los workflows n8n cuando fallan y crea una notificación en Slack/Email.
- **Base de datos:** agrega `emitMetric({ name: 'db.query_error', value: 1 })` dentro del catch de `lib/db.ts` para medir errores SQL cuando creas nuevos módulos.

Con este pipeline puedes arrancar con un endpoint local, y luego moverlo a Datadog, Prometheus o el servicio que prefieras sin volver a tocar el backend.
