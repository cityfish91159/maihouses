import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JWT_SECRET, cors } from './_utils';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Token required" });

        // Verify token
        try {
            jwt.verify(token, JWT_SECRET);
        } catch {
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
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
}
