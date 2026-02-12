// api/visualize-detections.js
import { enforceCors } from './lib/cors';
import { logger } from './lib/logger';

export default async function handler(req, res) {
  if (!enforceCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const { image, boxes, mode = 'general' } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Missing image URL' });
    }
    if (!boxes || !Array.isArray(boxes)) {
      return res.status(400).json({ error: 'Missing boxes array' });
    }

    // 取得圖片尺寸
    const imgRes = await fetch(image);
    const imgBuffer = await imgRes.arrayBuffer();
    const imgBase64 = Buffer.from(imgBuffer).toString('base64');
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

    // 簡易圖片尺寸偵測（假設 1000x1000，實際應解析）
    const imgWidth = 1000;
    const imgHeight = 1000;

    // 模式顏色配置
    const modeStyles = {
      curtain: {
        color: '#9370db',
        stroke: 5,
        opacity: 0.4,
        fontSize: 22,
        tag: '🪟',
      },
      general: {
        color: '#4ade80',
        stroke: 4,
        opacity: 0.3,
        fontSize: 20,
        tag: '📦',
      },
    };

    const style = modeStyles[mode] || modeStyles.general;

    // 產生 SVG
    const rects = boxes
      .map((box, i) => {
        const x = box.x * imgWidth;
        const y = box.y * imgHeight;
        const w = box.w * imgWidth;
        const h = box.h * imgHeight;
        const label = box.label || 'object';
        const score = box.score ? (box.score * 100).toFixed(0) + '%' : '';

        return `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" 
              fill="none" 
              stroke="${style.color}" 
              stroke-width="${style.stroke}" 
              opacity="${style.opacity}" />
        <text x="${x + 5}" y="${y + style.fontSize}" 
              fill="${style.color}" 
              font-family="Arial, sans-serif" 
              font-size="${style.fontSize}" 
              font-weight="bold">
          ${style.tag} ${label.toUpperCase()} ${score}
        </text>
      `;
      })
      .join('\n');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${imgWidth}" height="${imgHeight}" viewBox="0 0 ${imgWidth} ${imgHeight}">
  <image href="data:${contentType};base64,${imgBase64}" x="0" y="0" width="${imgWidth}" height="${imgHeight}" />
  ${rects}
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="detection-${mode}.svg"`);
    return res.status(200).send(svg);
  } catch (error) {
    logger.error('[visualize-detections] Visualization error', {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: 'Visualization failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

