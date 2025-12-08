#!/bin/bash

# AI Agent Strict Audit Protocol
# 這是給 AI Agent (我) 執行的強制自查腳本
# 必須在每次完成一個功能區塊後執行

echo "🤖 AI Agent 自查程序啟動..."
echo "========================================"

# 1. 檢查 TypeScript 型別
echo "🔍 1. 執行嚴格型別檢查..."
if npm run typecheck; then
    echo "✅ 型別檢查通過"
else
    echo "❌ 型別檢查失敗！請立即修正！"
    exit 1
fi

# 2. 檢查關鍵檔案是否被意外修改
echo "🔍 2. 檢查關鍵檔案完整性..."
CRITICAL_FILES=("src/components/Header/Header.tsx" "src/pages/Home.tsx")
for file in "${CRITICAL_FILES[@]}"; do
    if git diff --name-only | grep -q "$file"; then
        echo "⚠️ 警告：你修改了關鍵檔案 $file"
        echo "請確認這是否在本次任務範圍內？(y/n)"
        # 在自動化環境中，這裡應該是阻擋或記錄
        # 這裡模擬 AI 的自我反思
        echo "👉 自我反思：我是否被授權修改此檔案？"
    fi
done

# 3. 檢查是否遺留 TODO
echo "🔍 3. 掃描遺留的 TODO..."
grep -r "TODO" src/components/layout/GlobalHeader.tsx
if [ $? -eq 0 ]; then
    echo "⚠️ 發現未完成的 TODO，請確認是否需要處理"
fi

echo "========================================"
echo "🤖 自查完成。如果以上有任何錯誤，禁止 Commit。"
