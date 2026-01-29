import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTx, saveTx, logAudit, verifyToken, cors, TIMEOUTS, TrustQuerySchema } from './_utils';
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
      logger.error('[trust/confirm] Invalid query params', { error: queryParsed.error.message });
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    const { id } = queryParsed.data;

    if (user.role !== 'buyer') return res.status(403).json({ error: 'Forbidden' });
    if (user.txId && user.txId !== id) return res.status(403).json({ error: 'Access denied' });

    const { step, note } = req.body;
    const stepNum = parseInt(step);
    const tx = await getTx(id);

    const currentStepData = tx.steps[stepNum];
    if (!currentStepData) {
      return res.status(400).json({ error: 'Step not found' });
    }

    if (stepNum !== tx.currentStep) return res.status(400).json({ error: 'Invalid Step' });
    if (currentStepData.agentStatus !== 'submitted')
      return res.status(400).json({ error: 'Agent not submitted' });

    const step5 = tx.steps[5];
    if (stepNum === 6 && (!tx.isPaid || step5?.paymentStatus !== 'completed'))
      return res.status(400).json({ error: 'Unpaid' });

    if (note) {
      currentStepData.data = { ...currentStepData.data, buyerNote: note };
    }

    currentStepData.buyerStatus = 'confirmed';

    if (stepNum === 5 && step5) {
      if (step5.paymentStatus === 'pending') {
        step5.paymentStatus = 'initiated';
        step5.paymentDeadline = Date.now() + (TIMEOUTS[5] ?? 0);
      }
    } else if (stepNum === 6) {
      const step6 = tx.steps[6];
      const checklist = step6?.checklist ?? [];
      const allChecked = checklist.every((i: { checked: boolean }) => i.checked);
      if (!allChecked) return res.status(400).json({ error: 'Checklist incomplete' });
      if (step6) step6.locked = true;
    } else {
      currentStepData.locked = true;
      tx.currentStep += 1;
    }

    await saveTx(id, tx);
    await logAudit(id, `BUYER_CONFIRM_${step}`, user);
    res.json({ success: true, state: tx });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
