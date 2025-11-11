// Cloudflare Images Upload API
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
    return res.status(200).json({ ok: true, mode: 'ping', service: 'cloudflare' });
  }

  // 檢查必要的環境變數
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(500).json({
      ok: false,
      error: 'Missing Cloudflare credentials',
      missing: [
        !accountId && 'CLOUDFLARE_ACCOUNT_ID',
        !apiToken && 'CLOUDFLARE_API_TOKEN'
      ].filter(Boolean),
      hint: 'Set these in Vercel Environment Variables'
    });
  }

  // 只支援 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 從 request body 取得圖片 URL 或 base64
    const { imageUrl, imageData, filename } = req.body || {};

    if (!imageUrl && !imageData) {
      return res.status(400).json({
        ok: false,
        error: 'Missing image data',
        hint: 'Provide either imageUrl or imageData (base64)'
      });
    }

    let imageBlob;

    // 如果是 URL，先 fetch 下載
    if (imageUrl) {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return res.status(400).json({
          ok: false,
          error: 'Failed to fetch image from URL',
          status: imageResponse.status
        });
      }
      imageBlob = await imageResponse.blob();
    } else {
      // 如果是 base64，轉成 Blob
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      imageBlob = new Blob([buffer]);
    }

    // 準備上傳到 Cloudflare Images
    const formData = new FormData();
    formData.append('file', imageBlob, filename || 'upload.jpg');

    // 上傳到 Cloudflare Images
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      },
      body: formData
    });

    const result = await uploadResponse.json();

    if (!uploadResponse.ok || !result.success) {
      return res.status(uploadResponse.status).json({
        ok: false,
        error: 'Cloudflare upload failed',
        details: result.errors || result
      });
    }

    // 成功回傳
    return res.status(200).json({
      ok: true,
      id: result.result.id,
      filename: result.result.filename,
      uploaded: result.result.uploaded,
      variants: result.result.variants,
      // Cloudflare Images 提供多種尺寸變體
      url: result.result.variants[0] // 預設第一個變體
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || String(error),
      have: {
        CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_API_TOKEN: !!process.env.CLOUDFLARE_API_TOKEN
      }
    });
  }
}
