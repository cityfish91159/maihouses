export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: body?.model ?? 'gpt-4o-mini',
        messages: body?.messages ?? [{ role: 'user', content: 'hello' }],
        temperature: body?.temperature ?? 0.3,
        stream: body?.stream ?? false
      })
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e?.message ?? 'Unknown error' });
  }
}
