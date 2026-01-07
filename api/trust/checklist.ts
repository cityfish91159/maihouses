import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTx, saveTx, verifyToken, cors } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = verifyToken(req);
    const { id } = req.query as { id: string };

    if (user.role !== "buyer")
      return res.status(403).json({ error: "Forbidden" });
    if (user.txId && user.txId !== id)
      return res.status(403).json({ error: "Access denied" });

    const { index, checked } = req.body;
    const tx = await getTx(id);
    if (tx.currentStep !== 6)
      return res.status(400).json({ error: "Invalid step" });

    tx.steps[6].checklist[index].checked = checked;
    await saveTx(id, tx);
    res.json({ success: true, state: tx });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
