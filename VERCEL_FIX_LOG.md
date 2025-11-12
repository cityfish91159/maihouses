# Vercel 部署修復記錄
**日期**: 2025-11-12  
**最終成功 Commit**: `fd1f1f8`

---

## 🎯 問題描述
- 首頁 `https://maihouses.vercel.app/maihouses/` 一直 404 或轉圈圈
- F12 顯示資源載入失敗
- 多次部署失敗

---

## 🔍 根本原因

### 1. **rewrites 配置衝突**
```json
// ❌ 錯誤配置（會造成循環或路徑錯誤）
{
  "redirects": [
    { "source": "/", "destination": "/maihouses/", "permanent": false }
  ],
  "rewrites": [
    { "source": "/maihouses", "destination": "/" },       // 造成循環
    { "source": "/maihouses/(.*)", "destination": "/$1" }  // 路徑錯誤
  ]
}
```

### 2. **runtime 版本衝突**
```json
// ❌ 問題配置
"functions": {
  "api/**/*.js": {
    "runtime": "nodejs18.x",  // ← Vercel 不支援或與 package.json 衝突
    "memory": 256,
    "maxDuration": 10
  }
}
```
- `package.json` 指定 `"node": "22.x"`
- `vercel.json` 指定 `"runtime": "nodejs18.x"`
- 造成版本衝突

### 3. **路徑映射問題**
- `vite.config.ts` 設定 `base: '/maihouses/'`
- 建置輸出到 `docs/`
- HTML 引用 `/maihouses/assets/index.js`
- 但 Vercel 在 `docs/` 找不到 `maihouses/` 子目錄

---

## ✅ 解決方案

### 最終有效的 vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "docs",
  "routes": [
    { "src": "/maihouses/(.*)", "dest": "/$1" },
    { "src": "/maihouses", "dest": "/index.html" }
  ]
}
```

### 修正項目
1. ✅ **移除 `rewrites`** - 避免循環和路徑混亂
2. ✅ **移除 `redirects`** - 不必要
3. ✅ **移除 `functions.runtime`** - 讓 Vercel 自動偵測 Node.js 版本
4. ✅ **使用 `routes`** - 正確映射 `/maihouses/*` → `docs/*`

---

## 📋 修復過程 Commits

1. `9abc942` - feat(ui): remove mood chips & quiet mode toggles; fix vercel runtime
   - 移除右下心情按鈕 (`FloatingMoodChips`)
   - 移除 AI 智能交互白框框 (`QuietBanner`, `QuietModeToggle`)

2. `03f99fb` - fix: remove rewrites - enable orange pill CSS deployment
   - 移除 rewrites

3. `ddcab95` - Revert "fix(vercel): remove runtime config & node engines"
   - 回復測試

4. `e97e017` - fix(vercel): remove runtime field, fix api path pattern
   - 移除 runtime 欄位
   - 修正 `api/**/*.js` → `api/*.js`

5. `c833a34` - fix(vercel): use minimal config
   - 使用最簡化配置（只有 buildCommand 和 outputDirectory）

6. `fd1f1f8` - **fix(vercel): add routes to map /maihouses paths** ✅
   - **最終成功方案：加入 routes 映射**

---

## 🧪 驗證結果

```bash
# 首頁
curl -I https://maihouses.vercel.app/maihouses/
# HTTP/2 200 ✅

# JS 資源
curl -I https://maihouses.vercel.app/maihouses/assets/index-PvtLE0v-.js
# HTTP/2 200, 222KB ✅

# CSS 資源
curl -I https://maihouses.vercel.app/maihouses/assets/index-BQ9unFDC.css
# HTTP/2 200, 53KB ✅
```

---

## 📌 重要教訓

1. **Vercel rewrites ≠ 靜態資源路徑映射**
   - `rewrites` 用於 API 代理，不適合處理靜態資源
   - 靜態資源應使用 `routes` 明確映射

2. **runtime 版本要一致或不指定**
   - 不要在 `vercel.json` 和 `package.json` 中指定衝突的 Node 版本
   - 最好讓 Vercel 自動偵測

3. **base path 需要與 outputDirectory 對應**
   - `base: '/maihouses/'` + `outputDirectory: 'docs'` 需要 `routes` 橋接
   - 或者修改 `base: '/'` 但會影響 GitHub Pages 相容性

---

## 🔄 如果需要回滾

```bash
# 回到最後穩定版本
git checkout fd1f1f8

# 或使用此 vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "docs",
  "routes": [
    { "src": "/maihouses/(.*)", "dest": "/$1" },
    { "src": "/maihouses", "dest": "/index.html" }
  ]
}
```

---

## ✨ 已完成的 UI 修改

1. ✅ 移除右下角心情三大按鈕 (`FloatingMoodChips`)
2. ✅ 移除 AI 智能交互的兩個白框框 (`QuietBanner`, `QuietModeToggle`)
3. ✅ 橘色膠囊 CSS 已完整定義（`src/index.css` lines 470-482）
4. ✅ 社區評論卡 (`CommunityTeaser`) 完全未修改

---

**最終狀態**: 🟢 部署成功，首頁正常運作
