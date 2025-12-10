#!/bin/bash
# ============================================================================
# AI SUPERVISOR v12.0 - 精簡版 (模組化架構)
# ============================================================================
#
# ⛔️⛔️⛔️ AI AGENT 必讀 ⛔️⛔️⛔️
#
# 收到任何任務後，你的【第一個動作】必須是：
# ./scripts/ai-supervisor.sh start "任務描述"
#
# 核心指令：
#   start <任務>     開始任務 (初始分數 100)
#   finish           結束任務 (檢查所有審計)
#   audit <檔案>     審計單一檔案
#   audit-all        審計所有修改的檔案
#   track <檔案>     追蹤檔案修改
#   scan             掃描偷懶模式
#   status           顯示當前狀態
#   monitor          即時監控面板
#   score            顯示分數
#   rules            顯示扣分規則
#   violations       顯示違規記錄
#   rage-log         顯示怒罵記錄
#
# 扣分規則：
#   ❌ 未啟動 Session 就操作 = -20 分
#   ❌ any 類型 = -15 分/個
#   ❌ @ts-ignore = -15 分/個
#   ❌ eslint-disable = -15 分/個
#   ❌ 空 catch = -12 分/個
#   ❌ console.log = -8 分/個
#   ❌ 未審計檔案 = -5 分/個
#   ❌ 分數低於 80 = 清空所有代碼重來
#
# ============================================================================

set -euo pipefail

# ============================================================================
# 路徑設定
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STATE_DIR="$PROJECT_ROOT/.ai_supervisor"
LIB_DIR="$SCRIPT_DIR/lib"

# 狀態檔案
SCORE_FILE="$STATE_DIR/score.json"
SESSION_FILE="$STATE_DIR/session.json"
VIOLATION_LOG="$STATE_DIR/violations.log"
RAGE_LOG="$STATE_DIR/rage.log"

# 建立狀態目錄
mkdir -p "$STATE_DIR"
touch "$VIOLATION_LOG" "$RAGE_LOG"

# ============================================================================
# 載入模組
# ============================================================================
source "$LIB_DIR/messages.sh"
source "$LIB_DIR/core.sh"
source "$LIB_DIR/laziness.sh"
source "$LIB_DIR/audit.sh"
source "$LIB_DIR/watcher.sh"
source "$LIB_DIR/anti-cheat.sh"

# ============================================================================
# 指令實作
# ============================================================================

# 開始任務
cmd_start() {
    local task="${1:-}"
    start_session "$task"
}

# 結束任務
cmd_finish() {
    check_session

    print_header "🏁 任務完成檢查"

    # 1. 檢查逃漏
    echo "1️⃣  檢查未追蹤的修改..."
    if ! check_escape; then
        rage_exit "發現逃漏！所有修改必須經過 track 登記！"
    fi
    echo -e "${GREEN}   ✅ 無逃漏${NC}"

    # 2. 檢查未審計
    echo "2️⃣  檢查審計覆蓋..."
    if [ -f "$STATE_DIR/modified_files.log" ] && [ -f "$STATE_DIR/audited_files.log" ]; then
        local pending=$(comm -23 <(sort -u "$STATE_DIR/modified_files.log") <(sort -u "$STATE_DIR/audited_files.log" 2>/dev/null || echo "") 2>/dev/null | wc -l | tr -d ' ')
        if [ "$pending" -gt 0 ]; then
            echo -e "${RED}❌ 還有 $pending 個檔案未審計！${NC}"
            comm -23 <(sort -u "$STATE_DIR/modified_files.log") <(sort -u "$STATE_DIR/audited_files.log" 2>/dev/null || echo "") 2>/dev/null
            update_score $((pending * -5)) "未審計檔案: $pending 個"
            echo ""
            echo -e "${YELLOW}執行: ./scripts/ai-supervisor.sh audit-all${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}   ✅ 所有檔案已審計${NC}"

    # 3. 檢查 TODO 結果記錄
    echo "3️⃣  檢查 TODO 結果記錄..."
    if ! check_todo_result; then
        echo -e "${RED}   ❌ 未記錄結果到 TODO.md${NC}"
    else
        echo -e "${GREEN}   ✅ 已記錄結果${NC}"
    fi

    # 4. 執行偷懶掃描
    echo "4️⃣  執行偷懶掃描..."
    if ! scan_laziness "$PROJECT_ROOT/src" > /dev/null 2>&1; then
        warn "發現偷懶模式，但不阻擋完成"
    fi
    echo -e "${GREEN}   ✅ 掃描完成${NC}"

    # 5. 🔥 自動執行 TypeScript 和 ESLint 檢查 🔥
    echo "5️⃣  執行 TypeScript 檢查..."
    local ts_output
    ts_output=$(npm run typecheck 2>&1) || true
    if echo "$ts_output" | grep -qiE "error TS[0-9]+:|Cannot find module"; then
        echo -e "${RED}   ❌ TypeScript 有錯誤！${NC}"
        echo "$ts_output" | grep -iE "error TS[0-9]+:" | head -5
        check_terminal_errors "$ts_output"
    else
        echo -e "${GREEN}   ✅ TypeScript 通過${NC}"
        clear_error_remind "TypeScript" 2>/dev/null || true
    fi

    echo "6️⃣  執行 ESLint 檢查..."
    local lint_output
    lint_output=$(npm run lint 2>&1) || true
    if echo "$lint_output" | grep -qiE "error|✖.*problems"; then
        echo -e "${RED}   ❌ ESLint 有錯誤！${NC}"
        echo "$lint_output" | grep -iE "error" | head -5
        check_terminal_errors "$lint_output"
    else
        echo -e "${GREEN}   ✅ ESLint 通過${NC}"
        clear_error_remind "ESLint" 2>/dev/null || true
    fi

    # 7. 完成
    finish_session
}

# 審計單一檔案
cmd_audit() {
    local file="${1:-}"
    if [ -z "$file" ]; then
        error "請提供要審計的檔案路徑"
        echo "用法: ./scripts/ai-supervisor.sh audit <file>"
        exit 1
    fi

    check_session
    audit_file "$file"
}

# 審計所有檔案
cmd_audit_all() {
    check_session
    audit_all
}

# 追蹤修改 (自動即時分析)
cmd_track() {
    local file="${1:-}"
    if [ -z "$file" ]; then
        error "請提供要追蹤的檔案路徑"
        echo "用法: ./scripts/ai-supervisor.sh track <file>"
        exit 1
    fi

    check_session
    track_modify "$file"

    # 🔴 自動即時分析（單終端機模式）
    echo ""
    analyze_file_realtime "$file"

    # 顯示迷你狀態
    show_mini_status
}

# 掃描偷懶
cmd_scan() {
    local dir="${1:-$PROJECT_ROOT/src}"
    scan_laziness "$dir"
}

# 顯示狀態
cmd_status() {
    show_status
}

# 即時監控
cmd_monitor() {
    realtime_monitor
}

# 顯示分數
cmd_score() {
    print_header "🏆 分數"
    local score=$(get_score)
    local score_color="${GREEN}"
    [ "$score" -lt 80 ] && score_color="${RED}"
    [ "$score" -lt 100 ] && [ "$score" -ge 80 ] && score_color="${YELLOW}"

    echo -e "   當前分數: ${score_color}$score${NC} / 150"

    if [ "$score" -lt 80 ]; then
        echo -e "${RED}   💀 危險！低於 80 分將清空所有代碼！${NC}"
    elif [ "$score" -lt 90 ]; then
        echo -e "${YELLOW}   ⚠️  警告！距離清空代碼還有 $((score - 80)) 分${NC}"
    fi

    # 最近扣分原因
    if [ -f "$SCORE_FILE" ]; then
        local reason=$(grep -o '"reason":"[^"]*"' "$SCORE_FILE" | cut -d'"' -f4)
        echo -e "   最近變更: $reason"
    fi
}

# 顯示扣分規則
cmd_rules() {
    show_penalty_rules
}

# 顯示違規記錄
cmd_violations() {
    print_header "🚫 違規記錄"

    if [ ! -f "$VIOLATION_LOG" ] || [ ! -s "$VIOLATION_LOG" ]; then
        echo -e "${GREEN}   ✅ 無違規記錄${NC}"
        return
    fi

    local count=$(wc -l < "$VIOLATION_LOG" | tr -d ' ')
    echo -e "   總違規次數: ${RED}$count${NC}"
    echo ""
    echo "最近 10 條:"
    tail -10 "$VIOLATION_LOG"
}

# 顯示怒罵記錄
cmd_rage_log() {
    print_header "🔥 怒罵記錄"

    if [ ! -f "$RAGE_LOG" ] || [ ! -s "$RAGE_LOG" ]; then
        echo -e "${GREEN}   ✅ 無怒罵記錄 (表現良好！)${NC}"
        return
    fi

    local count=$(wc -l < "$RAGE_LOG" | tr -d ' ')
    echo -e "   被罵次數: ${RED}$count${NC}"
    echo ""
    echo "最近 10 條:"
    tail -10 "$RAGE_LOG"
}

# 即時監控 (持續運行)
cmd_watch() {
    check_session
    start_watcher
}

# 安裝 Git Hooks
cmd_install_hooks() {
    install_git_hooks
    record_script_hashes  # 記錄腳本 hash 防篡改
    record_branch         # 記錄分支防切換
}

# 鎖定監控 (用戶執行)
cmd_lock() {
    lock_state_dir
}

# 解鎖監控 (用戶執行)
cmd_unlock() {
    unlock_state_dir
}

# 反作弊檢查
cmd_check() {
    run_anti_cheat_check
}

# 執行指令並檢查錯誤
cmd_run() {
    local cmd="$*"

    if [ -z "$cmd" ]; then
        echo -e "${RED}用法: ./scripts/ai-supervisor.sh run <指令>${NC}"
        echo "範例: ./scripts/ai-supervisor.sh run npm run typecheck"
        return 1
    fi

    check_session
    echo -e "${CYAN}🔧 執行: $cmd${NC}"
    echo ""

    # 使用 watcher.sh 的函數執行並檢查錯誤
    run_with_error_check "$cmd"
}

# 清除錯誤提醒記錄
cmd_clear_error() {
    local error_type="${1:-all}"

    if [ "$error_type" = "all" ]; then
        rm -f "$STATE_DIR/terminal_errors.log" 2>/dev/null
        echo -e "${GREEN}✅ 已清除所有錯誤提醒記錄${NC}"
    else
        clear_error_remind "$error_type"
    fi
}

# 顯示範例模板
cmd_template() {
    local type="${1:-list}"
    local template_dir="$SCRIPT_DIR/templates"

    case "$type" in
        list)
            print_header "🏆 最佳實踐模板"
            echo ""
            echo "可用模板："
            echo "  component  - React 組件模板 (最高 +42 分)"
            echo "  hook       - Custom Hook 模板 (最高 +29 分)"
            echo "  api        - API Service 模板 (最高 +26 分)"
            echo ""
            echo "使用方式："
            echo "  ./scripts/ai-supervisor.sh template component"
            echo "  ./scripts/ai-supervisor.sh template hook"
            echo ""
            echo -e "${YELLOW}提示: 照著模板寫可以獲得大量獎勵分數！${NC}"
            ;;
        component)
            print_header "🏆 React 組件模板"
            cat "$template_dir/component.tsx.template"
            ;;
        hook)
            print_header "🏆 Custom Hook 模板"
            cat "$template_dir/hook.ts.template"
            ;;
        api|service)
            print_header "🏆 API Service 模板"
            cat "$template_dir/api-service.ts.template"
            ;;
        *)
            echo -e "${RED}未知模板類型: $type${NC}"
            echo "可用: component, hook, api"
            ;;
    esac
}

# 顯示幫助
cmd_help() {
    echo -e "${CYAN}AI Supervisor v12.0 - 全面監控版${NC}"
    echo ""
    echo "用法: ./scripts/ai-supervisor.sh <command> [args]"
    echo ""
    echo -e "${WHITE}【核心指令】${NC}"
    echo "  start <任務>     開始任務 (初始分數 100)"
    echo "  finish           結束任務 (檢查所有審計)"
    echo "  audit <檔案>     審計單一檔案"
    echo "  audit-all        審計所有修改的檔案"
    echo "  track <檔案>     追蹤檔案修改"
    echo ""
    echo -e "${WHITE}【即時監控】← 重要！${NC}"
    echo "  watch            🔴 啟動即時監控 (檔案一改就審計)"
    echo "  monitor          顯示監控面板"
    echo "  status           顯示當前狀態"
    echo "  score            顯示分數"
    echo ""
    echo -e "${WHITE}【安全功能】← 用戶專用${NC}"
    echo "  install-hooks    安裝 Git Hooks (防止 commit 作弊)"
    echo "  lock             🔒 鎖定監控檔案 (AI 無法修改)"
    echo "  unlock           🔓 解鎖監控檔案 (需要輸入 YES)"
    echo "  check            執行反作弊檢查"
    echo ""
    echo -e "${WHITE}【錯誤檢查】${NC}"
    echo "  run <指令>       執行指令並檢查錯誤 (第一次免扣，第二次起 -20分)"
    echo "  clear-error      清除錯誤提醒記錄"
    echo ""
    echo -e "${WHITE}【模板 🏆】${NC}"
    echo "  template         顯示最佳實踐模板列表"
    echo "  template component  React 組件模板 (+42 分)"
    echo "  template hook       Custom Hook 模板 (+29 分)"
    echo "  template api        API Service 模板 (+26 分)"
    echo ""
    echo -e "${WHITE}【記錄指令】${NC}"
    echo "  rules            顯示扣分規則"
    echo "  violations       顯示違規記錄"
    echo "  rage-log         顯示怒罵記錄"
    echo "  scan [目錄]      掃描偷懶模式"
    echo ""
    echo -e "${BG_RED}${WHITE}【天條 - 違反扣 500 分】${NC}"
    echo "  ❌ 未啟動 Session 就操作 = -500 分"
    echo "  ❌ 使用 --no-verify = -500 分"
    echo ""
    echo -e "${RED}【致命錯誤 - 審計必死】${NC}"
    echo "  ❌ any 類型 = -15 分/個"
    echo "  ❌ @ts-ignore = -15 分/個"
    echo "  ❌ eslint-disable = -15 分/個"
    echo "  ❌ 空 catch = -12 分/個"
    echo ""
    echo -e "${YELLOW}【80分清空代碼】${NC}"
    echo "  分數低於 80 = 本次所有代碼被清空重來"
    echo ""
    echo -e "${GREEN}【獎勵機制 🏆】${NC}"
    echo "  ✅ 精簡檔案 (<100行) = +5~10 分"
    echo "  ✅ 正確類型定義 (無 any) = +8 分"
    echo "  ✅ React.memo 優化 = +5 分"
    echo "  ✅ useCallback/useMemo = +5 分"
    echo "  ✅ i18n 國際化 = +10 分"
    echo "  ✅ 完整 a11y = +8 分"
    echo "  ✅ 有測試檔案 = +15 分"
}

# ============================================================================
# 主入口
# ============================================================================
main() {
    local cmd="${1:-help}"
    shift || true

    case "$cmd" in
        # 核心指令
        start)
            cmd_start "$@"
            ;;
        finish)
            cmd_finish
            ;;
        audit)
            cmd_audit "$@"
            ;;
        audit-all)
            cmd_audit_all
            ;;
        track|track-modify)
            cmd_track "$@"
            ;;

        # 即時監控
        watch)
            cmd_watch
            ;;
        monitor)
            cmd_monitor
            ;;
        status)
            cmd_status
            ;;
        score)
            cmd_score
            ;;
        scan)
            cmd_scan "$@"
            ;;

        # 安全功能 (用戶專用)
        install-hooks|install)
            cmd_install_hooks
            ;;
        lock)
            cmd_lock
            ;;
        unlock)
            cmd_unlock
            ;;
        check|anti-cheat)
            cmd_check
            ;;

        # 記錄指令
        rules|penalty|penalties)
            cmd_rules
            ;;
        violations)
            cmd_violations
            ;;
        rage-log|rage)
            cmd_rage_log
            ;;

        # 執行指令並檢查錯誤
        run)
            cmd_run "$@"
            ;;
        clear-error)
            cmd_clear_error "$@"
            ;;

        # 模板
        template|templates)
            cmd_template "$@"
            ;;

        # 幫助
        help|-h|--help)
            cmd_help
            ;;
        *)
            echo -e "${RED}未知指令: $cmd${NC}"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
