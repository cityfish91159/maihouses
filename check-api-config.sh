#!/bin/bash

echo "🔍 檢查 API 配置狀態..."
echo "================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查函數
check_env() {
    local var_name=$1
    local required=$2
    
    if [ -z "${!var_name}" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name${NC} - 缺失（必須）"
            return 1
        else
            echo -e "${YELLOW}⚠️  $var_name${NC} - 缺失（可選）"
            return 2
        fi
    else
        # 隱藏實際值
        local masked_value="${!var_name:0:8}..."
        echo -e "${GREEN}✅ $var_name${NC} - 已設定 ($masked_value)"
        return 0
    fi
}

echo "📦 1. Replicate API"
echo "-----------------------------------"
check_env "REPLICATE_API_TOKEN" "true"
check_env "REPLICATE_DEPLOYMENT" "false"
check_env "REPLICATE_DEPLOYMENT_DETECT" "false"
echo ""

echo "🤖 2. OpenAI API"
echo "-----------------------------------"
check_env "OPENAI_API_KEY" "true"
check_env "OPENAI_MODEL" "false"
echo ""

echo "🖼️  3. Imgix + AWS S3 (可選)"
echo "-----------------------------------"
check_env "IMGIX_DOMAIN" "false"
check_env "AWS_S3_BUCKET" "false"
check_env "AWS_S3_REGION" "false"
check_env "AWS_ACCESS_KEY_ID" "false"
check_env "AWS_SECRET_ACCESS_KEY" "false"
echo ""

echo "================================"
echo ""

# 統計
required_missing=0
optional_missing=0

if [ -z "$REPLICATE_API_TOKEN" ]; then ((required_missing++)); fi
if [ -z "$OPENAI_API_KEY" ]; then ((required_missing++)); fi

if [ -z "$REPLICATE_DEPLOYMENT" ]; then ((optional_missing++)); fi
if [ -z "$IMGIX_DOMAIN" ]; then ((optional_missing++)); fi

echo "📊 總結："
echo "-----------------------------------"
if [ $required_missing -eq 0 ]; then
    echo -e "${GREEN}✅ 所有必須的 API 已配置${NC}"
else
    echo -e "${RED}❌ 缺少 $required_missing 個必須的 API 配置${NC}"
fi

if [ $optional_missing -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $optional_missing 個可選 API 未配置（功能會降級）${NC}"
fi
echo ""

# 給出建議
if [ $required_missing -gt 0 ]; then
    echo "下一步："
    echo "-----------------------------------"
    if [ -z "$REPLICATE_API_TOKEN" ]; then
        echo "1. 申請 Replicate API Token:"
        echo "   https://replicate.com/account/api-tokens"
        echo ""
    fi
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "2. 申請 OpenAI API Key:"
        echo "   https://platform.openai.com/api-keys"
        echo ""
    fi
    echo "3. 設定環境變數（擇一）："
    echo "   - 本地: 創建 .env 檔案"
    echo "   - Vercel: Settings → Environment Variables"
    echo ""
    echo "4. 查看完整指南: cat API_CONFIG_GUIDE.md"
    echo ""
else
    echo "🎉 恭喜！所有必要配置已完成！"
    echo ""
    echo "📝 下一步（可選）："
    echo "-----------------------------------"
    echo "• 配置 Imgix + S3 以提升圖片處理效能"
    echo "• 運行測試: ./test-all-apis.sh"
    echo "• 查看詳細文檔: cat API_CONFIG_GUIDE.md"
fi

echo ""
