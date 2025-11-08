// cf-workers/mai-ai-proxy/worker.js
// Cloudflare Workers proxy for OpenAI-compatible chat completions with SSE streaming
// - CORS allowlist for your GitHub Pages domain
// - Basic per-IP rate limiting via KV
// - Keys live in Workers secrets (never in frontend)

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // CORS allowlist (adjust to your Pages origins)
    const ORIGIN = req.headers.get('Origin') || '';
    const ALLOW = new Set([
      'https://cityfish91159.github.io',
      'https://cityfish91159.github.io/maihouses',
    ]);
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOW.has(ORIGIN) ? ORIGIN : '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/' && req.method === 'GET') {
      return new Response('OK', { headers: corsHeaders });
    }

    // Proxy route
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      // Simple rate limit: 30 req/min per IP
      const ip = req.headers.get('CF-Connecting-IP') || '0.0.0.0';
      const bucket = `rl:${ip}:${new Date().getUTCFullYear()}${new Date().getUTCMonth()}${new Date().getUTCDate()}${new Date().getUTCHours()}${new Date().getUTCMinutes()}`;
      const current = (await env.RATE.get(bucket)) || '0';
      if (parseInt(current, 10) > 30) {
        return new Response(JSON.stringify({ error: 'RATE_LIMIT' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await env.RATE.put(bucket, String(parseInt(current, 10) + 1), { expirationTtl: 90 });

      const body = await req.json().catch(() => ({}));

      // Upstream config
      const upstream = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const model = env.OPENAI_MODEL || 'gpt-4o-mini';
      const headers = {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      };

      // Forward as streaming chat completions
      const upstreamResp = await fetch(`${upstream}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          stream: true,
          messages: body.messages || [{ role: 'user', content: 'Hello' }],
          temperature: body.temperature ?? 0.7,
        }),
      });

      // Pass-thru SSE stream
      return new Response(upstreamResp.body, {
        status: upstreamResp.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
