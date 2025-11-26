import { JWT_SECRET, SYSTEM_API_KEY, cors } from './_utils';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req: any, res: any) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        // Security Check
        const systemKey = req.headers['x-system-key'];
        if (systemKey !== SYSTEM_API_KEY) {
            return res.status(401).json({ error: "Unauthorized System Access" });
        }

        const { role, caseId } = req.body;

        // Input Validation
        if (!['agent', 'buyer'].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        if (caseId && !/^[A-Za-z0-9-_]+$/.test(caseId)) {
            return res.status(400).json({ error: "Invalid caseId format" });
        }

        const token = jwt.sign({ role, caseId: caseId || 'demo' }, JWT_SECRET, { expiresIn: '24h' });

        // Set HttpOnly Cookie
        res.setHeader('Set-Cookie', serialize('mh_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/'
        }));

        res.json({ token });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
