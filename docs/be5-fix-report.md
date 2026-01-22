# BE-5 問題修復紀錄（2026-01-22）

## 目標
修復你列出的 #1~#14 問題，並標註已處理/已驗證項目。

## 修復清單（#1~#14）

### #1 fn_create_trust_case 重複 NOW() 造成 hash 不一致（高）
- 修復：`supabase/migrations/20260122_be5_create_case_hash_fix.sql`
  - NOW() 單次取值
  - 保留 token / token_expires_at 回傳
  - 加註依賴 `20260122_add_case_token_final.sql`

### #2 舊版 fn_update_trust_case_step 仍存在（高）
- 修復：`supabase/migrations/20260122_be5_update_step_return_old.sql`
  - 加註依賴 `20260119_trust_cases_schema.sql`

### #3 p_action 未驗證空字串（中）
- 修復：`20260122_be5_update_step_return_old.sql`
  - `p_action IS NULL OR btrim(p_action) = ''` 直接回錯

### #4 p_actor 未驗證合法值（中）
- 修復：`20260122_be5_update_step_return_old.sql`
  - `p_actor IN ('agent','buyer','system')` 驗證

### #5 migration 依賴順序未標註（中）
- 修復：
  - `20260122_be5_update_step_return_old.sql`
  - `20260122_be5_step_constraint_fix.sql`

---

### #6 TrustCaseEventSchema.step 範圍錯誤（高）
- 狀態：已正確（`api/trust/cases/[id].ts` step = min(0) max(6)）
- 驗證：新增實際 handler 測試，回傳 step=0 事件可正常通過

### #7 通知函數同步 throw 未處理（中）
- 修復：`api/trust/cases/[id].ts`
  - 非阻塞通知外層加 try/catch，避免同步 throw 漏掉

### #8 logNotificationFailure step=0 會失敗（已修）
- 狀態：已修（`20260122_be5_step_constraint_fix.sql`）
- 補強：加註 migration 依賴順序

### #9 sendStepUpdateNotification 未驗證 from/to step（中）
- 狀態：已存在驗證（`api/trust/send-notification.ts`）

---

### #10 測試是假的（高）
- 修復：新增真實 handler 測試檔
  - `api/trust/__tests__/cases.handler.test.ts`
  - 直接 import handler 並呼叫

### #11 沒有測試 step=0 系統事件（中）
- 修復：在 handler 測試中回傳 step=0 事件並驗證成功

### #12 權限測試是假的（高）
- 修復：handler 測試實際驗證
  - 未登入 -> 401
  - buyer 角色 -> 403

### #13 沒有測試競態條件（中）
- 修復：handler 測試模擬 RPC 回傳競態錯誤 -> 400

### #14 hash 格式測試錯誤（中）
- 狀態：原測試已使用 8...4 格式（符合 SQL）

---

## 變更檔案
- `supabase/migrations/20260122_be5_create_case_hash_fix.sql`
- `supabase/migrations/20260122_be5_update_step_return_old.sql`
- `supabase/migrations/20260122_be5_step_constraint_fix.sql`
- `api/trust/cases/[id].ts`
- `api/trust/__tests__/cases.handler.test.ts`
- `api/trust/send-notification.ts`

## 備註
- 未刪除既有 mock 型測試（`api/trust/__tests__/cases.test.ts`），但已補上真實 handler 測試。
- 若你要我重構舊測試（移除假測試），請指示。

## 測試
- `npm test -- api/trust/__tests__/cases.handler.test.ts`（6 tests passed）

## A-D 補充修復
### A
- 修正 `cases.handler.test.ts` mock 路徑：`../lib/logger` -> `../../lib/logger`
### B
- 新增 `[id].ts` buyer role 403 測試
### C
- `cases.test.ts` 已使用 `{8}...{4}` hash 格式驗證（保持）
### D
- `send-notification.ts` stepNames 統一為「接觸」
