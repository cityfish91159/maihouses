import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, description, advantage1, advantage2 } = req.body || {};

  if (!title && !advantage1) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // 優雅降級：如果沒有 API Key，回傳空陣列或基於規則的簡單標籤
    return res.status(200).json({
      capsules: [],
      metadata: { status: "degraded", reason: "Missing API Key" },
    });
  }

  try {
    const prompt = `
你是一個專業的房地產經紀人。請根據以下房源資訊，生成 2 個吸睛且精簡的「亮點標籤」(Key Capsules)。
每個標籤必須是 2-5 個繁體中文字。
請嚴格遵守 JSON 陣列格式回傳，不要包含任何 Markdown 語法或多餘文字。

範例輸出：["捷運宅", "景觀優"]

房源標題：${title}
房源描述：${description || "無"}
優點 1：${advantage1 || "無"}
優點 2：${advantage2 || "無"}
`;

    const fetchWithRetry = async (retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                  {
                    role: "system",
                    content: "你是一個只會回傳純 JSON 陣列的機器人。",
                  },
                  { role: "user", content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 50,
              }),
            },
          );

          if (res.ok) return res;
          if (res.status >= 500 && i < retries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, delay * (i + 1)),
            );
            continue;
          }
          throw new Error(`OpenAI API error: ${res.statusText}`);
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        }
      }
      throw new Error("Max retries reached");
    };

    const response = await fetchWithRetry();

    // 定義 OpenAI 回應介面以解決 unknown 類型錯誤
    interface OpenAIResponse {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
      usage: {
        total_tokens: number;
      };
    }

    const data = (await response.json()) as OpenAIResponse;
    let content = data.choices[0]?.message?.content?.trim() || "[]";

    // 強健的 JSON 清洗邏輯
    content = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let capsules = [];
    try {
      capsules = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        capsules = JSON.parse(jsonMatch[0]);
      }
    }

    return res.status(200).json({
      capsules: Array.isArray(capsules)
        ? capsules
            .slice(0, 2)
            .filter((c) => typeof c === "string" && c.length > 0)
        : [],
      metadata: {
        status: "success",
        model: "gpt-3.5-turbo",
        usage: data.usage,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(200).json({
      capsules: [],
      metadata: { status: "error", message },
    });
  }
}
