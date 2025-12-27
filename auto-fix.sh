#!/bin/bash
# 自動修復腳本 - 只在需要時運行

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  需要設定 OPENAI_API_KEY 才能自動修復"
    echo "   export OPENAI_API_KEY=sk-proj-你的金鑰"
    exit 1
fi

echo "🔧 使用 Aider 自動修復代碼問題..."
echo ""

# 取得有問題的檔案
problem_files=$(git diff --name-only | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$problem_files" ]; then
    echo "✅ 沒有需要修復的檔案"
    exit 0
fi

echo "📁 將修復以下檔案:"
echo "$problem_files"
echo ""

# 使用 Aider 修復
aider --model gpt-4o --yes \
      --message "請修復代碼衝突、類型錯誤和 lint 問題" \
      $problem_files
