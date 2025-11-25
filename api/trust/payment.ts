import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;

        if (user.role !== 'buyer') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const tx = await getTx(id);
        const s5 = tx.steps[5];

        if (s5.buyerStatus !== 'confirmed') return res.status(400).json({ error: "Contract not confirmed" });
        if (s5.paymentStatus !== 'initiated') return res.status(400).json({ error: "Invalid status" });
        if (Date.now() > s5.paymentDeadline) return res.status(400).json({ error: "Expired" });

        tx.isPaid = true;
        s5.paymentStatus = 'completed';
        s5.locked = true;
        tx.currentStep = 6;

        const risks = tx.steps[2].data.risks || {};
        tx.steps[6].checklist = [
            { label: "🚰 水電瓦斯功能正常", checked: false },
            { label: "🪟 門窗鎖具開關正常", checked: false },
            { label: "🔑 鑰匙門禁卡點交", checked: false },
            { label: `🧱 驗證房仲承諾：${risks.water ? '有' : '無'}漏水`, checked: false },
            { label: `🧱 驗證房仲承諾：${risks.wall ? '有' : '無'}壁癌`, checked: false }
        ];

        await saveTx(id, tx);
        await logAudit(id, `PAYMENT_COMPLETED`, user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
