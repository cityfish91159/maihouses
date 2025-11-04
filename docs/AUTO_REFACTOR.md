# 系統重構自動化說明

## 📅 執行時間
每天台北時間 **凌晨 1:00** 自動執行

## 🎯 重構內容

### ✅ 會做的事
1. **重組型別檔案**
   - `src/types/index.ts` → `src/services/api/types.ts`
   - 自動更新所有 import 路徑

2. **補齊功能模組**
   - 建立 `src/features/community/`
   - 建立 `src/features/listing/`
   - 建立 `src/features/auth/`

3. **建立 Mock 數據結構**
   - 建立 `src/services/mock/data/` 目錄
   - 準備 JSON 數據檔案位置

4. **驗證目錄結構**
   - 檢查是否符合規格書 §4 離散式架構

### ❌ 不會動的東西
- ✅ 字型尺寸（保持現狀）
- ✅ 品牌色彩（保持現狀）
- ✅ 元件實作內容（不修改邏輯）
- ✅ CSS 樣式（不變動）

## 🚀 如何觸發

### 自動觸發
每天凌晨 1:00 自動執行，無需人工介入。

### 手動觸發
1. 進入 GitHub Repository
2. 點選 **Actions** 標籤
3. 選擇「系統重構自動化」workflow
4. 點選 **Run workflow** 按鈕
5. 選擇 `main` branch
6. 點選綠色 **Run workflow**

## 📊 執行結果

### 成功情況
- ✅ 自動 commit 並 push 到 main branch
- ✅ Commit 訊息包含時間戳與變更摘要
- ✅ 可在 Actions 頁面查看執行記錄

### 無變更情況
- ℹ️ 若結構已符合規範，會顯示「無需重構」
- ℹ️ 不會產生空 commit

### 失敗情況
- ❌ 會在 Actions 頁面顯示錯誤
- ❌ 不會推送變更
- ❌ 需手動檢查並修正

## 🔧 本地測試

如果想在推送前本地測試：

```bash
# 執行重構腳本
cd /workspaces/maihouses
./scripts/refactor-structure.sh

# 檢查變更
git status
git diff

# 如果滿意結果
git add .
git commit -m "chore: 手動測試系統重構"
git push
```

## 📖 相關文件
- 規格書: `docs/GUIDELINES.md` §4 離散式架構
- 重構腳本: `scripts/refactor-structure.sh`
- GitHub Actions: `.github/workflows/auto-refactor.yml`

## ⚙️ 配置說明

### 修改執行時間
編輯 `.github/workflows/auto-refactor.yml`：

```yaml
schedule:
  - cron: '0 17 * * *'  # UTC 17:00 = 台北 01:00
  
# 改為凌晨 3:00
# - cron: '0 19 * * *'  # UTC 19:00 = 台北 03:00
```

### 停用自動執行
刪除或註解 `schedule` 區塊，保留 `workflow_dispatch` 僅手動觸發。

## 🛡️ 安全機制

1. **建置測試**：推送前先執行 `npm run build` 確保無錯誤
2. **僅結構變更**：不修改業務邏輯與樣式
3. **Git 權限**：使用 GitHub Actions 內建 token（自動過期）
4. **可回溯**：所有變更都有完整 commit 記錄

## 📞 問題排查

### Q: 為什麼沒有自動執行？
A: 檢查 GitHub Actions 是否啟用（Repository Settings → Actions → General）

### Q: 執行失敗怎麼辦？
A: 查看 Actions 頁面的錯誤訊息，通常是檔案權限或路徑問題

### Q: 可以暫停一天嗎？
A: 手動 disable workflow 或等執行完後 revert commit

### Q: 想改成每週執行？
A: 修改 cron 為 `0 17 * * 1`（每週一凌晨 1:00）
