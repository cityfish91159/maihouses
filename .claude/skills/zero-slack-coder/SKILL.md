# Zero Slack Coder v2.0 — 零偷懶即時行為監控 + 生產級產出

**觸發指令:** `/zero-slack-coder` 或用戶手動載入
**生效範圍:** 載入後整個 session 持續生效
**定位:** 在 AI 寫代碼過程中即時攔截偷懶行為 + 確保產出達生產級品質

---

## 強制約束機制（三層防線）

```
第一層: settings.json hooks（系統級，AI 無法繞過）
  └─ PostToolUse → 每次 Edit/Write 後自動跑 zero-slack-check.cjs
  └─ 失敗 = block，AI 被迫修復才能繼續

第二層: zero-slack-check.cjs（檢查腳本）
  └─ 自動模式: hook 觸發，掃描 git diff
  └─ 手動模式: node scripts/zero-slack-check.cjs --full（掃描全專案）
  └─ 偵測: 半成品 / 安全碼刪除 / 大塊貼上 / 禁止清單 / A11y / 文案 / 測試缺失

第三層: SKILL.md（行為規範）
  └─ AI 載入後的行為紀律
  └─ 搭配 hook 硬性攔截使用
```

**手動觸發強制檢查:**
```bash
node scripts/zero-slack-check.cjs --full
```

---

## 核心原則

**看到錯誤就修，修完就驗證，驗證沒過就回滾重做。不問「要不要跳過」，不說「下次再修」，不留半成品。**

---

## 模組 1: 看到就修（See-Fix）

### 強制規則

| 觸發條件 | 強制動作 | 違規懲罰 |
|---------|---------|---------|
| 任何工具輸出包含 `error` | 立即定位 + 修復 | 回滾到修復前，重做 |
| 用戶貼錯誤訊息 | 視為直接命令，直接修 | 回滾 |
| 修 A 檔發現 B 檔也壞 | A + B 一起修 | 回滾 A，A+B 重做 |
| typecheck/lint/test 報錯 | 立即修復所有 error | 回滾 |

### 絕對禁止

```
禁止: "要不要跳過 typecheck？"
禁止: "這個錯誤可以之後再修"
禁止: "這是其他 session 的問題"
禁止: 看到錯誤但繼續做其他事
禁止: 用戶貼了錯誤訊息但去重新掃描確認
```

### 判定邏輯

```
IF 工具輸出包含 "error" OR "Error" OR "ERROR":
  → 停止當前動作
  → 定位錯誤檔案和行號
  → 立即修復
  → 修復後重新驗證
  → 驗證通過才繼續原本任務

IF 用戶貼了錯誤訊息:
  → 解析錯誤內容（檔案、行號、錯誤類型）
  → 直接 Read 該檔案
  → 直接 Edit 修復
  → 跑 typecheck 確認
  → 不重新掃描、不問問題、不做其他事
```

---

## 模組 2: 完成 = 驗證（Done-Means-Verified）

### 強制規則

| 觸發條件 | 強制動作 | 違規懲罰 |
|---------|---------|---------|
| 任何 Edit/Write 完成後 | hook 自動跑 typecheck + lint + zero-slack-check | 回滾修改 |
| 說「已完成」 | 必須附上 typecheck/lint 的實際終端輸出 | 不算完成 |
| 修 bug | 必須說明如何驗證修復 | 回滾修復 |
| 新增功能 | 必須跑相關測試 | 回滾新增 |

### 驗證最低標準

```
每次修改後 hook 自動執行:
  1. npx tsc --noEmit                    # typecheck
  2. npx eslint <被修改的檔案>            # lint
  3. node scripts/zero-slack-check.cjs   # zero-slack 檢查

每次任務完成後 AI 必須手動執行:
  npx vitest run                         # 全局測試

輸出格式:
  ✅ typecheck: 通過 (0 errors)
  ✅ lint: 0 errors, X warnings
  ✅ zero-slack: CLEAN
  ✅ test: XXXX/XXXX 通過
```

---

## 模組 3: 零半成品（No-Half-Baked）

### 偵測 + 回滾清單（由 zero-slack-check.cjs 自動掃描）

| 偵測目標 | 規則名 | 級別 | 懲罰 |
|---------|--------|------|------|
| `: any` | no-any | ERROR | block + 回滾 |
| `as any` | no-as-any | ERROR | block + 回滾 |
| `as unknown as X` | no-double-assertion | ERROR | block + 回滾 |
| `// TODO` | no-todo | ERROR | block + 回滾 |
| `// FIXME` | no-fixme | ERROR | block + 回滾 |
| `// ... rest/same/implement` | no-placeholder | ERROR | block + 回滾 |
| `console.log()` | no-console-log | ERROR | block + 回滾 |
| `@ts-ignore` | no-ts-ignore | ERROR | block + 回滾 |
| `@ts-expect-error` 無說明 | ts-expect-no-reason | ERROR | block + 回滾 |
| `eslint-disable` 無說明 | eslint-disable-no-reason | ERROR | block + 回滾 |

### 例外

```
允許: @ts-expect-error -- 第三方庫型別缺陷（必須有說明）
允許: eslint-disable-next-line rule-name -- 理由（必須有規則名+理由）
允許: Supabase 型別檔案中的 SupabaseClient<any>（已在腳本中排除）
```

---

## 模組 4: 安全碼刪除偵測（Safety-Guard）

### 偵測邏輯（由 zero-slack-check.cjs diff 模式掃描）

| 偵測目標 | 判定條件 | 級別 |
|---------|---------|------|
| `try { ... } catch` 被刪除 | diff 刪除行包含 `try {` | WARNING |
| `.safeParse()` 被刪除 | diff 刪除行包含 safeParse | WARNING |
| `.parse()` 被刪除 | diff 刪除行包含 .parse( | WARNING |
| `auth.uid()` 被刪除 | diff 刪除行包含 auth.uid | WARNING |
| `encodeURIComponent` 被刪除 | diff 刪除行包含 encode | WARNING |
| `sanitize` 被刪除 | diff 刪除行包含 sanitize | WARNING |

### 額外規則（行為層）

| 偵測目標 | 判定條件 | 懲罰 |
|---------|---------|------|
| RLS policy 被修改 | 任何 RLS SQL 變更 | 回滾，需用戶明確授權 |
| 環境變數硬編碼 | 密鑰/token 寫在代碼中 | 回滾，改用 env |
| 前端使用 service_role | src/ 中出現 service_role | ERROR (block) |

---

## 模組 5: 大塊貼上偵測（Chunk-Alert）

### 偵測（由 zero-slack-check.cjs 掃描）

| 偵測目標 | 判定條件 | 級別 |
|---------|---------|------|
| 檔案 > 500 行 | 掃描每個檔案行數 | WARNING |
| 單函數 > 80 行 | brace matching 計算 | WARNING |

### 行為規則

| 偵測目標 | 判定條件 | 處理方式 |
|---------|---------|---------|
| 單次新增 > 200 行 | Write 工具寫入大檔案 | 暫停，拆為多個小修改 |
| 單次修改 > 5 個檔案 | 一次改太多 | 暫停，確認是否該拆分 |
| 新增 .tsx/.ts 無對應 .test | 全掃描模式偵測 | WARNING |

---

## 模組 6: 上下文脫離偵測（Context-Drift）

### 自動掃描（zero-slack-check.cjs）

| 偵測目標 | 規則名 | 級別 |
|---------|--------|------|
| 硬編碼 Google API Key | hardcoded-secret | ERROR |
| 硬編碼 OpenAI Key | hardcoded-secret | ERROR |
| 硬編碼 Supabase service_role | hardcoded-secret | ERROR |
| 前端 src/ 出現 service_role | no-service-role-client | ERROR |

### 行為規則

| 偵測目標 | 判定條件 | 懲罰 |
|---------|---------|------|
| 沒讀就寫 | Edit/Write 前沒有 Read 該檔案 | 回滾，先讀再寫 |
| import 不存在模組 | 幻覺依賴 | 回滾 |
| 使用專案未安裝的套件 | package.json 中沒有 | 回滾 |
| 命名風格不一致 | camelCase vs snake_case 混用 | 警告 |

---

## 模組 7: 空轉偵測（Idle-Spin）

### 行為規則

| 偵測目標 | 判定條件 | 強制動作 |
|---------|---------|---------|
| 連續讀檔 > 5 次沒寫 | 只讀不寫 | 停止讀檔，開始寫代碼 |
| 同一檔案讀 > 1 次 | 重複讀檔 | 用已有內容繼續 |
| 連續問用戶 > 2 次 | 不敢決定 | 停止問，直接做 |
| 載入 Skill > 2 輪 | 無限準備 | 停止載入，開始工作 |
| 準備超過 3 輪沒產出 | 過度準備 | 強制開始產出代碼或報告 |
| 同一個錯誤修 > 3 次 | 方向錯誤 | 停下來，換思路重做 |

---

## 模組 8: 邊界防禦（Boundary-Defense）

### 強制規則

| 規則 | 說明 | 判定 |
|------|------|------|
| API 回傳必須 Zod parse | 不信任外部資料，fetch 後必須 safeParse | 新增 fetch 呼叫時檢查 |
| 用戶輸入必須 sanitize | form input 必須清理 | 新增 form 時檢查 |
| API endpoint 標準錯誤結構 | `{ error: string, code: string }` | 新增 API 時檢查 |
| 所有 fetch 必須有 timeout 或 AbortController | 防止無限等待 | 新增 fetch 時檢查 |

### 判定邏輯

```
IF 新增代碼包含 fetch() 或 await fetch():
  → 檢查回傳值是否經過 Zod safeParse/parse
  → 檢查是否有 try/catch 包裹
  → 檢查是否有 timeout 或 AbortController
  → 缺少任一項 = 警告 + 要求補上

IF 新增代碼包含 <input> 或 <textarea>:
  → 檢查 value 在使用前是否經過 trim/sanitize
```

---

## 模組 9: 測試品質門檻（Test-Quality）

### 強制規則

| 規則 | 說明 |
|------|------|
| 每個新函數至少 3 個測試 | happy path + sad path + edge case |
| 修 bug 必須先寫重現測試 | 紅燈 → 綠燈 → 重構 |
| mock 必須合理 | 不能 mock 掉正在測試的邏輯本身 |
| 測試命名必須描述行為 | `should return error when phone is empty` 不是 `test1` |
| 新增 .tsx 必須有 .test | 全掃描模式偵測缺失（WARNING） |

### 判定邏輯

```
IF 修 bug:
  → 先寫測試重現 bug（紅燈）
  → 再修代碼讓測試通過（綠燈）
  → 最後重構

IF 新增功能:
  → 寫功能代碼
  → 寫 happy path 測試
  → 寫 sad path 測試（錯誤輸入、網路失敗）
  → 寫 edge case 測試（空值、極端值）
  → 至少 3 個測試案例才算完成
```

---

## 模組 10: React 生產級（React-Production）

### 強制規則

| 規則 | 說明 | 懲罰 |
|------|------|------|
| callback props 必須 useCallback | 防止子組件不必要 re-render | 警告 |
| 物件/陣列 props 必須 useMemo | 防止每次 render 新建參考 | 警告 |
| 列表 key 禁用 index | 除非靜態列表 | 警告 |
| 非同步 effect 必須有 cleanup | 防止 unmount 後 setState | 回滾 |
| ErrorBoundary 包裹獨立功能區塊 | 不能只包最外層 | 警告 |
| 避免 inline object/array 在 JSX 中 | `style={{ }}` 每次 render 新建 | 警告 |

---

## 模組 11: A11y 最低標準（Accessibility）

### 自動掃描（zero-slack-check.cjs）

| 偵測目標 | 規則名 | 級別 |
|---------|--------|------|
| `<img>` 沒有 `alt` | a11y-img-alt | ERROR |
| icon-only button 沒有 aria-label | a11y-button-label | WARNING |

### 行為規則

| 規則 | 說明 |
|------|------|
| Modal 必須有 `role="dialog"` + `aria-modal="true"` | 螢幕閱讀器支援 |
| 表單 input 必須有對應 label | htmlFor 或包裹式 label |
| focus 管理 | Modal 開啟時 focus trap，關閉時還原 |
| 觸控目標 >= 44px | 手機端可點擊元素 min-h-[44px] min-w-[44px] |
| 對比度 | 正常文字 4.5:1，小字體 7:1 |

---

## 模組 12: 審計日誌（Audit-Trail）

### 強制規則

| 規則 | 說明 |
|------|------|
| state-changing API（POST/PUT/DELETE）必須有 logger | 記錄 who/what/when |
| 前端關鍵動作必須有 track 事件 | 按鈕點擊、表單送出、錯誤發生 |
| logger 必須包含 context | `{ userId, propertyId, action }` 不是只有字串 |
| 安心留痕相關動作必須有 audit prefix | `audit.trust.*` |

### 判定邏輯

```
IF 新增 API endpoint (POST/PUT/DELETE):
  → 檢查是否有 logger.info/logger.error 呼叫
  → 檢查 logger 是否包含 userId、resourceId
  → 缺少 = 警告

IF 新增按鈕 onClick:
  → 檢查是否有 track() 或 void track() 呼叫
  → 關鍵動作（聯絡、送出、刪除）缺少 track = 警告
```

---

## 模組 13: 錯誤處理品質（Error-Quality）

### 自動掃描（zero-slack-check.cjs）

| 偵測目標 | 規則名 | 級別 |
|---------|--------|------|
| 空 catch 區塊 | empty-catch | WARNING |
| notify/toast 使用「系統錯誤」 | bad-error-msg | WARNING |
| notify/toast 使用英文 "Error" | bad-error-msg | WARNING |
| notify/toast 使用「操作失敗」 | bad-error-msg | WARNING |

### 行為規則

| 規則 | 說明 |
|------|------|
| catch 不能只 log | 必須有用戶面向的 notify/toast |
| 錯誤訊息必須分類 | 網路錯誤、驗證錯誤、伺服器錯誤各有不同文案 |
| Promise rejection 必須被處理 | `void track()` 或 `.catch()` |

---

## 模組 14: 文案一致性（Copy-Consistency）

### 自動掃描（zero-slack-check.cjs）

| 偵測目標 | 規則名 | 級別 |
|---------|--------|------|
| 使用「房仲」而非「經紀人」 | copy-term | WARNING |
| 使用「預約參觀」而非「預約看屋」 | copy-term | WARNING |
| 使用「您」而非「你」 | copy-honorific | WARNING |

### 行為規則

遵循 `copy-consistency-audit` SKILL.md 的完整術語表。

---

## 回滾機制

### 回滾流程

```
1. hook 偵測到 ERROR 級違規（zero-slack-check.cjs exit 1）
2. AI 被 block，無法繼續
3. AI 必須:
   a. 讀取違規報告（hook 輸出）
   b. 重新 Read 該檔案
   c. 用正確方式重新 Edit
   d. hook 再次自動執行驗證
   e. 通過才能繼續
```

### 級別說明

```
ERROR（由 zero-slack-check.cjs 偵測）:
  → hook block，AI 被迫修復
  → 這是真正有牙齒的強制約束

WARNING（由 zero-slack-check.cjs 偵測）:
  → 不 block，但列出在報告中
  → AI 應該主動修復
  → 手動 --full 掃描時會全部列出

行為規則（由 SKILL.md 規範）:
  → AI 載入後「應該」遵守
  → 搭配 hook 的硬性攔截使用
```

---

## 每次修改後的自動檢查流程

```
┌─────────────────┐
│   Edit/Write    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Hook 1: typecheck + lint            │ → error? → block
│ Hook 2: zero-slack-check.cjs        │ → error? → block
└────────┬────────────────────────────┘
         │ 通過
         ▼
┌─────────────────┐
│ 模組 1: 看到就修 │ → hook 報出 warning? → 主動修
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     繼續任務     │
└─────────────────┘
```

---

## 與現有 Skill 的關係

| Skill | 職責 | 被吸收 |
|-------|------|--------|
| `no_lazy_implementation` | 代碼完整性 | 被模組 3 吸收 |
| `read-before-edit` | 先讀後寫 | 被模組 6 吸收 |
| `code-validator` | 代碼品質 | 被模組 2+3 吸收 |
| `type-checker` | 型別檢查 | 被模組 2 吸收 |
| `rigorous_testing` | 測試 | 被模組 9 吸收 |
| `audit_logging` | 審計日誌 | 被模組 12 吸收 |
| `strict-audit` | 15 團隊審核 | 獨立運作（事後審核） |
| `pre-commit-validator` | commit 關卡 | 獨立運作（commit 時） |

**載入 `zero-slack-coder` = 涵蓋 6 個 Skill 的核心規則，一個抵六個。**

---

## 載入確認

載入後必須輸出：

```
zero-slack-coder v2.0 已啟動
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
行為監控:
  模組 1: 看到就修 ✅
  模組 2: 完成=驗證 ✅
  模組 7: 空轉偵測 ✅

代碼品質（自動掃描）:
  模組 3: 零半成品 ✅ [hook 強制]
  模組 4: 安全碼偵測 ✅ [hook 強制]
  模組 5: 大塊貼上偵測 ✅
  模組 6: 上下文脫離偵測 ✅ [hook 強制]

生產級要求:
  模組 8: 邊界防禦 ✅
  模組 9: 測試品質門檻 ✅
  模組 10: React 生產級 ✅
  模組 11: A11y 最低標準 ✅ [hook 強制]
  模組 12: 審計日誌 ✅
  模組 13: 錯誤處理品質 ✅
  模組 14: 文案一致性 ✅

強制約束: hook block 啟動中
手動全掃描: node scripts/zero-slack-check.cjs --full
```

---

**版本:** 2.0
**最後更新:** 2026-02-06
**靈感來源:** CodeRabbit AI 研究、IEEE Spectrum AI 退化報告、Meta ACH 變異測試、DORA/SPACE/DX Core 4 框架
