// api/replicate-generate.js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
    const deploymentPath = deployment || process.env.REPLICATE_DEPLOYMENT;

    if (!token) {
      return res.status(500).json({ error: 'Missing REPLICATE_API_TOKEN (server)' });
    }
    if (!deploymentPath) {
      return res.status(500).json({ error: 'Missing REPLICATE_DEPLOYMENT (server)' });
    }

    console.log('Creating prediction with deployment:', deploymentPath);

    // 1) 建立預測
    const createUrl = `https://api.replicate.com/v1/deployments/${deploymentPath}/predictions`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { prompt }   // 多數文字生圖模型吃這個欄位
      })
    });

    const created = await createRes.json();
    if (!createRes.ok) {
      console.error('Create prediction failed:', created);
      return res.status(500).json({ error: 'create_failed', detail: created });
    }

    console.log('Prediction created:', created.id);

    // 2) 輪詢直到完成（最長 90 秒）
    const id = created.id;
    const pollUrl = `https://api.replicate.com/v1/predictions/${id}`;

    let status = created.status;
    let last = created;
    const deadline = Date.now() + 90_000;

    while (!['succeeded', 'failed', 'canceled'].includes(status) && Date.now() < deadline) {
      await sleep(1500);
      const pollRes = await fetch(pollUrl, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const pollData = await pollRes.json();
      status = pollData.status;
      last = pollData;
      console.log('Polling status:', status);
    }

    if (status !== 'succeeded') {
      console.error('Prediction failed:', status, last);
      return res.status(500).json({ 
        error: 'prediction_not_succeeded', 
        status, 
        detail: last 
      });
    }

    console.log('Prediction succeeded:', last.output);

    // 成功：回傳輸出（多為圖片 URL 陣列）
    return res.status(200).json({
      ok: true,
      id,
      output: last.output,     // 常見為 string[]（圖片網址）
      metrics: last.metrics || null
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
