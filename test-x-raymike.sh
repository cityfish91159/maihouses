#!/bin/bash
# X-Ray Mike API 測試腳本

echo "🧪 測試 X-Ray Mike API"
echo "======================="

# 配置
API_URL="${API_URL:-https://maihouses.vercel.app/api/x-raymike}"
TEST_IMAGE="${TEST_IMAGE:-https://replicate.delivery/pbxt/Jv0iM5p0HZJZZvqG7SgZqMQhBYCdvnkm2TQkI7qHB3ycDGRA/out-0.webp}"

echo ""
echo "📍 API URL: $API_URL"
echo "🖼️  測試圖片: $TEST_IMAGE"
echo ""

# 測試 1: 正常請求
echo "📝 測試 1: 正常圖片處理"
echo "------------------------"
response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$TEST_IMAGE\"}" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"
echo "Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ 測試 1 通過"
  output_url=$(echo "$body" | jq -r '.output' 2>/dev/null)
  if [ "$output_url" != "null" ] && [ -n "$output_url" ]; then
    echo "🎨 輸出圖片: $output_url"
  fi
else
  echo "❌ 測試 1 失敗"
fi

echo ""
echo "========================"

# 測試 2: 缺少圖片參數
echo "📝 測試 2: 缺少必要參數"
echo "------------------------"
response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{}" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"
echo "Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "400" ]; then
  echo "✅ 測試 2 通過（正確返回錯誤）"
else
  echo "❌ 測試 2 失敗（應該返回 400）"
fi

echo ""
echo "========================"

# 測試 3: OPTIONS 請求（CORS）
echo "📝 測試 3: CORS 預檢請求"
echo "------------------------"
response=$(curl -s -X OPTIONS "$API_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Origin: https://maihouses.vercel.app" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)

echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
  echo "✅ 測試 3 通過（CORS 支援）"
else
  echo "❌ 測試 3 失敗"
fi

echo ""
echo "========================"
echo "🏁 測試完成！"
echo ""

# 生成測試報告
echo "📊 測試摘要"
echo "------------------------"
echo "API Endpoint: $API_URL"
echo "測試時間: $(date)"
echo ""
echo "建議："
echo "1. 確保 REPLICATE_API_TOKEN 已在 Vercel 設置"
echo "2. 檢查模型 cityfish91159/x-raymike 是否可用"
echo "3. 查看 Vercel 函數日誌獲取詳細信息"
