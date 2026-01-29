import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, verifyToken, cors, TrustQuerySchema } from './_utils';
import { logger } from '../lib/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = verifyToken(req);
    // [NASA TypeScript Safety] Zod safeParse 取代 as 斷言
    const queryParsed = TrustQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      logger.error('[trust/status] Invalid query params', { error: queryParsed.error.message });
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    const { id } = queryParsed.data;

    if (user.txId && user.txId !== id) {
      return res.status(403).json({ error: 'Access denied for this case' });
    }

    const tx = await getTx(id);

    // Auto check expiration
    const step5 = tx.steps[5];
    if (step5) {
      const deadline = step5.paymentDeadline;
      if (
        deadline !== null &&
        deadline !== undefined &&
        Date.now() > Number(deadline) &&
        step5.paymentStatus === 'initiated'
      ) {
        step5.paymentStatus = 'expired';
        await saveTx(id, tx);
      }
    }

    res.json(tx);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(message === 'Unauthorized' ? 401 : 500).json({ error: message });
  }
}
