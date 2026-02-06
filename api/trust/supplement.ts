import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, logAudit, verifyToken, cors, TrustQuerySchema } from './_utils';
import { logger } from '../lib/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const user = verifyToken(req);
    // [NASA TypeScript Safety] Zod safeParse 取代 as 斷言
    const queryParsed = TrustQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      logger.error('[trust/supplement] Invalid query params', { error: queryParsed.error.message });
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    const { id } = queryParsed.data;
    if (user.txId && user.txId !== id) return res.status(403).json({ error: 'Access denied' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const tx = await getTx(id);
    tx.supplements.push({
      role: user.role,
      content: content,
      // 修復 TS2322: timestamp 使用 ISO 字串格式
      timestamp: new Date().toISOString(),
    });

    await saveTx(id, tx);
    await logAudit(id, 'ADD_SUPPLEMENT', user);
    res.json({ success: true, state: tx });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
