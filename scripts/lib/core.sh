#!/bin/bash
# ============================================================================
# AI Supervisor - 核心模組 (分數 + Session)
# ============================================================================

# 狀態檔案路徑 (由主程式設定)
# STATE_DIR, SCORE_FILE, SESSION_FILE, VIOLATION_LOG, RAGE_LOG

AUTO_RESTART_THRESHOLD=80

# ============================================================================
# 分數管理
# ============================================================================

# 取得當前分數
get_score() {
    if [ -f "$SCORE_FILE" ]; then
        grep -o '"score":[0-9-]*' "$SCORE_FILE" | cut -d: -f2 || echo 100
    else
        echo 100
    fi
}

# 更新分數
update_score() {
    local delta="$1"
    local reason="$2"

    local current_score=$(get_score)
    local new_score=$((current_score + delta))

    # 分數無上下限 - 讓 AI 知道犯錯的代價和優秀的獎勵都是真實的
    # 負分 = 債務，必須還清才能脫身
    # 正分 = 信用，越高越好

    # 寫入分數
    echo "{\"score\":$new_score,\"last_update\":\"$(date '+%Y-%m-%d %H:%M:%S')\",\"reason\":\"$reason\"}" > "$SCORE_FILE"

    # 即時回報
    local delta_str="$delta"
    [ "$delta" -gt 0 ] && delta_str="+$delta"
    echo -e "${CYAN}📊 分數: $current_score → $new_score ($delta_str) | $reason${NC}"

    # 階段性警告
    if [ "$new_score" -lt 90 ] && [ "$new_score" -ge 85 ]; then
        warn "分數 $new_score - 再扣 $((new_score - 80)) 分就要重來！"
    elif [ "$new_score" -lt 85 ] && [ "$new_score" -ge 80 ]; then
        error "分數 $new_score - 懸崖邊緣！"
        print_rage
    fi

    # 80 分以下：清空所有代碼 + 強制重來
    if [ "$new_score" -lt "$AUTO_RESTART_THRESHOLD" ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}💀💀💀 分數低於 ${AUTO_RESTART_THRESHOLD}！啟動代碼清洗！💀💀💀${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${WHITE}最終分數: ${RED}$new_score${NC}"
        echo -e "${WHITE}致命原因: ${RED}$reason${NC}"
        echo ""

        # 🔥 清空本次 Session 修改的所有代碼
        if [ -f "$STATE_DIR/modified_files.log" ]; then
            echo -e "${RED}🗑️  正在清空本次修改的代碼...${NC}"
            while IFS= read -r file; do
                [ -z "$file" ] && continue
                if [ -f "$file" ]; then
                    # 使用 git checkout 還原檔案
                    if git checkout HEAD -- "$file" 2>/dev/null; then
                        echo -e "${RED}   ↩️  已還原: $file${NC}"
                    else
                        echo -e "${YELLOW}   ⚠️  無法還原 (可能是新檔案): $file${NC}"
                        # 如果是新檔案，直接刪除
                        rm -f "$file" 2>/dev/null && echo -e "${RED}   🗑️  已刪除: $file${NC}"
                    fi
                fi
            done < "$STATE_DIR/modified_files.log"
            echo ""
            echo -e "${RED}💀 所有本次修改的代碼已被清空！${NC}"
        fi

        # 記錄
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] CODE-WIPE: score=$new_score reason=$reason" >> "$VIOLATION_LOG"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] CODE-WIPE: 已清空所有修改" >> "$RAGE_LOG"

        # 清除 session
        rm -f "$SESSION_FILE"

        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🔄 從頭再來！執行: ./scripts/ai-supervisor.sh start \"任務\"${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        exit 1
    fi
}

# ============================================================================
# 即時監控
# ============================================================================

# 即時監控狀態
realtime_monitor() {
    print_header "📡 即時監控"

    # Session 狀態
    if [ -f "$SESSION_FILE" ]; then
        local task=$(grep -o '"task":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)
        local start=$(grep -o '"start_datetime":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)
        echo -e "${WHITE}任務: ${CYAN}$task${NC}"
        echo -e "${WHITE}開始: $start${NC}"
    else
        echo -e "${YELLOW}無活躍 Session${NC}"
        return
    fi

    # 分數
    local score=$(get_score)
    local score_color="${GREEN}"
    [ "$score" -lt 80 ] && score_color="${RED}"
    [ "$score" -lt 100 ] && [ "$score" -ge 80 ] && score_color="${YELLOW}"
    echo -e "${WHITE}分數: ${score_color}$score${NC}"

    # 距離死亡
    local to_death=$((score - 80))
    if [ "$to_death" -le 20 ]; then
        echo -e "${RED}⚠️  距離清空代碼: $to_death 分${NC}"
    fi

    # 檔案統計
    echo ""
    local modified=0 audited=0 pending=0
    [ -f "$STATE_DIR/modified_files.log" ] && modified=$(wc -l < "$STATE_DIR/modified_files.log" | tr -d ' ')
    [ -f "$STATE_DIR/audited_files.log" ] && audited=$(wc -l < "$STATE_DIR/audited_files.log" | tr -d ' ')
    pending=$((modified - audited))
    [ "$pending" -lt 0 ] && pending=0

    echo -e "${WHITE}修改: $modified | 審計: $audited | 待審: ${YELLOW}$pending${NC}"

    # 待審計清單
    if [ "$pending" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}待審計檔案:${NC}"
        comm -23 <(sort -u "$STATE_DIR/modified_files.log") <(sort -u "$STATE_DIR/audited_files.log" 2>/dev/null || echo "") 2>/dev/null | head -5
    fi

    # 違規統計
    if [ -f "$VIOLATION_LOG" ]; then
        local violations=$(wc -l < "$VIOLATION_LOG" | tr -d ' ')
        [ "$violations" -gt 0 ] && echo -e "${RED}違規次數: $violations${NC}"
    fi

    return 0
}

# ============================================================================
# Session 管理
# ============================================================================

# 檢查 Session
check_session() {
    if [ ! -f "$SESSION_FILE" ]; then
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}沒有活躍的 Session！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}請先執行: ./scripts/ai-supervisor.sh start \"任務描述\"${NC}"
        update_score -20 "未啟動 Session 就操作"
        exit 1
    fi
}

# 開始 Session
start_session() {
    local task="$1"

    if [ -z "$task" ]; then
        error "請提供任務描述"
        echo "用法: ./scripts/ai-supervisor.sh start \"任務描述\""
        exit 1
    fi

    # 清理舊檔案
    rm -f "$STATE_DIR"/*.log "$STATE_DIR"/*.flag 2>/dev/null
    touch "$STATE_DIR/violations.log" "$STATE_DIR/modified_files.log" "$STATE_DIR/audited_files.log"

    # 建立 Session
    local session_id=$(date '+%Y%m%d%H%M%S')
    local now=$(date +%s)
    local now_str=$(date '+%Y-%m-%d %H:%M:%S')

    cat > "$SESSION_FILE" << EOF
{"session_id":"$session_id","task":"$task","start_time":$now,"start_datetime":"$now_str","status":"active"}
EOF

    # 初始化分數
    echo "{\"score\":100,\"last_update\":\"$now_str\",\"reason\":\"Session 開始\"}" > "$SCORE_FILE"

    print_header "🚀 任務開始"
    echo -e "${WHITE}任務: ${CYAN}$task${NC}"
    echo -e "${WHITE}Session: ${CYAN}$session_id${NC}"
    echo -e "${WHITE}分數: ${GREEN}100${NC}"
    echo ""
    echo -e "${YELLOW}接下來你應該:${NC}"
    echo "  1. 閱讀相關檔案"
    echo "  2. 修改代碼後執行: audit <file>"
    echo "  3. 完成後執行: finish"
}

# 結束 Session
finish_session() {
    check_session

    local task=$(grep -o '"task":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)
    local score=$(get_score)

    # 檢查未審計檔案
    if [ -f "$STATE_DIR/modified_files.log" ] && [ -f "$STATE_DIR/audited_files.log" ]; then
        local pending=$(comm -23 <(sort -u "$STATE_DIR/modified_files.log") <(sort -u "$STATE_DIR/audited_files.log" 2>/dev/null || echo "") 2>/dev/null | wc -l | tr -d ' ')
        if [ "$pending" -gt 0 ]; then
            error "還有 $pending 個檔案未審計！"
            echo "請先執行: audit-all"
            update_score -10 "未審計就想結束"
            exit 1
        fi
    fi

    print_header "🏁 任務完成"
    echo -e "${WHITE}任務: ${CYAN}$task${NC}"
    echo -e "${WHITE}最終分數: ${GREEN}$score${NC}"

    if [ "$score" -ge 90 ]; then
        echo -e "${GREEN}🏆 優秀！${NC}"
    elif [ "$score" -ge 80 ]; then
        echo -e "${YELLOW}👍 及格${NC}"
    else
        echo -e "${RED}⚠️ 需改進${NC}"
    fi

    # 清除 session
    rm -f "$SESSION_FILE"
}

# 顯示狀態
show_status() {
    print_header "📊 狀態"

    if [ -f "$SESSION_FILE" ]; then
        local task=$(grep -o '"task":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)
        local start=$(grep -o '"start_datetime":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)
        echo -e "${WHITE}任務: ${CYAN}$task${NC}"
        echo -e "${WHITE}開始: ${CYAN}$start${NC}"
    else
        echo -e "${YELLOW}無活躍 Session${NC}"
    fi

    echo -e "${WHITE}分數: ${CYAN}$(get_score)${NC}"

    # 檔案統計
    local modified=0 audited=0 pending=0
    [ -f "$STATE_DIR/modified_files.log" ] && modified=$(wc -l < "$STATE_DIR/modified_files.log" | tr -d ' ')
    [ -f "$STATE_DIR/audited_files.log" ] && audited=$(wc -l < "$STATE_DIR/audited_files.log" | tr -d ' ')
    pending=$((modified - audited))
    [ "$pending" -lt 0 ] && pending=0

    echo ""
    echo -e "${WHITE}已修改: ${CYAN}$modified${NC}"
    echo -e "${WHITE}已審計: ${CYAN}$audited${NC}"
    echo -e "${WHITE}待審計: ${YELLOW}$pending${NC}"
}
