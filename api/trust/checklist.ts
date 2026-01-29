import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, verifyToken, cors, TrustQuerySchema } from './_utils';
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
      logger.error('[trust/checklist] Invalid query params', { error: queryParsed.error.message });
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    const { id } = queryParsed.data;

    if (user.role !== 'buyer') return res.status(403).json({ error: 'Forbidden' });
    if (user.txId && user.txId !== id) return res.status(403).json({ error: 'Access denied' });

    const { index, checked } = req.body;
    const tx = await getTx(id);
    if (tx.currentStep !== 6) return res.status(400).json({ error: 'Invalid step' });

    // 修復 TS2532: checklist 可能 undefined
    const checklist = tx.steps[6]?.checklist;
    if (!checklist || !checklist[index]) {
      return res.status(400).json({ error: 'Checklist not found' });
    }
    checklist[index].checked = checked;
    await saveTx(id, tx);
    res.json({ success: true, state: tx });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
