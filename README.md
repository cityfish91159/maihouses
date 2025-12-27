# Maihouses - 社區找房平台

## 官方網址

**首頁（唯一）**: https://maihouses.vercel.app/maihouses/

**社區牆**: https://maihouses.vercel.app/maihouses/community-wall_mvp.html

---

房產社區資訊與 AI 找房助理。此 README 補充 AI 介面維運與防止回歸錯誤的要點。

## 🔤 繁體中文輸出保證

AI 對話服務在 `src/services/openai.ts` 內建 system prompt：要求所有回覆使用繁體中文（台灣字形與用語），避免簡體字出現。若需調整語言，僅修改該檔案的 `systemPrompt` 內容即可，不必改多處。

## 🔌 連線策略（避免指向 /api/chat）

前端呼叫順序：
1. 若存在 `VITE_OPENAI_API_KEY` -> 直連 `https://api.openai.com/v1/chat/completions`。
2. 否則若存在 `VITE_AI_PROXY_URL` -> 使用代理（建議 Cloudflare Workers）。
3. 否則回退 `/api/chat`（GitHub Pages 上會 404/405，務必配置 1 或 2）。

示例環境檔：請複製 `.env.example` 為 `.env` 並填入金鑰或代理。

## 🧪 金鑰/代理檢查

執行腳本：
```bash
bash scripts/check-ai.sh
```
輸出會告知：金鑰是否有效、代理是否可連通或需補 .env 設定。

## 🧭 界面與路由解耦

AI 聊天獨立路由：`/chat` 對應 `src/pages/Chat/Standalone.tsx`，僅渲染 `SmartAsk`。未來首頁改版不會影響聊天體驗。

若需更強隔離（不受全站 CSS 影響）：
- 方案 A：以 `<iframe src="/#/chat">` 內嵌。
- 方案 B：封裝成 Web Component 使用 Shadow DOM（建立 `components/ai-chat/`）。
- 方案 C：微前端（Single-SPA / Module Federation）— 適用於多團隊協作，暫不必實作。

## 🛡 防回歸建議

1. Git Tag 穩定版本：
```bash
git tag -a v2025-11-08-stable -m "Stable chat + zh-Hant system prompt"
git push origin v2025-11-08-stable
```
2. 發佈時附上 `docs/` 打包（Releases 上傳 zip）。
3. CI 加最小煙霧測試（避免又 fallback 到 /api/chat）：在 GitHub Actions build 後加入：
```bash
if grep -R "\/api\/chat" docs; then echo "[CI] Forbidden /api/chat fallback detected"; exit 1; fi
```
4. README 中明確寫「禁止使用 /api/chat 作為最終目標」。已完成。
5. 集中設定：未來若改代理，只需改 `.env`。程式內僅讀取環境，不寫死域名。

## 📁 重要檔案一覽

| 檔案 | 作用 |
|------|------|
| `src/services/openai.ts` | 對話與串流邏輯 + system prompt（繁體保證） |
| `src/pages/Chat/Standalone.tsx` | 獨立聊天頁面（與首頁解耦） |
| `scripts/check-ai.sh` | 金鑰/代理快速健康檢查 |
| `.env.example` | 連線方式示例設定 |
| `cf-workers/mai-ai-proxy/` | Cloudflare Workers 代理程式碼 |

## 🚀 本地開發

```bash
npm install
cp .env.example .env   # 編輯後填入真實值
npm run dev
# 打開 http://localhost:5173/maihouses/#/chat 進行測試
```

## ✅ 品質檢查

```bash
npm run typecheck
bash scripts/check-ai.sh
```

## 🧩 後續可選優化（暫不必要）

- 加入使用量計數與速率顯示（需後端配合）
- 將推薦清單 `reco` 的取得改為真正的房源推薦 API
- 將 system prompt 外部化為 `src/config/chat.ts` 便於 A/B 測試

---

維運備忘：聊天請求目標 = 直連 OpenAI 或設定的代理域名；禁止最終指向 `/api/chat`（GitHub Pages 靜態環境無該端點）。

## 🚀 UAG v8.0 業務廣告後台 (Ultimate Optimization)

UAG (User Activity & Growth) 系統已升級至 v8.0，採用「增量更新」與「智慧快取」架構，解決高流量下的效能瓶頸。

**核心功能：**
- **前端追蹤 (EnhancedTracker)**：支援指紋識別 (Fingerprinting)、斷線重連、事件批次處理。
- **後端處理 (Atomic RPC)**：使用 Supabase RPC 進行原子化更新，避免 Race Condition。
- **資料架構 (Hot/Cold Separation)**：
  - **熱數據**：`uag_sessions` (摘要) + `uag_events` (3小時內日誌)。
  - **冷數據**：`uag_events_archive` (歷史歸檔)。
  - **快取層**：`uag_lead_rankings` (Materialized View) 提供秒級儀表板查詢。

**相關文件：**
- [完整程式碼文件 (Full Stack Code)](./UAG_FULL_STACK_CODE.md)
- [系統規格書 (System Spec)](./UAG_SYSTEM_SPEC.md)
- [部署完成報告](./UAG_v8_COMPLETION_REPORT.md)

---

## 🗓 更新日誌 / Changelog

### 2025-11-09
- UI：第 11 次回朔後調整，房源卡標題 `.title` 對齊社區評價主標題尺寸，統一為 `font-size:16px; font-weight:800;`，移除 clamp / 放大與暫時主區塊標題造成的視覺漂移。
- 策略：先鎖定最小一致基準再考慮漸進放大，避免頻繁回退成本與樣式飄忽。
