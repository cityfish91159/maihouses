import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { logger } from '../lib/logger';

// [NASA TypeScript Safety] Track Payload Schema
const TrackPayloadSchema = z.object({
  reportId: z.string(),
  agentId: z.string().optional(),
  source: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * 報告瀏覽追蹤 API
 * POST /api/report/track
 *
 * 記錄客戶開啟報告的行為，可與 UAG 系統整合
 */

interface TrackPayload {
  reportId: string;
  agentId?: string;
  source?: string;
  userAgent?: string;
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
    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as TrackPayload
    const parseResult = TrackPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing reportId' });
    }
    const { reportId, agentId, source, userAgent } = parseResult.data;

    // TODO: 實際儲存到 Supabase
    // const { error } = await supabase
    //   .from('report_views')
    //   .insert({
    //     report_id: reportId,
    //     agent_id: agentId,
    //     source: source || 'direct',
    //     user_agent: userAgent,
    //     ip_hash: hashIP(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
    //     viewed_at: new Date().toISOString()
    //   });

    // 目前只記錄 log
    logger.info('[report/track] Report tracked', {
      reportId,
      agentId,
      source,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Tracked successfully',
    });
  } catch (error) {
    logger.error('[report/track] Error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
