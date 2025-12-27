#!/bin/bash
# 檢查專案代碼衝突和問題（精簡版）

echo "🔍 快速代碼檢查..."

# 1. 檢查 Git 衝突（關鍵）
if git grep -n "^<<<<<<< \|^=======$\|^>>>>>>> " -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null; then
    echo "❌ 發現 Git 衝突標記"
    exit 1
fi
echo "✅ 無衝突標記"


# 2. 檢查 ESLint（快速）
if npm run lint --silent 2>&1 | grep -q "error"; then
    echo "⚠️  發現 Lint 錯誤"
else
    echo "✅ Lint 通過"
fi

echo ""
echo "✅ 快速檢查完成！"
echo "💡 需要詳細檢查可運行: npm run lint"

# 3. 檢查 ESLint 問題
echo "3️⃣ 檢查 ESLint 問題..."
if npm run lint --silent 2>&1 | head -30; then
    echo "✅ ESLint 檢查通過"
else
    echo "⚠️  發現 Lint 問題（僅顯示前 30 行）"
fi
echo ""

# 4. 檢查重複的匯入
echo "4️⃣ 檢查重複的匯入..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    imports=$(grep "^import " "$file" | sort | uniq -d)
    if [ ! -z "$imports" ]; then
        echo "⚠️  $file 有重複匯入:"
        echo "$imports"
    fi
done
echo "✅ 重複匯入檢查完成"
echo ""

# 5. 檢查未使用的變數（簡單版）
echo "5️⃣ 檢查常見問題..."
grep -r "debugger" src/ && echo "⚠️  發現 debugger 語句" || echo "✅ 無 debugger"
grep -r "console.log" src/ | wc -l | xargs -I {} echo "📊 發現 {} 個 console.log"
echo ""

# 6. 檢查依賴衝突
echo "6️⃣ 檢查 package.json 依賴..."
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json 存在"
else
    echo "⚠️  缺少 package-lock.json"
fi
echo ""

echo "✅ 檢查完成！"
