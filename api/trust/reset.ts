import { createInitialState, saveTx, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        
        // Only allow reset in dev or if user has special permission?
        // For now, let's allow it if they have a valid token for the case.
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        await saveTx(id, createInitialState(id));
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
