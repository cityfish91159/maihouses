#!/bin/bash
# 啟動 Aider (Gemini 3 Pro / 1.5 Pro)

# 確保在專案根目錄
cd "$(dirname "$0")"

# 檢查虛擬環境
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

echo "🚀 準備啟動 Aider (Gemini Mode)..."
echo ""

# 檢查是否有 GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
  # 嘗試從 .env 讀取
  if [ -f ".env" ]; then
    export GEMINI_API_KEY=$(grep "^GEMINI_API_KEY" .env | cut -d'=' -f2)
  fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  未找到 GEMINI_API_KEY 環境變數"
  echo ""
  echo "請前往 https://aistudio.google.com/app/apikey 申請 API Key"
  echo ""
  read -p "請輸入您的 Google Gemini API Key: " api_key
  if [ ! -z "$api_key" ]; then
    export GEMINI_API_KEY="$api_key"
    echo "✅ API Key 已設定"
  else
    echo "❌ 無法啟動，需要 API Key"
    exit 1
  fi
fi

echo "🤖 正在啟動 Aider (Model: gemini/gemini-1.5-pro-latest)..."
echo "💡 提示: 使用 /help 查看指令，使用 /exit 退出"
echo ""

# 執行 Aider
# 使用 gemini/gemini-1.5-pro-latest 作為目前最強的 Gemini 模型
# 若未來有 gemini-3-pro，可修改此處
aider --model gemini/gemini-1.5-pro-latest --no-git-commits "$@"
