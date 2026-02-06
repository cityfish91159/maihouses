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
      logger.error('[trust/submit] Invalid query params', { error: queryParsed.error.message });
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    const { id } = queryParsed.data;

    if (user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
    if (user.txId && user.txId !== id) return res.status(403).json({ error: 'Access denied' });

    const { step, data } = req.body;
    const tx = await getTx(id);
    const stepNum = parseInt(step);

    // 修復 TS 錯誤：安全存取 step
    const currentStepData = tx.steps[stepNum];
    if (!currentStepData) {
      return res.status(400).json({ error: 'Step not found' });
    }

    if (stepNum !== tx.currentStep) return res.status(400).json({ error: 'Invalid Step' });
    if (currentStepData.locked) return res.status(400).json({ error: 'Locked' });

    // Basic sanitization if needed, but relying on React for display safety
    currentStepData.data = { ...currentStepData.data, ...data };
    currentStepData.agentStatus = 'submitted';

    await saveTx(id, tx);
    await logAudit(id, `AGENT_SUBMIT_${step}`, user);
    res.json({ success: true, state: tx });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
