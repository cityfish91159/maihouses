#!/bin/bash
# 測試 B (偵測) + C (可視化) API

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 B + C API 測試 - 蛋糕/窗簾物件偵測與視覺化"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="https://maihouses.vercel.app"
# BASE_URL="http://localhost:3000"  # 本機測試用

# 測試圖片（使用公開可訪問的圖片 URL）
CAKE_IMAGE="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"
CURTAIN_IMAGE="https://images.unsplash.com/photo-1631889142431-95a8f6c74799?w=800"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 測試 1: B-API 健檢"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HEALTH=$(curl -s $BASE_URL/api/health-replicate)
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"

HAS_DETECT=$(echo "$HEALTH" | jq -r '.hasDeployment' 2>/dev/null)

echo ""
if [ "$HAS_DETECT" = "true" ]; then
  echo "✅ 偵測 deployment 已設定"
else
  echo "❌ REPLICATE_DEPLOYMENT_DETECT 未設定"
  echo "請在 Vercel 加入環境變數: REPLICATE_DEPLOYMENT_DETECT=cityfish91159/maihouses-detect"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎂 測試 2: B-API 偵測蛋糕（cake mode）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "圖片: $CAKE_IMAGE"
echo "模式: cake"
echo "⏳ 偵測中，請稍候（約 10-30 秒）..."
echo ""

DETECT_CAKE=$(curl -X POST $BASE_URL/api/replicate-detect \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$CAKE_IMAGE\",\"mode\":\"cake\"}" \
  -s)

echo "$DETECT_CAKE" | jq . 2>/dev/null || echo "$DETECT_CAKE"

CAKE_OK=$(echo "$DETECT_CAKE" | jq -r '.ok' 2>/dev/null)
CAKE_ID=$(echo "$DETECT_CAKE" | jq -r '.id' 2>/dev/null)

echo ""
if [ "$CAKE_OK" = "true" ]; then
  echo "✅ 蛋糕偵測成功！Prediction ID: $CAKE_ID"
else
  echo "❌ 蛋糕偵測失敗"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🪟 測試 3: B-API 偵測窗簾（curtain mode）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "圖片: $CURTAIN_IMAGE"
echo "模式: curtain"
echo "⏳ 偵測中，請稍候（約 10-30 秒）..."
echo ""

DETECT_CURTAIN=$(curl -X POST $BASE_URL/api/replicate-detect \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$CURTAIN_IMAGE\",\"mode\":\"curtain\"}" \
  -s)

echo "$DETECT_CURTAIN" | jq . 2>/dev/null || echo "$DETECT_CURTAIN"

CURTAIN_OK=$(echo "$DETECT_CURTAIN" | jq -r '.ok' 2>/dev/null)

echo ""
if [ "$CURTAIN_OK" = "true" ]; then
  echo "✅ 窗簾偵測成功！"
else
  echo "❌ 窗簾偵測失敗"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 測試 4: C-API 可視化（cake mode）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 使用模擬 boxes 測試可視化
curl -X POST $BASE_URL/api/visualize-detections \
  -H "Content-Type: application/json" \
  -d "{
    \"image\":\"$CAKE_IMAGE\",
    \"mode\":\"cake\",
    \"boxes\":[
      {\"x\":0.2,\"y\":0.3,\"w\":0.4,\"h\":0.3,\"label\":\"cake layer\",\"score\":0.92},
      {\"x\":0.3,\"y\":0.2,\"w\":0.3,\"h\":0.15,\"label\":\"frosting\",\"score\":0.88}
    ]
  }" \
  --output detection-cake.svg \
  -s

if [ -f "detection-cake.svg" ]; then
  SIZE=$(wc -c < detection-cake.svg)
  echo "✅ 蛋糕可視化成功！檔案: detection-cake.svg ($SIZE bytes)"
  echo "   用瀏覽器開啟 detection-cake.svg 查看結果"
else
  echo "❌ 蛋糕可視化失敗"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 測試 5: C-API 可視化（curtain mode）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -X POST $BASE_URL/api/visualize-detections \
  -H "Content-Type: application/json" \
  -d "{
    \"image\":\"$CURTAIN_IMAGE\",
    \"mode\":\"curtain\",
    \"boxes\":[
      {\"x\":0.1,\"y\":0.1,\"w\":0.3,\"h\":0.7,\"label\":\"fabric fold\",\"score\":0.94},
      {\"x\":0.5,\"y\":0.05,\"w\":0.4,\"h\":0.85,\"label\":\"curtain pleat\",\"score\":0.91}
    ]
  }" \
  --output detection-curtain.svg \
  -s

if [ -f "detection-curtain.svg" ]; then
  SIZE=$(wc -c < detection-curtain.svg)
  echo "✅ 窗簾可視化成功！檔案: detection-curtain.svg ($SIZE bytes)"
  echo "   用瀏覽器開啟 detection-curtain.svg 查看結果"
else
  echo "❌ 窗簾可視化失敗"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 所有測試通過！B + C API 整合完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "已生成檔案:"
echo "  - detection-cake.svg (粉紅蛋糕模式)"
echo "  - detection-curtain.svg (紫色窗簾模式)"
echo ""
echo "📝 下一步:"
echo "  1. 在 Replicate 建立 deployment: cityfish91159/maihouses-detect"
echo "  2. 在 Vercel 加入 REPLICATE_DEPLOYMENT_DETECT"
echo "  3. Redeploy 後執行本測試"
echo ""
