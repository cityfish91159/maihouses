import { verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const user = verifyToken(req);
        res.json({ 
            role: user.role, 
            caseId: user.caseId 
        });
    } catch (e: any) {
        res.status(401).json({ error: e.message });
    }
}
