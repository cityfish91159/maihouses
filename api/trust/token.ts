import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JWT_SECRET, SYSTEM_API_KEY, cors } from './_utils';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { apiKey, txId, role } = req.body;
    if (apiKey !== SYSTEM_API_KEY) return res.status(403).json({ error: 'Forbidden' });

    const token = jwt.sign({ role, txId }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
