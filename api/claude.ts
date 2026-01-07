/**
 * Claude API Proxy for Vercel
 * 用於 GitHub Copilot 整合和進階 AI 對話
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ClaudeRequestBody {
  messages?: ChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設定 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  // 處理 preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 只允許 POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 檢查環境變數
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Missing ANTHROPIC_API_KEY",
      hint: "Please add ANTHROPIC_API_KEY to Vercel environment variables",
    });
  }

  // 解析 request body
  const {
    messages,
    model = "claude-sonnet-4-5-20250514",
    max_tokens = 4096,
    temperature = 1.0,
    stream = false,
  } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: "Invalid request",
      hint: "Expected: { messages: [...] }",
    });
  }

  // 轉換訊息格式（如果需要從 OpenAI 格式轉換）
  const claudeMessages = messages
    .map((msg: ChatMessage) => {
      if (msg.role === "system") {
        // Claude 不支援 system role 在 messages 中
        return null;
      }
      return {
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      };
    })
    .filter(Boolean);

  // 提取 system message
  const systemMessage =
    messages.find((msg: ChatMessage) => msg.role === "system")?.content ||
    undefined;

  try {
    // 如果要求串流
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens,
          temperature,
          messages: claudeMessages,
          system: systemMessage,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
      }

      // 轉發串流
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        res.write(chunk);
      }

      res.end();
    } else {
      // 非串流模式
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens,
          temperature,
          messages: claudeMessages,
          system: systemMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }

      // Claude API 回應類型
      interface ClaudeResponse {
        id: string;
        model: string;
        content: Array<{ text: string; type: string }>;
        stop_reason: string;
        usage?: {
          input_tokens: number;
          output_tokens: number;
        };
      }

      const data = (await response.json()) as ClaudeResponse;

      // 轉換為 OpenAI 格式（相容性）
      const result = {
        id: data.id,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: data.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: data.content[0]?.text || "",
            },
            finish_reason:
              data.stop_reason === "end_turn" ? "stop" : data.stop_reason,
          },
        ],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens:
            (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };

      return res.status(200).json(result);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      error: "Claude API request failed",
      details: message,
    });
  }
}
