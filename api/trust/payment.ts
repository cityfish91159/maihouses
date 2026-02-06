import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, logAudit, verifyToken, cors, TrustQuerySchema } from './_utils';
import { logger } from '../lib/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const user = verifyToken(req);
    // [NASA TypeScript Safety] Zod safeParse 取代 as 斷言
    const queryParsed = TrustQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      logger.error('[trust/payment] Invalid query params', { error: queryParsed.error.message });
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    const { id } = queryParsed.data;

    if (user.role !== 'agent')
      return res.status(403).json({ error: 'Forbidden: Only agent can initiate payment' });
    if (user.txId && user.txId !== id) return res.status(403).json({ error: 'Access denied' });

    const tx = await getTx(id);
    const s5 = tx.steps[5];

    // 修復 TS 錯誤：檢查 s5 是否存在
    if (!s5) {
      return res.status(400).json({ error: 'Step 5 not found' });
    }

    // Agent pays, so we check if payment is initiated (which means buyer confirmed contract)
    // Actually, if Agent pays, maybe we don't need buyer confirmation?
    // But the flow is: Agent submits contract -> Buyer confirms -> Payment initiated -> Agent pays.
    // So s5.buyerStatus === 'confirmed' is still correct.
    if (s5.buyerStatus !== 'confirmed')
      return res.status(400).json({ error: 'Contract not confirmed' });
    if (s5.paymentStatus !== 'initiated') return res.status(400).json({ error: 'Invalid status' });
    // 修復 TS2365/TS18049: 安全比較 deadline
    const deadline = s5.paymentDeadline;
    if (deadline !== null && deadline !== undefined && Date.now() > Number(deadline))
      return res.status(400).json({ error: 'Expired' });

    tx.isPaid = true;
    s5.paymentStatus = 'completed';
    s5.locked = true;
    tx.currentStep = 6;

    // 修復 TS 錯誤：安全存取 risks
    const step2Data = tx.steps[2]?.data as Record<string, unknown> | undefined;
    const risks = (step2Data?.risks ?? {}) as Record<string, boolean>;
    const step6 = tx.steps[6];
    if (step6) {
      step6.checklist = [
        { label: '🚰 水電瓦斯功能正常', checked: false },
        { label: '🪟 門窗鎖具開關正常', checked: false },
        { label: '🔑 鑰匙門禁卡點交', checked: false },
        {
          label: `🧱 驗證房仲承諾：${risks.water ? '有' : '無'}漏水`,
          checked: false,
        },
        {
          label: `🧱 驗證房仲承諾：${risks.wall ? '有' : '無'}壁癌`,
          checked: false,
        },
      ];
    }

    await saveTx(id, tx);
    await logAudit(id, `PAYMENT_COMPLETED`, user);
    res.json({ success: true, state: tx });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
