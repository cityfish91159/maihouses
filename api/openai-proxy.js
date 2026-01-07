// api/openai-proxy.js
export default async function handler(req, res) {
  // 設定 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 處理 preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 只允許 POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 檢查環境變數
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Missing API key",
      hint: "Check Vercel environment variables",
    });
  }

  // 解析 request body
  const { messages, model, temperature, stream } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: "Invalid request",
      hint: "Expected: { messages: [...] }",
    });
  }

  // 如果要求串流
  if (stream) {
    // 設定 SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: messages,
            temperature: temperature !== undefined ? temperature : 0.3,
            stream: true,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        res.write(
          `data: ${JSON.stringify({ error: "OpenAI API error", details: error })}\n\n`,
        );
        return res.end();
      }

      // 讀取串流並轉發
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              res.write("data: [DONE]\n\n");
              return res.end();
            }
            // 轉發給前端
            res.write(`data: ${data}\n\n`);
          }
        }
      }

      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ error: "Stream error", message: error.message })}\n\n`,
      );
      res.end();
    }
  } else {
    // 非串流模式（保留原有邏輯）
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: messages,
            temperature: temperature !== undefined ? temperature : 0.3,
            stream: false,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({
          error: "OpenAI API error",
          details: error,
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
}
