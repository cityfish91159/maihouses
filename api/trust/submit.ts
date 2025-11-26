import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        
        if (user.role !== 'agent') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
