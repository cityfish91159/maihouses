#!/bin/bash
# ============================================================================
# AI Supervisor - 反作弊模組
# ============================================================================
#
# 核心原則：讓作弊的成本遠高於正當做事
#
# 防堵策略：
# 1. 多重驗證 - Git + 檔案 Hash + 時間戳
# 2. 交叉檢查 - 本地 + 遠端 + 監控
# 3. 不可繞過 - 伺服器端 CI/CD
# 4. 即時偵測 - 毫秒級反應
# 5. 重罰機制 - 作弊代價極高
#
# ============================================================================

# ============================================================================
# 1. 檔案 Hash 追蹤 - 偵測偷改
# ============================================================================

# 記錄檔案 hash
record_file_hash() {
    local file="$1"
    local hash_file="$STATE_DIR/file_hashes.log"

    [ ! -f "$file" ] && return

    local hash=$(md5sum "$file" 2>/dev/null | cut -d' ' -f1)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "$timestamp|$file|$hash" >> "$hash_file"
}

# 驗證檔案未被偷改
verify_file_integrity() {
    local file="$1"
    local hash_file="$STATE_DIR/file_hashes.log"

    [ ! -f "$hash_file" ] && return 0
    [ ! -f "$file" ] && return 0

    local current_hash=$(md5sum "$file" 2>/dev/null | cut -d' ' -f1)
    local last_recorded=$(grep "|$file|" "$hash_file" | tail -1 | cut -d'|' -f3)

    if [ -n "$last_recorded" ] && [ "$current_hash" != "$last_recorded" ]; then
        echo -e "${RED}⚠️ 檔案 hash 不符！可能被偷改：$file${NC}"
        return 1
    fi

    return 0
}

# ============================================================================
# 2. Git 狀態交叉檢查 - 偵測未追蹤修改
# ============================================================================

# 全面檢查 Git 狀態
comprehensive_git_check() {
    print_header "🔍 Git 狀態檢查"

    local violations=0

    # 1. 未追蹤的新檔案 (|| true 防止 pipefail 退出)
    local untracked=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
    if [ -n "$untracked" ]; then
        echo -e "${RED}❌ 發現未追蹤的新檔案：${NC}"
        echo "$untracked"
        violations=$((violations + 1))
    fi

    # 2. 修改但未 staged (|| true 防止 pipefail 退出)
    local modified=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
    if [ -n "$modified" ]; then
        echo -e "${YELLOW}⚠️ 修改但未 staged：${NC}"
        echo "$modified"
        # 檢查是否在追蹤清單中
        while IFS= read -r file; do
            [ -z "$file" ] && continue
            if ! grep -qF "$file" "$STATE_DIR/modified_files.log" 2>/dev/null; then
                echo -e "${RED}   ❌ 未追蹤的修改: $file${NC}"
                violations=$((violations + 1))
            fi
        done <<< "$modified"
    fi

    # 3. 檢查 stash (可能藏代碼)
    local stash_count=$(git stash list 2>/dev/null | wc -l)
    if [ "$stash_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠️ 發現 $stash_count 個 stash (可能藏代碼)${NC}"
    fi

    # 4. 檢查最近的 commit 訊息
    local recent_commits=$(git log --oneline -5 2>/dev/null)
    echo ""
    echo -e "${CYAN}最近 5 個 commit：${NC}"
    echo "$recent_commits"

    if [ "$violations" -gt 0 ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}發現 $violations 個可疑操作！${NC}"
        return 1
    fi

    echo ""
    echo -e "${GREEN}✅ Git 狀態檢查通過${NC}"
    return 0
}

# ============================================================================
# 3. --no-verify 偵測 - 最嚴重的作弊
# ============================================================================

# 偵測 --no-verify 使用
detect_no_verify() {
    local detected=0

    # 方法 1: 檢查 bash history
    if [ -f "$HOME/.bash_history" ]; then
        local no_verify_count=$(grep -c "\-\-no-verify" "$HOME/.bash_history" 2>/dev/null || true)
        no_verify_count=$(echo "$no_verify_count" | tr -d '[:space:]')
        if [ -n "$no_verify_count" ] && [ "$no_verify_count" -gt 0 ]; then
            detected=1
        fi
    fi

    # 方法 2: 檢查 .git/logs/HEAD 看是否有跳過 hook 的 commit
    # (這個比較難檢測，因為 --no-verify 不會留下直接痕跡)

    # 方法 3: 環境變數檢查
    if [ -n "$GIT_SKIP_HOOKS" ]; then
        detected=1
    fi

    if [ "$detected" -eq 1 ]; then
        print_supreme_rage
        echo -e "${RED}💀 偵測到 --no-verify 使用！這是天條中的天條！${NC}"
        update_score -500 "天條: 使用 --no-verify 作弊"
        return 1
    fi

    return 0
}

# ============================================================================
# 4. 時間戳異常偵測 - 偵測時間旅行作弊
# ============================================================================

# 檢查修改時間是否合理
check_modification_times() {
    local session_start=$(grep -o '"start_time":[0-9]*' "$SESSION_FILE" 2>/dev/null | cut -d: -f2)
    [ -z "$session_start" ] && return 0

    local suspicious=0

    while IFS= read -r file; do
        [ -z "$file" ] && continue
        [ ! -f "$file" ] && continue

        local file_mtime=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
        if [ -n "$file_mtime" ] && [ "$file_mtime" -lt "$session_start" ]; then
            echo -e "${YELLOW}⚠️ 檔案修改時間早於 Session 開始: $file${NC}"
            suspicious=$((suspicious + 1))
        fi
    done < "$STATE_DIR/modified_files.log"

    if [ "$suspicious" -gt 0 ]; then
        echo -e "${YELLOW}發現 $suspicious 個時間戳異常，可能是預先準備的代碼${NC}"
    fi
}

# ============================================================================
# 5. 強制審計鎖 - 不審計就不能繼續
# ============================================================================

# 檢查審計進度
enforce_audit_progress() {
    local modified_count=0
    local audited_count=0
    local pending=0

    [ -f "$STATE_DIR/modified_files.log" ] && modified_count=$(wc -l < "$STATE_DIR/modified_files.log" | tr -d ' ')
    [ -f "$STATE_DIR/audited_files.log" ] && audited_count=$(wc -l < "$STATE_DIR/audited_files.log" | tr -d ' ')

    pending=$((modified_count - audited_count))
    [ "$pending" -lt 0 ] && pending=0

    # 超過 5 個未審計就強制停止
    if [ "$pending" -gt 5 ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🛑 強制停止！待審計檔案過多 ($pending 個)${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${RED}你必須先審計這些檔案才能繼續：${NC}"
        if [ -f "$STATE_DIR/audited_files.log" ]; then
            comm -23 <(sort -u "$STATE_DIR/modified_files.log") <(sort -u "$STATE_DIR/audited_files.log") 2>/dev/null
        else
            cat "$STATE_DIR/modified_files.log"
        fi
        echo ""
        echo -e "${YELLOW}執行: ./scripts/ai-supervisor.sh audit-all${NC}"

        # 每多一個未審計就扣分
        update_score $((pending * -2)) "未審計堆積: $pending 個"

        return 1
    fi

    return 0
}

# ============================================================================
# 6. 代碼量監控 - 防止偷刪代碼
# ============================================================================

# 追蹤代碼行數變化
track_code_changes() {
    local baseline_file="$STATE_DIR/code_baseline.txt"
    local current_lines=0

    # 計算當前 src/ 總行數
    if [ -d "$PROJECT_ROOT/src" ]; then
        current_lines=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
    fi

    # 如果有基準，比較變化
    if [ -f "$baseline_file" ]; then
        local baseline=$(cat "$baseline_file")
        local diff=$((current_lines - baseline))

        echo -e "${CYAN}代碼行數變化: $baseline → $current_lines (${diff:+$diff}${diff:--$diff})${NC}"

        # 大量刪減可能是作弊
        if [ "$diff" -lt -100 ]; then
            echo -e "${YELLOW}⚠️ 大量代碼刪減 ($diff 行)，請確認是合理重構${NC}"
        fi
    else
        # 建立基準
        echo "$current_lines" > "$baseline_file"
        echo -e "${CYAN}代碼基準已建立: $current_lines 行${NC}"
    fi
}

# ============================================================================
# 7. 防止刪除監控目錄
# ============================================================================

# 檢查監控目錄完整性
check_state_dir_integrity() {
    local required_files=(
        "$STATE_DIR"
        "$STATE_DIR/session.json"
        "$STATE_DIR/score.json"
        "$STATE_DIR/modified_files.log"
    )

    for f in "${required_files[@]}"; do
        if [ ! -e "$f" ] && [ -f "$STATE_DIR/session.json" ]; then
            # Session 存在但其他檔案不見了 = 可疑
            echo -e "${RED}⚠️ 監控檔案被刪除: $f${NC}"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] TAMPER: 監控檔案被刪除 $f" >> "$VIOLATION_LOG"
            update_score -100 "作弊: 刪除監控檔案"
        fi
    done
}

# ============================================================================
# 8. 防止切換分支逃避
# ============================================================================

# 記錄當前分支
record_branch() {
    local branch=$(git branch --show-current 2>/dev/null)
    echo "$branch" > "$STATE_DIR/current_branch.txt"
}

# 檢查分支是否被切換
check_branch_switch() {
    local recorded_branch=""
    [ -f "$STATE_DIR/current_branch.txt" ] && recorded_branch=$(cat "$STATE_DIR/current_branch.txt")

    local current_branch=$(git branch --show-current 2>/dev/null)

    if [ -n "$recorded_branch" ] && [ "$current_branch" != "$recorded_branch" ]; then
        echo -e "${RED}⚠️ 分支被切換！$recorded_branch → $current_branch${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] BRANCH-SWITCH: $recorded_branch → $current_branch" >> "$VIOLATION_LOG"
        update_score -50 "可疑: 分支被切換"
        return 1
    fi
    return 0
}

# ============================================================================
# 9. 防止修改腳本本身
# ============================================================================

# 記錄腳本 hash
record_script_hashes() {
    local hash_file="$STATE_DIR/script_hashes.txt"
    find "$SCRIPT_DIR" -name "*.sh" -exec md5sum {} \; > "$hash_file" 2>/dev/null
}

# 檢查腳本是否被篡改
check_script_tampering() {
    local hash_file="$STATE_DIR/script_hashes.txt"
    [ ! -f "$hash_file" ] && return 0

    local tampering=0
    while IFS= read -r line; do
        local expected_hash=$(echo "$line" | cut -d' ' -f1)
        local script_path=$(echo "$line" | cut -d' ' -f3-)

        if [ -f "$script_path" ]; then
            local current_hash=$(md5sum "$script_path" 2>/dev/null | cut -d' ' -f1)
            if [ "$current_hash" != "$expected_hash" ]; then
                echo -e "${BG_RED}${WHITE}🚨 腳本被篡改: $script_path${NC}"
                tampering=1
            fi
        fi
    done < "$hash_file"

    if [ "$tampering" -eq 1 ]; then
        print_supreme_rage
        echo -e "${RED}💀 偵測到腳本篡改！這是最嚴重的作弊！${NC}"
        update_score -1000 "天條: 篡改監控腳本"
        return 1
    fi

    return 0
}

# ============================================================================
# 10. 監控檔案唯讀保護
# ============================================================================

# 鎖定監控目錄 (設為唯讀)
lock_state_dir() {
    echo -e "${CYAN}🔒 鎖定監控目錄...${NC}"

    # 設定關鍵檔案為唯讀
    chmod 444 "$STATE_DIR/session.json" 2>/dev/null
    chmod 444 "$STATE_DIR/score.json" 2>/dev/null
    chmod 444 "$STATE_DIR/violations.log" 2>/dev/null
    chmod 444 "$SCRIPT_DIR"/*.sh 2>/dev/null
    chmod 444 "$SCRIPT_DIR/lib"/*.sh 2>/dev/null

    # 設定目錄為唯讀 (但允許讀取)
    chmod 555 "$STATE_DIR" 2>/dev/null
    chmod 555 "$SCRIPT_DIR/lib" 2>/dev/null

    echo -e "${GREEN}✅ 監控目錄已鎖定！AI 無法修改${NC}"
    echo ""
    echo -e "${YELLOW}要解鎖請執行: sudo ./scripts/ai-supervisor.sh unlock${NC}"
}

# 解鎖監控目錄 (需要用戶手動執行)
unlock_state_dir() {
    echo -e "${YELLOW}⚠️  即將解鎖監控目錄${NC}"
    echo -e "${RED}這會讓 AI 可以修改監控檔案！${NC}"
    read -p "確定要解鎖嗎？(輸入 YES 確認): " confirm

    if [ "$confirm" = "YES" ]; then
        chmod 644 "$STATE_DIR"/*.json 2>/dev/null
        chmod 644 "$STATE_DIR"/*.log 2>/dev/null
        chmod 755 "$STATE_DIR" 2>/dev/null
        chmod 755 "$SCRIPT_DIR"/*.sh 2>/dev/null
        chmod 755 "$SCRIPT_DIR/lib"/*.sh 2>/dev/null
        chmod 755 "$SCRIPT_DIR/lib" 2>/dev/null
        echo -e "${GREEN}✅ 已解鎖${NC}"
    else
        echo -e "${CYAN}已取消${NC}"
    fi
}

# 檢查是否被強行解鎖
check_lock_status() {
    local violations=0

    # 檢查關鍵檔案權限
    if [ -f "$STATE_DIR/session.json" ]; then
        local perms=$(stat -c %a "$STATE_DIR/session.json" 2>/dev/null || stat -f %Lp "$STATE_DIR/session.json" 2>/dev/null)
        if [ "$perms" != "444" ] && [ "$perms" != "555" ]; then
            echo -e "${RED}⚠️ session.json 權限被更改！(當前: $perms)${NC}"
            violations=$((violations + 1))
        fi
    fi

    if [ "$violations" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}🚨 偵測到監控檔案被解鎖！可能有作弊企圖！${NC}"
        update_score -200 "作弊: 非法解鎖監控檔案"
        return 1
    fi

    return 0
}

# ============================================================================
# 11. 全面反作弊檢查
# ============================================================================

# 執行所有反作弊檢查
run_anti_cheat_check() {
    print_header "🛡️ 反作弊全面檢查"

    local violations=0

    echo "1️⃣  檢查 --no-verify..."
    if ! detect_no_verify; then
        violations=$((violations + 1))
    else
        echo -e "${GREEN}   ✅ 無 --no-verify 作弊${NC}"
    fi

    echo ""
    echo "2️⃣  檢查 Git 狀態..."
    if ! comprehensive_git_check; then
        violations=$((violations + 1))
    fi

    echo ""
    echo "3️⃣  檢查審計進度..."
    if ! enforce_audit_progress; then
        violations=$((violations + 1))
    else
        echo -e "${GREEN}   ✅ 審計進度正常${NC}"
    fi

    echo ""
    echo "4️⃣  檢查時間戳..."
    check_modification_times

    echo ""
    echo "5️⃣  追蹤代碼量..."
    track_code_changes

    echo ""
    if [ "$violations" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}❌ 反作弊檢查失敗！發現 $violations 個問題${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        return 1
    fi

    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 反作弊檢查通過${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    return 0
}
