# Claude API 配置指南 (Vercel)

## 🎯 用途

Claude API 用於：

- **GitHub Copilot** 整合（AI 程式碼輔助）
- **進階對話功能**（比 GPT-4o-mini 更強大）
- **多模態分析**（圖片理解、長文本處理）

---

## 📋 配置步驟

### 1️⃣ 取得 Claude API Key

1. 前往 [Anthropic Console](https://console.anthropic.com/)
2. 登入後進入 **Settings → API Keys**
3. 點擊 **Create Key**，複製金鑰：
   ```
   sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2️⃣ 在 Vercel 設置環境變數

前往你的 Vercel 專案設置：

```
https://vercel.com/cityfish91159/maihouses/settings/environment-variables
```

**新增變數：**

| Key                 | Value                        | Environments                                  |
| ------------------- | ---------------------------- | --------------------------------------------- |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...`           | ✅ Production<br>✅ Preview<br>✅ Development |
| `ANTHROPIC_MODEL`   | `claude-3-5-sonnet-20241022` | ✅ All (可選)                                 |

**⚠️ 重要**：設定後需要 **重新部署** 才會生效！

```bash
# 本地觸發重新部署
git commit --allow-empty -m "chore: update env vars"
git push
```

---

## 🚀 API 使用

### 端點

```
POST https://maihouses.vercel.app/api/claude
```

### 請求格式

```json
{
  "messages": [
    { "role": "user", "content": "請用繁體中文回答：什麼是 MaiHouses？" }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "temperature": 1.0,
  "stream": false
}
```

### 回應格式（相容 OpenAI）

```json
{
  "id": "msg_xxx",
  "object": "chat.completion",
  "model": "claude-3-5-sonnet-20241022",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "MaiHouses 是一個..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

---

## 🧪 測試 API

### 使用 curl

```bash
curl -X POST https://maihouses.vercel.app/api/claude \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好，請用繁體中文自我介紹"}
    ]
  }'
```

### 使用前端

在 `src/services/` 創建 Claude 服務：

```typescript
// src/services/claude.ts
export async function chatWithClaude(
  messages: Array<{ role: string; content: string }>,
) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  return response.json();
}
```

---

## 🔧 故障排除

### 錯誤：Missing ANTHROPIC_API_KEY

**原因**：環境變數未設定或未重新部署

**解決方法**：

1. 確認 Vercel Dashboard 已設定 `ANTHROPIC_API_KEY`
2. 重新部署專案：
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy"
   git push
   ```

### 錯誤：Rate limit exceeded

**原因**：超過 API 配額限制

**解決方法**：

1. 前往 [Anthropic Console → Usage](https://console.anthropic.com/settings/usage) 查看用量
2. 考慮升級方案或實作快取機制

### 錯誤：Invalid model

**原因**：模型名稱錯誤

**可用模型**：

- `claude-3-5-sonnet-20241022` (最新，推薦)
- `claude-3-opus-20240229` (最強)
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307` (最快最便宜)

---

## 💰 計費說明

| 模型              | Input (每百萬 tokens) | Output (每百萬 tokens) |
| ----------------- | --------------------- | ---------------------- |
| Claude 3.5 Sonnet | $3                    | $15                    |
| Claude 3 Opus     | $15                   | $75                    |
| Claude 3 Haiku    | $0.25                 | $1.25                  |

**範例**：

- 1000 次對話（每次 500 tokens input + 1000 tokens output）
- 使用 Claude 3.5 Sonnet
- 費用：(0.5M × $3) + (1M × $15) = $1.5 + $15 = **$16.5**

---

## 🔐 安全性建議

1. **絕不在前端暴露 API Key**：

   ```typescript
   // ❌ 錯誤
   const ANTHROPIC_API_KEY = "sk-ant-api03-xxx"; // 會被看到！

   // ✅ 正確
   fetch('/api/claude', { ... }); // 透過後端代理
   ```

2. **實作速率限制**：

   ```typescript
   // api/claude.ts
   import rateLimit from "express-rate-limit";

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 分鐘
     max: 100, // 最多 100 次請求
   });
   ```

3. **監控異常用量**：
   - 設定 [Anthropic Console → Alerts](https://console.anthropic.com/settings/alerts)
   - 當超過預算時發送郵件通知

---

## 📚 參考資料

- [Anthropic API 文件](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Claude 模型比較](https://docs.anthropic.com/claude/docs/models-overview)
- [最佳實踐指南](https://docs.anthropic.com/claude/docs/prompt-engineering)

---

_最後更新：2024-12-24_
