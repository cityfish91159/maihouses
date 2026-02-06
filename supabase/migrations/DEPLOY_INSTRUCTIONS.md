# UAG v8 Schema 部署指南

## 📝 部署步驟

### 方式一：Supabase Dashboard（推薦）

1. **打開 Supabase Dashboard**

   ```
   https://supabase.com/dashboard/project/mtqnjmoisrvjofdxhwhi/sql/new
   ```

2. **複製 SQL 檔案內容**
   - 打開 `supabase/migrations/20251230_uag_tracking_v8.sql`
   - 全選複製 (Ctrl+A, Ctrl+C)

3. **執行 SQL**
   - 貼上到 SQL Editor
   - 點擊 "Run" 按鈕
   - 等待執行完成（約 10-15 秒）

4. **驗證部署**

   ```sql
   -- 檢查表格
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 'uag%';

   -- 預期結果：
   -- uag_sessions
   -- uag_events
   -- uag_events_archive

   -- 檢查函數
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_name LIKE '%uag%';

   -- 預期結果：
   -- track_uag_event_v8
   -- calculate_lead_grade
   -- archive_old_history

   -- 檢查物化視圖
   SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';

   -- 預期結果：
   -- uag_lead_rankings
   ```

### 方式二：使用 Node.js 腳本

```bash
# 執行部署腳本
node supabase/migrations/deploy_uag.js
```

---

## ✅ 部署成功標誌

- [x] 3 個表格創建成功
- [x] 3 個函數創建成功
- [x] 1 個物化視圖創建成功
- [x] RLS 政策啟用
- [x] 索引創建完成

## 🎯 下一步

部署完成後，執行以下命令更新到 git 和 Vercel：

```bash
git add .
git commit -m "feat(uag): deploy UAG v8 schema to Supabase"
git push origin deploy
vercel --prod --yes
```
