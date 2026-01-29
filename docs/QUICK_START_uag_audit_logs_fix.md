# uag_audit_logs RLS 修復 - 快速開始指南

**修復時間**: 約 5 分鐘
**影響範圍**: 後端資料庫 Schema（無需前端修改）
**停機時間**: 0 分鐘

---

## 一鍵執行

### 使用 Supabase CLI（推薦）

```bash
# 1. 確認 Supabase 連線
supabase status

# 2. 執行 Migration
supabase db push

# 3. 驗證 RLS 政策
supabase db execute -f supabase/migrations/20260129_verify_uag_audit_logs_rls.sql
```

### 預期輸出

```
NOTICE:  ✅ uag_audit_logs RLS verified: 3 policies active
NOTICE:  ✅ anon cannot access uag_audit_logs
NOTICE:  ✅ authenticated cannot access uag_audit_logs
NOTICE:  🎉 安全等級: 95/100 (P0 漏洞已修復)
```

---

## 檔案清單

| 檔案                                                         | 說明                                |
| ------------------------------------------------------------ | ----------------------------------- |
| `supabase/migrations/20260129_fix_uag_audit_logs_rls.sql`    | 主要修復腳本（啟用 RLS + 建立政策） |
| `supabase/migrations/20260129_verify_uag_audit_logs_rls.sql` | 驗證腳本（確認 RLS 正常運作）       |
| `supabase/migrations/20260129_uag_audit_logs_fix_README.md`  | 完整執行指南                        |
| `docs/20260129_uag_audit_logs_security_fix.md`               | 技術報告（問題分析 + 修復方案）     |

---

## 修復內容

### 1. 啟用 Row Level Security

```sql
ALTER TABLE public.uag_audit_logs ENABLE ROW LEVEL SECURITY;
```

### 2. 建立 Default-Deny 政策

```sql
-- 禁止匿名 + 已登入用戶存取
CREATE POLICY "uag_audit_logs_deny_anon" ON public.uag_audit_logs FOR ALL TO anon USING (false);
CREATE POLICY "uag_audit_logs_deny_authenticated" ON public.uag_audit_logs FOR ALL TO authenticated USING (false);

-- 僅允許 service_role（後端 API）
CREATE POLICY "uag_audit_logs_service_role_full_access" ON public.uag_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 3. 新增效能索引

```sql
CREATE INDEX idx_uag_audit_logs_created_at ON public.uag_audit_logs (created_at DESC);
CREATE INDEX idx_uag_audit_logs_session_id ON public.uag_audit_logs (session_id) WHERE session_id IS NOT NULL;
```

---

## 安全等級對比

| 評估項目          | 修復前      | 修復後      |
| ----------------- | ----------- | ----------- |
| RLS 狀態          | ❌ Disabled | ✅ Enabled  |
| 匿名用戶存取      | ✅ 可查詢   | ❌ 拒絕存取 |
| 已登入用戶存取    | ✅ 可查詢   | ❌ 拒絕存取 |
| service_role 存取 | ✅ 可查詢   | ✅ 完整權限 |
| **總分**          | **40/100**  | **95/100**  |

---

## 常見問題

### Q1: 這會影響現有功能嗎？

**A**: 不會。前端不應直接存取 `uag_audit_logs`，所有稽核日誌操作都應透過後端 API（使用 service_role）。

### Q2: 需要修改前端代碼嗎？

**A**: 不需要。此為純後端 Schema 修改。

### Q3: 需要備份資料庫嗎？

**A**: 可選。此為純 Schema 修改（新增 RLS 政策 + 索引），不涉及資料變更。

### Q4: 需要停機嗎？

**A**: 不需要。Migration 可在線執行，對現有服務無影響。

### Q5: 如何確認修復成功？

**A**: 執行驗證腳本，應看到 "🎉 安全等級: 95/100 (P0 漏洞已修復)" 訊息。

---

## 緊急回滾（僅測試環境）

如果需要回滾：

```sql
-- 刪除 RLS 政策
DROP POLICY IF EXISTS "uag_audit_logs_deny_anon" ON public.uag_audit_logs;
DROP POLICY IF EXISTS "uag_audit_logs_deny_authenticated" ON public.uag_audit_logs;
DROP POLICY IF EXISTS "uag_audit_logs_service_role_full_access" ON public.uag_audit_logs;

-- 停用 RLS
ALTER TABLE public.uag_audit_logs DISABLE ROW LEVEL SECURITY;
```

**⚠️ 警告**: 回滾會重新引入 P0 安全漏洞。

---

## 部署檢查清單

- [x] Migration 腳本已建立
- [x] 驗證腳本已建立
- [x] Git commit 已完成
- [ ] 執行 `supabase db push`
- [ ] 執行驗證腳本
- [ ] 確認驗證通過
- [ ] 通知團隊修復完成

---

## 後續監控

### 關鍵指標

1. **RLS 違規告警**
   - 監控是否有未授權存取嘗試
   - 在 Supabase Dashboard 設定告警

2. **後端 API 錯誤率**
   - 監控 `uag_audit_logs` 寫入錯誤
   - 預期：維持在 0%

3. **查詢效能**
   - 監控稽核日誌查詢時間
   - 預期：< 100ms（因新增索引）

---

## 參考文件

- 完整技術報告：`docs/20260129_uag_audit_logs_security_fix.md`
- 執行指南：`supabase/migrations/20260129_uag_audit_logs_fix_README.md`
- Supabase RLS 文件：https://supabase.com/docs/guides/auth/row-level-security

---

**修復負責人**: Claude Code
**修復日期**: 2026-01-29
**Git Commit**: 86647149
