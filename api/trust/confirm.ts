import { getTx, saveTx, logAudit, verifyToken, cors, TIMEOUTS } from './_utils';

export default async function handler(req: any, res: any) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;

        if (user.role !== 'buyer') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const { step, note } = req.body;
        const stepNum = parseInt(step);
        const tx = await getTx(id);

        if (stepNum !== tx.currentStep) return res.status(400).json({ error: "Invalid Step" });
        if (tx.steps[stepNum].agentStatus !== 'submitted') return res.status(400).json({ error: "Agent not submitted" });
        if (stepNum === 6 && (!tx.isPaid || tx.steps[5].paymentStatus !== 'completed')) return res.status(400).json({ error: "Unpaid" });

        if (note) {
            tx.steps[stepNum].data = { ...tx.steps[stepNum].data, buyerNote: note };
        }

        tx.steps[stepNum].buyerStatus = 'confirmed';

        if (stepNum === 5) {
            if (tx.steps[5].paymentStatus === 'pending') {
                tx.steps[5].paymentStatus = 'initiated';
                tx.steps[5].paymentDeadline = Date.now() + TIMEOUTS[5];
            }
        } else if (stepNum === 6) {
             const allChecked = tx.steps[6].checklist.every((i: any) => i.checked);
             if(!allChecked) return res.status(400).json({error: "Checklist incomplete"});
             tx.steps[6].locked = true;
        } else {
            tx.steps[stepNum].locked = true;
            tx.currentStep += 1;
        }

        await saveTx(id, tx);
        await logAudit(id, `BUYER_CONFIRM_${step}`, user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
