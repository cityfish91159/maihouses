import { JWT_SECRET, SYSTEM_API_KEY, cors } from './_utils';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { apiKey, caseId, role } = req.body;
        if (apiKey !== SYSTEM_API_KEY) return res.status(403).json({ error: "Forbidden" });
        
        const token = jwt.sign({ role, caseId }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
