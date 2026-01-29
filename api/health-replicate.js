// api/health-replicate.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    ok: true,
    hasToken: !!process.env.REPLICATE_API_TOKEN,
    hasDeployment: !!process.env.REPLICATE_DEPLOYMENT,
    tokenPrefix: process.env.REPLICATE_API_TOKEN
      ? process.env.REPLICATE_API_TOKEN.substring(0, 8) + '...'
      : 'missing',
    deployment: process.env.REPLICATE_DEPLOYMENT || 'missing',
  });
}
