#!/bin/bash
# Replicate Deployments 自動創建腳本
# 用途：自動創建 AI 生圖和偵測的 Deployments

set -e

echo "🚀 Replicate Deployments 自動配置"
echo "=================================="
echo ""

# 檢查 API Token
TOKEN="${REPLICATE_API_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "❌ 錯誤：請先設置 REPLICATE_API_TOKEN 環境變量"
  echo ""
  echo "使用方法："
  echo "  export REPLICATE_API_TOKEN=r8_your_token_here"
  echo "  bash setup-deployments.sh"
  exit 1
fi

echo "✅ 找到 API Token"
echo ""

# 獲取用戶名
echo "📝 獲取用戶信息..."
USER_INFO=$(curl -s https://api.replicate.com/v1/account \
  -H "Authorization: Bearer $TOKEN")

USERNAME=$(echo "$USER_INFO" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USERNAME" ]; then
  echo "❌ 無法獲取用戶名，請檢查 Token 是否有效"
  exit 1
fi

echo "✅ 用戶名: $USERNAME"
echo ""

# ==================== Deployment 1: AI 生圖 (Flux.1 Pro) ====================
echo "🎨 創建 Deployment 1: AI 生圖 (Flux.1 Pro)"
echo "----------------------------------------"

DEPLOY_1_NAME="maihouses-flux-pro"
DEPLOY_1_MODEL="black-forest-labs/flux-1.1-pro"

echo "名稱: $DEPLOY_1_NAME"
echo "模型: $DEPLOY_1_MODEL"
echo ""

# 檢查是否已存在
EXISTING_1=$(curl -s "https://api.replicate.com/v1/deployments/$USERNAME/$DEPLOY_1_NAME" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "")

if echo "$EXISTING_1" | grep -q "\"name\":\"$DEPLOY_1_NAME\""; then
  echo "⚠️  Deployment '$DEPLOY_1_NAME' 已存在，跳過創建"
  DEPLOY_1_PATH="$USERNAME/$DEPLOY_1_NAME"
else
  echo "正在創建..."

  CREATE_1_RESPONSE=$(curl -s -X POST https://api.replicate.com/v1/deployments \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$DEPLOY_1_NAME\",
      \"model\": \"$DEPLOY_1_MODEL\",
      \"version\": null,
      \"hardware\": \"gpu-a100-large\",
      \"min_instances\": 0,
      \"max_instances\": 1
    }")

  if echo "$CREATE_1_RESPONSE" | grep -q "\"name\":\"$DEPLOY_1_NAME\""; then
    echo "✅ Deployment 1 創建成功！"
    DEPLOY_1_PATH="$USERNAME/$DEPLOY_1_NAME"
  else
    echo "❌ 創建失敗："
    echo "$CREATE_1_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_1_RESPONSE"
    exit 1
  fi
fi

echo ""

# ==================== Deployment 2: AI 偵測 (YOLO World) ====================
echo "🔍 創建 Deployment 2: AI 偵測 (YOLO World)"
echo "----------------------------------------"

DEPLOY_2_NAME="maihouses-yolo"
DEPLOY_2_MODEL="cjwbw/yolo-world"

echo "名稱: $DEPLOY_2_NAME"
echo "模型: $DEPLOY_2_MODEL"
echo ""

# 檢查是否已存在
EXISTING_2=$(curl -s "https://api.replicate.com/v1/deployments/$USERNAME/$DEPLOY_2_NAME" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "")

if echo "$EXISTING_2" | grep -q "\"name\":\"$DEPLOY_2_NAME\""; then
  echo "⚠️  Deployment '$DEPLOY_2_NAME' 已存在，跳過創建"
  DEPLOY_2_PATH="$USERNAME/$DEPLOY_2_NAME"
else
  echo "正在創建..."

  CREATE_2_RESPONSE=$(curl -s -X POST https://api.replicate.com/v1/deployments \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$DEPLOY_2_NAME\",
      \"model\": \"$DEPLOY_2_MODEL\",
      \"version\": null,
      \"hardware\": \"gpu-t4\",
      \"min_instances\": 0,
      \"max_instances\": 1
    }")

  if echo "$CREATE_2_RESPONSE" | grep -q "\"name\":\"$DEPLOY_2_NAME\""; then
    echo "✅ Deployment 2 創建成功！"
    DEPLOY_2_PATH="$USERNAME/$DEPLOY_2_NAME"
  else
    echo "❌ 創建失敗："
    echo "$CREATE_2_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_2_RESPONSE"
    exit 1
  fi
fi

echo ""
echo "=================================="
echo "🎉 Deployments 配置完成！"
echo "=================================="
echo ""

# 輸出配置信息
echo "📋 請將以下環境變量添加到 Vercel："
echo ""
echo "REPLICATE_DEPLOYMENT=$DEPLOY_1_PATH"
echo "REPLICATE_DEPLOYMENT_DETECT=$DEPLOY_2_PATH"
echo ""

# 生成 .env 文件
ENV_FILE=".env.deployments"
cat > "$ENV_FILE" <<EOF
# Replicate Deployments 配置
# 生成時間: $(date)

REPLICATE_API_TOKEN=$TOKEN
REPLICATE_DEPLOYMENT=$DEPLOY_1_PATH
REPLICATE_DEPLOYMENT_DETECT=$DEPLOY_2_PATH
REPLICATE_XRAY_MODEL=cityfish91159/x-raymike
EOF

echo "✅ 配置已保存到: $ENV_FILE"
echo ""

# 輸出測試命令
echo "🧪 測試命令："
echo ""
echo "# 測試 AI 生圖"
echo "curl -X POST https://maihouses.vercel.app/api/replicate-generate \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"prompt\": \"a delicious chocolate cake with strawberries\"}'"
echo ""
echo "# 測試 AI 偵測"
echo "curl -X POST https://maihouses.vercel.app/api/replicate-detect \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"image\": \"https://example.com/cake.jpg\", \"labels\": [\"cake\", \"frosting\"], \"mode\": \"cake\"}'"
echo ""

# 查看 Deployments
echo "🔗 查看你的 Deployments："
echo "   https://replicate.com/deployments"
echo ""

echo "✨ 完成！現在可以在 Vercel 配置環境變量了。"
