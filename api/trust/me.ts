import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, cors } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = verifyToken(req);
    res.json({
      role: user.role,
      txId: user.txId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(401).json({ error: message });
  }
}
