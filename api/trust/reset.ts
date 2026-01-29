import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { createInitialState, saveTx, verifyToken, cors } from './_utils';

/** [NASA TypeScript Safety] Query 參數 Schema */
const ResetQuerySchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const user = verifyToken(req);

    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as { id: string }
    const queryResult = ResetQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    const { id } = queryResult.data;

    // Only allow reset if they have a valid token for the case
    if (user.txId && user.txId !== id) return res.status(403).json({ error: 'Access denied' });

    // [NASA TypeScript Safety] createInitialState 已正確返回 TrustState，無需斷言
    const initialState = createInitialState(id);
    await saveTx(id, initialState);
    res.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
