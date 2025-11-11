// 直接呼叫 Cloudinary Upload API（不使用 npm 套件）
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 健康檢查
  if (req.method === 'GET' && req.query?.ping === '1') {
    return res.status(200).json({ ok: true, mode: 'ping' });
  }

  // 解析環境變數
  let cloudName, apiKey, apiSecret;
  
  if (process.env.CLOUDINARY_URL) {
    // 格式: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      [, apiKey, apiSecret, cloudName] = match;
    }
  } else {
    cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    apiKey = process.env.CLOUDINARY_API_KEY;
    apiSecret = process.env.CLOUDINARY_API_SECRET;
  }

  if (!cloudName || !apiKey || !apiSecret) {
    const miss = [];
    if (!cloudName) miss.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) miss.push('CLOUDINARY_API_KEY');
    if (!apiSecret) miss.push('CLOUDINARY_API_SECRET');
    return res.status(500).json({
      ok: false,
      error: 'Missing Cloudinary credentials',
      missing: miss,
      hint: 'Set CLOUDINARY_URL or all three variables'
    });
  }

  try {
    // 準備上傳資料
    const formData = new FormData();
    formData.append('file', 'https://res.cloudinary.com/demo/image/upload/sample.jpg');
    formData.append('folder', 'raw');
    formData.append('api_key', apiKey);
    
    const timestamp = Math.floor(Date.now() / 1000);
    formData.append('timestamp', timestamp.toString());
    
    // 使用 Basic Auth
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    // 直接呼叫 Cloudinary Upload API
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        ok: false,
        error: 'Cloudinary API error',
        status: response.status,
        details: errorText
      });
    }

    const result = await response.json();
    
    return res.status(200).json({
      ok: true,
      url: result.secure_url,
      public_id: result.public_id,
      cloud_name: cloudName
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || String(error),
      stack: error.stack,
      have: {
        CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  }
}
