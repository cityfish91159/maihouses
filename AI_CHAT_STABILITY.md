# AI 對話穩定性與自查準則

本文件彙整目前 AI 對話（SmartAsk → aiAsk → callOpenAI → Cloudflare Workers 代理）穩定性的設計準則、常見故障根因、自查步驟與建議改善，遵守「最小改動、保持 Cloudflare Workers 代理方案」原則。

---

## 一、系統契約（Contract）

- 輸入：
  - 使用者訊息（字串）
  - Proxy URL（解析優先序：`VITE_AI_PROXY_URL` > `?aiProxy=` 完整 URL > `?api=workers.dev` 基底 + `/api/chat` > `/api/chat`）
- 輸出：
  - 成功：SSE 串流的部分字串片段（model 回覆），以 `data:` 行為單位，並以 `[DONE]` 結束
  - 失敗：標準化錯誤（對話面板顯示非空白的明確訊息）
- 錯誤模式：
  - 401/403：金鑰或權限錯誤（通常在 Worker 端）
  - 404：路徑或代理 URL 無效
  - 429：超出速率限制（Worker 有每 IP 每分鐘限制）
  - 5xx：上游（OpenAI）或代理端暫時性錯誤

---

## 二、穩定性準則（現狀與原則）

1. 串流前狀態檢查（已實裝）
   - 在開始讀取 SSE 前，必須先檢查 `response.ok`，非 2xx 一律走錯誤分支，避免「空白對話」。
   - 實作位置：`src/services/openai.ts`。

2. Proxy URL 解析（已實裝）
   - 優先序：`VITE_AI_PROXY_URL` > `?aiProxy=` 完整 URL > `?api=workers.dev` 基底 + `/api/chat` > `/api/chat`。
   - 目的：在不改部署方式前提下，提供彈性覆蓋與故障轉移。

3. SSE 解析防護（保持簡潔）
   - 以 `\n\n` 分段、逐行讀取 `data:` 欄位；遇到 `data: [DONE]` 立即結束。
   - 容忍空行與雜訊，累積片段再渲染一次，避免 UI 抖動。

4. UI 錯誤呈現（已實裝）
   - 前端遇到非 `ok` 回應、或 SSE 解析錯誤，顯示「AI 服務目前暫時不可用」而非空白。

5. CORS 與來源限制（Worker 端原則）
   - 允許的 `Origin` 應包含：GitHub Pages 域名與本地開發（如 `http://localhost:5173`）。
   - 若 CORS 不匹配，瀏覽器會在 preflight 阻擋，前端需能顯示錯誤而非嘗試串流。

6. 速率限制與退避（原則）
   - Worker 有每 IP 每分鐘配額，回傳 429 時請在 UI 明確提示「稍後再試」。
   - 現階段不在前端自動重試，避免誤觸更嚴格的限制。

7. 不快取（原則）
   - Proxy 應傳回 `Cache-Control: no-store` 以避免中間層快取干擾長連線。

---

## 三、自查流程（10 分鐘內定位）

1. 確認「實際使用中的 Proxy URL」
   - 網址是否帶 `?aiProxy=`（完整 URL）或 `?api=workers.dev`（自動補 `/api/chat`）。
   - 若無，則使用 `VITE_AI_PROXY_URL` 或預設 `/api/chat`。

2. 驗證 Proxy 端點是否可達
   - 發送一次最小 POST 需求（body 結構正確但 prompt 最簡）。
   - 期待 2xx 且 `content-type: text/event-stream`。

3. 檢查 CORS（瀏覽器 Network + Response Headers）
   - 有無 `access-control-allow-origin` 且值符合當前頁面域名。
   - 若 preflight 失敗（OPTIONS 4xx/5xx 或缺少 Allow-Headers），屬 Worker 設定問題。

4. 檢查狀態碼分類
   - 401/403：檢查 Worker 環境變數（OPENAI_API_KEY）與 Token 使用權限。
   - 404：檢查 Worker 路由與 `/api/chat` 路徑是否一致。
   - 429：速率限制，稍後再試；必要時降低呼叫頻率。
   - 5xx：短暫性；可稍後重試或觀察日誌。

5. SSE 內容觀察
   - Network 面板查看 response body，應該持續收到 `data: ...` 片段，並以 `[DONE]` 收尾。
   - 若只收到開頭 meta 而中途停止，多半是上游或網路中斷。

6. 驗證前端錯誤分支
   - 故意將 Proxy URL 指向不存在路徑，應顯示「AI 服務目前暫時不可用」，不應出現空白。

7. 域名白名單
   - GitHub Pages 部署域名是否與 Worker 的 CORS allowlist 完整匹配（含子網域）。

8. 本地開發
   - 若本地可用、雲端不可用，多半是 CORS 或 DNS 指向/HTTPS 設定問題。

9. 快速替代路徑（僅用於定位）
   - 在網址加入 `?aiProxy=<完整 Worker URL>/api/chat` 測試是否為預設解析問題。

10. 日誌/監控
   - 查看 Cloudflare Worker 的請求日誌與錯誤堆疊，對照前端時間點。

---

## 四、常見根因 → 對應處置

- 代理 URL 錯誤或環境變數漏設 → 修正 URL 或補上 OPENAI_API_KEY，重新部署 Worker。
- CORS 不匹配 → 更新 allowlist，包含實際部署域名與本地域名。
- 速率限制 → 減少頻率、分散流量、指導使用者稍後重試。
- 上游 5xx/網路抖動 → 呈現明確錯誤、容忍短暫不可用，避免自動猛重試。

---

## 五、可選的未來強化（保持最小風險，暫不預設上線）

- 客戶端：小型超時保護（如 30s watchdog）+ 明確提示；可選一次重試但避開 429。
- Worker：新增 `/health`（GET）回 200 以利外部健康檢查；不影響現有 `/api/chat` 路徑。
- 分流：在 query 參數指定候補 proxy（現已支援），未來可加入 UI 設定。
- 觀測：記錄非個資的錯誤碼統計以便後續修正（不含 prompt/content）。

---

## 六、驗收與品質門檻（Quality Gates）

- Build：PASS（文件變更不影響構建）
- Lint/Typecheck：PASS（無 TS/JS 改動）
- Tests：N/A（無代碼修改，依現有行為）
- 手測確認：
  - 正常情境可流式出字；
  - 故意錯誤 URL/Worker 停機 → UI 顯示錯誤訊息（非空白）。

---

## 七、備註（與現有程式碼對應）

- 串流狀態檢查：`src/services/openai.ts`（已加 `response.ok` 檢查）。
- Proxy URL 解析：同上（支援 `aiProxy`、`api` 參數與 `VITE_AI_PROXY_URL`）。
- 對話服務封裝：`src/services/api.ts`（aiAsk 串流回調與錯誤處理）。
- UI 功能點：`src/features/home/sections/SmartAsk.tsx`（錯誤提示呈現）。
- Worker 代理：`cf-workers/mai-ai-proxy/worker.js`（SSE passthrough、CORS、Rate Limit）。
