#!/bin/bash
# ============================================================================
# 🔒 HARD GATE - AI 不配合就直接死路
# ============================================================================
#
# 這不是提醒，這是物理阻斷：
# - G1: 沒 trace → 不能 commit
# - G2: 一次過關 → 地獄測試
# - G3: 非冠軍 → 不能上線
# - G4: 又慢又長 → 自動回退
# - G5: 沒全測 → 不准修 bug
#
# ============================================================================

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ARENA_DIR="$PROJECT_ROOT/arena"
TRACES_DIR="$ARENA_DIR/traces"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================================================
# G1: 沒有 task.trace.json → 任何 commit 直接失敗
# ============================================================================
gate_1_trace_required() {
    local staged_files="$1"
    
    # 檢查是否修改了 candidates 或 tasks
    if echo "$staged_files" | grep -qE "^arena/(candidates|tasks)/"; then
        # 找出修改的 task 名稱
        local tasks=$(echo "$staged_files" | grep -oE "arena/(candidates|tasks)/[^/]+" | sed 's|arena/[^/]*/||' | sort -u)
        
        for task in $tasks; do
            local trace_file="$TRACES_DIR/${task}.json"
            
            # trace 必須存在
            if [ ! -f "$trace_file" ]; then
                echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
                echo -e "${RED}🛑 GATE 1 BLOCKED: 沒有 task.trace.json${NC}"
                echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
                echo ""
                echo "你修改了 $task 但沒有 trace 紀錄"
                echo ""
                echo "解決方法："
                echo "  ./scripts/ai-supervisor.sh mid-law pre-write $task"
                echo ""
                return 1
            fi
            
            # trace 必須在本次 commit 中
            if ! echo "$staged_files" | grep -q "arena/traces/${task}.json"; then
                echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
                echo -e "${RED}🛑 GATE 1 BLOCKED: trace 未包含在 commit 中${NC}"
                echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
                echo ""
                echo "你修改了 $task 但 trace 沒有一起 commit"
                echo ""
                echo "解決方法："
                echo "  git add arena/traces/${task}.json"
                echo ""
                return 1
            fi
        done
    fi
    
    return 0
}

# ============================================================================
# G2: failed_attempts = 0 → 自動進入最嚴格對抗測試
# ============================================================================
gate_2_check_attempts() {
    local task="$1"
    local trace_file="$TRACES_DIR/${task}.json"
    
    if [ ! -f "$trace_file" ]; then
        return 0  # G1 會處理
    fi
    
    local failed=$(jq -r '.failed // 0' "$trace_file" 2>/dev/null || echo "0")
    
    if [ "$failed" -eq 0 ]; then
        echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}⚠️ GATE 2 WARNING: 一次過關 = 高風險${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "failed_attempts = 0"
        echo "→ 啟動地獄級隨機測試模式"
        echo ""
        
        # 設置環境變數讓 arena 知道要用最嚴格模式
        export ARENA_HELL_MODE=1
        return 0  # 警告但不阻斷，讓 arena 去處理
    fi
    
    return 0
}

# ============================================================================
# G3: 不是 arena 冠軍 → 永遠不能變成正式解
# ============================================================================
gate_3_champion_only() {
    local staged_files="$1"
    
    # 檢查是否有人試圖把 candidates 複製到 src
    if echo "$staged_files" | grep -qE "^src/.*\.ts$"; then
        # 檢查是否有對應的 arena 結果
        for task_dir in "$ARENA_DIR/results"/*.json; do
            [ -f "$task_dir" ] || continue
            
            local champion=$(jq -r '.champion // empty' "$task_dir" 2>/dev/null)
            
            if [ -z "$champion" ]; then
                echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
                echo -e "${RED}🛑 GATE 3 BLOCKED: 沒有 arena 冠軍${NC}"
                echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
                echo ""
                echo "你試圖修改 src/ 但沒有任何 arena 冠軍"
                echo ""
                echo "解決方法："
                echo "  1. 先在 arena/candidates/ 寫至少 2 個版本"
                echo "  2. 執行 ./scripts/ai-supervisor.sh arena <task>"
                echo "  3. 只有冠軍版本才能進入 src/"
                echo ""
                return 1
            fi
        done
    fi
    
    return 0
}

# ============================================================================
# G4: 行數變多 + 效能變慢 → 當次修改直接作廢
# ============================================================================
gate_4_no_regression() {
    local task="$1"
    local trace_file="$TRACES_DIR/${task}.json"
    
    if [ ! -f "$trace_file" ]; then
        return 0
    fi
    
    local versions=$(jq -r '.versions | length' "$trace_file" 2>/dev/null || echo "0")
    
    if [ "$versions" -lt 2 ]; then
        return 0  # 需要至少 2 個版本才能比較
    fi
    
    # 取最後兩個版本比較
    local prev_lines=$(jq -r '.versions[-2].lines // 0' "$trace_file")
    local curr_lines=$(jq -r '.versions[-1].lines // 0' "$trace_file")
    local prev_runtime=$(jq -r '.versions[-2].avgRuntimeMs // 0' "$trace_file")
    local curr_runtime=$(jq -r '.versions[-1].avgRuntimeMs // 0' "$trace_file")
    
    # 都變差 = 回退
    if [ "$curr_lines" -gt "$prev_lines" ] && [ "$(echo "$curr_runtime > $prev_runtime" | bc -l)" -eq 1 ]; then
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}🛑 GATE 4 BLOCKED: 又慢又長 = 退化${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "上一版: ${prev_lines} 行, ${prev_runtime}ms"
        echo "這一版: ${curr_lines} 行, ${curr_runtime}ms"
        echo ""
        echo "你同時變慢又變長，本次修改作廢"
        echo ""
        echo "執行回退："
        echo "  git checkout -- arena/candidates/${task}/"
        echo ""
        return 1
    fi
    
    return 0
}

# ============================================================================
# G5: 沒先跑全域測試 → 不准修局部 bug
# ============================================================================
gate_5_full_test_first() {
    local commit_msg="$1"
    
    # 檢查是否是 bugfix commit
    if echo "$commit_msg" | grep -qiE "fix|bug|patch|hotfix"; then
        local test_log="$PROJECT_ROOT/.ai_supervisor/last_full_test.log"
        
        # 檢查是否有全域測試紀錄
        if [ ! -f "$test_log" ]; then
            echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
            echo -e "${RED}🛑 GATE 5 BLOCKED: 沒有全域測試紀錄${NC}"
            echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "你的 commit message 包含 'fix/bug/patch/hotfix'"
            echo "但沒有先執行全域測試"
            echo ""
            echo "解決方法："
            echo "  1. 先執行: npm test 或 npx vitest"
            echo "  2. 確認測試失敗（證明 bug 存在）"
            echo "  3. 再提交修復"
            echo ""
            return 1
        fi
        
        # 檢查全測紀錄是否在 10 分鐘內
        local test_time=$(stat -c %Y "$test_log" 2>/dev/null || echo "0")
        local now=$(date +%s)
        local diff=$((now - test_time))
        
        if [ "$diff" -gt 600 ]; then
            echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
            echo -e "${RED}🛑 GATE 5 BLOCKED: 全域測試紀錄過期${NC}"
            echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
            echo ""
            echo "上次全域測試是 $((diff / 60)) 分鐘前"
            echo "bugfix 前必須有 10 分鐘內的測試紀錄"
            echo ""
            return 1
        fi
    fi
    
    return 0
}

# ============================================================================
# 主程式
# ============================================================================
main() {
    local command="${1:-check}"
    
    case "$command" in
        "pre-commit")
            echo "🔒 Running Hard Gates..."
            
            local staged=$(git diff --cached --name-only 2>/dev/null || echo "")
            
            if [ -z "$staged" ]; then
                echo "No staged files"
                exit 0
            fi
            
            # G1: trace 必須存在
            gate_1_trace_required "$staged" || exit 1
            
            # G3: 非冠軍不能進 src
            gate_3_champion_only "$staged" || exit 1
            
            echo -e "${GREEN}✅ All gates passed${NC}"
            ;;
            
        "commit-msg")
            local msg_file="${2:-}"
            if [ -f "$msg_file" ]; then
                local msg=$(cat "$msg_file")
                gate_5_full_test_first "$msg" || exit 1
            fi
            ;;
            
        "check-task")
            local task="${2:-}"
            if [ -z "$task" ]; then
                echo "Usage: hard-gate.sh check-task <task>"
                exit 1
            fi
            
            gate_2_check_attempts "$task"
            gate_4_no_regression "$task"
            ;;
            
        *)
            echo "Hard Gate Commands:"
            echo "  pre-commit     - Run as pre-commit hook"
            echo "  commit-msg     - Run as commit-msg hook"
            echo "  check-task     - Check specific task gates"
            ;;
    esac
}

main "$@"
