// cf-workers/mai-ai-proxy/worker.js
// Cloudflare Workers proxy for OpenAI-compatible chat completions (minimal)
// 極簡回退：保留原始 CORS allowlist + 基礎 KV 流量桶 + 直接 SSE 轉發，不加額外 JSON 錯誤格式化或本地開發白名單。

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // CORS allowlist（維持最初設定，不自動擴增）
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

    // Health check（純 200 OK）
    if (url.pathname === '/' && req.method === 'GET') {
      return new Response('OK', { headers: corsHeaders });
    }

    // Proxy route（直接轉發，不加額外驗錯）
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      // Simple rate limit: 30 req/min per IP（保持不變）
      const ip = req.headers.get('CF-Connecting-IP') || '0.0.0.0';
      const bucket = `rl:${ip}:${new Date().getUTCFullYear()}${new Date().getUTCMonth()}${new Date().getUTCDate()}${new Date().getUTCHours()}${new Date().getUTCMinutes()}`;
      const current = (await env.RATE.get(bucket)) || '0';
      if (parseInt(current, 10) > 30) {
        return new Response(JSON.stringify({ error: 'RATE_LIMIT' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await env.RATE.put(bucket, String(parseInt(current, 10) + 1), {
        expirationTtl: 90,
      });

      const body = await req.json().catch(() => ({}));

      // Upstream config
      const upstream = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const model = env.OPENAI_MODEL || 'gpt-4o-mini';
      const headers = {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      };

      // Forward as streaming chat completions（保持 upstream headers 與流）
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
