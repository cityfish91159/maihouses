import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, verifyToken, cors } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query as { id: string };

        if (user.txId && user.txId !== id) {
            return res.status(403).json({ error: "Access denied for this case" });
        }

        const tx = await getTx(id);

        // Auto check expiration
        if (tx.steps[5].paymentDeadline && Date.now() > tx.steps[5].paymentDeadline && tx.steps[5].paymentStatus === 'initiated') {
            tx.steps[5].paymentStatus = 'expired';
            await saveTx(id, tx);
        }

        res.json(tx);
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(message === 'Unauthorized' ? 401 : 500).json({ error: message });
    }
}
