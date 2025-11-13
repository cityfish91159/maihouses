// api/replicate-detect.js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const { image, labels, mode = 'general', model } = req.body || {};
    
    if (!image) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    
    // 優先順序：前端傳的 model > 環境變數
    let deploymentPath;
    if (model) {
      // 前端傳 model: 'yolov8' → 轉換為完整路徑
      const modelMap = {
        'yolov8': 'cityfish91159/maihouses-yoloworld',
        'grounding-dino': 'cityfish91159/maihouses-grounding-dino',
        'dino': 'cityfish91159/maihouses-grounding-dino'
      };
      deploymentPath = modelMap[model] || model;
    } else {
      deploymentPath = process.env.REPLICATE_DEPLOYMENT_DETECT;
    }
    
    if (!token) {
      return res.status(500).json({ error: 'Missing REPLICATE_API_TOKEN' });
    }
    if (!deploymentPath) {
      return res.status(500).json({ error: 'Missing model or REPLICATE_DEPLOYMENT_DETECT' });
    }

    // 模式參數（與前端 detection-labels.ts 同步）
    const modeConfigs = {
      cake: {
        score_threshold: 0.08,
        box_threshold: 0.15
      },
      curtain: {
        score_threshold: 0.06,
        box_threshold: 0.12
      },
      general: {
        score_threshold: 0.07,
        box_threshold: 0.15
      }
    };

    const config = modeConfigs[mode] || modeConfigs.general;
    const inputLabels = labels || (mode === 'cake' ? ['cake', 'frosting', 'icing'] : mode === 'curtain' ? ['curtain', 'fabric fold'] : ['object']);

    console.log('Detecting with mode:', mode, 'labels:', inputLabels, 'deployment:', deploymentPath);

    // 建立 prediction
    const createUrl = `https://api.replicate.com/v1/deployments/${deploymentPath}/predictions`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          image: image,
          prompt: inputLabels.join(', '),
          box_threshold: config.box_threshold,
          text_threshold: config.score_threshold
        }
      })
    });

    const created = await createRes.json();
    if (!createRes.ok) {
      console.error('Create failed:', created);
      return res.status(500).json({ error: 'create_failed', detail: created });
    }

    console.log('Prediction created:', created.id);

    // 輪詢
    const id = created.id;
    const pollUrl = `https://api.replicate.com/v1/predictions/${id}`;
    let status = created.status;
    let last = created;
    const deadline = Date.now() + 60_000; // 60秒

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

    console.log('Detection succeeded');

    // 回傳原始輸出
    return res.status(200).json({
      ok: true,
      id,
      output: last.output,
      mode,
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
