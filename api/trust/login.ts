import { JWT_SECRET, SYSTEM_API_KEY, cors } from './_utils';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        // Security Check
        const systemKey = req.headers['x-system-key'];
        if (systemKey !== SYSTEM_API_KEY) {
            return res.status(401).json({ error: "Unauthorized System Access" });
        }

        const { role, caseId } = req.body;
        const token = jwt.sign({ role, caseId: caseId || 'demo' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
