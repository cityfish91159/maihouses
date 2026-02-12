// api/replicate-generate.js
import { secureEndpoint } from './lib/endpointSecurity';
import { logger } from './lib/logger';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (
    !secureEndpoint(req, res, {
      endpointName: 'replicate-generate',
      allowedMethods: ['POST'],
      requireSystemKey: process.env.ENFORCE_HIGH_COST_SYSTEM_KEY === 'true',
      rateLimit: {
        maxRequests: 8,
        windowMs: 60_000,
        maxEnvVar: 'RATE_LIMIT_REPLICATE_GENERATE_MAX',
        windowEnvVar: 'RATE_LIMIT_REPLICATE_GENERATE_WINDOW_MS',
      },
    })
  ) {
    return;
  }

  try {
    const { prompt, model, deployment } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const token = process.env.REPLICATE_API_TOKEN;

    // 優先順序：前端傳的 model > deployment > 環境變數
    let deploymentPath;
    if (model) {
      // 前端傳 model: 'flux' → 轉換為完整路徑
      const modelMap = {
        flux: 'cityfish91159/maihouses-flux-dev',
        'flux-dev': 'cityfish91159/maihouses-flux-dev',
        sdxl: 'cityfish91159/maihouses-sdxl',
      };
      deploymentPath = modelMap[model] || model; // 如果傳完整路徑就直接用
    } else {
      deploymentPath = deployment || process.env.REPLICATE_DEPLOYMENT;
    }

    if (!token) {
      return res.status(500).json({ error: 'Missing REPLICATE_API_TOKEN (server)' });
    }
    if (!deploymentPath) {
      return res.status(500).json({ error: 'Missing REPLICATE_DEPLOYMENT (server)' });
    }

    logger.info('[replicate-generate] Create request', { deploymentPath });

    // 1) 建立預測
    const createUrl = `https://api.replicate.com/v1/deployments/${deploymentPath}/predictions`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { prompt }, // 多數文字生圖模型吃這個欄位
      }),
    });

    const created = await createRes.json();
    if (!createRes.ok) {
      logger.error('[replicate-generate] Create prediction failed', { detail: created });
      return res.status(500).json({ error: 'create_failed', detail: created });
    }

    logger.info('[replicate-generate] Prediction created', { predictionId: created.id });

    // 2) 輪詢直到完成（最長 90 秒）
    const id = created.id;
    const pollUrl = `https://api.replicate.com/v1/predictions/${id}`;

    let status = created.status;
    let last = created;
    const deadline = Date.now() + 90_000;

    while (!['succeeded', 'failed', 'canceled'].includes(status) && Date.now() < deadline) {
      await sleep(1500);
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pollData = await pollRes.json();
      status = pollData.status;
      last = pollData;
      logger.debug('[replicate-generate] Polling status', { predictionId: id, status });
    }

    if (status !== 'succeeded') {
      logger.error('[replicate-generate] Prediction failed', {
        predictionId: id,
        status,
        detail: last,
      });
      return res.status(500).json({
        error: 'prediction_not_succeeded',
        status,
        detail: last,
      });
    }

    logger.info('[replicate-generate] Prediction succeeded', { predictionId: id });

    // 成功：回傳輸出（多為圖片 URL 陣列）
    return res.status(200).json({
      ok: true,
      id,
      output: last.output, // 常見為 string[]（圖片網址）
      metrics: last.metrics || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[replicate-generate] Server error', { message });
    return res.status(500).json({
      error: 'Internal server error',
      message,
    });
  }
}

