import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * UAG S 級客戶推播 API
 * 
 * 當客戶升級為 S 級時，透過 LINE Notify 通知業務
 * 
 * 環境變數需求:
 * - LINE_NOTIFY_TOKEN: LINE Notify 的 Access Token
 * 
 * POST /api/uag-notify
 * Body: { agent_id, session_id, grade, reason, score, property_id, district }
 */

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      agent_id, 
      session_id, 
      grade, 
      reason, 
      score,
      property_id,
      district 
    } = req.body;

    // 只處理 S 級
    if (grade !== 'S') {
      return res.status(200).json({ 
        success: true, 
        skipped: true, 
        message: 'Not S-grade, skipping notification' 
      });
    }

    // 取得 LINE Notify Token
    const token = process.env.LINE_NOTIFY_TOKEN;
    if (!token) {
      console.warn('[UAG Notify] LINE_NOTIFY_TOKEN not configured');
      return res.status(200).json({ 
        success: false, 
        error: 'LINE Notify not configured' 
      });
    }

    // 組裝訊息
    const now = new Date().toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `
🎯 【S級高意向客戶】

⏰ 時間: ${now}
📊 評分: ${score || '-'} 分
📍 行政區: ${district || '-'}
🏠 房源: ${property_id ? property_id.substring(0, 12) + '...' : '-'}

📝 原因: ${reason || '有強互動信號'}

🔗 查看詳情: https://maihouses.com/p/uag-dashboard.html

---
Session: ${session_id?.substring(0, 12)}...
`;

    // 發送 LINE Notify
    const formData = new URLSearchParams();
    formData.append('message', message);

    const response = await fetch(LINE_NOTIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[UAG Notify] LINE Notify failed:', response.status, errorText);
      return res.status(200).json({ 
        success: false, 
        error: `LINE Notify failed: ${response.status}` 
      });
    }

    console.log(`[UAG Notify] ✅ S-grade notification sent for ${session_id}`);

    return res.status(200).json({ 
      success: true, 
      notified: true,
      message: 'LINE Notify sent successfully'
    });

  } catch (err) {
    console.error('[UAG Notify] Error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
