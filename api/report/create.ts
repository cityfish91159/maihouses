import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { logger } from '../lib/logger';

// [NASA TypeScript Safety] Create Payload Schema
const CreatePayloadSchema = z.object({
  propertyId: z.string(),
  agentId: z.string(),
  style: z.enum(['simple', 'investment', 'marketing']),
  highlights: z.array(z.string()),
  photos: z.array(z.number()),
  customMessage: z.string().optional(),
});

/**
 * 報告建立 API
 * POST /api/report/create
 *
 * 建立報告記錄並生成短連結
 */

interface CreatePayload {
  propertyId: string;
  agentId: string;
  style: 'simple' | 'investment' | 'marketing';
  highlights: string[];
  photos: number[];
  customMessage?: string;
}

// 生成短碼
function generateShortCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

  try {
    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as CreatePayload
    const parseResult = CreatePayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { propertyId, agentId, style, highlights, photos, customMessage } = parseResult.data;

    const shortCode = generateShortCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 天後過期

    // TODO: 實際儲存到 Supabase
    // const { data, error } = await supabase
    //   .from('reports')
    //   .insert({
    //     short_code: shortCode,
    //     property_id: propertyId,
    //     agent_id: agentId,
    //     style,
    //     highlights,
    //     photos,
    //     custom_message: customMessage,
    //     expires_at: expiresAt.toISOString()
    //   })
    //   .select()
    //   .single();

    const reportData = {
      id: `R-${Date.now()}`,
      shortCode,
      propertyId,
      agentId,
      style,
      highlights,
      photos,
      customMessage,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    logger.info('[report/create] Report created', reportData);

    return res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    logger.error('[report/create] Error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
