// api/x-raymike.js
// X-Ray Mike 模型接口 - 用於圖片透視處理
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    const { image, version } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Missing image parameter' });
    }

    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
      return res.status(500).json({ error: 'Missing REPLICATE_API_TOKEN (server)' });
    }

    // 使用模型路徑或 deployment
    const modelPath = version || 'cityfish91159/x-raymike';

    console.log('Creating X-Ray prediction with model:', modelPath);

    // 1) 建立預測
    const createUrl = modelPath.includes('/')
      ? `https://api.replicate.com/v1/models/${modelPath}/predictions`
      : `https://api.replicate.com/v1/predictions`;

    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        version: modelPath.includes(':') ? modelPath.split(':')[1] : undefined,
        input: {
          image: image, // 主要輸入：圖片 URL 或 base64
        },
      }),
    });

    const created = await createRes.json();
    if (!createRes.ok) {
      console.error('Create prediction failed:', created);
      return res.status(500).json({
        error: 'create_failed',
        detail: created,
        message: created.detail || created.error || 'Unknown error',
      });
    }

    console.log('X-Ray prediction created:', created.id);

    // 2) 輪詢直到完成（最長 120 秒，因為圖像處理可能較慢）
    const id = created.id;
    const pollUrl = `https://api.replicate.com/v1/predictions/${id}`;

    let status = created.status;
    let last = created;
    const deadline = Date.now() + 120_000; // 120 秒超時

    while (!['succeeded', 'failed', 'canceled'].includes(status) && Date.now() < deadline) {
      await sleep(2000); // 每 2 秒輪詢一次
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pollData = await pollRes.json();
      status = pollData.status;
      last = pollData;
      console.log(
        'X-Ray polling status:',
        status,
        last.progress ? `(${Math.round(last.progress * 100)}%)` : ''
      );
    }

    if (status !== 'succeeded') {
      console.error('X-Ray prediction failed:', status, last);
      return res.status(500).json({
        error: 'prediction_not_succeeded',
        status,
        detail: last,
        logs: last.logs || null,
      });
    }

    console.log('X-Ray prediction succeeded:', last.output);

    // 成功：回傳輸出（通常是處理後的圖片 URL）
    return res.status(200).json({
      ok: true,
      id,
      output: last.output, // 處理後的 X-ray 圖片 URL
      metrics: last.metrics || null,
      logs: last.logs || null,
    });
  } catch (error) {
    console.error('X-Ray Mike API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
