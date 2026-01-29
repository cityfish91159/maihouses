import { v2 as cloudinary } from 'cloudinary';

// 通用回應工具：同時支援 Vercel 傳統 res.json 與 Web Response（保留但使用 req,res）
const reply = (res, body, status = 200) => {
  if (res && typeof res.status === 'function') {
    return res.status(status).json(body);
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
};

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
    return res.status(200).json({ ok: true, mode: 'ping' });
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
      hint: 'Set CLOUDINARY_URL or all three variables in Vercel',
    });
  }

  // 設定 Cloudinary
  if (hasUrl) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: name,
      api_key: key,
      api_secret: secret,
      secure: true,
    });
  }

  try {
    const cfg = cloudinary.config();
    // 不使用 upload_preset，直接伺服器端上傳
    const r = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      { folder: 'raw' }
    );

    return res.status(200).json({
      ok: true,
      url: r.secure_url,
      public_id: r.public_id,
      cloud_name: cfg.cloud_name,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e.message || e),
      have: {
        CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      },
    });
  }
}
