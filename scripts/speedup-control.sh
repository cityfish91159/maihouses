#!/bin/bash
# 一次性加速腳本 - 不會當機的簡化版
# 用法: bash scripts/speedup-control.sh
# 或: npm run speedup (需在 package.json 加入)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 開始 Codespace 加速清理..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$WORK_DIR"

# 1. 清理 Vite 快取
echo -n "📦 清理 Vite 快取..."
rm -rf node_modules/.vite .cache 2>/dev/null || true
echo " ✓"

# 2. 清理 TypeScript 暫存
echo -n "📝 清理 TypeScript 暫存..."
rm -rf .tsbuildinfo tsconfig.tsbuildinfo 2>/dev/null || true
echo " ✓"

# 3. Git GC (溫和模式)
echo -n "🔧 Git 垃圾回收..."
git gc --auto --quiet 2>/dev/null || true
echo " ✓"

# 4. npm 快取驗證
echo -n "📋 驗證 npm 快取..."
npm cache verify --silent 2>/dev/null || true
echo " ✓"

# 5. 清理 logs
echo -n "🗑️  清理舊日誌..."
rm -f .speedup.log .auto-speedup.pid 2>/dev/null || true
find . -name "*.log" -size +10M -delete 2>/dev/null || true
echo " ✓"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 加速清理完成！"
echo ""
echo "💡 提示: 開發時若感覺慢，可再次執行此腳本"
