import { v2 as cloudinary } from 'cloudinary';
import { enforceCors } from './lib/cors';

function getHeaderValue(headerValue) {
  if (typeof headerValue === 'string') return headerValue;
  if (Array.isArray(headerValue) && headerValue.length > 0) return headerValue[0];
  return '';
}

export default async function handler(req, res) {
  if (!enforceCors(req, res)) return;

  if (process.env.ENABLE_TEST_APIS !== 'true') {
    return res.status(403).json({
      ok: false,
      error: 'Test endpoint is disabled',
      hint: 'Set ENABLE_TEST_APIS=true only in controlled environments',
    });
  }

  const systemApiKey = process.env.SYSTEM_API_KEY;
  if (!systemApiKey) {
    return res.status(503).json({
      ok: false,
      error: 'SYSTEM_API_KEY not configured',
    });
  }

  const requestSystemKey = getHeaderValue(req.headers['x-system-key']);
  if (requestSystemKey !== systemApiKey) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET' && req.query?.ping === '1') {
    return res.status(200).json({ ok: true, mode: 'ping' });
  }

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
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({
      ok: false,
      error: message,
      have: {
        CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      },
    });
  }
}
