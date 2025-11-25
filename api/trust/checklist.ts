import { getTx, saveTx, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;

        if (user.role !== 'buyer') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const { index, checked } = req.body;
        const tx = await getTx(id);
        if (tx.currentStep !== 6) return res.status(400).json({ error: "Invalid step" });
        
        tx.steps[6].checklist[index].checked = checked;
        await saveTx(id, tx);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
