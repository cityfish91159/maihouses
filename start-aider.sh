#!/bin/bash
# 快速啟動 Aider with GPT-4o

echo "🚀 準備啟動 Aider..."
echo ""

# 檢查是否有 OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
  echo "⚠️  未找到 OPENAI_API_KEY 環境變數"
  echo ""
  echo "請使用以下方式之一設定："
  echo "1. export OPENAI_API_KEY=sk-proj-你的金鑰"
  echo "2. 在 .env 中設定 OPENAI_API_KEY=sk-proj-你的金鑰"
  echo ""
  read -p "請輸入您的 OpenAI API Key (或按 Enter 跳過): " api_key
  if [ ! -z "$api_key" ]; then
    export OPENAI_API_KEY="$api_key"
    echo "✅ API Key 已設定"
  else
    echo "❌ 無法啟動 Aider，需要 API Key"
    exit 1
  fi
fi

echo "✅ 使用模型: GPT-4o"
echo "✅ 工作目錄: $(pwd)"
echo ""
echo "💡 Aider 命令提示："
echo "  /add <檔案>  - 添加檔案到對話"
echo "  /drop <檔案> - 移除檔案"
echo "  /exit        - 退出"
echo ""

# 啟動 Aider
aider --model gpt-4o "$@"
