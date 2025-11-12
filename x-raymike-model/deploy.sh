#!/bin/bash
# X-Ray Mike 模型部署腳本

set -e

echo "🚀 X-Ray Mike 部署到 Replicate"
echo "==============================="
echo ""

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝"
    echo "請訪問: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker 未運行"
    echo "請啟動 Docker Desktop"
    exit 1
fi

echo "✅ Docker 運行中"
echo ""

# 檢查 Cog
if ! command -v cog &> /dev/null; then
    echo "❌ Cog 未安裝"
    echo ""
    echo "安裝 Cog:"
    echo "  sudo curl -o /usr/local/bin/cog -L https://github.com/replicate/cog/releases/latest/download/cog_\$(uname -s)_\$(uname -m)"
    echo "  sudo chmod +x /usr/local/bin/cog"
    exit 1
fi

echo "✅ Cog 已安裝 ($(cog --version))"
echo ""

# 檢查登入狀態
if ! cog whoami &> /dev/null; then
    echo "⚠️  未登入 Replicate"
    echo "請先登入: cog login"
    echo ""
    read -p "現在登入? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cog login
    else
        echo "請先運行: cog login"
        exit 1
    fi
fi

USERNAME=$(cog whoami 2>/dev/null | grep -o 'Logged in as: .*' | sed 's/Logged in as: //')
echo "✅ 已登入為: $USERNAME"
echo ""

# 設定模型名稱
MODEL_NAME="x-raymike"
FULL_NAME="$USERNAME/$MODEL_NAME"

echo "📦 模型名稱: $FULL_NAME"
echo ""

# 確認
read -p "繼續部署? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    exit 0
fi

# 步驟 1: 本地測試（如果有測試圖片）
if [ -f "test.jpg" ] || [ -f "test.png" ]; then
    echo "🧪 步驟 1: 本地測試"
    echo "-------------------"

    TEST_IMG=$(ls test.{jpg,png} 2>/dev/null | head -1)

    if [ -n "$TEST_IMG" ]; then
        echo "使用測試圖片: $TEST_IMG"
        echo ""

        echo "運行本地預測..."
        if cog predict -i image=@"$TEST_IMG" -i mode=clahe -i intensity=5.0; then
            echo "✅ 本地測試通過"
        else
            echo "❌ 本地測試失敗"
            echo "請檢查 predict.py 和 cog.yaml"
            exit 1
        fi
    fi

    echo ""
else
    echo "⏭️  跳過本地測試（沒有測試圖片）"
    echo ""
fi

# 步驟 2: 構建容器
echo "🔨 步驟 2: 構建容器"
echo "-------------------"
echo "這可能需要幾分鐘..."
echo ""

if cog build; then
    echo "✅ 容器構建成功"
else
    echo "❌ 構建失敗"
    exit 1
fi

echo ""

# 步驟 3: 推送到 Replicate
echo "📤 步驟 3: 推送到 Replicate"
echo "-------------------------"
echo "推送到: r8.im/$FULL_NAME"
echo ""

if cog push r8.im/$FULL_NAME; then
    echo ""
    echo "🎉 部署成功！"
    echo ""
    echo "📍 模型 URL:"
    echo "   https://replicate.com/$FULL_NAME"
    echo ""
    echo "🧪 測試模型:"
    echo "   訪問上面的 URL，或使用 API"
    echo ""
    echo "🔗 集成到網站:"
    echo "   在 Vercel 設置環境變量:"
    echo "   REPLICATE_XRAY_MODEL=$FULL_NAME"
    echo ""
else
    echo "❌ 推送失敗"
    echo ""
    echo "常見問題:"
    echo "1. 未登入: cog login"
    echo "2. 網絡問題: 檢查連接"
    echo "3. 權限問題: 確保有創建模型的權限"
    exit 1
fi
