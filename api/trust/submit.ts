import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query as { id: string };

        if (user.role !== 'agent') return res.status(403).json({ error: "Forbidden" });
        if (user.txId && user.txId !== id) return res.status(403).json({ error: "Access denied" });

        const { step, data } = req.body;
        const tx = await getTx(id);
        const stepNum = parseInt(step);

        if (stepNum !== tx.currentStep) return res.status(400).json({ error: "Invalid Step" });
        if (tx.steps[stepNum].locked) return res.status(400).json({ error: "Locked" });

        // Basic sanitization if needed, but relying on React for display safety
        tx.steps[stepNum].data = { ...tx.steps[stepNum].data, ...data };
        tx.steps[stepNum].agentStatus = 'submitted';

        await saveTx(id, tx);
        await logAudit(id, `AGENT_SUBMIT_${step}`, user);
        res.json({ success: true, state: tx });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
