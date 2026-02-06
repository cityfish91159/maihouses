# mai-ai-proxy (Cloudflare Workers)

OpenAI 兼容聊天代理（SSE 串流）

- CORS 白名單：僅允許 `https://cityfish91159.github.io` 與其子路徑
- Rate limit：以 IP+分鐘做 KV 限流（30 req/min）
- Secrets：金鑰只放 Workers，不放前端

## 部署步驟

1. 安裝 wrangler（本機或 Codespaces）

```bash
npm i -g wrangler
```

2. 建立 KV namespace（會回傳 ID，貼到 wrangler.toml）

```bash
wrangler kv:namespace create RATE
```

3. 設定 secrets（不會寫入 repo）

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put OPENAI_BASE_URL   # 可略
wrangler secret put OPENAI_MODEL      # 可略，例如 gpt-4o-mini
```

4. 部署

```bash
wrangler deploy
```

部署成功後會得到 URL，如：

```
https://mai-ai-proxy.yourname.workers.dev
```

前端請呼叫：

```
POST https://<your-worker>/api/chat
```

Body（OpenAI 兼容）：

```json
{
  "messages": [{ "role": "user", "content": "你好" }],
  "temperature": 0.7
}
```

回應為 SSE 串流（`text/event-stream`）。
