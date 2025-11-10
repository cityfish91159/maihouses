#!/bin/bash
# === Cake Reveal v12.0 一鍵部署腳本 ===
# 作者: AI Assistant
# 日期: 2025-11-10
# 用途: 部署蛋糕.html 到 maihouses/public/tools/cake-reveal/

set -e  # 遇到錯誤立即退出

echo "🎂 Cake Reveal v12.0 部署腳本"
echo "========================================"

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 進入專案目錄
echo -e "${YELLOW}📂 Step 1: 進入專案目錄${NC}"
cd /workspaces/maihouses || exit 1
pwd

# 2. 創建分支
echo -e "\n${YELLOW}🌿 Step 2: 創建功能分支${NC}"
git checkout -b feature/cake-reveal-v12 || git checkout feature/cake-reveal-v12
echo -e "${GREEN}✔ 分支已切換${NC}"

# 3. 建立目錄結構
echo -e "\n${YELLOW}📁 Step 3: 建立目錄結構${NC}"
mkdir -p public/tools/cake-reveal
echo -e "${GREEN}✔ 目錄已創建${NC}"

# 4. 複製文件
echo -e "\n${YELLOW}📄 Step 4: 複製 蛋糕.html${NC}"
if [ ! -f "蛋糕.html" ]; then
  echo -e "${RED}✖ 找不到 蛋糕.html${NC}"
  exit 1
fi
cp 蛋糕.html public/tools/cake-reveal/index.html
echo -e "${GREEN}✔ 文件已複製${NC}"

# 5. 安裝壓縮工具
echo -e "\n${YELLOW}📦 Step 5: 安裝 HTML 壓縮工具${NC}"
if ! npm list html-minifier-terser > /dev/null 2>&1; then
  npm i -D html-minifier-terser --legacy-peer-deps
  echo -e "${GREEN}✔ 工具已安裝${NC}"
else
  echo -e "${GREEN}✔ 工具已存在${NC}"
fi

# 6. HTML 壓縮
echo -e "\n${YELLOW}🗜️  Step 6: 壓縮 HTML（保守版）${NC}"
npx html-minifier-terser \
  public/tools/cake-reveal/index.html \
  --collapse-whitespace \
  --remove-comments \
  --minify-css true \
  --minify-js true \
  -o public/tools/cake-reveal/index.html

echo -e "${GREEN}✔ 壓縮完成${NC}"

# 7. 程式完整性檢查
echo -e "\n${YELLOW}🔍 Step 7: 程式完整性檢查${NC}"

check_function() {
  local func=$1
  local desc=$2
  if grep -q "$func" public/tools/cake-reveal/index.html; then
    echo -e "${GREEN}  ✔ $desc${NC}"
    return 0
  else
    echo -e "${RED}  ✖ 缺少 $desc${NC}"
    return 1
  fi
}

errors=0

check_function "function clahe" "CLAHE 對比增強" || ((errors++))
check_function "function guidedFilter" "Guided Filter" || ((errors++))
check_function "function enhanceDetailMultiScale" "多尺度細節增強" || ((errors++))
check_function "function calcGLCM" "GLCM 紋理分析" || ((errors++))
check_function "曝光不足修復" "曝光修復推薦" || ((errors++))
check_function "過曝修復" "過曝修復推薦" || ((errors++))
check_function "極高紋理" "極高紋理推薦" || ((errors++))
check_function "強力降噪" "降噪推薦" || ((errors++))

recommend_count=$(grep -o "suggestions.push" public/tools/cake-reveal/index.html | wc -l | tr -d ' ')
if [ "$recommend_count" -ge 8 ]; then
  echo -e "${GREEN}  ✔ AI推薦數量: $recommend_count (預期 ≥8)${NC}"
else
  echo -e "${YELLOW}  ⚠ AI推薦數量: $recommend_count (預期 ≥8)${NC}"
fi

if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✅ 所有檢查通過！${NC}"
else
  echo -e "${RED}❌ 發現 $errors 個錯誤${NC}"
  exit 1
fi

# 8. 建置生產版本
echo -e "\n${YELLOW}🏗️  Step 8: 建置生產版本${NC}"
npm run build
echo -e "${GREEN}✔ 建置完成${NC}"

# 9. 檢查建置結果
echo -e "\n${YELLOW}🔍 Step 9: 檢查建置結果${NC}"
if [ -f "docs/tools/cake-reveal/index.html" ]; then
  file_size=$(du -h docs/tools/cake-reveal/index.html | cut -f1)
  echo -e "${GREEN}✔ 建置文件已產生: $file_size${NC}"
else
  echo -e "${RED}✖ 建置文件不存在${NC}"
  exit 1
fi

# 10. Git 提交
echo -e "\n${YELLOW}📝 Step 10: 提交到 Git${NC}"
git add public/tools/cake-reveal/ docs/tools/cake-reveal/ package.json package-lock.json 2>/dev/null || true
git commit -m "feat(tools): 升級 Cake Reveal v12.0

新功能:
- 智能測光分析 (曝光/噪點/動態範圍自動檢測)
- 8種AI推薦 (曝光修復/降噪/極限解析/完美增強等)
- Guided Filter 細節增強 (多尺度自適應細節提取)

優化:
- 21項功能全部保留
- 性能優化和記憶體管理
- 代碼質量提升

部署: /tools/cake-reveal/
" || echo -e "${YELLOW}⚠ 沒有新變更需要提交${NC}"

# 11. 推送
echo -e "\n${YELLOW}🚀 Step 11: 推送到遠端${NC}"
read -p "是否推送到 GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push -u origin feature/cake-reveal-v12
  echo -e "${GREEN}✔ 已推送${NC}"
  
  echo ""
  echo "========================================"
  echo -e "${GREEN}✅ 部署完成！${NC}"
  echo "========================================"
  echo ""
  echo "📝 下一步:"
  echo "1. 前往 GitHub 創建 Pull Request"
  echo "2. 合併後訪問: https://cityfish91159.github.io/maihouses/tools/cake-reveal/"
  echo ""
  echo "🧪 本地測試:"
  echo "   npm run dev"
  echo "   http://localhost:5173/tools/cake-reveal/"
  echo ""
else
  echo -e "${YELLOW}⏸️  跳過推送${NC}"
  echo ""
  echo "手動推送命令:"
  echo "  git push -u origin feature/cake-reveal-v12"
fi
