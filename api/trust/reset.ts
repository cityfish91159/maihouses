import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createInitialState,
  saveTx,
  verifyToken,
  cors,
  type TrustState,
} from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = verifyToken(req);
    const { id } = req.query as { id: string };

    // Only allow reset in dev or if user has special permission?
    // For now, let's allow it if they have a valid token for the case.
    if (user.txId && user.txId !== id)
      return res.status(403).json({ error: "Access denied" });

    await saveTx(id, createInitialState(id) as TrustState);
    res.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
