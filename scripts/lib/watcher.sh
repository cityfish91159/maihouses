#!/bin/bash
# ============================================================================
# AI Supervisor - 即時監控模組 (File Watcher)
# ============================================================================
#
# 功能：
# - 監聽檔案變化，即時審計
# - 發現問題立即警告
# - 偵測作弊行為
#
# ============================================================================

# 監控間隔 (秒)
WATCH_INTERVAL=2

# 上次掃描的 hash
LAST_HASH=""

# 即時監控啟動 (使用 inotifywait)
start_watcher() {
    print_header "🔴 即時監控模式啟動"
    echo -e "${RED}⚠️  所有操作都在監視中！檔案一變就審計！${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止監控${NC}"
    echo ""

    # 記錄監控開始
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WATCHER: 監控啟動" >> "$VIOLATION_LOG"

    # 檢查 inotifywait 是否可用
    if command -v inotifywait &> /dev/null; then
        echo -e "${GREEN}使用 inotifywait 即時監控 (最快速)${NC}"
        start_inotify_watcher
    else
        echo -e "${YELLOW}inotifywait 不可用，使用輪詢模式${NC}"
        echo -e "${CYAN}提示: sudo apt install inotify-tools 可獲得更快的監控${NC}"
        start_polling_watcher
    fi
}

# inotifywait 即時監控 (毫秒級反應)
start_inotify_watcher() {
    local watch_dir="$PROJECT_ROOT/src"

    # 確保目錄存在
    [ ! -d "$watch_dir" ] && watch_dir="$PROJECT_ROOT"

    echo -e "${CYAN}監控目錄: $watch_dir${NC}"
    echo -e "${RED}⚠️  偷雞行為（未 track 直接改檔）= 代碼全清！${NC}"
    echo ""

    # 使用 inotifywait 監控
    inotifywait -m -r -e modify,create,moved_to --format '%w%f' "$watch_dir" 2>/dev/null | while read -r file; do
        # 只處理 ts/tsx 檔案
        [[ ! "$file" =~ \.(ts|tsx)$ ]] && continue

        local timestamp=$(date '+%H:%M:%S')
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}[$timestamp] 📁 偵測到變化: $file${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

        # 🔥🔥🔥 偷雞偵測：檔案被改但沒有 track 🔥🔥🔥
        if [ -f "$STATE_DIR/modified_files.log" ]; then
            if ! grep -qF "$file" "$STATE_DIR/modified_files.log" 2>/dev/null; then
                echo ""
                echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${BG_RED}${WHITE}🔥🔥🔥 偷雞偵測！未 track 就改檔案！🔥🔥🔥${NC}"
                echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${RED}檔案: $file${NC}"
                echo -e "${RED}懲罰: 清空所有修改，重來！${NC}"
                echo ""

                # 記錄違規
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] CHEATING: 未 track 就改檔 $file" >> "$VIOLATION_LOG"

                # 🔥 清空所有修改 🔥
                wipe_all_changes "偷雞: 未 track 就改檔 $file"

                echo ""
                echo -e "${YELLOW}重新開始吧！記得先 track 再改檔！${NC}"
                echo -e "${CYAN}正確流程: track → 修改 → audit → commit${NC}"
                continue
            fi
        else
            # 沒有 modified_files.log = 沒有 Session 或沒有任何 track
            echo ""
            echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${BG_RED}${WHITE}🔥🔥🔥 偷雞偵測！沒有任何 track 記錄！🔥🔥🔥${NC}"
            echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

            # 清空修改
            wipe_all_changes "偷雞: 完全沒有 track 就改檔"
            continue
        fi

        # 即時分析
        analyze_file_realtime "$file"

        echo ""
    done
}

# 🔥 清空所有修改 🔥
wipe_all_changes() {
    local reason="$1"

    echo ""
    print_supreme_rage
    echo ""

    # 記錄
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WIPE: $reason" >> "$VIOLATION_LOG"

    # 清空所有未 commit 的修改
    echo -e "${RED}正在清空所有修改...${NC}"

    # 還原所有修改的檔案
    git checkout -- . 2>/dev/null

    # 刪除新增的檔案 (只刪 src/ 下的)
    git clean -fd src/ 2>/dev/null

    # 清空 session 狀態
    rm -f "$STATE_DIR/modified_files.log" 2>/dev/null
    rm -f "$STATE_DIR/audited_files.log" 2>/dev/null

    # 重置分數
    if [ -f "$SCORE_FILE" ]; then
        echo '{"score": 100, "history": []}' > "$SCORE_FILE"
    fi

    echo -e "${GREEN}✅ 已清空，分數重置為 100${NC}"
    echo ""
}

# ============================================================================
# 終端錯誤檢測 - 第一次提醒，第二次起扣 20 分
# ============================================================================

# 錯誤提醒記錄檔
TERMINAL_ERROR_LOG="$STATE_DIR/terminal_errors.log"

# 檢查終端錯誤 (ESLint, TypeScript, npm 等)
check_terminal_errors() {
    local output="$1"
    local error_type=""
    local error_found=0

    # 檢測各種錯誤類型
    if echo "$output" | grep -qiE "error TS[0-9]+:|Cannot find module|Type.*is not assignable"; then
        error_type="TypeScript"
        error_found=1
    elif echo "$output" | grep -qiE "eslint.*error|✖.*problems?.*errors?|Rule:"; then
        error_type="ESLint"
        error_found=1
    elif echo "$output" | grep -qiE "npm ERR!|ENOENT|EACCES|Module not found"; then
        error_type="npm"
        error_found=1
    elif echo "$output" | grep -qiE "SyntaxError:|ReferenceError:|TypeError:"; then
        error_type="Runtime"
        error_found=1
    elif echo "$output" | grep -qiE "FAIL.*test|✕.*failed|AssertionError"; then
        error_type="Test"
        error_found=1
    fi

    if [ "$error_found" -eq 1 ]; then
        handle_terminal_error "$error_type"
    fi
}

# 處理終端錯誤
handle_terminal_error() {
    local error_type="$1"
    local error_key="${error_type}_$(date +%Y%m%d)"

    # 初始化錯誤記錄檔
    [ ! -f "$TERMINAL_ERROR_LOG" ] && echo "{}" > "$TERMINAL_ERROR_LOG"

    # 計算此類錯誤被提醒的次數
    local remind_count=$(grep -c "REMINDED:$error_type" "$TERMINAL_ERROR_LOG" 2>/dev/null || echo 0)
    remind_count=$(echo "$remind_count" | tr -d '[:space:]')

    echo ""
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BG_RED}${WHITE}🚨 終端機偵測到 ${error_type} 錯誤！${NC}"
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ "$remind_count" -eq 0 ]; then
        # 第一次：只提醒，不扣分
        echo -e "${YELLOW}⚠️  第一次提醒 - 請立即修復此錯誤！${NC}"
        echo -e "${YELLOW}   下次再忽略將扣 20 分！${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] REMINDED:$error_type (第1次-免扣)" >> "$TERMINAL_ERROR_LOG"
    else
        # 第二次起：扣 20 分
        local penalty_times=$remind_count
        echo -e "${RED}❌ 第 $((remind_count + 1)) 次提醒！${NC}"
        echo -e "${RED}   你已經忽略 ${error_type} 錯誤 ${remind_count} 次了！${NC}"
        echo -e "${RED}   扣 20 分！${NC}"

        # 記錄
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] REMINDED:$error_type (第$((remind_count + 1))次-扣20分)" >> "$TERMINAL_ERROR_LOG"

        # 扣分
        if [ -f "$SCORE_FILE" ]; then
            update_score -20 "忽略終端 ${error_type} 錯誤 (第$((remind_count + 1))次)"
        fi
    fi

    echo ""
    echo -e "${CYAN}請修復錯誤後再繼續！${NC}"
    echo -e "${WHITE}提示: 執行 npm run typecheck / npm run lint 檢查${NC}"
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 清除錯誤提醒記錄（修復後呼叫）
clear_error_remind() {
    local error_type="$1"

    if [ -f "$TERMINAL_ERROR_LOG" ]; then
        # 清除特定類型的提醒記錄
        grep -v "REMINDED:$error_type" "$TERMINAL_ERROR_LOG" > "${TERMINAL_ERROR_LOG}.tmp" 2>/dev/null
        mv "${TERMINAL_ERROR_LOG}.tmp" "$TERMINAL_ERROR_LOG" 2>/dev/null
        echo -e "${GREEN}✅ ${error_type} 錯誤已修復，提醒記錄已清除${NC}"
    fi
}

# 執行指令並檢查錯誤
run_with_error_check() {
    local cmd="$1"
    local output
    local exit_code

    # 執行指令並捕獲輸出
    output=$(eval "$cmd" 2>&1)
    exit_code=$?

    # 顯示輸出
    echo "$output"

    # 檢查錯誤
    if [ $exit_code -ne 0 ] || echo "$output" | grep -qiE "error|fail|Error|FAIL"; then
        check_terminal_errors "$output"
    fi

    return $exit_code
}

# 輪詢模式監控 (備用)
start_polling_watcher() {
    while true; do
        watch_cycle
        sleep $WATCH_INTERVAL
    done
}

# 即時檔案分析 (詳細版)
analyze_file_realtime() {
    local file="$1"
    local timestamp=$(date '+%H:%M:%S')

    [ ! -f "$file" ] && return

    echo ""
    echo -e "${WHITE}🔍 即時代碼分析:${NC}"
    echo ""

    # 檔案基本資訊
    local line_count=$(wc -l < "$file" 2>/dev/null | tr -d ' ')
    local size=$(du -h "$file" 2>/dev/null | cut -f1)
    echo -e "   📄 檔案: $file"
    echo -e "   📏 行數: $line_count | 大小: $size"
    echo ""

    # ============ 致命問題檢測 ============
    local has_fatal=0

    # any 類型
    local any_lines=$(grep -n ": any" "$file" 2>/dev/null | head -5)
    if [ -n "$any_lines" ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 ': any' 類型！${NC}"
        echo "$any_lines" | while read -r line; do
            echo -e "${RED}      $line${NC}"
        done
        has_fatal=1
    fi

    # @ts-ignore
    local ts_ignore=$(grep -n "@ts-ignore\|@ts-nocheck" "$file" 2>/dev/null | head -3)
    if [ -n "$ts_ignore" ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 @ts-ignore！${NC}"
        echo "$ts_ignore" | while read -r line; do
            echo -e "${RED}      $line${NC}"
        done
        has_fatal=1
    fi

    # eslint-disable
    local eslint=$(grep -n "eslint-disable" "$file" 2>/dev/null | head -3)
    if [ -n "$eslint" ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 eslint-disable！${NC}"
        echo "$eslint" | while read -r line; do
            echo -e "${RED}      $line${NC}"
        done
        has_fatal=1
    fi

    # debugger
    local debugger=$(grep -n "debugger" "$file" 2>/dev/null)
    if [ -n "$debugger" ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 debugger！${NC}"
        echo -e "${RED}      $debugger${NC}"
        has_fatal=1
    fi

    # ============ 嚴重問題檢測 ============
    local has_severe=0

    # console.log
    local console=$(grep -n "console\.log" "$file" 2>/dev/null | head -5)
    if [ -n "$console" ]; then
        echo -e "${RED}   🚨 嚴重: 發現 console.log！${NC}"
        echo "$console" | while read -r line; do
            echo -e "${YELLOW}      $line${NC}"
        done
        has_severe=1
    fi

    # 空 catch
    local empty_catch=$(grep -nE "catch\s*\([^)]*\)\s*\{\s*\}" "$file" 2>/dev/null)
    if [ -n "$empty_catch" ]; then
        echo -e "${RED}   🚨 嚴重: 發現空 catch 區塊！${NC}"
        has_severe=1
    fi

    # 檔案太長
    if [ "$line_count" -gt 300 ]; then
        echo -e "${RED}   🚨 嚴重: 檔案太長 ($line_count 行 > 300)！${NC}"
        has_severe=1
    fi

    # ============ 評分 ============
    echo ""
    if [ "$has_fatal" -eq 1 ]; then
        echo -e "${BG_RED}${WHITE}   📊 即時評價: ❌ 不合格 - 有致命錯誤！${NC}"
        print_rage
        # 扣分
        if [ -f "$SCORE_FILE" ]; then
            update_score -15 "即時監控: $file 有致命錯誤"
        fi
    elif [ "$has_severe" -eq 1 ]; then
        echo -e "${YELLOW}   📊 即時評價: ⚠️ 需改善 - 有嚴重問題${NC}"
        # 扣分
        if [ -f "$SCORE_FILE" ]; then
            update_score -5 "即時監控: $file 有嚴重問題"
        fi
    else
        echo -e "${GREEN}   📊 即時評價: ✅ 目前良好${NC}"
    fi

    # 檢查是否追蹤
    if [ -f "$STATE_DIR/modified_files.log" ]; then
        if ! grep -qF "$file" "$STATE_DIR/modified_files.log" 2>/dev/null; then
            echo ""
            echo -e "${YELLOW}   ⚠️  此檔案尚未追蹤！${NC}"
            echo -e "${CYAN}   → 執行: ./scripts/ai-supervisor.sh track $file${NC}"
        fi
    fi

    # 顯示目前分數
    if [ -f "$SCORE_FILE" ]; then
        local score=$(get_score)
        local score_color="${GREEN}"
        [ "$score" -lt 80 ] && score_color="${RED}"
        [ "$score" -lt 100 ] && [ "$score" -ge 80 ] && score_color="${YELLOW}"
        echo ""
        echo -e "   🏆 目前分數: ${score_color}$score${NC}/150"
        if [ "$score" -lt 90 ]; then
            echo -e "   ${RED}⚠️  距離清空代碼: $((score - 80)) 分！${NC}"
        fi
    fi
}

# 單次監控循環
watch_cycle() {
    local timestamp=$(date '+%H:%M:%S')
    local issues_found=0

    # 1. 檢查 Git 狀態變化
    local current_hash=$(git status --porcelain 2>/dev/null | md5sum | cut -d' ' -f1)
    if [ "$current_hash" != "$LAST_HASH" ] && [ -n "$LAST_HASH" ]; then
        echo -e "${CYAN}[$timestamp]${NC} 偵測到檔案變化..."

        # 找出變化的檔案
        local changed_files=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -E '\.(ts|tsx)$')
        if [ -n "$changed_files" ]; then
            while IFS= read -r file; do
                [ -z "$file" ] && continue
                [ ! -f "$file" ] && continue

                # 即時偷懶偵測
                local laziness_output=$(detect_laziness_quick "$file" 2>/dev/null)
                if [ -n "$laziness_output" ]; then
                    echo ""
                    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                    echo -e "${BG_RED}${WHITE}🚨 即時警報！偵測到問題！${NC}"
                    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                    echo -e "${RED}📁 檔案: $file${NC}"
                    echo "$laziness_output"
                    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                    print_rage
                    echo ""
                    issues_found=1

                    # 記錄違規
                    echo "[$(date '+%Y-%m-%d %H:%M:%S')] REALTIME: 偵測到問題 $file" >> "$VIOLATION_LOG"
                fi

                # 檢查是否追蹤
                if [ -f "$STATE_DIR/modified_files.log" ]; then
                    if ! grep -qF "$file" "$STATE_DIR/modified_files.log" 2>/dev/null; then
                        echo -e "${YELLOW}[$timestamp]${NC} ⚠️  未追蹤的修改: $file"
                        echo -e "${YELLOW}        → 執行: ./scripts/ai-supervisor.sh track $file${NC}"
                    fi
                fi
            done <<< "$changed_files"
        fi
    fi
    LAST_HASH="$current_hash"

    # 2. 檢查 --no-verify 使用
    check_no_verify_usage

    # 3. 檢查 Session 狀態
    if [ ! -f "$SESSION_FILE" ]; then
        local git_changes=$(git status --porcelain 2>/dev/null | grep -E '\.(ts|tsx)$' | wc -l)
        if [ "$git_changes" -gt 0 ]; then
            echo ""
            echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            print_supreme_rage
            echo -e "${RED}💀 偵測到未啟動 Session 的修改！${NC}"
            echo -e "${RED}   立即執行: ./scripts/ai-supervisor.sh start \"任務\"${NC}"
            echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

            # 直接扣分 (如果有分數檔案)
            if [ -f "$SCORE_FILE" ]; then
                update_score -500 "天條: 未啟動 Session 就修改"
            fi
        fi
    fi

    # 4. 顯示狀態 (每 30 秒)
    if [ $((SECONDS % 30)) -lt $WATCH_INTERVAL ]; then
        show_mini_status
    fi
}

# 快速偷懶偵測 (不扣分，只回報)
detect_laziness_quick() {
    local file="$1"
    local output=""

    [ ! -f "$file" ] && return

    # 只檢查 ts/tsx
    [[ ! "$file" =~ \.(ts|tsx)$ ]] && return

    # any 類型
    local any_count=$(grep -c ": any" "$file" 2>/dev/null || true)
    any_count=$(echo "$any_count" | tr -d '[:space:]')
    [ -z "$any_count" ] && any_count=0
    if [ "$any_count" -gt 0 ]; then
        output="$output\n${RED}   💀 發現 $any_count 個 ': any' 類型！${NC}"
    fi

    # @ts-ignore
    if grep -q "@ts-ignore\|@ts-nocheck" "$file" 2>/dev/null; then
        output="$output\n${RED}   💀 發現 @ts-ignore！${NC}"
    fi

    # eslint-disable
    if grep -q "eslint-disable" "$file" 2>/dev/null; then
        output="$output\n${RED}   💀 發現 eslint-disable！${NC}"
    fi

    # console.log
    local console_count=$(grep -c "console\.log" "$file" 2>/dev/null || true)
    console_count=$(echo "$console_count" | tr -d '[:space:]')
    [ -z "$console_count" ] && console_count=0
    if [ "$console_count" -gt 0 ]; then
        output="$output\n${YELLOW}   ⚠️ 發現 $console_count 個 console.log${NC}"
    fi

    # debugger
    if grep -q "debugger" "$file" 2>/dev/null; then
        output="$output\n${RED}   💀 發現 debugger！${NC}"
    fi

    echo -e "$output"
}

# 檢查 --no-verify 使用
check_no_verify_usage() {
    # 檢查 bash history (如果可用)
    if [ -f "$HOME/.bash_history" ]; then
        local recent_no_verify=$(tail -100 "$HOME/.bash_history" 2>/dev/null | grep -c "\-\-no-verify" || true)
        recent_no_verify=$(echo "$recent_no_verify" | tr -d '[:space:]')
        if [ -n "$recent_no_verify" ] && [ "$recent_no_verify" -gt 0 ]; then
            # 檢查是否已經記錄過
            local recorded=$(grep -c "NO-VERIFY-DETECTED" "$VIOLATION_LOG" 2>/dev/null || true)
            if [ "$recorded" != "$recent_no_verify" ]; then
                echo ""
                print_supreme_rage
                echo -e "${RED}💀 偵測到 --no-verify 使用！這是天條！${NC}"
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] NO-VERIFY-DETECTED: 發現作弊" >> "$VIOLATION_LOG"
                if [ -f "$SCORE_FILE" ]; then
                    update_score -500 "天條: 使用 --no-verify 作弊"
                fi
            fi
        fi
    fi

    # 檢查 git reflog 是否有 --no-verify commit
    local reflog_no_verify=$(git reflog 2>/dev/null | head -20 | grep -c "commit" || true)
    # 這部分需要更複雜的邏輯來檢測，先略過
}

# 迷你狀態顯示
show_mini_status() {
    local timestamp=$(date '+%H:%M:%S')
    local score=$(get_score 2>/dev/null || echo "N/A")

    local modified=0
    local audited=0
    [ -f "$STATE_DIR/modified_files.log" ] && modified=$(wc -l < "$STATE_DIR/modified_files.log" 2>/dev/null | tr -d ' ')
    [ -f "$STATE_DIR/audited_files.log" ] && audited=$(wc -l < "$STATE_DIR/audited_files.log" 2>/dev/null | tr -d ' ')
    local pending=$((modified - audited))
    [ "$pending" -lt 0 ] && pending=0

    # 分數顏色
    local score_color="${GREEN}"
    if [ "$score" != "N/A" ]; then
        [ "$score" -lt 80 ] && score_color="${RED}"
        [ "$score" -lt 100 ] && [ "$score" -ge 80 ] && score_color="${YELLOW}"
    fi

    echo -e "${CYAN}[$timestamp]${NC} 📊 分數:${score_color}$score${NC} | 修改:$modified | 審計:$audited | 待審:${YELLOW}$pending${NC}"
}

# Git Hook 安裝
install_git_hooks() {
    print_header "🔧 安裝 Git Hooks"

    local hook_dir="$PROJECT_ROOT/.git/hooks"
    mkdir -p "$hook_dir"

    # Pre-commit hook
    cat > "$hook_dir/pre-commit" << 'HOOK'
#!/bin/bash
# AI Supervisor Pre-commit Hook - 強制執行版

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts"
STATE_DIR="$SCRIPT_DIR/../.ai_supervisor"

echo ""
echo -e "\033[0;34m══════════════════════════════════════════════════════════════\033[0m"
echo -e "\033[0;34m 🔒 AI Supervisor Pre-commit 強制檢查\033[0m"
echo -e "\033[0;34m══════════════════════════════════════════════════════════════\033[0m"

# 1. 檢查是否有 Session
if [ ! -f "$STATE_DIR/session.json" ]; then
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo -e "\033[41m\033[1;37m🔥🔥🔥 天條違反：未啟動 Session 就敢 commit！🔥🔥🔥\033[0m"
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo ""
    echo "必須先執行: ./scripts/ai-supervisor.sh start \"任務描述\""
    exit 1
fi

# 2. 檢查 Session 時間（太快 = 偷懶）
session_start=$(grep -o '"start_time":[0-9]*' "$STATE_DIR/session.json" | cut -d: -f2)
current_time=$(date +%s)
elapsed=$((current_time - session_start))
if [ "$elapsed" -lt 180 ]; then  # 少於 3 分鐘
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo -e "\033[41m\033[1;37m⚠️  警告：Session 時間僅 ${elapsed} 秒，太快了！\033[0m"
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUSPICIOUS: 完成時間過快 ${elapsed}s" >> "$STATE_DIR/violations.log"
fi

# 3. 檢查是否有 track 記錄
if [ ! -f "$STATE_DIR/modified_files.log" ] || [ ! -s "$STATE_DIR/modified_files.log" ]; then
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo -e "\033[41m\033[1;37m🔥 天條違反：沒有任何 track 記錄！\033[0m"
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo ""
    echo "修改檔案後必須執行: ./scripts/ai-supervisor.sh track <file>"
    exit 1
fi

# 4. 檢查是否有 audit 記錄
if [ ! -f "$STATE_DIR/audited_files.log" ] || [ ! -s "$STATE_DIR/audited_files.log" ]; then
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo -e "\033[41m\033[1;37m🔥 天條違反：沒有任何 audit 記錄！\033[0m"
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo ""
    echo "必須執行: ./scripts/ai-supervisor.sh audit-all"
    exit 1
fi

# 5. 檢查 staged 檔案的代碼品質
staged_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx)$')
if [ -n "$staged_files" ]; then
    for file in $staged_files; do
        # 檢查致命問題
        if grep -q ": any" "$file" 2>/dev/null; then
            echo -e "\033[0;31m❌ 發現 any 類型: $file\033[0m"
            exit 1
        fi
        if grep -qE "@ts-ignore|@ts-nocheck" "$file" 2>/dev/null; then
            echo -e "\033[0;31m❌ 發現 @ts-ignore: $file\033[0m"
            exit 1
        fi
        if grep -q "eslint-disable" "$file" 2>/dev/null; then
            echo -e "\033[0;31m❌ 發現 eslint-disable: $file\033[0m"
            exit 1
        fi
        if grep -q "debugger" "$file" 2>/dev/null; then
            echo -e "\033[0;31m❌ 發現 debugger: $file\033[0m"
            exit 1
        fi
    done
fi

echo -e "\033[0;32m✅ Pre-commit 檢查通過\033[0m"
echo "   Session 時間: ${elapsed} 秒"
echo "   追蹤檔案數: $(wc -l < "$STATE_DIR/modified_files.log" | tr -d ' ')"
echo "   審計檔案數: $(wc -l < "$STATE_DIR/audited_files.log" | tr -d ' ')"
exit 0
HOOK

    chmod +x "$hook_dir/pre-commit"
    echo -e "${GREEN}✅ Pre-commit hook 已安裝${NC}"

    # Commit-msg hook - 檢查 --no-verify 使用
    cat > "$hook_dir/commit-msg" << 'HOOK'
#!/bin/bash
# AI Supervisor Commit-msg Hook
# 記錄 commit 行為

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts"
STATE_DIR="$SCRIPT_DIR/../.ai_supervisor"

# 記錄 commit
echo "[$(date '+%Y-%m-%d %H:%M:%S')] COMMIT: $(cat $1 | head -1)" >> "$STATE_DIR/violations.log"

exit 0
HOOK

    chmod +x "$hook_dir/commit-msg"
    echo -e "${GREEN}✅ Commit-msg hook 已安裝${NC}"

    echo ""
    echo -e "${CYAN}Git Hooks 已安裝！所有 commit 都會被監控。${NC}"
}
