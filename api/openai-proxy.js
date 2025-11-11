// api/openai-proxy.js
export default function handler(req, res) {
  return res.status(200).json({ 
    status: 'ok',
    method: req.method,
    time: new Date().toISOString(),
    hasEnvKey: !!process.env.OPENAI_API_KEY
  });
}
