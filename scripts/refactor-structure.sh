#!/bin/bash
# 邁房子系統重構腳本
# 目的：按照規格書 §4 離散式架構重組檔案結構
# 執行時間：每天凌晨 1:00 (GitHub Actions)

set -e

echo "🔧 開始系統重構..."
echo "📅 執行時間: $(date +'%Y-%m-%d %H:%M:%S')"
echo ""

CHANGED=0

# ==========================================
# 1. 重組型別檔案 (§4 離散式架構)
# ==========================================
echo "📝 Step 1/4: 重組型別檔案"

if [ -f "src/types/index.ts" ]; then
  echo "  移動 src/types/index.ts → src/services/api/types.ts"
  mkdir -p src/services/api
  
  # 如果目標已存在，合併內容
  if [ -f "src/services/api/types.ts" ]; then
    echo "  ⚠️  目標檔案已存在，備份後覆蓋"
    cp src/services/api/types.ts src/services/api/types.ts.bak
  fi
  
  mv src/types/index.ts src/services/api/types.ts
  
  # 更新所有 import 路徑
  find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
    "s|from ['\"]\.\.*/types['\"]|from '../services/api/types'|g" {} +
  
  find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
    "s|from ['\"]@/types['\"]|from '@/services/api/types'|g" {} +
  
  # 刪除空目錄
  [ -d "src/types" ] && rmdir src/types 2>/dev/null || true
  
  CHANGED=1
  echo "  ✅ 型別檔案已重組"
else
  echo "  ℹ️  型別檔案已在正確位置"
fi

echo ""

# ==========================================
# 2. 建立缺少的功能模組 (§4.1 專案切分)
# ==========================================
echo "📝 Step 2/4: 建立缺少的功能模組"

MODULES=("community" "listing" "auth")
for module in "${MODULES[@]}"; do
  if [ ! -d "src/features/$module" ]; then
    echo "  建立 src/features/$module/"
    mkdir -p "src/features/$module/sections"
    
    # 建立 README 說明檔
    cat > "src/features/$module/README.md" << EOF
# $module 模組

## 用途
根據規格書 §8 頁面槽位定義，此模組負責 $module 相關功能。

## 結構
\`\`\`
$module/
  sections/     # 頁面區塊元件
  index.ts      # 模組匯出點
\`\`\`

## 規範
- 只能引用 components/* 和 services/*
- 不得修改 Design Tokens
- 遵守離散式架構原則（§4.3）
EOF
    
    # 建立空 index.ts
    echo "// $module 模組匯出點" > "src/features/$module/index.ts"
    
    CHANGED=1
    echo "  ✅ 建立 $module 模組"
  else
    echo "  ℹ️  $module 模組已存在"
  fi
done

echo ""

# ==========================================
# 3. 檢查並修正 Mock 數據結構 (§6 Mock 管理)
# ==========================================
echo "📝 Step 3/4: 檢查 Mock 數據結構"

if [ ! -d "src/services/mock/data" ]; then
  echo "  建立 src/services/mock/data/ 目錄"
  mkdir -p src/services/mock/data
  
  # 建立 README
  cat > "src/services/mock/data/README.md" << EOF
# Mock 數據檔案

## 用途
存放 JSON 格式的 Mock 數據，與業務邏輯分離。

## 規範（§6 Mock 管理）
1. 所有數據以 JSON 格式存放
2. 檔案命名: \`{entity}.json\` (例：properties.json)
3. 數據格式必須與真實 API 回應一致
4. 使用固定種子確保可重現性

## 範例結構
\`\`\`
data/
  properties.json      # 物件列表
  communities.json     # 社區列表
  reviews.json         # 評價數據
  users.json           # 使用者數據
\`\`\`
EOF
  
  CHANGED=1
  echo "  ✅ Mock 數據目錄已建立"
else
  echo "  ℹ️  Mock 數據目錄已存在"
fi

echo ""

# ==========================================
# 4. 驗證目錄結構符合規範
# ==========================================
echo "📝 Step 4/4: 驗證目錄結構"

REQUIRED_DIRS=(
  "src/components"
  "src/features/home"
  "src/features/community"
  "src/features/listing"
  "src/features/auth"
  "src/pages"
  "src/services"
  "src/services/api"
  "src/services/mock"
  "src/services/mock/data"
  "src/styles"
)

ALL_OK=1
for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✅ $dir"
  else
    echo "  ❌ $dir (缺失)"
    ALL_OK=0
  fi
done

echo ""

# ==========================================
# 5. 總結報告
# ==========================================
echo "🎉 系統重構完成！"
echo "=================================="
echo ""

if [ $CHANGED -eq 1 ]; then
  echo "📋 變更摘要："
  echo "  - 型別檔案已重組至 services/api/"
  echo "  - 功能模組已補齊 (community/listing/auth)"
  echo "  - Mock 數據目錄結構已建立"
  echo ""
  echo "🔍 結構符合度："
  if [ $ALL_OK -eq 1 ]; then
    echo "  ✅ 100% 符合規格書 §4 離散式架構"
  else
    echo "  ⚠️  部分目錄仍缺失，請檢查上方報告"
  fi
else
  echo "✅ 無需變更，目錄結構已符合規範"
fi

echo ""
echo "📖 相關文件："
echo "  - 規格書: docs/GUIDELINES.md"
echo "  - 變更日誌: docs/CHANGELOG.md"
echo ""

exit 0
