import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "Content required" });
        
        const tx = await getTx(id);
        tx.supplements.push({ role: user.role, content: content, timestamp: Date.now() });
        
        await saveTx(id, tx);
        await logAudit(id, 'ADD_SUPPLEMENT', user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
