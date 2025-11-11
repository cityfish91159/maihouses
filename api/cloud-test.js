// 對齊 openai-proxy 風格：使用 (req, res) 簽名
// 暫時移除 cloudinary import 來診斷 timeout 問題

export default async function handler(req, res) {
  // CORS（與 openai-proxy 一致）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 健康檢查（GET ?ping=1）
  if (req.method === 'GET' && req.query?.ping === '1') {
    return res.status(200).json({ ok: true, mode: 'ping', test: 'without_cloudinary' });
  }

  // 檢查環境變數
  const hasUrl = !!process.env.CLOUDINARY_URL;
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!hasUrl && !(name && key && secret)) {
    const miss = [];
    if (!hasUrl) {
      if (!name) miss.push('CLOUDINARY_CLOUD_NAME');
      if (!key) miss.push('CLOUDINARY_API_KEY');
      if (!secret) miss.push('CLOUDINARY_API_SECRET');
    }
    return res.status(500).json({
      ok: false,
      error: 'Missing Cloudinary credentials',
      missing: miss,
      hint: 'Set CLOUDINARY_URL or all three variables in Vercel'
    });
  }

  // 暫時回傳環境檢查結果，不實際呼叫 cloudinary
  return res.status(200).json({
    ok: true,
    message: 'Cloudinary credentials found, but upload is disabled for testing',
    have: {
      CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET
    }
  });
}
