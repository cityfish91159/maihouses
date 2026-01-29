# Phase 1.5 部署檢查清單

## 📊 Migration 執行狀態

### ✅ 已確認完成

- [x] **20260128_add_buyer_email_phone.sql** - buyer_email, buyer_phone 欄位已存在

### ⏳ 待確認

#### 1. 檢查 5 個效能索引是否存在

```sql
-- 在 Supabase SQL Editor 執行
SELECT indexname
FROM pg_indexes
WHERE tablename = 'trust_cases'
  AND indexname LIKE 'idx_trust_cases_%';
```

**預期結果**（應回傳 5 個索引）：

- `idx_trust_cases_token`
- `idx_trust_cases_buyer_user_id`
- `idx_trust_cases_agent_status`
- `idx_trust_cases_property_id`
- `idx_trust_cases_created_at`

---

#### 2. 檢查 RPC 函數是否最新版本

```sql
-- 在 Supabase SQL Editor 執行
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'fn_upgrade_trust_case';
```

**檢查要點**：

- 函數定義中是否包含 `[Team Alpha - S-03]` 註解
- EXCEPTION 區塊是否只記錄 `SQLERRM` 和 `SQLSTATE`（不包含 case_id, user_id）

---

#### 3. 檢查 RPC 函數權限

```sql
-- 在 Supabase SQL Editor 執行
SELECT
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'fn_upgrade_trust_case';
```

**預期結果**：

- `authenticated` 有 EXECUTE 權限
- `service_role` 有 EXECUTE 權限
- `anon` **沒有** EXECUTE 權限

---

## 🔐 Vercel 環境變數檢查

### ✅ 必填變數

- [ ] **VITE_STORAGE_SECRET** - AES-256 加密金鑰（64 字元）
  - Production: ⏳ 待設置
  - Preview: ⏳ 待設置
  - Development: ⏳ 待設置

#### 如何生成金鑰：

```bash
# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

---

## 📝 需要執行的 SQL（如果上述檢查未通過）

### SQL 1: 效能索引（如果索引不存在）

```sql
-- 檔案: 20260128_add_performance_indexes.sql
-- 複製整個檔案內容到 Supabase SQL Editor 執行
```

### SQL 2: RPC 日誌脫敏（如果函數不是最新版本）

```sql
-- 檔案: 20260128_fix_rpc_logging_security.sql
-- 複製整個檔案內容到 Supabase SQL Editor 執行
```

---

## 🎯 部署步驟（按順序執行）

### Step 1: 生成加密金鑰

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**記下輸出的 64 字元金鑰** ✏️: ********\_\_\_\_********

---

### Step 2: 設置 Vercel 環境變數

1. 前往 https://vercel.com/dashboard
2. 選擇專案 `maihouses`
3. **Settings** → **Environment Variables**
4. 點擊 **Add New**
5. 填入：
   - Name: `VITE_STORAGE_SECRET`
   - Value: 貼上 Step 1 的金鑰
   - Environments: 勾選 **All** (Production, Preview, Development)
6. **Save**

---

### Step 3: 驗證 Migration（執行上方的檢查 SQL）

- [ ] 索引檢查通過（5 個索引）
- [ ] RPC 函數最新版本
- [ ] RPC 函數權限正確

---

### Step 4: 重新部署 Vercel

```bash
# 方法 1: 透過 Vercel Dashboard
# Settings → Deployments → ... → Redeploy

# 方法 2: 推送新 commit 觸發部署
git commit --allow-empty -m "chore: trigger redeploy for VITE_STORAGE_SECRET"
git push origin main
```

---

### Step 5: 驗證部署成功

1. 等待 Vercel 部署完成
2. 前往 https://maihouses.vercel.app/maihouses/property/MH-100001
3. 檢查：
   - [ ] 頁面正常載入（無 Build Error）
   - [ ] 安心留痕橫幅顯示
   - [ ] 點擊「進入服務」可取得 Token
   - [ ] 瀏覽器 Console 無 localStorage 加密錯誤

---

## 🚨 常見問題排除

### Q1: Vercel Build 失敗，錯誤：VITE_STORAGE_SECRET is required

**解決方法**:

1. 確認 Step 2 已正確設置環境變數
2. 確認勾選了 **Production** 環境
3. 重新部署

### Q2: 索引查詢回傳少於 5 個

**解決方法**: 執行 `20260128_add_performance_indexes.sql`

### Q3: RPC 函數 EXCEPTION 仍記錄 case_id

**解決方法**: 執行 `20260128_fix_rpc_logging_security.sql`

---

## ✅ 最終確認清單

- [ ] buyer_email/phone 欄位存在 ✅（已確認）
- [ ] 5 個效能索引已建立
- [ ] RPC 函數已更新（日誌脫敏版本）
- [ ] RPC 函數權限正確
- [ ] VITE_STORAGE_SECRET 已設置到 Vercel
- [ ] Vercel 重新部署成功
- [ ] 前端功能驗證通過

---

**完成時間**: ****\_\_\_\_****
**執行人**: ****\_\_\_\_****
