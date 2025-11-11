// api/replicate-generate.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST' });
  }

  try {
    const { prompt, deployment } = req.body || {};
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'REPLICATE_API_TOKEN not configured on server' });
    }

    // 使用傳入的 deployment 或預設值
    // 格式: {owner}/{deployment-name}
    const deploymentPath = deployment || 'cityfish91159/maihouses-flux'; // 替換成你的 deployment
    const url = `https://api.replicate.com/v1/deployments/${deploymentPath}/predictions`;

    console.log('Calling Replicate API:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "png",
          output_quality: 80
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Replicate API error:', data);
      return res.status(response.status).json({
        error: 'Replicate API error',
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
