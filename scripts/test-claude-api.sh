#!/bin/bash

# 測試 Claude API 是否正常運作

echo "🧪 測試 Claude API..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 檢查環境變數
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ 錯誤：未設定 ANTHROPIC_API_KEY"
  echo ""
  echo "請在 Vercel Dashboard 設定："
  echo "https://vercel.com/<your-team>/maihouses/settings/environment-variables"
  exit 1
fi

echo "✅ 環境變數已設定"

# 測試 API 端點
API_URL="${1:-http://localhost:3000/api/claude}"

echo ""
echo "📡 測試端點：$API_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "請用繁體中文說：你好"}
    ]
  }')

# 分離 body 和 status code
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ API 正常運作"
  echo ""
  echo "回應："
  echo "$HTTP_BODY" | jq -r '.choices[0].message.content' 2>/dev/null || echo "$HTTP_BODY"
  echo ""
  echo "用量："
  echo "$HTTP_BODY" | jq '.usage' 2>/dev/null
else
  echo "❌ API 錯誤 (HTTP $HTTP_CODE)"
  echo ""
  echo "$HTTP_BODY" | jq . 2>/dev/null || echo "$HTTP_BODY"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 所有測試通過！"
