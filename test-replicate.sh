#!/bin/bash
# 測試 Replicate API 整合

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 測試 1: 健檢 API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "執行: curl https://maihouses.vercel.app/api/health-replicate"
echo ""

HEALTH=$(curl -s https://maihouses.vercel.app/api/health-replicate)
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"

HAS_TOKEN=$(echo "$HEALTH" | jq -r '.hasToken' 2>/dev/null)
HAS_DEPLOYMENT=$(echo "$HEALTH" | jq -r '.hasDeployment' 2>/dev/null)

echo ""
if [ "$HAS_TOKEN" = "true" ] && [ "$HAS_DEPLOYMENT" = "true" ]; then
  echo "✅ 健檢通過！環境變數設定正確"
else
  echo "❌ 健檢失敗！"
  [ "$HAS_TOKEN" != "true" ] && echo "   - REPLICATE_API_TOKEN 未設定或錯誤"
  [ "$HAS_DEPLOYMENT" != "true" ] && echo "   - REPLICATE_DEPLOYMENT 未設定或錯誤"
  echo ""
  echo "請完成上述步驟 ②，在 Vercel 加入環境變數後重新部署"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 測試 2: 圖片生成 API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "執行: curl -X POST https://maihouses.vercel.app/api/replicate-generate"
echo "提示詞: a modern cozy living room with sunlight"
echo ""
echo "⏳ 生成中，請稍候（約 5-15 秒）..."
echo ""

GENERATE=$(curl -X POST https://maihouses.vercel.app/api/replicate-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a modern cozy living room with sunlight, wide angle, interior design magazine"}' \
  -s)

echo "$GENERATE" | jq . 2>/dev/null || echo "$GENERATE"

SUCCESS=$(echo "$GENERATE" | jq -r '.ok' 2>/dev/null)
OUTPUT=$(echo "$GENERATE" | jq -r '.output[0]' 2>/dev/null)

echo ""
if [ "$SUCCESS" = "true" ] && [ "$OUTPUT" != "null" ] && [ -n "$OUTPUT" ]; then
  echo "✅ 生成成功！"
  echo ""
  echo "圖片 URL:"
  echo "$OUTPUT"
  echo ""
  echo "🎉 Replicate API 整合完成！可以開始使用了"
else
  echo "❌ 生成失敗！"
  ERROR=$(echo "$GENERATE" | jq -r '.error' 2>/dev/null)
  [ -n "$ERROR" ] && [ "$ERROR" != "null" ] && echo "錯誤: $ERROR"
  echo ""
  echo "常見問題:"
  echo "  - Deployment 尚未建立 → 完成步驟 ①"
  echo "  - Deployment 名稱錯誤 → 確認是 cityfish91159/maihouses-flux"
  echo "  - 模型排隊中 → 稍等片刻再試"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
