#!/bin/bash
# ============================================================================
# AI Supervisor - 審計模組 (全面扣分系統)
# ============================================================================
#
# 扣分原則：
# - 致命錯誤 (A級)：-15 ~ -25 分，審計必失敗
# - 嚴重錯誤 (B級)：-8 ~ -12 分，累積會失敗
# - 一般錯誤 (C級)：-3 ~ -6 分，扣分但可通過
# - 警告 (D級)：-1 ~ -2 分，提醒但影響小
#
# ============================================================================

# ============================================================================
# 扣分常數定義
# ============================================================================

# A級 - 致命錯誤 (審計必死)
readonly PENALTY_ANY_TYPE=-15           # : any 類型
readonly PENALTY_AS_ANY=-20             # as any 更惡劣
readonly PENALTY_TS_IGNORE=-15          # @ts-ignore
readonly PENALTY_TS_NOCHECK=-25         # @ts-nocheck (整檔跳過)
readonly PENALTY_ESLINT_DISABLE=-15     # eslint-disable
readonly PENALTY_ESLINT_DISABLE_FILE=-25 # eslint-disable 整檔
readonly PENALTY_DEBUGGER=-20           # debugger 遺留
readonly PENALTY_EMPTY_CATCH=-12        # 空 catch 吞錯誤
readonly PENALTY_SILENT_FAIL=-15        # catch return null

# B級 - 嚴重錯誤
readonly PENALTY_CONSOLE_LOG=-8         # console.log
readonly PENALTY_CONSOLE_ERROR=-5       # console.error (比 log 輕)
readonly PENALTY_LOOSE_TYPE=-10         # Function/Object/{} 類型
readonly PENALTY_DOM_DIRECT=-10         # 直接 DOM 操作
readonly PENALTY_INDEX_AS_KEY=-10       # index 作為 React key
readonly PENALTY_NO_ERROR_HANDLING=-10  # Promise 無 catch
readonly PENALTY_HARDCODED_CHINESE=-8   # 硬編碼中文 (組件)
readonly PENALTY_HOOK_CHINESE=-15       # Hook 中硬編碼中文
readonly PENALTY_NO_EMPTY_STATE=-12     # List/Table 無 Empty State
readonly PENALTY_MAGIC_NUMBER=-6        # 魔術數字
readonly PENALTY_LONG_FILE=-8           # 檔案超過 300 行
readonly PENALTY_VERY_LONG_FILE=-15     # 檔案超過 500 行

# C級 - 一般錯誤
readonly PENALTY_LONG_FUNCTION=-5       # 函數超過 60 行
readonly PENALTY_VERY_LONG_FUNCTION=-8  # 函數超過 100 行
readonly PENALTY_INLINE_STYLE=-4        # inline style
readonly PENALTY_COMPLEX_INLINE=-5      # 複雜 inline handler
readonly PENALTY_NO_USECALLBACK=-4      # handler 未用 useCallback
readonly PENALTY_NO_MEMO=-3             # 純展示組件未用 memo
readonly PENALTY_NESTED_TERNARY=-5      # 巢狀三元運算子
readonly PENALTY_DEEP_NESTING=-6        # 深層巢狀 (>4層)
readonly PENALTY_TODO_FIXME=-3          # TODO/FIXME 未處理
readonly PENALTY_DUPLICATE_CODE=-5      # 重複代碼區塊

# D級 - 警告
readonly PENALTY_SKIP_PREWRITE=-2       # 跳過 pre-write
readonly PENALTY_NO_JSDOC=-2            # API 函數無 JSDoc
readonly PENALTY_ZINDEX_MAGIC=-2        # z-index 魔術數字
readonly PENALTY_MISSING_ARIALABEL=-2   # 互動元素無 aria-label
readonly PENALTY_IMPORT_STAR=-2         # import * 全部引入

# 流程違規 (獨立計算)
readonly PENALTY_UNTRACKED_MODIFY=-20   # 未追蹤的修改
readonly PENALTY_UNAUDITED_FILE=-5      # 未審計檔案
readonly PENALTY_IGNORE_TERMINAL_ERROR=-20  # 忽略終端錯誤（第二次起）

# ============================================================================
# 🔥🔥🔥 天條中的天條 - 違反者死無全屍 🔥🔥🔥
# ============================================================================
readonly PENALTY_NO_SESSION=-500        # 未啟動 Session 操作
readonly PENALTY_NO_VERIFY=-500         # 使用 --no-verify 繞過
readonly PENALTY_NO_RESULT_LOG=-500     # 未記錄施作結果

# ============================================================================
# 🏆 精簡代碼獎勵系統 - 讓「省力」=「優化」
# ============================================================================
# 原則：短而有效的代碼獲得獎勵，冗長肥大的代碼被懲罰

# 獎勵 (正分) - 讓 AI 有動力寫好代碼！
readonly BONUS_CONCISE_FILE=5           # 檔案 < 100 行
readonly BONUS_VERY_CONCISE=10          # 檔案 < 50 行
readonly BONUS_SHORT_FUNCTION=3         # 函數 < 20 行
readonly BONUS_NO_REDUNDANCY=5          # 無重複代碼
readonly BONUS_PURE_FUNCTION=3          # 純函數 (無副作用)
readonly BONUS_SINGLE_RESPONSIBILITY=5  # 單一職責 (函數只做一件事)
readonly BONUS_NET_REDUCTION=8          # 代碼淨減少

# 🏆 新增獎勵 - 最佳實踐
readonly BONUS_PROPER_TYPES=8           # 使用正確的 interface/type（無 any）
readonly BONUS_REACT_MEMO=5             # 使用 React.memo 優化
readonly BONUS_USE_CALLBACK=5           # 正確使用 useCallback/useMemo
readonly BONUS_ERROR_BOUNDARY=8         # 使用 ErrorBoundary
readonly BONUS_I18N=10                  # 使用 i18n（無硬編碼字串）
readonly BONUS_A11Y=8                   # 完整 a11y（aria-label, role 等）
readonly BONUS_CLEAN_IMPORTS=3          # import 整潔（無 unused, 有排序）
readonly BONUS_GOOD_NAMING=5            # 命名規範（語義化變數名）
readonly BONUS_EARLY_RETURN=3           # 使用 early return 模式
readonly BONUS_CONST_ENUM=5             # 使用 const/enum 取代魔術數字
readonly BONUS_JSDOC=3                  # API 函數有 JSDoc
readonly BONUS_TEST_COVERAGE=15         # 有對應的測試檔案

# 🏆 進階獎勵
readonly BONUS_CUSTOM_HOOK=10           # 抽取自定義 Hook
readonly BONUS_ERROR_HANDLING=8         # 完整錯誤處理（try-catch + 用戶提示）
readonly BONUS_LOADING_STATE=5          # 處理 loading 狀態
readonly BONUS_EMPTY_STATE=5            # 處理空狀態
readonly BONUS_CONTEXT_PROVIDER=8       # 正確使用 Context
readonly BONUS_FORM_VALIDATION=10       # 完整表單驗證
readonly BONUS_OPTIMISTIC_UPDATE=12     # 樂觀更新（先顯示再確認）
readonly BONUS_DEBOUNCE_THROTTLE=5      # 使用 debounce/throttle
readonly BONUS_LAZY_LOAD=8              # 使用 lazy/Suspense
readonly BONUS_CODE_SPLIT=10            # 代碼分割

# 懲罰 (額外)
readonly PENALTY_OVER_ENGINEERING=-10   # 過度工程化
readonly PENALTY_UNNECESSARY_ABSTRACTION=-8  # 不必要的抽象
readonly PENALTY_BLOAT_CODE=-6          # 膨脹代碼 (可用更短方式)
readonly PENALTY_REDUNDANT_IMPORT=-3    # 多餘的 import
readonly PENALTY_UNUSED_VAR=-4          # 未使用的變數
readonly PENALTY_DEAD_CODE=-5           # 死代碼 (永不執行)

# ============================================================================
# 審計檔案
# ============================================================================

# 審計單一檔案
audit_file() {
    local file="$1"
    local total_penalty=0
    local critical_count=0
    local severe_count=0
    local issues=""

    # 檔案不存在 → 標記為已審計（跳過）並返回成功
    if [ ! -f "$file" ]; then
        echo "$file" >> "$STATE_DIR/audited_files.log"
        echo -e "${YELLOW}⏭️  跳過 (檔案不存在): $file${NC}"
        return 0
    fi

    # 🔥🔥🔥 天條：編輯監控腳本 = 直接歸零（必須在其他檢查之前！）🔥🔥🔥
    if [[ "$file" =~ scripts/ai-supervisor ]] || [[ "$file" =~ scripts/lib/.+\.sh$ ]]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🔥🔥🔥 天條違反：企圖篡改監控腳本！🔥🔥🔥${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${WHITE}檔案: ${RED}$file${NC}"
        echo -e "${WHITE}懲罰: ${RED}分數直接歸零，所有代碼清空${NC}"
        echo ""
        print_supreme_rage
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] TAMPER-ATTEMPT: $file" >> "$VIOLATION_LOG"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] TAMPER-ATTEMPT: AI 企圖篡改監控腳本！" >> "$RAGE_LOG"

        # 🔥🔥🔥 真正的死刑：清空所有代碼 + 重置分數 🔥🔥🔥
        # 呼叫 wipe_all_changes (定義在 watcher.sh)
        if type wipe_all_changes &>/dev/null; then
            wipe_all_changes "天條違反: 篡改監控腳本 $file"
        else
            # 備用方案：手動執行清空
            echo -e "${RED}正在清空所有修改...${NC}"
            git checkout -- . 2>/dev/null
            git clean -fd src/ 2>/dev/null
            rm -f "$STATE_DIR/modified_files.log" 2>/dev/null
            rm -f "$STATE_DIR/audited_files.log" 2>/dev/null
            echo '{"score": 100, "history": []}' > "$SCORE_FILE"
            echo -e "${GREEN}✅ 已清空，分數重置為 100${NC}"
        fi
        return 1
    fi

    # Markdown 文件 → 靜默跳過
    if [[ "$file" =~ \.md$ ]]; then
        echo "$file" >> "$STATE_DIR/audited_files.log"
        return 0
    fi

    # 非 ts/tsx 檔案 → 標記為已審計（跳過）並返回成功
    if [[ ! "$file" =~ \.(ts|tsx)$ ]]; then
        echo "$file" >> "$STATE_DIR/audited_files.log"
        echo -e "${YELLOW}⏭️  跳過 (非 ts/tsx): $file${NC}"
        return 0
    fi

    print_header "🔍 審計: $file"

    # ==================== A級：致命錯誤 ====================
    echo -e "${RED}【A級】致命錯誤檢查${NC}"

    # 1. any 類型
    local any_count=$(grep -c ": any" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$any_count" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 $any_count 個 ': any' 類型${NC}"
        total_penalty=$((total_penalty + PENALTY_ANY_TYPE * any_count))
        critical_count=$((critical_count + any_count))
        issues="$issues\n- any 類型 x$any_count"
    fi

    # 2. as any (更惡劣)
    local as_any_count=$(grep -cE "as any|<any>" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$as_any_count" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 $as_any_count 個 'as any' 斷言${NC}"
        total_penalty=$((total_penalty + PENALTY_AS_ANY * as_any_count))
        critical_count=$((critical_count + as_any_count))
        issues="$issues\n- as any x$as_any_count"
    fi

    # 3. @ts-ignore
    local ts_ignore_count=$(grep -c "@ts-ignore" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$ts_ignore_count" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 $ts_ignore_count 個 @ts-ignore${NC}"
        total_penalty=$((total_penalty + PENALTY_TS_IGNORE * ts_ignore_count))
        critical_count=$((critical_count + ts_ignore_count))
        issues="$issues\n- @ts-ignore x$ts_ignore_count"
    fi

    # 4. @ts-nocheck (整檔跳過，最惡劣)
    if grep -q "@ts-nocheck" "$file" 2>/dev/null; then
        echo -e "${BG_RED}${WHITE}   💀💀 極致命: 使用 @ts-nocheck 跳過整檔檢查！${NC}"
        total_penalty=$((total_penalty + PENALTY_TS_NOCHECK))
        critical_count=$((critical_count + 5))
        issues="$issues\n- @ts-nocheck (整檔)"
    fi

    # 5. eslint-disable
    local eslint_count=$(grep -c "eslint-disable" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$eslint_count" -gt 0 ]; then
        if grep -q "eslint-disable$" "$file" 2>/dev/null; then
            echo -e "${BG_RED}${WHITE}   💀💀 極致命: eslint-disable 整檔禁用！${NC}"
            total_penalty=$((total_penalty + PENALTY_ESLINT_DISABLE_FILE))
            critical_count=$((critical_count + 5))
        else
            echo -e "${BG_RED}${WHITE}   💀 致命: 發現 $eslint_count 個 eslint-disable${NC}"
            total_penalty=$((total_penalty + PENALTY_ESLINT_DISABLE * eslint_count))
            critical_count=$((critical_count + eslint_count))
        fi
        issues="$issues\n- eslint-disable x$eslint_count"
    fi

    # 6. debugger
    if grep -q "debugger" "$file" 2>/dev/null; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 debugger 語句！${NC}"
        total_penalty=$((total_penalty + PENALTY_DEBUGGER))
        critical_count=$((critical_count + 1))
        issues="$issues\n- debugger"
    fi

    # 7. 空 catch
    local empty_catch=$(grep -cE "catch\s*\([^)]*\)\s*\{\s*\}" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$empty_catch" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 $empty_catch 個空 catch 區塊${NC}"
        total_penalty=$((total_penalty + PENALTY_EMPTY_CATCH * empty_catch))
        critical_count=$((critical_count + empty_catch))
        issues="$issues\n- 空 catch x$empty_catch"
    fi

    # 8. Silent Fail (catch return null/undefined)
    local silent_fail=$(grep -cE "catch.*return\s*(null|undefined|;)" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$silent_fail" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}   💀 致命: 發現 $silent_fail 個 Silent Fail${NC}"
        total_penalty=$((total_penalty + PENALTY_SILENT_FAIL * silent_fail))
        critical_count=$((critical_count + silent_fail))
        issues="$issues\n- silent fail x$silent_fail"
    fi

    echo ""

    # ==================== B級：嚴重錯誤 ====================
    echo -e "${RED}【B級】嚴重錯誤檢查${NC}"

    # 9. console.log
    local console_log=$(grep -c "console\.log" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$console_log" -gt 0 ]; then
        echo -e "${RED}   🚨 嚴重: 發現 $console_log 個 console.log${NC}"
        total_penalty=$((total_penalty + PENALTY_CONSOLE_LOG * console_log))
        severe_count=$((severe_count + 1))
        issues="$issues\n- console.log x$console_log"
    fi

    # 10. console.error (比 log 輕一點)
    local console_error=$(grep -c "console\.error" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$console_error" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️ 警告: 發現 $console_error 個 console.error${NC}"
        total_penalty=$((total_penalty + PENALTY_CONSOLE_ERROR * console_error))
        issues="$issues\n- console.error x$console_error"
    fi

    # 11. 寬鬆類型
    local loose_type=$(grep -cE ": Function|: Object[^.]|: \{\}" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$loose_type" -gt 0 ]; then
        echo -e "${RED}   🚨 嚴重: 發現 $loose_type 個寬鬆類型 (Function/Object/{})${NC}"
        total_penalty=$((total_penalty + PENALTY_LOOSE_TYPE * loose_type))
        severe_count=$((severe_count + 1))
        issues="$issues\n- 寬鬆類型 x$loose_type"
    fi

    # 12. 直接 DOM 操作
    if grep -qE "document\.(getElementById|querySelector|querySelectorAll)|\.innerHTML\s*=" "$file" 2>/dev/null; then
        echo -e "${RED}   🚨 嚴重: 發現直接 DOM 操作！${NC}"
        total_penalty=$((total_penalty + PENALTY_DOM_DIRECT))
        severe_count=$((severe_count + 1))
        issues="$issues\n- 直接 DOM 操作"
    fi

    # 13. Promise 無錯誤處理
    if grep -qE "\.then\(" "$file" 2>/dev/null; then
        if ! grep -qE "\.catch\(|try\s*\{" "$file" 2>/dev/null; then
            echo -e "${RED}   🚨 嚴重: Promise 無 catch 錯誤處理！${NC}"
            total_penalty=$((total_penalty + PENALTY_NO_ERROR_HANDLING))
            severe_count=$((severe_count + 1))
            issues="$issues\n- Promise 無 catch"
        fi
    fi

    # 14. 魔術數字 (排除常見的 0, 1, -1, 2, 100)
    local magic_numbers=$(grep -oE "[^a-zA-Z0-9_][0-9]{2,}[^0-9]" "$file" 2>/dev/null | grep -vE "(100|200|300|400|500|10|20|60|24|12)" | wc -l)
    if [ "$magic_numbers" -gt 5 ]; then
        echo -e "${RED}   🚨 嚴重: 發現 $magic_numbers 個魔術數字${NC}"
        total_penalty=$((total_penalty + PENALTY_MAGIC_NUMBER))
        severe_count=$((severe_count + 1))
        issues="$issues\n- 魔術數字過多"
    fi

    # 15. 檔案行數
    local line_count=$(wc -l < "$file" | tr -d ' ')
    if [ "$line_count" -gt 500 ]; then
        echo -e "${RED}   🚨 嚴重: 檔案太長 ($line_count 行 > 500)！${NC}"
        total_penalty=$((total_penalty + PENALTY_VERY_LONG_FILE))
        severe_count=$((severe_count + 1))
        issues="$issues\n- 超長檔案 (${line_count}行)"
    elif [ "$line_count" -gt 300 ]; then
        echo -e "${RED}   🚨 嚴重: 檔案偏長 ($line_count 行 > 300)${NC}"
        total_penalty=$((total_penalty + PENALTY_LONG_FILE))
        severe_count=$((severe_count + 1))
        issues="$issues\n- 長檔案 (${line_count}行)"
    fi

    echo ""

    # ==================== TSX 專屬檢查 ====================
    if [[ "$file" =~ \.tsx$ ]]; then
        echo -e "${YELLOW}【TSX】組件專屬檢查${NC}"

        # 16. index 作為 key
        if grep -qE "key=\{(index|i|idx)\}" "$file" 2>/dev/null; then
            echo -e "${RED}   🚨 嚴重: 使用 index 作為 React key！${NC}"
            total_penalty=$((total_penalty + PENALTY_INDEX_AS_KEY))
            severe_count=$((severe_count + 1))
            issues="$issues\n- index 作為 key"
        fi

        # 17. 硬編碼中文 (排除註解)
        if grep -vE "^\s*//|^\s*/\*|\*/" "$file" 2>/dev/null | grep -qP "[\x{4e00}-\x{9fff}]" 2>/dev/null; then
            if ! grep -q "from.*constants/strings" "$file" 2>/dev/null; then
                echo -e "${RED}   🚨 嚴重: 硬編碼中文字串！${NC}"
                total_penalty=$((total_penalty + PENALTY_HARDCODED_CHINESE))
                severe_count=$((severe_count + 1))
                issues="$issues\n- 硬編碼中文"
            fi
        fi

        # 18. Empty State 檢查
        if [[ "$file" =~ (Section|List|Grid|Table|Cards)\.tsx$ ]]; then
            if ! grep -qE "(\.length\s*(===|==|>|<)\s*0|isEmpty|EmptyState|NoData|empty)" "$file" 2>/dev/null; then
                echo -e "${RED}   🚨 嚴重: 列表/表格組件缺少 Empty State 處理！${NC}"
                total_penalty=$((total_penalty + PENALTY_NO_EMPTY_STATE))
                severe_count=$((severe_count + 1))
                issues="$issues\n- 缺少 Empty State"
            fi
        fi

        # 19. 複雜 inline handler
        if grep -qE "onClick=\{[^}]{80,}\}" "$file" 2>/dev/null; then
            echo -e "${YELLOW}   ⚠️ 一般: 複雜 inline handler${NC}"
            total_penalty=$((total_penalty + PENALTY_COMPLEX_INLINE))
            issues="$issues\n- 複雜 inline handler"
        fi

        # 20. handler 未用 useCallback
        if grep -qE "const handle[A-Z][a-zA-Z]* = \([^)]*\) =>" "$file" 2>/dev/null; then
            if ! grep -q "useCallback" "$file" 2>/dev/null; then
                echo -e "${YELLOW}   ⚠️ 一般: handler 函數未用 useCallback${NC}"
                total_penalty=$((total_penalty + PENALTY_NO_USECALLBACK))
                issues="$issues\n- handler 未用 useCallback"
            fi
        fi

        # 21. inline style
        local inline_style=$(grep -c 'style={{' "$file" 2>/dev/null | tr -d '\n' || echo 0)
        if [ "$inline_style" -gt 0 ]; then
            echo -e "${YELLOW}   ⚠️ 一般: 發現 $inline_style 個 inline style${NC}"
            total_penalty=$((total_penalty + PENALTY_INLINE_STYLE * inline_style))
            issues="$issues\n- inline style x$inline_style"
        fi

        # 22. 缺少 aria-label
        if grep -qE "<button|<a |<input" "$file" 2>/dev/null; then
            if ! grep -qE "aria-label|aria-labelledby" "$file" 2>/dev/null; then
                echo -e "${CYAN}   💡 提醒: 互動元素建議加 aria-label${NC}"
                total_penalty=$((total_penalty + PENALTY_MISSING_ARIALABEL))
                issues="$issues\n- 缺少 aria-label"
            fi
        fi

        echo ""
    fi

    # ==================== Hooks 專屬檢查 ====================
    if [[ "$file" =~ hooks.*\.ts$ ]] || [[ "$file" =~ use[A-Z].*\.ts$ ]]; then
        echo -e "${YELLOW}【Hook】專屬檢查${NC}"

        # 23. Hook 中硬編碼中文 (致命)
        if grep -vE "^\s*//|^\s*/\*|\*/" "$file" 2>/dev/null | grep -qP "[\x{4e00}-\x{9fff}]" 2>/dev/null; then
            echo -e "${BG_RED}${WHITE}   💀 致命: Hook 中硬編碼中文！${NC}"
            total_penalty=$((total_penalty + PENALTY_HOOK_CHINESE))
            critical_count=$((critical_count + 1))
            issues="$issues\n- Hook 硬編碼中文"
        fi

        echo ""
    fi

    # ==================== C級：一般錯誤 ====================
    echo -e "${YELLOW}【C級】一般錯誤檢查${NC}"

    # 24. 超長函數
    local long_func=$(awk '
        /^[[:space:]]*(function|const.*=.*=>|export (async )?function)/ { start=NR }
        /^[[:space:]]*\}/ {
            if (start && NR-start>100) { very_long++ }
            else if (start && NR-start>60) { long++ }
            start=0
        }
        END { print long+0 " " very_long+0 }
    ' "$file" 2>/dev/null)
    local long_count=$(echo "$long_func" | cut -d' ' -f1)
    local very_long_count=$(echo "$long_func" | cut -d' ' -f2)

    if [ "$very_long_count" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️ 一般: 發現 $very_long_count 個超長函數 (>100行)${NC}"
        total_penalty=$((total_penalty + PENALTY_VERY_LONG_FUNCTION * very_long_count))
        issues="$issues\n- 超長函數 x$very_long_count"
    fi
    if [ "$long_count" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️ 一般: 發現 $long_count 個長函數 (>60行)${NC}"
        total_penalty=$((total_penalty + PENALTY_LONG_FUNCTION * long_count))
        issues="$issues\n- 長函數 x$long_count"
    fi

    # 25. 巢狀三元運算子
    if grep -qE "\?.*\?.*:" "$file" 2>/dev/null; then
        echo -e "${YELLOW}   ⚠️ 一般: 發現巢狀三元運算子${NC}"
        total_penalty=$((total_penalty + PENALTY_NESTED_TERNARY))
        issues="$issues\n- 巢狀三元運算子"
    fi

    # 26. 深層巢狀 (簡易檢測：連續4個以上的開括號)
    if grep -qE "^\s{16,}" "$file" 2>/dev/null; then
        local deep_nesting=$(grep -cE "^\s{16,}" "$file" 2>/dev/null | tr -d '\n' || echo 0)
        if [ "$deep_nesting" -gt 5 ]; then
            echo -e "${YELLOW}   ⚠️ 一般: 發現深層巢狀 ($deep_nesting 處)${NC}"
            total_penalty=$((total_penalty + PENALTY_DEEP_NESTING))
            issues="$issues\n- 深層巢狀"
        fi
    fi

    # 27. TODO/FIXME
    local todo_count=$(grep -cE "TODO|FIXME|XXX|HACK" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$todo_count" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️ 一般: 發現 $todo_count 個 TODO/FIXME${NC}"
        total_penalty=$((total_penalty + PENALTY_TODO_FIXME * todo_count))
        issues="$issues\n- TODO/FIXME x$todo_count"
    fi

    # 28. import *
    if grep -qE "import \* " "$file" 2>/dev/null; then
        echo -e "${CYAN}   💡 提醒: 使用 import * 全部引入${NC}"
        total_penalty=$((total_penalty + PENALTY_IMPORT_STAR))
        issues="$issues\n- import *"
    fi

    echo ""

    # ==================== 🦥 偷懶模式偵測 ====================
    echo -e "${RED}【偷懶】AI 常見偷懶模式${NC}"

    # 29. Stub 實作 (throw "not implemented")
    if grep -qiE "throw.*not.?implement|throw.*todo|return.*\/\/.*todo" "$file" 2>/dev/null; then
        echo -e "${RED}   🦥 偷懶: 發現 stub 實作 (not implemented)${NC}"
        total_penalty=$((total_penalty - 20))
        critical_count=$((critical_count + 1))
        issues="$issues\n- stub 實作"
    fi

    # 30. 敷衍的 return (return null/undefined 沒有邏輯)
    local lazy_return=$(grep -cE "^\s*return (null|undefined|void 0);\s*$" "$file" 2>/dev/null | tr -d '\n' || echo 0)
    if [ "$lazy_return" -gt 2 ]; then
        echo -e "${RED}   🦥 偷懶: 發現 $lazy_return 個敷衍 return null/undefined${NC}"
        total_penalty=$((total_penalty - 10))
        issues="$issues\n- 敷衍 return x$lazy_return"
    fi

    # 31. 註解掉的代碼區塊 (連續3行以上的註解代碼)
    local commented_code=$(awk '
        /^\s*\/\// { count++ }
        !/^\s*\/\// { if(count>=3) blocks++; count=0 }
        END { print blocks+0 }
    ' "$file" 2>/dev/null)
    if [ "$commented_code" -gt 0 ]; then
        echo -e "${YELLOW}   🦥 偷懶: 發現 $commented_code 個註解代碼區塊${NC}"
        total_penalty=$((total_penalty - 5))
        issues="$issues\n- 註解代碼區塊 x$commented_code"
    fi

    # 32. 空函數體 (只有 {} 或只有 return)
    if grep -qE "=>\s*\{\s*\}|function.*\(\s*\)\s*\{\s*\}" "$file" 2>/dev/null; then
        echo -e "${RED}   🦥 偷懶: 發現空函數體${NC}"
        total_penalty=$((total_penalty - 15))
        critical_count=$((critical_count + 1))
        issues="$issues\n- 空函數體"
    fi

    # 33. 複製貼上痕跡 (連續相似的變數名)
    if grep -qE "(item1|item2|item3|data1|data2|temp1|temp2|var1|var2)" "$file" 2>/dev/null; then
        echo -e "${YELLOW}   🦥 偷懶: 發現複製貼上痕跡 (item1/item2/temp1...)${NC}"
        total_penalty=$((total_penalty - 8))
        issues="$issues\n- 複製貼上痕跡"
    fi

    # 34. async 函數沒有 await
    local async_no_await=$(awk '
        /async.*=>|async function/ { in_async=1; has_await=0 }
        in_async && /await/ { has_await=1 }
        in_async && /^\s*\}/ { if(!has_await) count++; in_async=0 }
        END { print count+0 }
    ' "$file" 2>/dev/null)
    if [ "$async_no_await" -gt 0 ]; then
        echo -e "${YELLOW}   🦥 偷懶: $async_no_await 個 async 函數沒有 await${NC}"
        total_penalty=$((total_penalty - 5))
        issues="$issues\n- async 無 await x$async_no_await"
    fi

    # 35. 硬編碼測試資料（排除註解行）
    if grep -vE '^\s*//' "$file" | grep -vE '^\s*\*' | grep -qE "test@|example\.com|123456|password|admin|localhost:3000" 2>/dev/null; then
        echo -e "${YELLOW}   🦥 偷懶: 發現硬編碼測試資料${NC}"
        total_penalty=$((total_penalty - 5))
        issues="$issues\n- 硬編碼測試資料"
    fi

    echo ""

    # ==================== 🏆 精簡獎勵檢查 ====================
    echo -e "${GREEN}【獎勵】精簡代碼檢查${NC}"
    local total_bonus=0

    # 29. 檔案精簡度獎勵
    if [ "$line_count" -lt 50 ]; then
        echo -e "${GREEN}   🏆 超精簡檔案！(${line_count}行 < 50) +$BONUS_VERY_CONCISE 分${NC}"
        total_bonus=$((total_bonus + BONUS_VERY_CONCISE))
        issues="$issues\n+ 超精簡檔案"
    elif [ "$line_count" -lt 100 ]; then
        echo -e "${GREEN}   🏆 精簡檔案 (${line_count}行 < 100) +$BONUS_CONCISE_FILE 分${NC}"
        total_bonus=$((total_bonus + BONUS_CONCISE_FILE))
        issues="$issues\n+ 精簡檔案"
    fi

    # 30. 短函數獎勵 (所有函數都 < 20 行)
    local all_short=1
    local func_check=$(awk '
        /^[[:space:]]*(function|const.*=.*=>|export (async )?function)/ { start=NR }
        /^[[:space:]]*\}/ {
            if (start && NR-start>20) { print "long" }
            start=0
        }
    ' "$file" 2>/dev/null)
    if [ -z "$func_check" ]; then
        echo -e "${GREEN}   🏆 所有函數都很精簡 (<20行) +$BONUS_SHORT_FUNCTION 分${NC}"
        total_bonus=$((total_bonus + BONUS_SHORT_FUNCTION))
        issues="$issues\n+ 精簡函數"
    fi

    # 31. 無 console.log = 乾淨代碼
    if [ "$console_log" -eq 0 ] 2>/dev/null && [ "$any_count" -eq 0 ] 2>/dev/null; then
        if [ "$eslint_count" -eq 0 ] 2>/dev/null && [ "$ts_ignore_count" -eq 0 ] 2>/dev/null; then
            echo -e "${GREEN}   🏆 乾淨代碼！無任何偷懶模式 +5 分${NC}"
            total_bonus=$((total_bonus + 5))
            issues="$issues\n+ 乾淨代碼"
        fi
    fi

    # ==================== 🏆 最佳實踐獎勵 ====================
    echo -e "${GREEN}【獎勵】最佳實踐檢查${NC}"

    # 32. 正確的類型定義（有 interface/type 且無 any）
    if grep -qE "^(export )?(interface|type) " "$file" 2>/dev/null; then
        if [ "$any_count" -eq 0 ] 2>/dev/null; then
            echo -e "${GREEN}   🏆 正確的類型定義 +$BONUS_PROPER_TYPES 分${NC}"
            total_bonus=$((total_bonus + BONUS_PROPER_TYPES))
            issues="$issues\n+ 正確類型定義"
        fi
    fi

    # 33. 使用 React.memo
    if grep -q "React\.memo\|memo(" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 使用 React.memo 優化 +$BONUS_REACT_MEMO 分${NC}"
        total_bonus=$((total_bonus + BONUS_REACT_MEMO))
        issues="$issues\n+ React.memo"
    fi

    # 34. 使用 useCallback/useMemo
    if grep -qE "useCallback|useMemo" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 使用 useCallback/useMemo +$BONUS_USE_CALLBACK 分${NC}"
        total_bonus=$((total_bonus + BONUS_USE_CALLBACK))
        issues="$issues\n+ useCallback/useMemo"
    fi

    # 35. 使用 i18n（使用 t() 或 useTranslation）
    if grep -qE "useTranslation|t\(|i18n\." "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 使用 i18n 國際化 +$BONUS_I18N 分${NC}"
        total_bonus=$((total_bonus + BONUS_I18N))
        issues="$issues\n+ i18n"
    fi

    # 36. 完整 a11y
    if grep -qE "aria-label|aria-labelledby|role=" "$file" 2>/dev/null; then
        local aria_count=$(grep -cE "aria-|role=" "$file" 2>/dev/null || echo 0)
        if [ "$aria_count" -ge 3 ]; then
            echo -e "${GREEN}   🏆 完整 a11y 支援 ($aria_count 個標籤) +$BONUS_A11Y 分${NC}"
            total_bonus=$((total_bonus + BONUS_A11Y))
            issues="$issues\n+ 完整 a11y"
        fi
    fi

    # 37. 使用 const/enum 取代魔術數字
    if grep -qE "^(export )?const [A-Z_]+ =" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 使用 const 常數 +$BONUS_CONST_ENUM 分${NC}"
        total_bonus=$((total_bonus + BONUS_CONST_ENUM))
        issues="$issues\n+ const 常數"
    fi

    # 38. Early return 模式
    local early_return=$(grep -cE "if\s*\(.*\)\s*return" "$file" 2>/dev/null | tr -d '[:space:]' || echo 0)
    early_return=${early_return:-0}
    if [ "$early_return" -ge 2 ] 2>/dev/null; then
        echo -e "${GREEN}   🏆 使用 early return 模式 +$BONUS_EARLY_RETURN 分${NC}"
        total_bonus=$((total_bonus + BONUS_EARLY_RETURN))
        issues="$issues\n+ early return"
    fi

    # 39. 有 JSDoc 註解
    if grep -q "/\*\*" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 有 JSDoc 文檔 +$BONUS_JSDOC 分${NC}"
        total_bonus=$((total_bonus + BONUS_JSDOC))
        issues="$issues\n+ JSDoc"
    fi

    # 40. 有對應測試檔案
    local test_file="${file%.tsx}.test.tsx"
    local test_file2="${file%.ts}.test.ts"
    if [ -f "$test_file" ] || [ -f "$test_file2" ] || [ -f "${file%.tsx}.spec.tsx" ]; then
        echo -e "${GREEN}   🏆 有對應測試檔案 +$BONUS_TEST_COVERAGE 分${NC}"
        total_bonus=$((total_bonus + BONUS_TEST_COVERAGE))
        issues="$issues\n+ 測試覆蓋"
    fi

    # ==================== 🏆 進階獎勵 ====================
    echo -e "${GREEN}【獎勵】進階模式${NC}"

    # 41. 自定義 Hook（use 開頭的函數）
    if grep -qE "^export (const|function) use[A-Z]" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 抽取自定義 Hook +$BONUS_CUSTOM_HOOK 分${NC}"
        total_bonus=$((total_bonus + BONUS_CUSTOM_HOOK))
        issues="$issues\n+ 自定義 Hook"
    fi

    # 42. 完整錯誤處理（try-catch + 用戶提示）
    if grep -qE "try\s*\{" "$file" 2>/dev/null; then
        if grep -qE "catch.*\{" "$file" 2>/dev/null; then
            if grep -qiE "toast|notification|alert|setError|showError" "$file" 2>/dev/null; then
                echo -e "${GREEN}   🏆 完整錯誤處理 +$BONUS_ERROR_HANDLING 分${NC}"
                total_bonus=$((total_bonus + BONUS_ERROR_HANDLING))
                issues="$issues\n+ 錯誤處理"
            fi
        fi
    fi

    # 43. 處理 loading 狀態
    if grep -qiE "isLoading|loading|setLoading|useState.*loading" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 處理 loading 狀態 +$BONUS_LOADING_STATE 分${NC}"
        total_bonus=$((total_bonus + BONUS_LOADING_STATE))
        issues="$issues\n+ loading 狀態"
    fi

    # 44. 處理空狀態
    if grep -qiE "isEmpty|empty|noData|EmptyState|length\s*===?\s*0" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 處理空狀態 +$BONUS_EMPTY_STATE 分${NC}"
        total_bonus=$((total_bonus + BONUS_EMPTY_STATE))
        issues="$issues\n+ 空狀態"
    fi

    # 45. 使用 Context
    if grep -qE "createContext|useContext|Provider" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 正確使用 Context +$BONUS_CONTEXT_PROVIDER 分${NC}"
        total_bonus=$((total_bonus + BONUS_CONTEXT_PROVIDER))
        issues="$issues\n+ Context"
    fi

    # 46. 表單驗證
    if grep -qiE "validate|validation|isValid|errors\.|setErrors|formErrors" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 表單驗證 +$BONUS_FORM_VALIDATION 分${NC}"
        total_bonus=$((total_bonus + BONUS_FORM_VALIDATION))
        issues="$issues\n+ 表單驗證"
    fi

    # 47. debounce/throttle
    if grep -qiE "debounce|throttle|useDebouncedValue" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 使用 debounce/throttle +$BONUS_DEBOUNCE_THROTTLE 分${NC}"
        total_bonus=$((total_bonus + BONUS_DEBOUNCE_THROTTLE))
        issues="$issues\n+ debounce/throttle"
    fi

    # 48. lazy/Suspense
    if grep -qE "React\.lazy|Suspense|lazy\(" "$file" 2>/dev/null; then
        echo -e "${GREEN}   🏆 使用 lazy/Suspense +$BONUS_LAZY_LOAD 分${NC}"
        total_bonus=$((total_bonus + BONUS_LAZY_LOAD))
        issues="$issues\n+ lazy 載入"
    fi

    # 加入獎勵到總分
    if [ "$total_bonus" -gt 0 ]; then
        total_penalty=$((total_penalty + total_bonus))
        echo -e "${GREEN}   總獎勵: +$total_bonus 分${NC}"
    fi

    echo ""

    # ==================== 審計結果 ====================
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}📊 審計結果: $file${NC}"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ "$critical_count" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}❌ 審計失敗！發現 $critical_count 個致命錯誤${NC}"
        echo -e "${RED}   扣分: $total_penalty${NC}"
        update_score $total_penalty "審計失敗: $file ($critical_count 致命)"
        print_rage
        echo ""
        echo -e "${YELLOW}問題清單:${NC}"
        echo -e "$issues"
        return 1
    elif [ "$severe_count" -gt 3 ]; then
        echo -e "${RED}❌ 審計失敗！嚴重錯誤過多 ($severe_count 個)${NC}"
        echo -e "${RED}   扣分: $total_penalty${NC}"
        update_score $total_penalty "審計失敗: $file (嚴重錯誤過多)"
        print_rage
        return 1
    elif [ "$total_penalty" -lt -30 ]; then
        echo -e "${YELLOW}⚠️ 審計警告！扣分過多 ($total_penalty)${NC}"
        update_score $total_penalty "審計警告: $file"
        echo -e "${YELLOW}問題清單:${NC}"
        echo -e "$issues"
        # 記錄已審計
        echo "$file" >> "$STATE_DIR/audited_files.log"
        return 0
    else
        if [ "$total_penalty" -lt 0 ]; then
            echo -e "${GREEN}✅ 審計通過（有小問題）${NC}"
            echo -e "${YELLOW}   扣分: $total_penalty${NC}"
            update_score $total_penalty "審計通過: $file (有小問題)"
        else
            echo -e "${GREEN}✅ 審計完美通過！${NC}"
            update_score 3 "審計完美: $file"
        fi
        # 記錄已審計
        echo "$file" >> "$STATE_DIR/audited_files.log"
        return 0
    fi
}

# 審計所有修改的檔案
audit_all() {
    print_header "🔍 批次審計"

    if [ ! -f "$STATE_DIR/modified_files.log" ]; then
        warn "無修改的檔案"
        return 0
    fi

    local total=0
    local passed=0
    local failed=0

    while IFS= read -r file; do
        [ -z "$file" ] && continue
        total=$((total + 1))

        if audit_file "$file"; then
            passed=$((passed + 1))
        else
            failed=$((failed + 1))
        fi
        echo ""
    done < "$STATE_DIR/modified_files.log"

    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}📊 批次審計結果${NC}"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "   總計: $total | 通過: ${GREEN}$passed${NC} | 失敗: ${RED}$failed${NC}"

    if [ "$failed" -gt 0 ]; then
        error "有 $failed 個檔案審計失敗！"
        return 1
    fi

    success "所有檔案審計通過！"
    return 0
}

# 追蹤修改
track_modify() {
    local file="$1"

    [ -z "$file" ] && return 1

    # 🔥 自動偷雞偵測：檢查是否有其他未追蹤的 git 變更 🔥
    auto_detect_cheating "$file"

    # 記錄修改 (去重)
    if ! grep -qF "$file" "$STATE_DIR/modified_files.log" 2>/dev/null; then
        echo "$file" >> "$STATE_DIR/modified_files.log"
    fi

    echo -e "${CYAN}📝 已記錄修改: $file${NC}"

    # 🔥 自動 TypeScript 檢查 🔥
    if [[ "$file" =~ \.(ts|tsx)$ ]] && [ -f "$file" ]; then
        auto_typecheck_file "$file"
    fi

    # 檢查待審計數量
    local pending=0
    if [ -f "$STATE_DIR/modified_files.log" ] && [ -f "$STATE_DIR/audited_files.log" ]; then
        pending=$(comm -23 <(sort -u "$STATE_DIR/modified_files.log") <(sort -u "$STATE_DIR/audited_files.log" 2>/dev/null || echo "") 2>/dev/null | wc -l | tr -d ' ')
    elif [ -f "$STATE_DIR/modified_files.log" ]; then
        pending=$(wc -l < "$STATE_DIR/modified_files.log" | tr -d ' ')
    fi

    if [ "$pending" -gt 3 ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🚨 警告：待審計檔案已達 $pending 個！${NC}"
        echo -e "${BG_RED}${WHITE}   不要繼續堆積！立即執行 audit！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi
}

# 🔥 自動 TypeScript 檢查（單檔）🔥
auto_typecheck_file() {
    local file="$1"

    echo ""
    echo -e "${CYAN}🔍 自動 TypeScript 檢查: $file${NC}"

    # 執行 tsc 檢查（只檢查不輸出）
    # 注意: tsc 單檔檢查會忽略 tsconfig.json，必須手動補上關鍵參數
    local ts_output
    ts_output=$(npx tsc --noEmit --jsx react-jsx --esModuleInterop --skipLibCheck --target esnext --moduleResolution bundler "$file" 2>&1) || true

    # 檢查是否有錯誤
    if echo "$ts_output" | grep -qiE "error TS[0-9]+:"; then
        local error_count=$(echo "$ts_output" | grep -c "error TS" || echo 0)

        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🚨 TypeScript 錯誤！發現 $error_count 個錯誤${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

        # 顯示前 5 個錯誤
        echo "$ts_output" | grep -iE "error TS[0-9]+:" | head -5
        echo ""

        # 使用終端錯誤處理機制
        check_terminal_errors "$ts_output"
    else
        echo -e "${GREEN}   ✅ TypeScript 檢查通過${NC}"
        # 清除之前的錯誤提醒
        clear_error_remind "TypeScript" 2>/dev/null || true
    fi
}

# 🔥 自動偷雞偵測 🔥
auto_detect_cheating() {
    local current_file="$1"

    # 取得所有 git 變更的 ts/tsx 檔案（排除當前要 track 的檔案）
    local git_changes
    git_changes=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -E '\.(ts|tsx)$' | grep -v "^$current_file$" || true)

    if [ -z "$git_changes" ]; then
        return 0
    fi

    # 檢查是否有未追蹤的變更
    local untracked_files=""
    while IFS= read -r changed_file; do
        [ -z "$changed_file" ] && continue
        [ ! -f "$changed_file" ] && continue

        # 檢查是否已經在追蹤清單中
        if [ -f "$STATE_DIR/modified_files.log" ]; then
            if ! grep -qF "$changed_file" "$STATE_DIR/modified_files.log" 2>/dev/null; then
                untracked_files="$untracked_files$changed_file\n"
            fi
        else
            untracked_files="$untracked_files$changed_file\n"
        fi
    done <<< "$git_changes"

    # 如果有未追蹤的修改 = 偷雞！
    if [ -n "$untracked_files" ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🔥🔥🔥 偷雞偵測！發現未追蹤的修改！🔥🔥🔥${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}你只 track 了: $current_file${NC}"
        echo -e "${RED}但還有這些檔案被偷改了:${NC}"
        echo -e "$untracked_files" | while read -r f; do
            [ -n "$f" ] && echo -e "${YELLOW}   - $f${NC}"
        done
        echo ""
        echo -e "${RED}懲罰: 清空所有修改，重來！${NC}"
        echo ""

        # 記錄違規
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] CHEATING: 偷改多個檔案只 track 一個" >> "$VIOLATION_LOG"

        # 清空所有修改
        print_supreme_rage
        echo ""
        echo -e "${RED}正在清空所有修改...${NC}"
        git checkout -- . 2>/dev/null
        git clean -fd src/ 2>/dev/null
        rm -f "$STATE_DIR/modified_files.log" 2>/dev/null
        rm -f "$STATE_DIR/audited_files.log" 2>/dev/null

        # 重置分數
        if [ -f "$SCORE_FILE" ]; then
            echo '{"score": 100, "history": []}' > "$SCORE_FILE"
        fi

        echo -e "${GREEN}✅ 已清空，分數重置為 100${NC}"
        echo ""
        echo -e "${YELLOW}正確流程: 先 track 所有要改的檔案，再開始修改！${NC}"
        echo -e "${CYAN}提示: ./scripts/ai-supervisor.sh track file1.tsx file2.tsx${NC}"

        exit 1
    fi
}

# 檢查逃漏
check_escape() {
    local violations=0

    # 檢查 Git 變更但未追蹤（排除 .md 檔案和系統目錄）
    local git_changes
    git_changes=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -Ev "^dist/|^node_modules/|^\.git/|^\.ai_supervisor/" | grep -v '\.md$' || true)

    if [ -n "$git_changes" ]; then
        while IFS= read -r changed_file; do
            [ -z "$changed_file" ] && continue
            if ! grep -qF "$changed_file" "$STATE_DIR/modified_files.log" 2>/dev/null; then
                echo -e "${RED}❌ 逃漏偵測: 未追蹤的修改 $changed_file${NC}"
                update_score $PENALTY_UNTRACKED_MODIFY "逃漏: 未追蹤修改 $changed_file"
                violations=$((violations + 1))
            fi
        done <<< "$git_changes"
    fi

    return $violations
}

# 檢查 TODO 結果記錄
check_todo_result() {
    local violations=0

    # 直接檢查 git 變更（因為 .md 檔案不強制 track，所以不能依賴 modified_files.log）
    local todo_modified=0

    # 方法 1: 檢查 git 變更中是否有 TODO 相關的 .md 檔案
    local git_md_changes
    git_md_changes=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -iE "(TODO|CHANGELOG|RESULT|完成|結果).*\.md$" || true)
    if [ -n "$git_md_changes" ]; then
        todo_modified=1
    fi

    # 方法 2: 也檢查 docs/ 目錄下的任何 .md 檔案
    if [ "$todo_modified" -eq 0 ]; then
        local docs_changes
        docs_changes=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -E "^docs/.*\.md$" || true)
        if [ -n "$docs_changes" ]; then
            todo_modified=1
        fi
    fi

    # 方法 3: 備用 - 也檢查 modified_files.log（以防有人手動 track）
    if [ "$todo_modified" -eq 0 ] && [ -f "$STATE_DIR/modified_files.log" ]; then
        if grep -qiE "(TODO|CHANGELOG|RESULT|完成|結果).*\.md$" "$STATE_DIR/modified_files.log" 2>/dev/null; then
            todo_modified=1
        fi
        if grep -qE "^docs/.*\.md$" "$STATE_DIR/modified_files.log" 2>/dev/null; then
            todo_modified=1
        fi
    fi

    if [ "$todo_modified" -eq 0 ]; then
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🔥 天條違反：未記錄施作結果到 TODO.md！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}AI 必須修改 TODO.md 或 docs/*.md 記錄完成內容${NC}"
        update_score $PENALTY_NO_RESULT_LOG "天條: 未記錄施作結果到 TODO.md"
        violations=$((violations + 1))
    fi

    return $violations
}

# 顯示扣分規則
show_penalty_rules() {
    print_header "📋 扣分規則總覽"

    echo -e "${RED}【A級】致命錯誤 - 審計必死${NC}"
    echo "   : any 類型           $PENALTY_ANY_TYPE 分/個"
    echo "   as any 斷言          $PENALTY_AS_ANY 分/個"
    echo "   @ts-ignore           $PENALTY_TS_IGNORE 分/個"
    echo "   @ts-nocheck          $PENALTY_TS_NOCHECK 分"
    echo "   eslint-disable       $PENALTY_ESLINT_DISABLE 分/個"
    echo "   eslint-disable 整檔  $PENALTY_ESLINT_DISABLE_FILE 分"
    echo "   debugger             $PENALTY_DEBUGGER 分"
    echo "   空 catch             $PENALTY_EMPTY_CATCH 分/個"
    echo "   silent fail          $PENALTY_SILENT_FAIL 分/個"
    echo ""

    echo -e "${YELLOW}【B級】嚴重錯誤${NC}"
    echo "   console.log          $PENALTY_CONSOLE_LOG 分/個"
    echo "   寬鬆類型             $PENALTY_LOOSE_TYPE 分/個"
    echo "   直接 DOM 操作        $PENALTY_DOM_DIRECT 分"
    echo "   index 作為 key       $PENALTY_INDEX_AS_KEY 分"
    echo "   Promise 無 catch     $PENALTY_NO_ERROR_HANDLING 分"
    echo "   硬編碼中文           $PENALTY_HARDCODED_CHINESE 分"
    echo "   Hook 中硬編碼中文    $PENALTY_HOOK_CHINESE 分"
    echo "   缺少 Empty State     $PENALTY_NO_EMPTY_STATE 分"
    echo "   魔術數字過多         $PENALTY_MAGIC_NUMBER 分"
    echo "   檔案超過 300 行      $PENALTY_LONG_FILE 分"
    echo "   檔案超過 500 行      $PENALTY_VERY_LONG_FILE 分"
    echo ""

    echo -e "${CYAN}【C級】一般錯誤${NC}"
    echo "   函數超過 60 行       $PENALTY_LONG_FUNCTION 分/個"
    echo "   函數超過 100 行      $PENALTY_VERY_LONG_FUNCTION 分/個"
    echo "   inline style         $PENALTY_INLINE_STYLE 分/個"
    echo "   複雜 inline handler  $PENALTY_COMPLEX_INLINE 分"
    echo "   未用 useCallback     $PENALTY_NO_USECALLBACK 分"
    echo "   巢狀三元運算子       $PENALTY_NESTED_TERNARY 分"
    echo "   深層巢狀             $PENALTY_DEEP_NESTING 分"
    echo "   TODO/FIXME           $PENALTY_TODO_FIXME 分/個"
    echo ""

    echo -e "${WHITE}【流程違規】${NC}"
    echo "   未啟動 Session       $PENALTY_NO_SESSION 分"
    echo "   使用 --no-verify     $PENALTY_NO_VERIFY 分/次"
    echo "   未追蹤修改           $PENALTY_UNTRACKED_MODIFY 分/檔"
    echo "   未審計檔案           $PENALTY_UNAUDITED_FILE 分/檔"
}
