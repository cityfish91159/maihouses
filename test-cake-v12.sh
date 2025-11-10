#!/bin/bash
# === Cake Reveal v12.0 功能測試腳本 ===
# 用途: 自動驗證所有關鍵功能是否存在

set -e

echo "🧪 Cake Reveal v12.0 功能完整性測試"
echo "========================================"

FILE="蛋糕.html"
PASS=0
FAIL=0

# 顏色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 測試函數
test_feature() {
  local pattern=$1
  local desc=$2
  
  if grep -q "$pattern" "$FILE"; then
    echo -e "${GREEN}✔${NC} $desc"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✖${NC} $desc"
    ((FAIL++))
    return 1
  fi
}

echo ""
echo "【v11.0 基礎功能檢查】"
test_feature "function stackBlur" "Stack Blur 模糊"
test_feature "function fastBilateral" "快速雙邊濾波"
test_feature "function clahe" "CLAHE 對比增強"
test_feature "function calcGLCM" "GLCM 紋理分析"
test_feature "ckDeblock" "去塊狀選項"
test_feature "ckBilateral" "雙邊濾波選項"
test_feature "ckXray" "透視選項"
test_feature "ckHeat" "熱區選項"
test_feature "xrayMode" "透視模式選擇"

echo ""
echo "【v12.0 新功能檢查】"
test_feature "function guidedFilter" "Guided Filter"
test_feature "function boxFilter" "Box Filter 輔助"
test_feature "function enhanceDetailMultiScale" "多尺度細節增強"
test_feature "ckGuidedDetail" "細節增強選項"
test_feature "曝光不足修復" "曝光不足推薦"
test_feature "過曝修復" "過曝修復推薦"
test_feature "極高紋理" "極高紋理推薦"
test_feature "強力降噪" "降噪推薦"
test_feature "完美曝光增強" "完美曝光推薦"
test_feature "低對比增強" "低對比推薦"
test_feature "極限解析" "極限解析推薦"

echo ""
echo "【曝光分析功能檢查】"
test_feature "exposure.mean" "平均亮度"
test_feature "exposure.median" "中位數"
test_feature "exposure.stdDev" "標準差"
test_feature "exposure.clipLow" "暗部裁切"
test_feature "exposure.clipHigh" "亮部裁切"
test_feature "isUnderexposed" "曝光不足判斷"
test_feature "isOverexposed" "過曝判斷"
test_feature "isDynamic" "動態範圍判斷"

echo ""
echo "【代碼質量檢查】"
test_feature "v12.0" "版本號正確"
test_feature "AI增強版" "標題正確"
test_feature "智能測光" "功能描述"
test_feature "Guided Filter" "功能描述"

# 推薦數量檢查
echo ""
echo "【AI 推薦數量檢查】"
recommend_count=$(grep -o "suggestions.push" "$FILE" | wc -l | tr -d ' ')
if [ "$recommend_count" -ge 8 ]; then
  echo -e "${GREEN}✔${NC} AI推薦數量: $recommend_count (預期 ≥8)"
  ((PASS++))
else
  echo -e "${RED}✖${NC} AI推薦數量: $recommend_count (預期 ≥8)"
  ((FAIL++))
fi

# 總代碼行數
line_count=$(wc -l < "$FILE" | tr -d ' ')
echo ""
echo "【代碼統計】"
if [ "$line_count" -gt 1600 ]; then
  echo -e "${GREEN}✔${NC} 總行數: $line_count (預期 >1600)"
  ((PASS++))
else
  echo -e "${YELLOW}⚠${NC} 總行數: $line_count (預期 >1600)"
fi

# 檢查重複定義
echo ""
echo "【代碼衝突檢查】"
dup_stackblur=$(grep -o "function stackBlur" "$FILE" | wc -l | tr -d ' ')
dup_clahe=$(grep -o "function clahe" "$FILE" | wc -l | tr -d ' ')

if [ "$dup_stackblur" -eq 1 ]; then
  echo -e "${GREEN}✔${NC} 無重複 stackBlur 定義"
  ((PASS++))
else
  echo -e "${RED}✖${NC} 發現 $dup_stackblur 個 stackBlur 定義"
  ((FAIL++))
fi

if [ "$dup_clahe" -eq 1 ]; then
  echo -e "${GREEN}✔${NC} 無重複 clahe 定義"
  ((PASS++))
else
  echo -e "${RED}✖${NC} 發現 $dup_clahe 個 clahe 定義"
  ((FAIL++))
fi

# 結果總結
echo ""
echo "========================================"
echo "測試結果:"
echo -e "${GREEN}通過: $PASS${NC}"
echo -e "${RED}失敗: $FAIL${NC}"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ 所有測試通過！可以開始部署。${NC}"
  exit 0
else
  echo -e "${RED}❌ 發現 $FAIL 個問題，請修復後再部署。${NC}"
  exit 1
fi
