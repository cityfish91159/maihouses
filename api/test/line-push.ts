/**
 * LINE Push 測試 API
 *
 * 用途：測試 LINE 推播功能，繞過資料庫直接發送
 * 安全：僅限開發環境使用
 *
 * 使用方式：
 * curl -X POST https://maihouses.vercel.app/api/test/line-push \
 *   -H "Content-Type: application/json" \
 *   -d '{"lineUserId": "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}'
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { messagingApi } from '@line/bot-sdk';
import { z } from 'zod';

// [NASA TypeScript Safety] Test Request Schema
const TestRequestSchema = z.object({
  lineUserId: z.string(),
  message: z.string().optional(),
});

interface TestRequest {
  lineUserId: string;
  message?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
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

  // 驗證環境變數
  const lineChannelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineChannelToken) {
    return res.status(500).json({
      error: 'LINE_CHANNEL_ACCESS_TOKEN not configured',
      hint: '請在 Vercel 環境變數中設定 LINE_CHANNEL_ACCESS_TOKEN',
    });
  }

  // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as TestRequest
  const parseResult = TestRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Missing lineUserId',
      hint: '請提供 LINE User ID (U 開頭的 33 字元字串)',
      example: {
        lineUserId: 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        message: '可選的自訂訊息',
      },
    });
  }
  const { lineUserId, message } = parseResult.data;

  // 驗證 LINE User ID 格式
  if (!lineUserId.startsWith('U') || lineUserId.length !== 33) {
    return res.status(400).json({
      error: 'Invalid LINE User ID format',
      hint: 'LINE User ID 應該是 U 開頭的 33 字元字串',
      received: lineUserId,
      receivedLength: lineUserId.length,
    });
  }

  // 初始化 LINE Client
  const lineClient = new messagingApi.MessagingApiClient({
    channelAccessToken: lineChannelToken,
  });

  // 發送測試訊息
  const testMessage =
    message ||
    `🧪【邁房子測試】
此為 LINE 推播功能測試訊息
時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}

如果你收到這則訊息，表示 LINE 推播功能正常運作！`;

  try {
    await lineClient.pushMessage({
      to: lineUserId,
      messages: [{ type: 'text', text: testMessage }],
    });

    return res.json({
      success: true,
      message: 'LINE 推播發送成功！請檢查你的 LINE',
      sentTo: lineUserId,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 解析 LINE API 錯誤
    let hint = '未知錯誤';
    if (errorMessage.includes('Invalid reply token')) {
      hint = 'Reply token 無效';
    } else if (errorMessage.includes('not found')) {
      hint = '找不到此 LINE 用戶，可能是 User ID 錯誤或用戶已封鎖';
    } else if (errorMessage.includes('Authentication failed')) {
      hint = 'LINE Channel Access Token 無效';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      hint,
      lineUserId,
    });
  }
}
