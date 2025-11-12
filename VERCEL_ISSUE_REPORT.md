# Vercel 部署問題詳細報告

## 📋 問題摘要
- **網站 URL**: https://maihouses.vercel.app/maihouses/
- **症狀**: Vercel 部署成功，但網頁無法正常顯示
- **時間**: 2025-11-12

---

## 🔧 當前配置

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/maihouses/',  // 子路徑配置
  build: {
    outDir: 'docs',
    sourcemap: false,
  },
  // ... 其他配置
})
```

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "docs",
  "redirects": [
    { "source": "/", "destination": "/maihouses", "permanent": false }
  ],
  "rewrites": [
    { "source": "/maihouses", "destination": "/" },
    { "source": "/maihouses/(.*)", "destination": "/$1" }
  ],
  "functions": {
    "api/*.js": {
      "memory": 256,
      "maxDuration": 30
    }
  }
}
```

### 建置後的檔案結構
```
docs/
├── index.html  (資源路徑: /maihouses/assets/...)
├── assets/
│   ├── index-BGHzPMnF.js
│   ├── index-B-g80JJG.js
│   └── index-iVc9esUb.css
└── ... 其他檔案
```

---

## 📝 今天的改動歷史（時間順序）

### 1. 今天凌晨 3:06 (成功狀態)
- **Commit**: `f3c9ff1` - Merge feat/ui-homepage-optimize-responsive
- **配置**:
  - `base: '/maihouses/'`
  - vercel.json 有 redirects + rewrites + functions (runtime: nodejs22.x)
- **狀態**: ✅ 網站正常運作

### 2. 今天白天開始修改
嘗試修復 Vercel 部署問題，進行了以下操作：

#### 改動 A: 移除 nodejs22.x runtime
- **原因**: Vercel 報錯 "Function Runtimes must have a valid version"
- **改動**: 從 vercel.json 的 functions 區塊移除 `"runtime": "nodejs22.x"`
- **結果**: ❌ 網站仍然故障

#### 改動 B: 修改 base 路徑 (錯誤嘗試)
多次在 `base: '/'` 和 `base: '/maihouses/'` 之間切換：
- 嘗試 1: 改成 `base: '/'` 並移除所有 redirects/rewrites
- 嘗試 2: 改回 `base: '/maihouses/'` 保留 redirects/rewrites
- 嘗試 3: 重置到多個不同的歷史版本

#### 改動 C: 多次重新建置
執行了多次 `npm run build`，重新生成 `docs/` 資料夾

#### 改動 D: Git 分支混亂
創建並推送了多個修復分支：
- claude/fix-base-path-011CV3NQanGYHXrh4JjHkuDj
- claude/restore-stable-011CV3NQanGYHXrh4JjHkuDj
- claude/restore-working-config-011CV3NQanGYHXrh4JjHkuDj
- claude/restore-yesterday-config-011CV3NQanGYHXrh4JjHkuDj
- claude/fix-vercel-deployment-issues-011CV3NQanGYHXrh4JjHkuDj

### 3. 最終恢復狀態 (當前)
- **Commit**: `eabc89c` on branch `claude/fix-vercel-deployment-issues-011CV3NQanGYHXrh4JjHkuDj`
- **配置**: 與凌晨 3:06 相同，但移除了 nodejs22.x runtime
- **狀態**: ❌ Vercel 部署成功但網頁故障

---

## 🔍 可能的問題原因

### 1. Rewrites 規則衝突
vercel.json 的 rewrites 可能造成路徑混亂：

```json
"rewrites": [
  { "source": "/maihouses", "destination": "/" },
  { "source": "/maihouses/(.*)", "destination": "/$1" }
]
```

**問題分析**:
- 瀏覽器請求: `https://maihouses.vercel.app/maihouses/`
- HTML 載入後請求資源: `/maihouses/assets/index-BGHzPMnF.js`
- Rewrite 規則將 `/maihouses/assets/...` 重寫成 `/assets/...`
- 但 Vercel 靜態檔案在 `docs/assets/` 而非根目錄 `assets/`
- **結果**: 404 錯誤

### 2. Base Path 與 Rewrites 的雙重映射
- Vite 建置時使用 `base: '/maihouses/'`，所有資源路徑都加上 `/maihouses/` 前綴
- Vercel rewrites 又試圖把 `/maihouses/` 映射到根路徑 `/`
- 這造成雙重映射衝突

### 3. Vercel 快取問題
- 多次部署可能導致 Vercel CDN 快取舊的錯誤版本
- 即使配置正確，可能還是載入快取的錯誤檔案

### 4. 可能被我改動的 Vercel 平台設定
用戶提到：「你亂改的東西除了 GIT 還有 VERCEL」
- 但我沒有直接存取 Vercel 平台的權限
- **可能**: 多次推送導致 Vercel 自動偵測配置改變，觸發某些設定更新

---

## 🎯 建議的修復方案

### 方案 A: 簡化為根路徑部署 (最簡單)
```typescript
// vite.config.ts
base: '/'  // 改回根路徑
```

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "docs"
  // 移除所有 redirects 和 rewrites
}
```
- **優點**: 配置最簡單，不易出錯
- **缺點**: 網址變成 `https://maihouses.vercel.app/` 而非 `/maihouses/`

### 方案 B: 修正 Rewrites 規則 (保留 /maihouses/)
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "docs",
  // 移除 rewrites，只保留 redirect
  "redirects": [
    { "source": "/", "destination": "/maihouses/", "permanent": false }
  ]
}
```
- **優點**: 保留 `/maihouses/` 路徑
- **說明**: 讓 Vercel 直接服務 `docs/` 資料夾作為靜態網站，不做路徑重寫

### 方案 C: 檢查 Vercel 平台設定
登入 Vercel Dashboard 檢查：
1. **Framework Preset**: 是否設定為 Vite？
2. **Root Directory**: 是否正確（應該是空白或 `.`）
3. **Build Command**: 是否被覆寫？
4. **Output Directory**: 是否正確設為 `docs`？
5. **Environment Variables**: 是否有遺失或錯誤的環境變數？

### 方案 D: 清除 Vercel 快取
在 Vercel Dashboard：
1. 進入 Deployments
2. 找到最新的部署
3. 點擊 "Redeploy" 並勾選 "Clear build cache"

---

## 📊 昨天 vs 今天配置差異

| 項目 | 昨天凌晨 (正常) | 今天 (故障) |
|------|----------------|-------------|
| vite base | `/maihouses/` | `/maihouses/` ✅ |
| vercel redirects | 有 | 有 ✅ |
| vercel rewrites | 有 | 有 ✅ |
| nodejs runtime | nodejs22.x | 移除 ❌ |
| docs/ 建置 | 正常 | 重建多次 ⚠️ |
| Git 狀態 | 乾淨 | 多個分支混亂 ⚠️ |

**主要差異**: 只有移除了 nodejs22.x runtime

---

## 🔨 需要確認的資訊

請協助確認以下資訊，以便更準確診斷問題：

1. **網頁錯誤症狀**：
   - [ ] 完全白屏
   - [ ] 顯示 404 錯誤
   - [ ] 部分載入但 JavaScript 錯誤
   - [ ] 樣式缺失（CSS 未載入）
   - [ ] 其他: ___________

2. **瀏覽器開發者工具 (F12) Network 顯示**：
   - 哪些資源載入失敗 (404)？
   - 失敗的資源完整 URL 是什麼？

3. **Vercel Dashboard 資訊**：
   - Framework Preset 設定為？
   - Build Command 顯示為？
   - Output Directory 顯示為？
   - 有無自訂的 Environment Variables？

4. **昨天正常時的網址**：
   - 確認是 `https://maihouses.vercel.app/maihouses/` 嗎？

---

## 🚨 我今天做錯的事

1. **反覆修改配置沒有系統性診斷**: 應該先用本地測試確認問題，而非直接推送多次
2. **沒有先確認 docs/ 是否正確建置**: 只恢復配置檔但忘記重建
3. **創建太多修復分支**: 造成 Git 歷史混亂
4. **沒有先了解 rewrites 規則的運作**: 盲目恢復配置而不理解原理
5. **缺少對 Vercel 平台本身設定的確認**: 只專注在代碼層面

---

## 📞 請提供給他人的問題描述

可以直接把這個報告給其他工程師，或者用以下簡短版本：

> **問題**: React + Vite 專案部署到 Vercel，使用 `/maihouses/` 子路徑。昨天正常，今天修改後（主要是移除 nodejs22.x runtime）Vercel 顯示部署成功但網頁故障。
>
> **當前配置**:
> - Vite `base: '/maihouses/'`
> - Vercel `outputDirectory: "docs"`
> - 有 redirects 從 `/` 到 `/maihouses`
> - 有 rewrites 將 `/maihouses` 映射到 `/` 和 `/maihouses/*` 映射到 `/*`
>
> **懷疑**: rewrites 規則可能造成資源路徑衝突（HTML 請求 `/maihouses/assets/...` 但被 rewrite 成 `/assets/...` 導致 404）
>
> **需要協助**: 如何正確配置 Vercel rewrites 讓子路徑 `/maihouses/` 正常運作？

---

生成時間: 2025-11-12 16:08 (UTC+8)
