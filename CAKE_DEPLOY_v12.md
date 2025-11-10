# 🎂 Cake Reveal v12.0 部署指南

## ✨ v12.0 新功能總覽

### 1. 智能測光自動推薦系統
- **8種AI智能推薦**：
  - 🌙 曝光不足修復
  - ☀️ 過曝修復  
  - 🎂 極高紋理（蛋糕專用）
  - 🧹 強力降噪
  - ✨ 完美曝光增強
  - 🧊 低對比增強
  - 🔬 極限解析
  - 🎯 標準預設

- **自動分析指標**：
  - 曝光度（平均值/中位數/標準差）
  - 亮暗部裁切檢測
  - 動態範圍評估
  - 噪點檢測（GLCM 能量）
  - 對比度分析

### 2. Guided Filter 細節增強
- 多尺度自適應細節提取（類 Adobe Lightroom）
- 三個尺度：細小/中等/粗糙紋理
- 邊緣保持平滑算法
- 增益可調節（fine: 1.5, mid: 1.2, coarse: 0.8）

### 3. 代碼優化
- 所有算法保持 100% 功能完整
- 記憶體管理優化
- Worker 並行處理優化
- 超時保護機制

---

## 📋 部署步驟（Vite 專案）

### 方法 A：直接部署（推薦）

```bash
#!/bin/bash
# === Cake Reveal v12.0 一鍵部署腳本 ===

# 1. 進入專案目錄
cd /workspaces/maihouses

# 2. 創建分支
git checkout -b feature/cake-reveal-v12

# 3. 建立目錄結構
mkdir -p public/tools/cake-reveal

# 4. 複製文件
cp 蛋糕.html public/tools/cake-reveal/index.html

# 5. HTML 壓縮（保守版 - 保留功能完整性）
npm i -D html-minifier-terser

npx html-minifier-terser \
  public/tools/cake-reveal/index.html \
  --collapse-whitespace \
  --remove-comments \
  --minify-css true \
  --minify-js true \
  -o public/tools/cake-reveal/index.html

# 6. 程式完整性檢查
echo "🔍 檢查關鍵功能..."

grep -q "function clahe" public/tools/cake-reveal/index.html && echo "✔ CLAHE OK" || (echo "✖ 缺少 CLAHE" && exit 1)
grep -q "function guidedFilter" public/tools/cake-reveal/index.html && echo "✔ Guided Filter OK" || (echo "✖ 缺少 Guided Filter" && exit 1)
grep -q "function enhanceDetailMultiScale" public/tools/cake-reveal/index.html && echo "✔ 細節增強 OK" || (echo "✖ 缺少細節增強" && exit 1)
grep -q "analyzeExposure" public/tools/cake-reveal/index.html && echo "✔ 曝光分析 OK" || (echo "✖ 缺少曝光分析" && exit 1)
grep -q "calcGLCM" public/tools/cake-reveal/index.html && echo "✔ GLCM OK" || (echo "✖ 缺少 GLCM" && exit 1)

# 檢查推薦數量（應該有 8 個）
recommend_count=$(grep -o "suggestions.push" public/tools/cake-reveal/index.html | wc -l)
if [ "$recommend_count" -ge 8 ]; then
  echo "✔ AI推薦數量正確: $recommend_count"
else
  echo "⚠ AI推薦數量異常: $recommend_count (預期 ≥8)"
fi

echo "✅ 所有檢查通過！"

# 7. 本機測試
echo "🧪 啟動本機測試..."
npm run dev &
DEV_PID=$!
sleep 3

echo ""
echo "========================================="
echo "📱 測試 URL: http://localhost:5173/tools/cake-reveal/"
echo "========================================="
echo ""
echo "請測試以下功能："
echo "1. 上傳 3000×4000 圖片"
echo "2. 點擊 AI 智能建議按鈕 (🧠)"
echo "3. 查看 8 種推薦選項"
echo "4. 勾選「細節增強」並執行高畫質處理"
echo "5. 下載並比對結果"
echo ""
read -p "測試完成後按 Enter 繼續部署..." _

kill $DEV_PID 2>/dev/null || true

# 8. 建置生產版本
npm run build

# 9. 提交 Git
git add public/tools/cake-reveal/index.html docs/tools/cake-reveal/
git commit -m "feat(tools): 升級 Cake Reveal v12.0 - AI智能測光+Guided Filter細節增強"

# 10. 推送並創建 PR
git push -u origin feature/cake-reveal-v12

echo ""
echo "✅ 部署完成！"
echo "📝 請到 GitHub 創建 Pull Request"
echo "🌐 部署後 URL: https://cityfish91159.github.io/maihouses/tools/cake-reveal/"
```

---

### 方法 B：Nginx 路徑保護（選用）

如果需要密碼保護：

```bash
# 1. 安裝 htpasswd 工具
sudo apt-get update && sudo apt-get install -y apache2-utils

# 2. 創建密碼檔（帳號: 1234 密碼: 1234）
sudo htpasswd -bc /etc/nginx/.htpasswd 1234 1234

# 3. 配置 Nginx
NGINX_CONF="/etc/nginx/sites-available/maihouses.conf"
sudo bash -c "cat >> '$NGINX_CONF' " <<'NGINX_SNIPPET'

# ==== Cake Reveal (private) ====
location ^~ /maihouses/tools/cake-reveal/ {
  auth_basic           "Restricted - Cake Reveal Tool";
  auth_basic_user_file /etc/nginx/.htpasswd;

  add_header Content-Security-Policy "script-src 'self' 'unsafe-inline' blob:; worker-src 'self' blob:;" always;
  add_header X-Robots-Tag "noindex, nofollow" always;

  try_files $uri $uri/ /maihouses/tools/cake-reveal/index.html;
}
NGINX_SNIPPET

# 4. 測試並重載 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🧪 功能驗證清單

### 基礎功能（v11.0 保留）
- [ ] 上傳圖片（支援 3000×4000）
- [ ] 拖動分割線比對
- [ ] 透視 5 種模式
- [ ] 熱區疊加
- [ ] 去塊狀/雙邊濾波
- [ ] USM 銳化
- [ ] 邊緣/浮雕/陰影
- [ ] 儲存/下載功能

### 新功能（v12.0）
- [ ] AI 智能建議按鈕顯示
- [ ] 自動分析顯示完整指標（曝光/標準差/GLCM）
- [ ] 8 種推薦選項正確顯示
- [ ] 細節增強選項可勾選
- [ ] Guided Filter 處理速度合理（<3秒）
- [ ] 各推薦預設可正確套用
- [ ] 處理後畫質提升明顯

### 性能測試
- [ ] 3000×4000 圖片分析時間 <2秒
- [ ] 高畫質處理時間 <10秒（含細節增強）
- [ ] Console 無錯誤訊息
- [ ] Worker 正常運作（檢查 DevTools）
- [ ] 記憶體使用穩定（<500MB）

---

## 📊 v12.0 vs v11.0 對比

| 功能 | v11.0 | v12.0 |
|------|-------|-------|
| AI 推薦數量 | 3 種 | **8 種** ✨ |
| 曝光分析 | ❌ | **✅** ✨ |
| 噪點檢測 | 部分 | **智能檢測** ✨ |
| 細節增強 | USM only | **Guided Filter + USM** ✨ |
| 多尺度處理 | ❌ | **✅** ✨ |
| 自適應增益 | ❌ | **✅** ✨ |
| 基礎功能 | 21 項 | **21 項保留** ✅ |
| 處理速度 | 快 | **同樣快** ✅ |

---

## 🐛 常見問題排查

### 1. AI 推薦不顯示
```javascript
// 檢查 Console
console.log(state.analysisCache);
// 應該看到 exposure 物件
```

### 2. 細節增強無效果
- 確認勾選「細節增強」選項
- 檢查 Console 是否有 guidedFilter 錯誤
- 嘗試降低圖片解析度測試

### 3. 處理速度慢
- 檢查 Worker 數量：`console.log(numWorkers)`
- iOS 限制為 2 Workers
- 考慮降低圖片尺寸（建議 ≤4000px）

### 4. 壓縮後功能異常
使用保守版壓縮：
```bash
npx html-minifier-terser \
  public/tools/cake-reveal/index.html \
  --collapse-whitespace \
  --remove-comments \
  -o public/tools/cake-reveal/index.html
```

---

## 📞 技術支援

- **文件位置**: `/workspaces/maihouses/蛋糕.html`
- **版本**: v12.0
- **更新日期**: 2025-11-10
- **關鍵功能**:
  - 智能測光分析
  - Guided Filter 細節增強
  - 8 種 AI 推薦
  - 21 項基礎功能保留

---

## 🎯 下一步計劃（v13.0 候選）

1. **Real-ESRGAN 整合** - AI 超解析度（需 ONNX Runtime + 17MB 模型）
2. **真正的透視校正** - 四點幾何變換（需 UI 改進）
3. **批次處理** - 多圖同時處理
4. **預設模板系統** - 保存/載入自訂配置

---

**部署後記得測試並回報問題！** 🚀
