import { JWT_SECRET, cors } from './_utils';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Token required" });

        // Verify token
        try {
            jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Set HttpOnly Cookie
        res.setHeader('Set-Cookie', serialize('mh_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/'
        }));

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
