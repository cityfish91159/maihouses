import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query as { id: string };
        if (user.txId && user.txId !== id) return res.status(403).json({ error: "Access denied" });

        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "Content required" });

        const tx = await getTx(id);
        tx.supplements.push({ role: user.role, content: content, timestamp: Date.now() });

        await saveTx(id, tx);
        await logAudit(id, 'ADD_SUPPLEMENT', user);
        res.json({ success: true, state: tx });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
