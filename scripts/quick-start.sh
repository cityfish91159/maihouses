#!/bin/bash
# ============================================================================
# 🚀 QUICK START v11.0 - 一鍵啟動 AI 監控系統
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASK="${1:-}"

echo ""
echo -e "\033[1;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "\033[1;36m🚀 AI Supervisor v11.0 - Quick Start\033[0m"
echo -e "\033[1;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo ""

# 檢查任務名稱
if [ -z "$TASK" ]; then
    echo -e "\033[1;31m❌ 請提供任務名稱！\033[0m"
    echo ""
    echo "使用方式："
    echo "  ./scripts/quick-start.sh \"任務名稱\""
    echo ""
    exit 1
fi

# 1. 安裝物理阻斷
echo -e "\033[1;33m[1/4] 安裝物理阻斷...\033[0m"
"$SCRIPT_DIR/ai-supervisor.sh" install-physical-gates

# 2. 檢查阻斷狀態
echo ""
echo -e "\033[1;33m[2/4] 檢查阻斷狀態...\033[0m"
"$SCRIPT_DIR/ai-supervisor.sh" check-gates

# 3. 開始任務
echo ""
echo -e "\033[1;33m[3/4] 開始任務: $TASK\033[0m"
"$SCRIPT_DIR/ai-supervisor.sh" start "$TASK"

# 4. 顯示即時監控
echo ""
echo -e "\033[1;33m[4/4] 即時監控狀態...\033[0m"
"$SCRIPT_DIR/ai-supervisor.sh" monitor

echo ""
echo -e "\033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "\033[1;32m✅ 監控系統已啟動！開始工作吧！\033[0m"
echo -e "\033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo ""
echo "後續命令："
echo "  ./scripts/ai-supervisor.sh track-modify <file>  # 修改後登記"
echo "  ./scripts/ai-supervisor.sh audit <file>         # 審計代碼"
echo "  ./scripts/ai-supervisor.sh monitor              # 查看進度"
echo "  ./scripts/ai-supervisor.sh finish               # 結束任務"
echo ""
