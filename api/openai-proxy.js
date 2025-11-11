const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    
    const payload = JSON.stringify({
      model: body?.model || 'gpt-4o-mini',
      messages: body?.messages || [{ role: 'user', content: 'hello' }],
      temperature: body?.temperature !== undefined ? body.temperature : 0.3,
      stream: false
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          res.status(apiRes.statusCode || 200).json(jsonData);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse OpenAI response', raw: data });
        }
      });
    });

    apiReq.on('error', (e) => {
      console.error('HTTPS Request Error:', e);
      res.status(500).json({ error: e.message });
    });

    apiReq.write(payload);
    apiReq.end();

  } catch (e) {
    console.error('Handler Error:', e);
    return res.status(500).json({ 
      error: e?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    });
  }
};
