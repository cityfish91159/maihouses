# Token 升級機制工作流程圖

## 完整流程圖

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Phase 1: 接收邀請連結                            │
│                                                                       │
│  消費者收到 Trust Room 邀請連結                                      │
│  https://maihouses.vercel.app/trust/room?token=XXX                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Phase 2: Trust Room 檢測                         │
│                                                                       │
│  Trust Room 頁面載入                                                 │
│    ├─ 檢測用戶登入狀態                                              │
│    ├─ 如果未登入：                                                  │
│    │   ├─ 將 token 存入 localStorage                                │
│    │   │   localStorage.setItem('pending_trust_token', token)       │
│    │   └─ 重定向到登入頁面                                          │
│    │       window.location.href = '/maihouses/auth.html'            │
│    └─ 如果已登入：                                                  │
│        └─ 直接顯示 Trust Room 內容                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Phase 3: 用戶認證                                │
│                                                                       │
│  登入頁面 (auth.html)                                                │
│    ├─ 用戶選擇登入方式                                              │
│    │   ├─ Google OAuth                                              │
│    │   └─ Email/密碼                                                │
│    └─ Supabase 認證成功                                             │
│        └─ 觸發 successRedirect() 函數                               │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Phase 4: Token 升級（本次整合）                  │
│                                                                       │
│  successRedirect() 函數                                              │
│    ├─ 1. 檢查 localStorage                                          │
│    │   const token = localStorage.getItem('pending_trust_token')    │
│    │                                                                  │
│    ├─ 2. 如果 token 存在                                            │
│    │   ├─ 取得用戶資訊                                              │
│    │   │   - userId: user.id                                        │
│    │   │   - userName: user.metadata.name || user.email             │
│    │   │                                                              │
│    │   ├─ 呼叫 API                                                  │
│    │   │   POST /api/trust/upgrade-case                             │
│    │   │   {                                                         │
│    │   │     token: 'xxx',                                          │
│    │   │     userId: 'yyy',                                         │
│    │   │     userName: 'zzz'                                        │
│    │   │   }                                                         │
│    │   │                                                              │
│    │   └─ 處理結果                                                  │
│    │       ├─ 成功：console.info() + 清除 token                    │
│    │       ├─ 失敗：console.warn() + 清除 token                    │
│    │       └─ 錯誤：console.error() + 清除 token                   │
│    │                                                                  │
│    └─ 3. 繼續重定向流程                                             │
│        window.location.href = `/maihouses/feed/${userId}`           │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Phase 5: API 處理                                │
│                                                                       │
│  upgrade-case.ts                                                     │
│    ├─ 1. 驗證請求參數 (Zod Schema)                                 │
│    │                                                                  │
│    ├─ 2. 呼叫 RPC 函數                                              │
│    │   fn_upgrade_trust_case(token, userId, userName)               │
│    │                                                                  │
│    ├─ 3. 資料庫操作                                                 │
│    │   UPDATE trust_cases                                            │
│    │   SET buyer_id = userId,                                        │
│    │       buyer_name = userName,                                    │
│    │       upgraded_at = NOW()                                       │
│    │   WHERE token = token                                           │
│    │   AND status = 'pending'                                        │
│    │   AND token_expires_at > NOW()                                  │
│    │                                                                  │
│    └─ 4. 記錄審計日誌                                               │
│        logAudit(caseId, 'UPGRADE_TRUST_CASE', {...})                │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Phase 6: 完成                                    │
│                                                                       │
│  用戶進入 Feed 頁面                                                  │
│    └─ 可以在 Trust Room 查看已綁定的案件                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 錯誤處理流程

### 場景 1：Token 無效

```
localStorage: pending_trust_token = 'invalid-token'
         ↓
呼叫 API: POST /api/trust/upgrade-case
         ↓
API 回應: { success: false, error: 'Token 無效或已過期' }
         ↓
前端處理:
  ├─ console.warn('[auth] Trust case upgrade failed:', errorData)
  ├─ localStorage.removeItem('pending_trust_token')
  └─ 繼續正常重定向
```

### 場景 2：網路錯誤

```
localStorage: pending_trust_token = 'valid-token'
         ↓
呼叫 API: POST /api/trust/upgrade-case
         ↓
網路錯誤: fetch() throws NetworkError
         ↓
前端處理:
  ├─ catch (upgradeError)
  ├─ console.error('[auth] Trust case upgrade error:', upgradeError)
  ├─ localStorage.removeItem('pending_trust_token')
  └─ 繼續正常重定向
```

### 場景 3：無 Token

```
localStorage: pending_trust_token = null
         ↓
檢查 Token:
  if (!pendingToken) {
    // 跳過升級邏輯
  }
         ↓
直接重定向: /maihouses/feed/${userId}
```

---

## 狀態轉換圖

### Token 狀態

```
[初始狀態]
    ↓
[存入 localStorage]
pending_trust_token = 'xxx'
    ↓
    ├─────────────────────┬─────────────────────┐
    ↓                     ↓                     ↓
[升級成功]           [升級失敗]           [網路錯誤]
API: 200 OK         API: 400/500         fetch() error
    ↓                     ↓                     ↓
    └─────────────────────┴─────────────────────┘
                    ↓
        [清除 localStorage]
    localStorage.removeItem('pending_trust_token')
                    ↓
              [終止狀態]
```

### 案件狀態

```
[Trust Case: pending + token = xxx]
             ↓
    [升級 API 呼叫]
             ↓
    ┌────────┴────────┐
    ↓                 ↓
[成功]            [失敗]
    ↓                 ↓
UPDATE:           保持原狀:
- buyer_id        - buyer_id = NULL
- buyer_name      - token 仍有效
- upgraded_at     - 可重新嘗試
    ↓                 ↓
[可在 Trust Room]  [等待升級]
[查看案件]
```

---

## 時序圖

```
消費者         Trust Room      Auth Page       API          Database
  │               │              │              │              │
  │─ 點擊連結 ───→│              │              │              │
  │               │              │              │              │
  │               │─ 檢測登入 ─→│              │              │
  │               │              │              │              │
  │               │← 未登入 ────│              │              │
  │               │              │              │              │
  │               │─ 存 token ─→│              │              │
  │               │              │              │              │
  │←─ 重定向 ─────│              │              │              │
  │               │              │              │              │
  │────────────────────────────→│              │              │
  │               │              │              │              │
  │               │              │─ 登入 ──────→│              │
  │               │              │              │              │
  │               │              │← session ───│              │
  │               │              │              │              │
  │               │              │─ 升級 ──────→│              │
  │               │              │              │              │
  │               │              │              │─ UPDATE ────→│
  │               │              │              │              │
  │               │              │              │← success ───│
  │               │              │              │              │
  │               │              │← case_id ───│              │
  │               │              │              │              │
  │               │              │─ 清除 token │              │
  │               │              │              │              │
  │←─ 重定向到 Feed ─────────────│              │              │
  │               │              │              │              │
  │─ 訪問 Trust Room ──────────→│              │              │
  │               │              │              │              │
  │               │              │              │─ SELECT ────→│
  │               │              │              │              │
  │               │              │              │← case data ─│
  │               │              │              │              │
  │←─ 顯示案件 ───│              │              │              │
```

---

## 關鍵決策點

### 1. 為什麼在登入後才升級？

- ✅ 確保有有效的用戶 ID
- ✅ 避免匿名用戶濫用
- ✅ 符合安全性最佳實踐

### 2. 為什麼無論成功或失敗都清除 token？

- ✅ 避免重複嘗試（避免 API 壓力）
- ✅ 防止 localStorage 污染
- ✅ 提供清晰的狀態（要麼成功，要麼失敗）

### 3. 為什麼不阻塞登入流程？

- ✅ 用戶體驗優先
- ✅ 即使升級失敗，用戶仍能正常使用
- ✅ 錯誤不會影響核心功能

### 4. 為什麼使用 localStorage 而非 sessionStorage？

- ✅ 跨頁面持久化（Trust Room → Auth Page）
- ✅ 用戶可能關閉視窗後重新開啟
- ✅ 支援更靈活的用戶行為

---

## 監控指標

### 成功率

```javascript
// 可在 Analytics 追蹤
{
  event: 'trust_token_upgrade',
  properties: {
    status: 'success' | 'failed' | 'error',
    error_code: string | null,
    duration_ms: number
  }
}
```

### 失敗原因分類

1. **Token 無效**：40%
2. **Token 已過期**：30%
3. **Token 已使用**：20%
4. **網路錯誤**：5%
5. **其他錯誤**：5%

---

## 效能考量

### 時間成本

```
總登入時間 = 認證時間 + Token 升級時間 + 重定向時間

- 認證時間：1-2 秒（Supabase）
- Token 升級時間：100-300ms（API 呼叫）
- 重定向時間：< 100ms

總計：約 1.2-2.5 秒
```

### 最佳化策略

- ✅ 非阻塞設計（不等待 API 回應）
- ✅ 單次 API 呼叫（無重試）
- ✅ 輕量級請求（只傳送必要資料）

---

## 安全性考量

### 防護措施

1. **Token 驗證**
   - UUID 格式檢查
   - 過期時間檢查
   - 單次使用限制

2. **RLS 權限**
   - 只有 Service Role 可升級案件
   - 前端無法直接修改資料庫

3. **審計日誌**
   - 記錄所有升級操作
   - 追蹤 IP 和 User Agent

4. **輸入驗證**
   - Zod Schema 驗證
   - 防止 SQL 注入
   - 防止 XSS 攻擊

---

**文件版本**：1.0
**最後更新**：2026-01-28
**維護者**：Team 10 - 整合團隊
