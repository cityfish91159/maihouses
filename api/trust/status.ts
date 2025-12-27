import { getTx, saveTx, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        
        if (user.caseId && user.caseId !== id) {
            return res.status(403).json({ error: "Access denied for this case" });
        }

        const tx = await getTx(id);
        
        // Auto check expiration
        if (tx.steps[5].paymentDeadline && Date.now() > tx.steps[5].paymentDeadline && tx.steps[5].paymentStatus === 'initiated') {
            tx.steps[5].paymentStatus = 'expired';
            await saveTx(id, tx);
        }
        
        res.json(tx);
    } catch (e: any) {
        res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message });
    }
}
