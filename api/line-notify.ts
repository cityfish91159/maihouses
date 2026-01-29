import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { logger } from './lib/logger';

/**
 * Line Notify API - 發送 Line 通知給管理員
 *
 * 使用方式：
 * 1. 去 https://notify-bot.line.me/my/ 取得個人 Access Token
 * 2. 將 Token 設定為環境變數 LINE_NOTIFY_TOKEN
 */

// Zod Schema for request validation
const LineNotifyRequestSchema = z.object({
  message: z.string().min(1, 'message 不能為空').max(1000),
  type: z
    .enum(['activity', 'intimate', 'photo', 'unlock_request', 'default'])
    .optional()
    .default('activity'),
});

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 驗證 request body
  const parsed = LineNotifyRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten(),
    });
  }
  const { message, type } = parsed.data;
  const lineToken = process.env.LINE_NOTIFY_TOKEN;

  if (!lineToken) {
    logger.error('[line-notify] LINE_NOTIFY_TOKEN not configured');
    return res.status(500).json({ error: 'Line Notify not configured' });
  }

  try {
    // 根據類型建立不同格式的訊息
    let formattedMessage = '';
    const timestamp = new Date().toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
    });

    switch (type) {
      case 'activity':
        formattedMessage = `\n💕 資欣老師上線了！\n\n📝 ${message}\n\n⏰ ${timestamp}`;
        break;
      case 'intimate':
        formattedMessage = `\n🔥 親密模式啟動！\n\n${message}\n\n⏰ ${timestamp}`;
        break;
      case 'photo':
        formattedMessage = `\n📸 收到新照片！\n\n${message}\n\n⏰ ${timestamp}`;
        break;
      case 'unlock_request':
        formattedMessage = `\n🔓 聊色請求！\n\n${message}\n\n⏰ ${timestamp}\n\n快去 GodView 批准！`;
        break;
      default:
        formattedMessage = `\n📱 MUSE 通知\n\n${message}\n\n⏰ ${timestamp}`;
    }

    // 發送到 Line Notify
    const response = await fetch(LINE_NOTIFY_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lineToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ message: formattedMessage }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[line-notify] Line Notify error', null, { errorText });
      return res.status(response.status).json({ error: 'Line Notify failed', details: errorText });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    logger.error('[line-notify] Internal server error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
