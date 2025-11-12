#!/bin/bash
################################################################################
# AI 顏色回填模組 - 完整 API 測試腳本
# 測試所有 API 端點連接狀態
################################################################################

set -e

# 顏色輸出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🧪 AI 顏色回填模組 - API 測試腳本${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}測試伺服器: ${BASE_URL}${NC}"
echo ""

# 檢查 jq 是否安裝
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ 請先安裝 jq: brew install jq${NC}"
    exit 1
fi

# 測試計數器
PASSED=0
FAILED=0

################################################################################
# 測試函數
################################################################################

test_api() {
    local name=$1
    local endpoint=$2
    local method=$3
    local data=$4
    
    echo -e "${YELLOW}📝 測試: ${name}${NC}"
    echo -e "   端點: ${endpoint}"
    
    local response
    local status
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}" 2>&1)
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo -e "   ${GREEN}✅ 成功 (HTTP $status)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        PASSED=$((PASSED + 1))
    else
        echo -e "   ${RED}❌ 失敗 (HTTP $status)${NC}"
        echo "$body"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
}

################################################################################
# 1. 測試 OpenAI Proxy
################################################################################

echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}1️⃣  測試 OpenAI Vision API${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo ""

test_api \
    "OpenAI GPT-4 Vision 分析" \
    "/api/openai-proxy" \
    "POST" \
    '{
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Say hello in JSON format: {message: \"...\"}"
                    }
                ]
            }
        ],
        "max_tokens": 50,
        "temperature": 0.3
    }'

################################################################################
# 2. 測試 Replicate Detection
################################################################################

echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}2️⃣  測試 Replicate 物體檢測${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo ""

test_api \
    "Replicate GroundingDINO 檢測" \
    "/api/replicate-detect" \
    "POST" \
    '{
        "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
        "labels": ["cake", "object"],
        "mode": "general"
    }'

################################################################################
# 3. 測試 Replicate Generate
################################################################################

echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}3️⃣  測試 Replicate 圖像生成${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo ""

test_api \
    "Replicate Flux 增強" \
    "/api/replicate-generate" \
    "POST" \
    '{
        "prompt": "a beautiful sunset over mountains, high quality"
    }'

################################################################################
# 4. 測試 imgix Upload
################################################################################

echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}4️⃣  測試 imgix 圖片上傳${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo ""

test_api \
    "imgix 上傳 (1x1 測試圖)" \
    "/api/upload-imgix" \
    "POST" \
    "{
        \"imageData\": \"${TEST_IMAGE}\"
    }"

################################################################################
# 5. 健康檢查
################################################################################

echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}5️⃣  系統健康檢查${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo ""

# 檢查前端頁面是否可訪問
echo -e "${YELLOW}📝 測試: 前端頁面可訪問性${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/tools/cake-reveal/ai-color-recolor-m.html")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ 前端頁面可訪問 (HTTP $FRONTEND_STATUS)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "   ${RED}❌ 前端頁面無法訪問 (HTTP $FRONTEND_STATUS)${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

################################################################################
# 測試結果摘要
################################################################################

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   📊 測試結果摘要${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "   ${GREEN}✅ 通過: ${PASSED}${NC}"
echo -e "   ${RED}❌ 失敗: ${FAILED}${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有測試通過! (100%)${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 50 ]; then
    echo -e "${YELLOW}⚠️  部分測試失敗 (${SUCCESS_RATE}% 通過)${NC}"
    echo ""
    echo -e "${YELLOW}建議檢查:${NC}"
    echo "   1. 環境變數是否正確設定 (.env.local 或 Vercel)"
    echo "   2. API 金鑰是否有效且有額度"
    echo "   3. Replicate 部署是否已建立"
    echo "   4. imgix 和 S3 是否正確連接"
    exit 1
else
    echo -e "${RED}❌ 大部分測試失敗 (${SUCCESS_RATE}% 通過)${NC}"
    echo ""
    echo -e "${RED}請檢查:${NC}"
    echo "   1. 伺服器是否正在運行: npm run dev"
    echo "   2. BASE_URL 是否正確: ${BASE_URL}"
    echo "   3. 查看完整設定指南: AI_COLOR_RECOLOR_API_GUIDE.txt"
    exit 1
fi
