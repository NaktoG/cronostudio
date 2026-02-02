export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Use POST', { status: 405 });
    }

    const body = await request.json();
    const site = env.DD_SITE || 'datadoghq.com';
    const endpoint = `https://api.${site}/api/v1/series?api_key=${env.DD_API_KEY}`;

    const series = {
      series: [
        {
          metric: body.name,
          points: [[Math.floor(Date.now() / 1000), body.value || 0]],
          tags: Object.entries(body.tags || {}).map(([key, value]) => `${key}:${value}`),
          type: 'gauge',
        },
      ],
    };

    const ddResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(series),
    });

    if (!ddResponse.ok) {
      const errorText = await ddResponse.text();
      return new Response(errorText, { status: ddResponse.status });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  },
};
