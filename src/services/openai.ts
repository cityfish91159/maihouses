/**
 * 極簡 AI 對話服務
 * 需求：只保留最基本串流/非串流邏輯，不做 tokens 動態計算、不加使用量日誌、不加額外 guard。
 * 不再新增任何「修復空白」或「優化」相關指令與註解。
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 保留最小型型別，僅用於非串流模式解析
export interface OpenAIResponseChoiceDelta {
  content?: string;
}
export interface OpenAIResponse {
  choices?: Array<{
    message?: ChatMessage;
    delta?: OpenAIResponseChoiceDelta;
  }>;
}

// 不再強制附加 system prompt（依使用者原始需求：移除修復/優化附加指令）

/**
 * 呼叫 OpenAI API 進行對話
 * @param messages 對話訊息列表（不含 system message）
 * @param onChunk 串流回傳的回調函數（每收到一段文字就呼叫）
 * @returns AI 回應的完整文字內容
 */
export async function callOpenAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk?: (chunk: string) => void,
): Promise<{ content: string }> {
  // 僅保留最近少量訊息（避免無限增長）
  const recent = messages.slice(-6);

  // 根據環境自動選擇 API 端點
  let upstreamUrl: string;
  if (window.location.hostname.includes("vercel.app")) {
    upstreamUrl = "/api/chat";
  } else if (window.location.hostname.includes("github.io")) {
    upstreamUrl = "https://maihouses.vercel.app/api/chat";
  } else {
    // 本地開發：預設用 Vercel
    upstreamUrl =
      import.meta.env.VITE_AI_PROXY_URL ||
      "https://maihouses.vercel.app/api/chat";
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // 提示代理或上游服務以繁體中文處理
    "Accept-Language": "zh-Hant-TW",
  };
  // 不再需要 Authorization header，由 Vercel serverless 處理

  // 在最前面插入 system prompt：統一繁體中文，不輸出簡體
  const systemPrompt = {
    role: "system" as const,
    content:
      "你是房產諮詢助理。無論使用者輸入何種語言，回覆一律使用繁體中文（台灣用語、標點與字形，避免簡體字）。若需輸出地點、價錢或面積，請用在地常用格式。",
  };

  const bodyPayload = {
    model: "gpt-4o-mini",
    messages: [
      systemPrompt,
      ...recent.map((m) => ({ role: m.role, content: m.content })),
    ],
    stream: !!onChunk, // 如果有 onChunk 回調就啟用串流
  };

  const resp = await fetch(upstreamUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  // 若上游非 2xx，直接丟出錯誤讓呼叫端處理
  if (!resp.ok) {
    throw new Error(`Upstream error: ${resp.status}`);
  }

  // 串流模式：僅在 SSE 回應時啟用
  const isEventStream = resp.headers
    .get("content-type")
    ?.includes("text/event-stream");
  if (onChunk && resp.body && isEventStream) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const piece: string | undefined = parsed.choices?.[0]?.delta?.content;
          if (piece) {
            acc += piece;
            onChunk(piece);
          }
        } catch (_) {
          // 忽略解析錯誤
        }
      }
    }
    return { content: acc };
  }

  // 非串流：嘗試解析 JSON，失敗則回傳空字串
  let text = "";
  try {
    const data: OpenAIResponse = await resp.json();
    text = data?.choices?.[0]?.message?.content || "";
  } catch (_) {
    text = "";
  }
  return { content: text };
}
