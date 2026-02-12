// api/x-raymike.js
// X-Ray Mike 模型接口 - 用於圖片透視處理
import { secureEndpoint } from './lib/endpointSecurity';
import { logger } from './lib/logger';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (
    !secureEndpoint(req, res, {
      endpointName: 'x-raymike',
      allowedMethods: ['POST'],
      requireSystemKey: process.env.ENFORCE_HIGH_COST_SYSTEM_KEY === 'true',
      rateLimit: {
        maxRequests: 6,
        windowMs: 60_000,
        maxEnvVar: 'RATE_LIMIT_X_RAYMIKE_MAX',
        windowEnvVar: 'RATE_LIMIT_X_RAYMIKE_WINDOW_MS',
      },
    })
  ) {
    return;
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

    logger.info('[x-raymike] Create request', { modelPath });

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
      logger.error('[x-raymike] Create prediction failed', { detail: created });
      return res.status(500).json({
        error: 'create_failed',
        detail: created,
        message: created.detail || created.error || 'Unknown error',
      });
    }

    logger.info('[x-raymike] Prediction created', { predictionId: created.id });

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
      logger.debug('[x-raymike] Polling status', {
        predictionId: id,
        status,
        progress: typeof last.progress === 'number' ? Math.round(last.progress * 100) : null,
      });
    }

    if (status !== 'succeeded') {
      logger.error('[x-raymike] Prediction failed', {
        predictionId: id,
        status,
        detail: last,
      });
      return res.status(500).json({
        error: 'prediction_not_succeeded',
        status,
        detail: last,
        logs: last.logs || null,
      });
    }

    logger.info('[x-raymike] Prediction succeeded', { predictionId: id });

    // 成功：回傳輸出（通常是處理後的圖片 URL）
    return res.status(200).json({
      ok: true,
      id,
      output: last.output, // 處理後的 X-ray 圖片 URL
      metrics: last.metrics || null,
      logs: last.logs || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[x-raymike] API error', { message });
    return res.status(500).json({
      error: 'Internal server error',
      message,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    });
  }
}


