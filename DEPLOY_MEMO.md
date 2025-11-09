# 部署備忘錄（MaiHouses）

本專案已設定「自動部署」：

- 觸發條件：推送到 `main` 分支（push to main）
- 工作流程：`.github/workflows/deploy.yml`
- 建置：使用 Vite，輸出到 `docs/`
- 發佈：GitHub Pages（透過 Actions：configure-pages → upload-pages-artifact → deploy-pages）
- 結果網址：`https://cityfish91159.github.io/maihouses/`

## 日常操作
1. 直接提交/合併到 `main`。
2. GitHub Actions 會自動：
   - 安裝依賴（npm ci）
   - 建置（`npm run build` → 產出 `docs/`）
   - 上傳成 Pages 產物並發布
3. 約數十秒後即可在 Pages 網站看到最新內容。

## 特殊說明
- 工作流程同時會把 `community_wall_MVP_green_tags.html` 複製到 `docs/community-wall_mvp.html` 以維持現有靜態頁。
- 若需要暫停自動部署（例如只想推程式碼不發版）：
  - 方式 A（推薦）：建立非 `main` 分支開發，等確認再合併；
  - 方式 B（可選）：在 GitHub 上暫時停用 Pages 或停用 workflow；
  - 方式 C（進階）：可於 workflow 中加入 `[skip deploy]` 條件（目前未啟用）。

## 故障排查
- 進到「Actions → Deploy to GitHub Pages」檢視每個步驟的日誌。
- 常見問題：
  - 依賴安裝失敗：重新跑一次或檢查 lockfile。
  - Vite build 失敗：檢查型別/語法錯誤（可先本地 `npm run build`）。
  - 頁面 cache：硬重新整理（Ctrl+Shift+R）或等 CDN 刷新。

> 備忘：此流程屬「無提示自動部署」；只要推到 main 就會發布，不再額外詢問。
