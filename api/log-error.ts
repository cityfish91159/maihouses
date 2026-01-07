import type { VercelRequest, VercelResponse } from "@vercel/node";

type IncomingErrorPayload = {
  error?: {
    message?: string;
    stack?: string;
    name?: string;
  };
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
};

const MAX_STACK_LENGTH = 2000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const rawBody =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const payload = rawBody as IncomingErrorPayload;

    if (!payload?.error?.message) {
      return res
        .status(400)
        .json({ success: false, error: "Missing error message" });
    }

    const sanitized = {
      message: payload.error.message.slice(0, 500),
      stack: payload.error.stack
        ? payload.error.stack.slice(0, MAX_STACK_LENGTH)
        : undefined,
      name: payload.error.name?.slice(0, 120),
      componentStack: payload.componentStack?.slice(0, MAX_STACK_LENGTH),
      url: payload.url?.slice(0, 500),
      userAgent: payload.userAgent?.slice(0, 500),
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };

    console.error("[CommunityWall] Client error reported", sanitized);

    return res
      .status(200)
      .json({ success: true, recordedAt: sanitized.timestamp });
  } catch (error) {
    console.error("[log-error] Failed to record client error", error);
    return res
      .status(400)
      .json({ success: false, error: "Invalid JSON payload" });
  }
}
