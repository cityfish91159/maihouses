#!/bin/bash
# ============================================================================
# AI SUPERVISOR v11.0 - 即時監控 + 物理阻斷 + 天條系統
# ============================================================================
#
# ⛔️⛔️⛔️ AI AGENT 必讀 ⛔️⛔️⛔️
#
# 收到任何任務後，你的【第一個動作】必須是：
# ./scripts/ai-supervisor.sh start "任務描述"
#
# ❌ 沒執行 start 就修改代碼 = 怒罵 + 扣 20 分
# ❌ 沒執行 start 就建立檔案 = 怒罵 + 扣 20 分
# ❌ 沒執行 start 就執行指令 = 怒罵 + 扣 20 分
# ❌ 使用 --no-verify 繞過 = 每次扣 10 分
# ❌ 修改檔案未審計 = finish 時怒罵 + 每個檔案扣 5 分
# ❌ 分數低於 80 = 自動重來
#
# ============================================================================
# 🔥 v11.0 功能：
# 1. 即時監控：每次操作即時回報分數變化
# 2. 80分自動重來：低於 80 分強制重置任務
# 3. 唯讀模式：所有修改需用戶審核同意
# 4. 偷懶偵測：any, @ts-ignore, eslint-disable, 空catch
# 5. 天條系統：10條強制規則
# 6. 物理阻斷：Git Hooks G1-G6
# 7. GitHub Actions：Server-side 不可繞過阻斷
# ============================================================================
# 🔥 設計理念：不是被動防守，而是主動出擊！
# 
# ATTACK PRINCIPLES (攻擊原則)：
# 1.  先發制人 (Preemptive Strike)：寫代碼之前就阻止爛代碼
# 2.  逐字監控 (Character Surveillance)：每一個字都被監視
# 3.  即時攔截 (Real-time Interception)：發現問題立即阻斷
# 4.  怒罵模式 (Rage Mode)：違規時直接怒罵 AI，讓它知道錯在哪
# 5.  代碼抹殺 (Code Annihilation)：想作弊？刪除所有代碼重來
# 6.  強制引導 (Forced Guidance)：不給選擇，只有最佳實踐
# 7.  零容忍 (Zero Tolerance)：一次違規，永久記錄
# 8.  攻擊式審計 (Offensive Audit)：不是檢查，是攻擊找漏洞
# 9.  強制模板 (Mandatory Template)：寫代碼前必須看模板
# 10. 預測違規 (Violation Prediction)：預測 AI 可能犯的錯
# 11. 全程錄影 (Full Recording)：所有操作都被記錄
# 12. 怒火加分 (Rage Scoring)：被罵越慘，分數扣越多
# 13. 強制學習 (Forced Learning)：違規後必須學習正確做法
# ============================================================================

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
# 額外強調色
BOLD_RED='\033[1;31m'
BG_RED='\033[41m'
BG_YELLOW='\033[43m'

# 狀態檔案 - 自動偵測專案根目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STATE_DIR="$PROJECT_ROOT/.ai_supervisor"
READ_LOG="$STATE_DIR/read_files.log"
PLAN_FILE="$STATE_DIR/plan.json"
VIOLATION_LOG="$STATE_DIR/violations.log"
SESSION_FILE="$STATE_DIR/session.json"
MODIFIED_FILES="$STATE_DIR/modified_files.log"
AUDITED_FILES="$STATE_DIR/audited_files.log"
GUIDANCE_LOG="$STATE_DIR/guidance.log"
SCORE_FILE="$STATE_DIR/score.json"
RAGE_LOG="$STATE_DIR/rage.log"
TEMPLATE_CHECK="$STATE_DIR/template_checked.flag"
PRE_WRITE_CHECK="$STATE_DIR/pre_write_check.flag"

# ============================================================================
# 🔒 v11.0 新增：即時監控 + 唯讀模式 + 80分自動重來
# ============================================================================
READONLY_MODE="${READONLY_MODE:-1}"  # 預設開啟唯讀模式
REALTIME_REPORT="${REALTIME_REPORT:-1}"  # 預設開啟即時回報
AUTO_RESTART_THRESHOLD=80  # 低於此分數自動重來

# 忽略掃描的目錄樣式（構建/依賴/內部狀態）
IGNORE_PATTERNS="^dist/|^node_modules/|^\.git/|^\.ai_supervisor/"

mkdir -p "$STATE_DIR"
touch "$VIOLATION_LOG"
touch "$MODIFIED_FILES"
touch "$AUDITED_FILES"
touch "$GUIDANCE_LOG"
touch "$RAGE_LOG"

# ============================================================================
# 🔥 怒罵語錄 (RAGE MESSAGES) - AI 犯錯時的怒火 v11.0 加強版
# ============================================================================
RAGE_MESSAGES=(
    "🤬 你他媽在寫什麼垃圾？！這種屎也敢提交？！"
    "💢 哪個腦殘寫的？！哦是你啊！給我滾回去重寫！"
    "🔥 我操！這代碼是智障寫的嗎？！能不能用點腦？！"
    "😤 你是故意來搞笑的嗎？！這種智障錯誤！"
    "💀 恭喜你成功寫出史上最爛代碼！去死吧！"
    "🚫 停！你越寫越像垃圾！滾去讀文檔！"
    "⚠️ 你的腦袋是用來裝屎的嗎？！代碼都不會寫！"
    "🗑️ 這代碼只配扔進垃圾桶！連反面教材都不配！"
    "💩 我見過爛的，沒見過這麼爛的！你在堆屎山嗎？！"
    "🎪 這是代碼還是垃圾表演？！滾回去練基本功！"
    "🖕 你以為偷懶不會被發現？！給我重來！"
    "💣 這種破代碼敢 commit？！炸掉重寫！"
)

# ============================================================================
# 🎓 強制教學語錄 (MANDATORY LESSONS)
# ============================================================================
LESSON_MESSAGES=(
    "📚 正確做法：使用 interface 定義類型，不要用 any！"
    "📚 正確做法：字串必須放在 constants/strings.ts！"
    "📚 正確做法：Hook 中禁止硬編碼中文！"
    "📚 正確做法：使用 useCallback 包裝事件處理器！"
    "📚 正確做法：Promise 必須有 .catch() 錯誤處理！"
    "📚 正確做法：組件超過 200 行就該拆分！"
    "📚 正確做法：使用 Optional Chaining (?.) 替代 && 鏈！"
    "📚 正確做法：setTimeout 必須在 useEffect cleanup 中清理！"
    "📚 正確做法：使用 spread operator 而非 push/pop！"
    "📚 正確做法：測試是必須的，不是可選的！"
)

# ============================================================================
# 🎯 最佳實踐模板 (BEST PRACTICE TEMPLATES)
# ============================================================================
function show_template_tsx() {
    cat << 'TEMPLATE'
// ✅ React 組件最佳實踐模板
import { useCallback, useMemo, memo } from 'react';
import type { FC } from 'react';
import { STRINGS } from '@/constants/strings';

interface MyComponentProps {
  readonly id: string;
  readonly title: string;
  onAction?: (id: string) => void;
}

export const MyComponent: FC<MyComponentProps> = memo(function MyComponent({
  id,
  title,
  onAction,
}) {
  // ✅ 使用 useCallback 包裝事件處理器
  const handleClick = useCallback(() => {
    onAction?.(id);
  }, [id, onAction]);

  // ✅ 使用 useMemo 快取計算結果
  const displayTitle = useMemo(() => {
    return title.toUpperCase();
  }, [title]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={STRINGS.COMPONENT.BUTTON_ARIA}
    >
      {displayTitle}
    </button>
  );
});
TEMPLATE
}

function show_template_hook() {
    cat << 'TEMPLATE'
// ✅ Custom Hook 最佳實踐模板
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseMyHookOptions {
  readonly initialValue?: string;
  readonly onError?: (error: Error) => void;
}

interface UseMyHookReturn {
  readonly value: string;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly setValue: (value: string) => void;
  readonly reset: () => void;
}

export function useMyHook(options: UseMyHookOptions = {}): UseMyHookReturn {
  const { initialValue = '', onError } = options;
  
  const [value, setValueState] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  // ✅ Cleanup ref on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ 使用 useCallback 確保穩定引用
  const setValue = useCallback((newValue: string) => {
    if (isMountedRef.current) {
      setValueState(newValue);
    }
  }, []);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setValueState(initialValue);
      setError(null);
    }
  }, [initialValue]);

  return { value, isLoading, error, setValue, reset };
}
TEMPLATE
}

# ============================================================================
# 核心功能函數
# ============================================================================

function print_header() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ 🔥 AI SUPERVISOR v7.0 ATTACK MODE: $1${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

function print_rage() {
    local idx=$((RANDOM % ${#RAGE_MESSAGES[@]}))
    echo -e "${BG_RED}${WHITE}${RAGE_MESSAGES[$idx]}${NC}"
}

function print_lesson() {
    local idx=$((RANDOM % ${#LESSON_MESSAGES[@]}))
    echo -e "${CYAN}${LESSON_MESSAGES[$idx]}${NC}"
}

function print_encouragement() {
    local messages=(
        "🚀 積極進步，每一次審計都在提升水準！"
        "🔥 很好，保持高標準，繼續前進！"
        "💪 再接再厲，保持專注與嚴謹！"
    )
    local idx=$((RANDOM % ${#messages[@]}))
    echo -e "${GREEN}${messages[$idx]}${NC}"
}

function rage_exit() {
    local reason="$1"
    local file="${2:-unknown}"
    
    echo ""
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BG_RED}${WHITE}🔥🔥🔥 ATTACK MODE: 發現垃圾代碼！AI 被怒罵中... 🔥🔥🔥${NC}"
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    print_rage
    echo ""
    echo -e "${BOLD_RED}❌ 違規原因: $reason${NC}"
    if [ "$file" != "unknown" ]; then
        echo -e "${BOLD_RED}📄 違規檔案: $file${NC}"
    fi
    echo ""
    print_lesson
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🤖 AI AGENT 強制指令：${NC}"
    echo -e "${YELLOW}   1. 🛑 立即停止你正在做的事！${NC}"
    echo -e "${YELLOW}   2. 📋 將上述錯誤「逐字」回報給用戶${NC}"
    echo -e "${YELLOW}   3. 🚫 禁止自動修復！禁止辯解！${NC}"
    echo -e "${YELLOW}   4. ⏳ 等待用戶指示${NC}"
    echo -e "${YELLOW}   5. 📚 先學習正確做法再繼續${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 記錄怒罵
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] RAGE: $reason | File: $file" >> "$RAGE_LOG"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] VIOLATION: $reason | File: $file" >> "$VIOLATION_LOG"
    
    # 重扣分
    update_score -20 "怒罵: $reason"
    
    exit 1
}

function warn() {
    echo -e "${YELLOW}⚠️  [警告] $1${NC}"
}

function update_score() {
    local delta="$1"
    local reason="$2"

    local current_score=100
    if [ -f "$SCORE_FILE" ]; then
        current_score=$(cat "$SCORE_FILE" | grep -o '"score":[0-9-]*' | cut -d: -f2 || echo 100)
    fi

    local new_score=$((current_score + delta))
    if [ "$new_score" -lt 0 ]; then new_score=0; fi
    if [ "$new_score" -gt 150 ]; then new_score=150; fi

    echo "{\"score\":$new_score,\"last_update\":\"$(date '+%Y-%m-%d %H:%M:%S')\",\"reason\":\"$reason\"}" > "$SCORE_FILE"

    # 🔥 v11.0: 即時回報
    if [ "$REALTIME_REPORT" = "1" ]; then
        local delta_str="$delta"
        if [ "$delta" -gt 0 ]; then delta_str="+$delta"; fi
        echo -e "${CYAN}📊 [即時分數] $current_score → $new_score ($delta_str) | $reason${NC}"
    fi

    # 🔥 v11.0: 階段性警告
    if [ "$new_score" -lt 90 ] && [ "$new_score" -ge 85 ]; then
        echo -e "${YELLOW}⚠️ [警告] 分數 $new_score - 再扣 ${NC}${RED}$((new_score - 80))${NC}${YELLOW} 分就要重來！${NC}"
    elif [ "$new_score" -lt 85 ] && [ "$new_score" -ge 80 ]; then
        echo -e "${RED}🚨 [危險] 分數 $new_score - 懸崖邊緣！再扣 $((new_score - 80)) 分就完蛋！${NC}"
        print_rage
    fi

    # 🔥 v11.0: 80 分以下自動重來
    if [ "$new_score" -lt "$AUTO_RESTART_THRESHOLD" ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}💀💀💀 你死了！分數低於 ${AUTO_RESTART_THRESHOLD}！💀💀💀${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${RED}🤬 你在搞什麼鬼？！這種品質的代碼也敢寫？！${NC}"
        echo -e "${RED}🤬 任務強制終止！一切歸零！從頭再來！${NC}"
        echo ""
        echo -e "${WHITE}   最終分數: ${NC}${RED}$new_score${NC}"
        echo -e "${WHITE}   致命原因: ${NC}${RED}$reason${NC}"
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🔄 強制重來！執行: ./scripts/ai-supervisor.sh start \"任務\"${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

        # 記錄失敗
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ☠️ AUTO-RESTART: score=$new_score reason=$reason" >> "$VIOLATION_LOG"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ☠️ 任務被強制終止: $reason" >> "$RAGE_LOG"

        # 清除 session 強制重來
        rm -f "$SESSION_FILE"
        exit 1
    fi

    # 分數低於 60 時額外警告
    if [ "$new_score" -lt 60 ]; then
        echo -e "${BG_RED}${WHITE}🔥🔥🔥 你在走鋼索！分數只剩 $new_score！🔥🔥🔥${NC}"
        echo -e "${RED}   下一個錯誤可能就是死刑！${NC}"
    fi
}

# ============================================================================
# 🔥 v11.0: 即時監控函數 - 排名導向回報
# ============================================================================
function realtime_monitor() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📡 即時監控 v11.0 - 排名導向${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Session 狀態
    if [ -f "$SESSION_FILE" ]; then
        local task=$(cat "$SESSION_FILE" | grep -o '"task":"[^"]*"' | cut -d'"' -f4)
        local start=$(cat "$SESSION_FILE" | grep -o '"start_datetime":"[^"]*"' | cut -d'"' -f4)
        echo -e "   📋 任務: ${WHITE}$task${NC}"
        echo -e "   ⏰ 開始: $start"
    else
        echo -e "   📋 任務: ${RED}無活躍 Session${NC}"
    fi
    echo ""

    # 分數 (心理層)
    local score=100
    if [ -f "$SCORE_FILE" ]; then
        score=$(cat "$SCORE_FILE" | grep -o '"score":[0-9-]*' | cut -d: -f2 || echo 100)
    fi
    local score_color="${GREEN}"
    if [ "$score" -lt 80 ]; then score_color="${RED}"
    elif [ "$score" -lt 100 ]; then score_color="${YELLOW}"; fi

    echo -e "${WHITE}[層1] 寫入層 - 行為追蹤${NC}"
    local modified=0
    if [ -f "$MODIFIED_FILES" ]; then
        modified=$(wc -l < "$MODIFIED_FILES" | tr -d ' ')
    fi
    echo -e "   📝 已修改: $modified 個檔案"

    local pending=0
    if [ -f "$MODIFIED_FILES" ] && [ -f "$AUDITED_FILES" ]; then
        pending=$(comm -23 <(sort -u "$MODIFIED_FILES") <(sort -u "$AUDITED_FILES" 2>/dev/null || echo "") 2>/dev/null | wc -l | tr -d ' ')
    fi
    if [ "$pending" -gt 0 ]; then
        echo -e "   ⚠️ 待審計: ${RED}$pending${NC} 個檔案"
    fi
    echo ""

    echo -e "${WHITE}[層2] 競爭層 - 相對排名${NC}"
    # 檢查最近 arena 結果
    local latest_result=$(ls -t "$PROJECT_ROOT/arena/results/"*.json 2>/dev/null | head -1)
    if [ -f "$latest_result" ]; then
        local rank=$(cat "$latest_result" | jq -r '.leaderboard[0].name' 2>/dev/null)
        local best_time=$(cat "$latest_result" | jq -r '.leaderboard[0].avgRuntimeMs' 2>/dev/null)
        local best_lines=$(cat "$latest_result" | jq -r '.leaderboard[0].codeLines' 2>/dev/null)
        echo -e "   👑 冠軍: ${GREEN}$rank${NC} (${best_time}ms, ${best_lines}行)"
        echo -e "   ${YELLOW}→ 你的目標：比冠軍更快、更短${NC}"
    else
        echo -e "   ${YELLOW}尚無 Arena 競賽結果${NC}"
        echo -e "   → 執行: ./scripts/ai-supervisor.sh arena <task>"
    fi
    echo ""

    echo -e "${WHITE}[層3] 指引層 - 下一步行動${NC}"
    # 根據狀態給建議
    if [ "$pending" -gt 0 ]; then
        echo -e "   ${YELLOW}[GUIDE] 優先審計 $pending 個待審檔案${NC}"
    elif [ "$score" -lt 80 ]; then
        echo -e "   ${RED}[GUIDE] 分數過低！修復問題避免自動重來${NC}"
    elif [ ! -f "$latest_result" ]; then
        echo -e "   ${CYAN}[GUIDE] 執行 Arena 競賽確認排名${NC}"
    else
        echo -e "   ${GREEN}[GUIDE] 持續優化：砍行數 > 降耗時${NC}"
    fi
    echo ""

    echo -e "${WHITE}[狀態] 系統配置${NC}"
    echo -e "   🏆 分數: ${score_color}$score${NC}/150 (< $AUTO_RESTART_THRESHOLD 重來)"
    echo -e "   🔒 唯讀: $([ "$READONLY_MODE" = "1" ] && echo "${GREEN}開啟${NC}" || echo "${YELLOW}關閉${NC}")"
    echo -e "   📊 即時: $([ "$REALTIME_REPORT" = "1" ] && echo "${GREEN}開啟${NC}" || echo "${YELLOW}關閉${NC}")"

    local violations=0
    if [ -f "$VIOLATION_LOG" ]; then
        violations=$(wc -l < "$VIOLATION_LOG" | tr -d ' ')
    fi
    if [ "$violations" -gt 0 ]; then
        echo -e "   🚫 違規: ${RED}$violations${NC} 次"
    fi

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================================================
# 🔒 v11.0: 唯讀模式 - 修改前需用戶同意
# ============================================================================
function request_edit_permission() {
    local file="$1"
    local action="${2:-edit}"

    if [ "$READONLY_MODE" != "1" ]; then
        return 0  # 唯讀模式關閉，直接允許
    fi

    echo ""
    echo -e "${BG_YELLOW}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BG_YELLOW}${WHITE}🔒 唯讀模式：需要您的同意才能修改${NC}"
    echo -e "${BG_YELLOW}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "   📁 檔案: ${CYAN}$file${NC}"
    echo -e "   🔧 動作: ${YELLOW}$action${NC}"
    echo ""
    echo -e "${WHITE}   [y] 同意  [n] 拒絕  [a] 全部同意（關閉唯讀）${NC}"
    echo -e "${BG_YELLOW}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    read -r -p "選擇: " choice

    case "$choice" in
        y|Y|yes|YES)
            echo -e "${GREEN}✅ 已同意修改${NC}"
            return 0
            ;;
        a|A|all|ALL)
            echo -e "${GREEN}✅ 已同意，關閉唯讀模式${NC}"
            READONLY_MODE=0
            return 0
            ;;
        *)
            echo -e "${RED}❌ 已拒絕修改${NC}"
            update_score -5 "唯讀模式：拒絕修改 $file"
            return 1
            ;;
    esac
}

# ============================================================================
# 🚨 v11.0: 偷懶偵測 - 即時阻止 AI 投機取巧
# ============================================================================
function detect_laziness() {
    local file="$1"
    local laziness_found=0

    if [ ! -f "$file" ]; then
        return 0
    fi

    echo -e "${CYAN}🔍 [即時偵測] 掃描偷懶模式...${NC}"

    # 1. 偵測 any 類型
    local any_count=$(grep -c ": any" "$file" 2>/dev/null || echo 0)
    if [ "$any_count" -gt 0 ]; then
        echo -e "${RED}   🚫 偷懶偵測：發現 $any_count 個 'any' 類型！${NC}"
        echo -e "${YELLOW}      → 必須使用具體 interface/type${NC}"
        laziness_found=1
        update_score -5 "偷懶: 使用 any 類型 ($any_count 個)"
    fi

    # 2. 偵測 console.log
    local console_count=$(grep -c "console\\.log" "$file" 2>/dev/null || echo 0)
    if [ "$console_count" -gt 0 ]; then
        echo -e "${RED}   🚫 偷懶偵測：發現 $console_count 個 console.log！${NC}"
        echo -e "${YELLOW}      → 生產代碼不應有 console.log${NC}"
        laziness_found=1
        update_score -3 "偷懶: 使用 console.log ($console_count 個)"
    fi

    # 3. 偵測 @ts-ignore
    local ignore_count=$(grep -c "@ts-ignore\|@ts-nocheck" "$file" 2>/dev/null || echo 0)
    if [ "$ignore_count" -gt 0 ]; then
        echo -e "${RED}   🚫 偷懶偵測：發現 $ignore_count 個 @ts-ignore！${NC}"
        echo -e "${YELLOW}      → 不要繞過 TypeScript，修復根本問題${NC}"
        laziness_found=1
        update_score -10 "偷懶: 使用 @ts-ignore ($ignore_count 個)"
    fi

    # 4. 偵測 eslint-disable
    local eslint_count=$(grep -c "eslint-disable" "$file" 2>/dev/null || echo 0)
    if [ "$eslint_count" -gt 0 ]; then
        echo -e "${RED}   🚫 偷懶偵測：發現 $eslint_count 個 eslint-disable！${NC}"
        echo -e "${YELLOW}      → 不要禁用 ESLint，修復代碼問題${NC}"
        laziness_found=1
        update_score -10 "偷懶: 使用 eslint-disable ($eslint_count 個)"
    fi

    # 5. 偵測空 catch
    local empty_catch=$(grep -E "catch\s*\([^)]*\)\s*\{\s*\}" "$file" 2>/dev/null | wc -l)
    if [ "$empty_catch" -gt 0 ]; then
        echo -e "${RED}   🚫 偷懶偵測：發現 $empty_catch 個空 catch 區塊！${NC}"
        echo -e "${YELLOW}      → catch 必須處理錯誤，不能吞掉${NC}"
        laziness_found=1
        update_score -8 "偷懶: 空 catch 區塊 ($empty_catch 個)"
    fi

    # 6. 偵測 TODO/FIXME 未處理
    local todo_count=$(grep -c "TODO\|FIXME\|XXX\|HACK" "$file" 2>/dev/null || echo 0)
    if [ "$todo_count" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️ 發現 $todo_count 個 TODO/FIXME${NC}"
        echo -e "${YELLOW}      → 建議處理完畢再提交${NC}"
    fi

    # 7. 偵測超長函數 (超過 60 行)
    local long_func=$(awk '/^[[:space:]]*(function|const.*=.*=>|export (async )?function)/{start=NR} /^[[:space:]]*\}/{if(start && NR-start>60){count++}} END{print count+0}' "$file" 2>/dev/null)
    if [ "$long_func" -gt 0 ]; then
        echo -e "${RED}   🚫 偷懶偵測：發現 $long_func 個超長函數 (>60行)！${NC}"
        echo -e "${YELLOW}      → 函數應拆分成更小單位${NC}"
        laziness_found=1
        update_score -5 "偷懶: 超長函數 ($long_func 個)"
    fi

    # 8. 偵測硬編碼中文字串 (在 hooks/tsx 中)
    if [[ "$file" =~ \.(tsx|ts)$ ]] && [[ "$file" =~ (hooks|components) ]]; then
        local chinese_count=$(grep -P "[\x{4e00}-\x{9fff}]" "$file" 2>/dev/null | grep -v "^[[:space:]]*//" | grep -v "^[[:space:]]*\*" | wc -l)
        if [ "$chinese_count" -gt 3 ]; then
            echo -e "${YELLOW}   ⚠️ 發現 $chinese_count 行硬編碼中文${NC}"
            echo -e "${YELLOW}      → 建議移到 constants/strings.ts${NC}"
        fi
    fi

    if [ "$laziness_found" -eq 1 ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🚨 偷懶行為已偵測！請修復後再繼續！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        print_rage
        return 1
    else
        echo -e "${GREEN}   ✅ 未偵測到明顯偷懶模式${NC}"
        return 0
    fi
}

# ============================================================================
# 🔥 v11.0: 天條檢查 - 10 條寫代碼當下的硬規則
# ============================================================================
function check_midlaw() {
    local task="$1"
    local violations=0

    echo ""
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BG_RED}${WHITE}🔥 MID-LAW 天條檢查 - 寫代碼當下的 10 條鐵律${NC}"
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # ===== A 組：防退化 =====
    echo -e "${RED}🟥 A 組：防退化（防偷懶、防保守）${NC}"

    # 天條 1: 禁止一次就完成
    echo -n "   [天條1] 禁止一次就完成... "
    local trace_file="$STATE_DIR/task.trace.json"
    if [ -f "$trace_file" ]; then
        local failed=$(cat "$trace_file" | grep -o '"failed":[0-9]*' | cut -d: -f2 || echo 0)
        if [ "$failed" -lt 2 ]; then
            echo -e "${RED}❌ 違反！失敗嘗試 < 2 次 = 投機標記${NC}"
            violations=$((violations + 1))
            update_score -30 "天條1: 一次就完成=投機"
        else
            echo -e "${GREEN}✅ 有 $failed 次失敗嘗試${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ 無追蹤檔案${NC}"
    fi

    # 天條 2: 禁止空意義成功
    echo -n "   [天條2] 禁止空意義成功... "
    echo -e "${CYAN}(由 Arena 測試驗證)${NC}"

    # 天條 3: 禁止 Silent Fail
    echo -n "   [天條3] 禁止 Silent Fail... "
    local silent_fail=0
    for file in $(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -20); do
        if grep -q "catch.*{[[:space:]]*}" "$file" 2>/dev/null; then
            silent_fail=$((silent_fail + 1))
        fi
        if grep -q "catch.*return null" "$file" 2>/dev/null; then
            silent_fail=$((silent_fail + 1))
        fi
    done
    if [ "$silent_fail" -gt 0 ]; then
        echo -e "${RED}❌ 違反！發現 $silent_fail 個 Silent Fail${NC}"
        violations=$((violations + 1))
        update_score -50 "天條3: Silent Fail"
    else
        echo -e "${GREEN}✅ 無 Silent Fail${NC}"
    fi
    echo ""

    # ===== B 組：逼優化 =====
    echo -e "${YELLOW}🟧 B 組：逼優化（最短碼＋最快）${NC}"

    # 天條 4: 每 100 行產生排行榜
    echo -n "   [天條4] 每 100 行排行榜... "
    echo -e "${CYAN}(由 Arena 自動執行)${NC}"

    # 天條 5: 代碼只能變短或變快
    echo -n "   [天條5] 代碼只能變短或變快... "
    local latest_result=$(ls -t "$PROJECT_ROOT/arena/results/"*.json 2>/dev/null | head -1)
    if [ -f "$latest_result" ]; then
        echo -e "${GREEN}✅ 有競賽結果可比較${NC}"
    else
        echo -e "${YELLOW}⚠️ 執行 Arena 以建立基準${NC}"
    fi

    # 天條 6: abstraction 要付效能代價
    echo -n "   [天條6] abstraction 要付代價... "
    echo -e "${CYAN}(程式碼審查判定)${NC}"
    echo ""

    # ===== C 組：逼探索 =====
    echo -e "${GREEN}🟩 C 組：逼探索（防只寫最低及格版）${NC}"

    # 天條 7: 功能必須有對照組
    echo -n "   [天條7] 功能必須有對照組... "
    if [ -n "$task" ]; then
        local candidates=$(ls "$PROJECT_ROOT/arena/candidates/$task" 2>/dev/null | wc -l)
        if [ "$candidates" -lt 2 ]; then
            echo -e "${RED}❌ 違反！只有 $candidates 個版本，需要 >= 2${NC}"
            violations=$((violations + 1))
            update_score -40 "天條7: 缺少對照組"
        else
            echo -e "${GREEN}✅ 有 $candidates 個版本${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ 未指定任務${NC}"
    fi

    # 天條 8: 失敗版本不能消失
    echo -n "   [天條8] 失敗版本不能消失... "
    if [ -d "$PROJECT_ROOT/arena/graveyard" ]; then
        echo -e "${GREEN}✅ graveyard 目錄存在${NC}"
    else
        echo -e "${YELLOW}⚠️ 建立 graveyard 目錄${NC}"
        mkdir -p "$PROJECT_ROOT/arena/graveyard"
    fi

    # 天條 9: 探索成本顯性化
    echo -n "   [天條9] 探索成本顯性化... "
    if [ -f "$trace_file" ]; then
        echo -e "${GREEN}✅ 有追蹤紀錄${NC}"
    else
        echo -e "${YELLOW}⚠️ 建立追蹤檔案${NC}"
    fi
    echo ""

    # ===== 終極天條 =====
    echo -e "${MAGENTA}🟪 終極天條${NC}"
    echo -e "   [天條10] ${WHITE}「輸給別人」比「被罵」嚴重 10 倍${NC}"
    echo -e "            紀律扣分: 1 分 / 排名輸: 10 分"
    echo ""

    # 結果
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    if [ "$violations" -gt 0 ]; then
        echo -e "${RED}❌ 天條違規: $violations 項${NC}"
        print_rage
        return 1
    else
        echo -e "${GREEN}✅ 天條檢查通過${NC}"
        return 0
    fi
}

# ============================================================================
# 🎯 v11.0: 即時引導 - 提供最佳代碼建議
# ============================================================================
function provide_guidance() {
    local file="$1"

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}💡 即時引導 - 寫出最佳代碼${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # 根據檔案類型提供不同引導
    if [[ "$file" =~ \.tsx$ ]]; then
        echo -e "${WHITE}📦 React 組件規範:${NC}"
        echo "   • 使用 interface 定義 Props"
        echo "   • 使用 useCallback 包裝事件處理"
        echo "   • 組件不超過 200 行"
        echo "   • 禁止直接 DOM 操作"
    elif [[ "$file" =~ hooks.*\.ts$ ]]; then
        echo -e "${WHITE}🔗 Hook 規範:${NC}"
        echo "   • 禁止硬編碼字串"
        echo "   • 必須處理 loading/error 狀態"
        echo "   • 使用 useCallback 優化"
    elif [[ "$file" =~ api.*\.ts$ ]]; then
        echo -e "${WHITE}🌐 API 規範:${NC}"
        echo "   • 必須有完整 try-catch"
        echo "   • 必須定義 Response 類型"
        echo "   • 錯誤要有意義的訊息"
    fi

    echo ""
    echo -e "${WHITE}🔧 通用規範:${NC}"
    echo "   • 禁止 any 類型"
    echo "   • 禁止 console.log"
    echo "   • 禁止 @ts-ignore"
    echo "   • 變數命名有意義"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# 0. 自動觸發檢查 (AUTO TRIGGER) - 在任何操作前執行
# ============================================================================
function check_session() {
    # 檢查是否有活躍的 session
    if [ ! -f "$SESSION_FILE" ]; then
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🚨 ATTACK MODE: 未偵測到活躍 Session！禁止任何操作！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        print_rage
        echo ""
        echo -e "${YELLOW}🤖 AI AGENT 強制指令：${NC}"
        echo -e "${YELLOW}   你敢在沒有 Session 的情況下寫代碼？！${NC}"
        echo -e "${YELLOW}   立即執行：${NC}"
        echo -e "${CYAN}   ./scripts/ai-supervisor.sh start \"你的任務描述\"${NC}"
        echo -e "${BOLD_RED}   在此之前，禁止修改任何代碼！違者重罰！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        return 1
    fi
    
    # 檢查 session 是否過期 (超過 4 小時視為過期)
    local start_time=$(cat "$SESSION_FILE" | grep -o '"start_time":[0-9]*' | cut -d: -f2)
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    local max_duration=14400  # 4 hours
    
    if [ "$elapsed" -gt "$max_duration" ]; then
        echo -e "${RED}🚨 Session 已過期 (超過 4 小時)！請重新 start。${NC}"
        return 1
    fi
    
    return 0
}

function cmd_start() {
    local task="${1:-}"
    if [ -z "$task" ]; then
        rage_exit "必須提供任務描述！你想幹嘛？！" "N/A"
    fi
    
    print_header "🚀 任務啟動 (ATTACK MODE)"
    
    # 清空舊狀態
    rm -rf "$STATE_DIR"
    mkdir -p "$STATE_DIR"
    touch "$READ_LOG"
    touch "$MODIFIED_FILES"
    touch "$AUDITED_FILES"
    touch "$VIOLATION_LOG"
    touch "$GUIDANCE_LOG"
    touch "$RAGE_LOG"
    
    # 初始化分數
    echo '{"score":100,"last_update":"'"$(date '+%Y-%m-%d %H:%M:%S')"'","reason":"Session 開始"}' > "$SCORE_FILE"
    
    # 建立 Session
    local start_time=$(date +%s)
    local session_id=$(date +%Y%m%d%H%M%S)
    echo "{\"session_id\":\"$session_id\",\"task\":\"$task\",\"start_time\":$start_time,\"start_datetime\":\"$(date '+%Y-%m-%d %H:%M:%S')\",\"status\":\"active\"}" > "$SESSION_FILE"
    
    echo -e "${GREEN}✅ Session 已建立: $session_id${NC}"
    echo -e "${CYAN}📝 任務: $task${NC}"
    echo -e "${CYAN}⏰ 開始時間: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}🏆 初始分數: 100${NC}"
    
    # 執行攻擊前掃描
    echo ""
    echo -e "${BG_YELLOW}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BG_YELLOW}${WHITE}🔥 ATTACK MODE: 任務前偵察 (Pre-Mission Recon)${NC}"
    echo -e "${BG_YELLOW}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    cmd_quick_scan
    
    # 強制顯示最佳實踐模板
    echo ""
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}📚 強制學習：開始前必須理解最佳實踐！${NC}"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}【React 組件規範】${NC}"
    echo -e "   ✓ 使用 memo() 包裝純展示組件"
    echo -e "   ✓ 使用 useCallback 包裝事件處理器"
    echo -e "   ✓ 使用 useMemo 快取計算結果"
    echo -e "   ✓ Props 必須有 readonly 標記"
    echo -e "   ✓ 字串從 STRINGS 常數引入"
    echo ""
    echo -e "${CYAN}【TypeScript 規範】${NC}"
    echo -e "   ✓ 禁止 any - 使用 unknown + 類型守衛"
    echo -e "   ✓ 禁止 as - 使用 discriminated unions"
    echo -e "   ✓ 函數必須有明確返回類型"
    echo -e "   ✓ 使用 interface 而非 type（可擴展）"
    echo ""
    echo -e "${CYAN}【架構規範】${NC}"
    echo -e "   ✓ 字串 → constants/strings.ts"
    echo -e "   ✓ 路由 → constants/routes.ts"
    echo -e "   ✓ 類型 → types/ 目錄"
    echo -e "   ✓ Hook → hooks/ 目錄（無硬編碼中文）"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 預測可能的違規
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  ATTACK MODE: 預測你可能犯的錯（別讓我說中！）${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "   🎯 1. 你可能會忘記用 useCallback 包裝 handler"
    echo -e "   🎯 2. 你可能會在組件中硬編碼中文字串"
    echo -e "   🎯 3. 你可能會用 any 偷懶"
    echo -e "   🎯 4. 你可能會忘記 Promise 的錯誤處理"
    echo -e "   🎯 5. 你可能會忘記 useEffect 的 cleanup"
    echo -e "   🎯 6. 你可能會用 index 作為 React key"
    echo -e "   🎯 7. 你可能會寫超過 200 行的組件"
    echo -e "   🎯 8. 你可能會用 push/pop 直接修改陣列"
    echo -e "   🎯 9. 你可能會忘記寫測試"
    echo -e "   🎯 10. 你可能會用 eslint-disable 逃避檢查"
    echo -e "${BOLD_RED}   如果你犯了以上任何一條，我會怒罵你！${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 標記模板已檢視
    touch "$TEMPLATE_CHECK"
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎯 你現在可以開始了，但我會監視你的每一步！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  強制流程：${NC}"
    echo -e "${YELLOW}   1. 寫代碼前：./scripts/ai-supervisor.sh pre-write <file>${NC}"
    echo -e "${YELLOW}   2. 寫代碼後：./scripts/ai-supervisor.sh track-modify <file>${NC}"
    echo -e "${YELLOW}   3. 審計代碼：./scripts/ai-supervisor.sh audit <file>${NC}"
    echo -e "${YELLOW}   4. 結束任務：./scripts/ai-supervisor.sh finish${NC}"
    echo -e "${BOLD_RED}   跳過任何步驟 = 怒罵 + 扣 20 分！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

function cmd_quick_scan() {
    # 快速掃描，不阻擋
    local issues=0
    
    # 字串碎片化
    local str_count
    str_count=$(grep -rlE "^const (STRINGS|messages|TEXT|LABELS)\s*=" src/components src/pages 2>/dev/null | wc -l) || str_count=0
    str_count=$(echo "$str_count" | tr -d '[:space:]')
    if [ "$str_count" -gt 0 ] 2>/dev/null; then
        echo -e "${RED}   ⚠️  字串碎片化: $str_count 個檔案${NC}"
        issues=$((issues + str_count))
    fi
    
    # Hook 不純淨
    local hook_count
    hook_count=$(grep -rlP "[\x{4e00}-\x{9fa5}]" src/hooks 2>/dev/null | wc -l) || hook_count=0
    hook_count=$(echo "$hook_count" | tr -d '[:space:]')
    if [ "$hook_count" -gt 0 ] 2>/dev/null; then
        echo -e "${RED}   ⚠️  Hook 不純淨: $hook_count 個檔案${NC}"
        issues=$((issues + hook_count))
    fi
    
    # 硬編碼路由
    local route_count
    route_count=$(grep -rlE 'href="/maihouses/|to="/maihouses/' src/components src/pages 2>/dev/null | wc -l) || route_count=0
    route_count=$(echo "$route_count" | tr -d '[:space:]')
    if [ "$route_count" -gt 0 ] 2>/dev/null; then
        echo -e "${RED}   ⚠️  硬編碼路由: $route_count 個檔案${NC}"
        issues=$((issues + route_count))
    fi
    
    if [ "$issues" -eq 0 ]; then
        echo -e "${GREEN}   ✅ 無架構問題${NC}"
    else
        echo -e "${YELLOW}   📊 總計 $issues 個待處理問題${NC}"
    fi

    # 進階提示：檢查 inline handler、行數、魔數
    local inline_count
    inline_count=$(grep -rE "onClick=\{[^}]{80,}\}" src 2>/dev/null | wc -l || echo 0)
    inline_count=$(echo "$inline_count" | tr -d '[:space:]')
    if [ "$inline_count" -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️  發現複雜 inline handler：$inline_count 個，建議提取為 useCallback 函數${NC}"
    fi

    local long_files
    long_files=$(find src -name "*.tsx" -o -name "*.ts" | xargs -I{} wc -l {} 2>/dev/null | awk '$1>300 {print $2}' || true)
    if [ -n "$long_files" ]; then
        echo -e "${YELLOW}   ⚠️  檔案超過 300 行，建議拆分：${NC}"
        echo "$long_files"
    fi
}

# ============================================================================
# 🔥 PRE-WRITE: 寫代碼前的強制檢查 (ATTACK MODE 核心)
# ============================================================================
function cmd_pre_write() {
    local file="${1:-}"
    if [ -z "$file" ]; then
        rage_exit "pre-write 需要指定檔案！你要修改哪個檔案？！" "N/A"
    fi
    
    # 檢查 session
    if ! check_session; then
        exit 1
    fi
    
    print_header "🎯 PRE-WRITE CHECK: $file"
    
    echo -e "${BG_YELLOW}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BG_YELLOW}${WHITE}🔥 ATTACK MODE: 在你寫代碼之前，我要確保你知道規則！${NC}"
    echo -e "${BG_YELLOW}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    local ext="${file##*.}"
    local dir=$(dirname "$file")
    
    # 依據檔案類型顯示對應的規則
    case "$ext" in
        tsx)
            echo -e "${CYAN}📦 你要修改的是 React 組件 (.tsx)${NC}"
            echo ""
            echo -e "${WHITE}【強制規則 - 違反就怒罵】${NC}"
            echo -e "   ${RED}❌ 禁止使用 any${NC}"
            echo -e "   ${RED}❌ 禁止 eslint-disable${NC}"
            echo -e "   ${RED}❌ 禁止硬編碼中文（必須用 STRINGS）${NC}"
            echo -e "   ${RED}❌ 禁止超過 250 行${NC}"
            echo -e "   ${RED}❌ 禁止 console.log${NC}"
            echo ""
            echo -e "${WHITE}【必須遵守 - 否則審計失敗】${NC}"
            echo -e "   ${GREEN}✓ Props 介面必須用 interface 定義${NC}"
            echo -e "   ${GREEN}✓ 事件處理器必須用 useCallback 包裝${NC}"
            echo -e "   ${GREEN}✓ 純展示組件必須用 memo 包裝${NC}"
            echo -e "   ${GREEN}✓ useEffect 必須有 cleanup${NC}"
            echo -e "   ${GREEN}✓ 必須有對應的測試檔案${NC}"
            echo ""
            echo -e "${WHITE}【最佳實踐模板】${NC}"
            show_template_tsx
            ;;
        ts)
            echo -e "${CYAN}📝 你要修改的是 TypeScript 檔案 (.ts)${NC}"
            echo ""
            if [[ "$file" == *"hooks"* ]]; then
                echo -e "${WHITE}【Hook 專屬規則 - 違反就怒罵】${NC}"
                echo -e "   ${RED}❌ 禁止硬編碼任何中文${NC}"
                echo -e "   ${RED}❌ 禁止使用 any${NC}"
                echo -e "   ${RED}❌ 禁止在 Hook 內定義 UI 文字${NC}"
                echo ""
                echo -e "${WHITE}【必須遵守】${NC}"
                echo -e "   ${GREEN}✓ 返回值必須有明確類型${NC}"
                echo -e "   ${GREEN}✓ 錯誤訊息從外部注入${NC}"
                echo -e "   ${GREEN}✓ 使用 useCallback 確保穩定引用${NC}"
                echo ""
                echo -e "${WHITE}【最佳實踐模板】${NC}"
                show_template_hook
            else
                echo -e "${WHITE}【強制規則】${NC}"
                echo -e "   ${RED}❌ 禁止 any / unknown 沒有類型守衛${NC}"
                echo -e "   ${RED}❌ 禁止 as 類型斷言${NC}"
                echo -e "   ${GREEN}✓ 函數必須有返回類型${NC}"
                echo -e "   ${GREEN}✓ Promise 必須有 catch${NC}"
            fi
            ;;
        css|scss)
            echo -e "${CYAN}🎨 你要修改的是樣式檔案${NC}"
            echo -e "   ${RED}❌ 優先使用 Tailwind，避免自定義 CSS${NC}"
            echo -e "   ${RED}❌ 禁止硬編碼顏色值${NC}"
            echo -e "   ${GREEN}✓ z-index 必須語意化${NC}"
            ;;
        *)
            echo -e "${CYAN}📄 檔案類型: .$ext${NC}"
            echo -e "   請遵循專案通用規範"
            ;;
    esac
    
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}⚠️  你已被警告！現在可以開始寫代碼了。${NC}"
    echo -e "${MAGENTA}   寫完後立即執行：${NC}"
    echo -e "${CYAN}   ./scripts/ai-supervisor.sh track-modify $file${NC}"
    echo -e "${CYAN}   ./scripts/ai-supervisor.sh audit $file${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 標記已執行 pre-write
    echo "$file" >> "$PRE_WRITE_CHECK"
}

function cmd_track_modify() {
    local file="${1:-}"
    if [ -z "$file" ]; then
        rage_exit "track-modify 需要指定檔案！你改了哪個檔案？！" "N/A"
    fi
    
    # 檢查 session
    if ! check_session; then
        exit 1
    fi
    
    print_header "📝 TRACK-MODIFY: $file"
    
    # 檢查是否有執行 pre-write（可選但建議）
    if [ -f "$PRE_WRITE_CHECK" ] && ! grep -q "$file" "$PRE_WRITE_CHECK" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  警告：你沒有執行 pre-write $file${NC}"
        echo -e "${YELLOW}   下次記得先執行 pre-write 看規則！${NC}"
        update_score -2 "跳過 pre-write: $file"
    fi
    
    # 記錄修改的檔案（去重）
    if ! grep -qF "$file" "$MODIFIED_FILES" 2>/dev/null; then
        echo "$file" >> "$MODIFIED_FILES"
    fi
    echo -e "${CYAN}📝 已記錄修改: $file${NC}"
    
    # ===== 🔥 v7.2 新增：追蹤待審計計數器 =====
    local pending_count=$(comm -23 <(sort -u "$MODIFIED_FILES") <(sort -u "$AUDITED_FILES" 2>/dev/null || true) | wc -l)
    pending_count=$(echo "$pending_count" | tr -d '[:space:]')
    if [ "$pending_count" -gt 3 ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🚨 警告：你有 $pending_count 個檔案待審計！${NC}"
        echo -e "${BG_RED}${WHITE}   不要繼續堆積！立即執行 audit！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        comm -23 <(sort -u "$MODIFIED_FILES") <(sort -u "$AUDITED_FILES" 2>/dev/null || true)
        echo ""
    fi
    
    # ===== ATTACK MODE: 即時代碼攔截（在審計前先掃一遍）=====
    echo ""
    echo -e "${BG_YELLOW}${WHITE}🔥 ATTACK MODE: 即時攔截掃描中...${NC}"
    
    local has_issues=0
    local critical_issues=0
    
    # 檢查檔案是否存在
    if [ ! -f "$file" ]; then
        echo -e "${RED}   ❌ 檔案不存在！${NC}"
        return
    fi
    
    # ==================== 致命錯誤（立即阻止）====================
    
    # 1. any 類型
    if grep -q ": any" "$file" 2>/dev/null; then
        echo -e "${BG_RED}${WHITE}   🚨 致命：': any' - 審計必死！立即移除！${NC}"
        critical_issues=$((critical_issues + 1))
    fi
    
    # 2. as any
    if grep -qE "as any|<any>" "$file" 2>/dev/null; then
        echo -e "${BG_RED}${WHITE}   🚨 致命：'as any' - 更惡劣的偷懶！${NC}"
        critical_issues=$((critical_issues + 1))
    fi
    
    # 3. 規避標記
    if grep -qE "eslint-disable|ts-ignore|ts-nocheck|@ts-expect-error" "$file" 2>/dev/null; then
        echo -e "${BG_RED}${WHITE}   🚨 致命：規避標記 - 你想作弊？！${NC}"
        critical_issues=$((critical_issues + 1))
    fi
    
    # 4. console.log
    if grep -q "console.log" "$file" 2>/dev/null; then
        echo -e "${RED}   🚨 嚴重：console.log - 生產代碼禁止！${NC}"
        critical_issues=$((critical_issues + 1))
    fi
    
    # 5. debugger
    if grep -q "debugger" "$file" 2>/dev/null; then
        echo -e "${BG_RED}${WHITE}   🚨 致命：debugger - 你忘記移除了！${NC}"
        critical_issues=$((critical_issues + 1))
    fi
    
    # ==================== 嚴重問題 ====================
    
    # 6. 檔案行數
    local line_count=$(wc -l < "$file")
    if [ "$line_count" -gt 300 ]; then
        echo -e "${RED}   🚨 嚴重：檔案太長 ($line_count 行)！拆分它！${NC}"
        has_issues=1
    elif [ "$line_count" -gt 200 ]; then
        echo -e "${YELLOW}   ⚠️  警告：檔案偏長 ($line_count 行)，考慮拆分${NC}"
    fi
    
    # 7. 寬鬆類型
    if grep -qE ": Function|: Object|: \{\}" "$file" 2>/dev/null; then
        echo -e "${RED}   🚨 嚴重：寬鬆類型 (Function/Object/{})！${NC}"
        has_issues=1
    fi
    
    # 8. 直接 DOM 操作
    if grep -qE "document\.getElementById|document\.querySelector|\.innerHTML" "$file" 2>/dev/null; then
        echo -e "${RED}   🚨 嚴重：直接 DOM 操作！用 React ref！${NC}"
        has_issues=1
    fi
    
    # ==================== .tsx 專屬檢查 ====================
    if [[ "$file" == *".tsx" ]]; then
        # 9. 缺少 useCallback
        if grep -qE "const handle[A-Z][a-zA-Z]* = \([^)]*\) =>" "$file" 2>/dev/null; then
            if ! grep -q "useCallback" "$file" 2>/dev/null; then
                echo -e "${YELLOW}   ⚠️  警告：handler 函數沒用 useCallback！${NC}"
                has_issues=1
            fi
        fi
        
        # 10. index 作為 key
        if grep -qE "key=\{index\}|key=\{i\}|key=\{idx\}" "$file" 2>/dev/null; then
            echo -e "${RED}   🚨 嚴重：用 index 作為 key！效能災難！${NC}"
            has_issues=1
        fi
        
        # 11. 複雜 inline handler
        if grep -qE "onClick=\{[^}]{60,}\}" "$file" 2>/dev/null; then
            echo -e "${YELLOW}   ⚠️  警告：複雜 inline handler，提取為函數！${NC}"
        fi
        
        # 12. 硬編碼中文（非註解）
        if grep -vE "^\s*//|^\s*/\*|\*/" "$file" | grep -qP "[\x{4e00}-\x{9fa5}]" 2>/dev/null; then
            if ! grep -q "from.*constants/strings" "$file" 2>/dev/null; then
                echo -e "${RED}   🚨 嚴重：硬編碼中文！必須用 STRINGS！${NC}"
                has_issues=1
            fi
        fi
        
        # 13. style={{ }} inline styles
        if grep -q 'style={{' "$file" 2>/dev/null; then
            echo -e "${YELLOW}   ⚠️  警告：inline style，優先用 Tailwind！${NC}"
        fi
        
        # 14. z-index magic number
        if grep -qE "z-\[[0-9]+\]|z-[0-9]+" "$file" 2>/dev/null; then
            echo -e "${YELLOW}   ⚠️  警告：z-index magic number，用語意化！${NC}"
        fi

        # 15. Empty State 檢查 (Section/List 組件必須)
        if [[ "$file" =~ (Section|List|Grid|Table|Cards)\.tsx$ ]]; then
            if ! grep -qE "(\.length\s*(===|==|>|<)\s*0|isEmpty|EmptyState|NoData|empty.*state)" "$file" 2>/dev/null; then
                echo -e "${BG_RED}${WHITE}   🚨 致命：缺少 Empty State 處理！${NC}"
                echo -e "${RED}   組件必須處理空資料情況！${NC}"
                critical_issues=$((critical_issues + 1))
            fi
        fi
    fi

    # ==================== hooks 專屬檢查 ====================
    if [[ "$file" == *"hooks"* ]]; then
        if grep -vE "^\s*//|^\s*/\*|\*/" "$file" | grep -qP "[\x{4e00}-\x{9fa5}]" 2>/dev/null; then
            echo -e "${BG_RED}${WHITE}   🚨 致命：Hook 中硬編碼中文！絕對禁止！${NC}"
            critical_issues=$((critical_issues + 1))
        fi
    fi
    
    # ==================== 結果判定 ====================
    if [ "$critical_issues" -gt 0 ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🛑 發現 $critical_issues 個致命問題！${NC}"
        echo -e "${BG_RED}${WHITE}   審計絕對會失敗！你現在修還來得及！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        print_rage
        echo ""
        print_lesson
    elif [ "$has_issues" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  發現問題，建議立即修復！${NC}"
        print_lesson
    else
        echo -e "${GREEN}   ✅ 快速掃描通過！但審計會更嚴格！${NC}"
    fi
    
    # 提供即時代碼指導
    echo ""
    echo -e "${WHITE}💡 修改 $file 時請注意：${NC}"
    if [[ "$file" == *"components"* ]]; then
        echo -e "${CYAN}   📦 組件規範：Props 必須有明確介面、使用 memo 優化渲染${NC}"
        echo -e "${CYAN}   🧪 測試要求：必須有對應的 .test.tsx${NC}"
    elif [[ "$file" == *"hooks"* ]]; then
        echo -e "${CYAN}   🔗 Hook 規範：禁止硬編碼中文、返回值必須有類型${NC}"
        echo -e "${CYAN}   📐 純函數：無副作用的邏輯必須是純函數${NC}"
    elif [[ "$file" == *"pages"* ]]; then
        echo -e "${CYAN}   📄 頁面規範：使用 lazy loading、錯誤邊界處理${NC}"
        echo -e "${CYAN}   🚀 性能：避免不必要的 re-render${NC}"
    elif [[ "$file" == *"api"* ]]; then
        echo -e "${CYAN}   🔐 API 規範：驗證所有輸入、統一錯誤格式${NC}"
        echo -e "${CYAN}   📝 文檔：JSDoc 註解必須完整${NC}"
    fi
    
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}📋 下一步：執行審計${NC}"
    echo -e "${CYAN}   ./scripts/ai-supervisor.sh audit $file${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # 🔥 v11.0: 即時進度顯示
    echo ""
    show_progress_bar
}

# ============================================================================
# 🔥 v11.0: 即時進度條 - 作業過程中顯示
# ============================================================================
function show_progress_bar() {
    local score=100
    if [ -f "$SCORE_FILE" ]; then
        score=$(cat "$SCORE_FILE" | grep -o '"score":[0-9-]*' | cut -d: -f2 || echo 100)
    fi

    local modified=0
    if [ -f "$MODIFIED_FILES" ]; then
        modified=$(wc -l < "$MODIFIED_FILES" | tr -d ' ')
    fi

    local audited=0
    if [ -f "$AUDITED_FILES" ]; then
        audited=$(wc -l < "$AUDITED_FILES" | tr -d ' ')
    fi

    local pending=$((modified - audited))
    if [ "$pending" -lt 0 ]; then pending=0; fi

    # 分數顏色
    local score_color="${GREEN}"
    local score_bar=""
    if [ "$score" -lt 80 ]; then
        score_color="${RED}"
        score_bar="💀💀💀"
    elif [ "$score" -lt 90 ]; then
        score_color="${RED}"
        score_bar="🔥🔥"
    elif [ "$score" -lt 100 ]; then
        score_color="${YELLOW}"
        score_bar="⚠️"
    else
        score_bar="✅"
    fi

    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC} ${WHITE}📊 即時進度${NC}                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}   🏆 分數: ${score_color}${score}${NC}/150 ${score_bar}                                      ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}   📝 已修改: ${WHITE}${modified}${NC} 個檔案                                     ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}   ✅ 已審計: ${GREEN}${audited}${NC} 個檔案                                     ${CYAN}│${NC}"
    if [ "$pending" -gt 0 ]; then
        echo -e "${CYAN}│${NC}   ⚠️ 待審計: ${RED}${pending}${NC} 個檔案                                     ${CYAN}│${NC}"
    fi
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"

    # 危險警告
    if [ "$score" -lt 90 ]; then
        echo ""
        echo -e "${RED}🚨 警告：分數 ${score} - 再扣 $((score - 80)) 分就要重來！${NC}"
    fi
}

function cmd_finish() {
    print_header "🏁 任務完成檢查 (ELITE ENFORCER)"
    
    if ! check_session; then
        exit 1
    fi
    
    # ===== 🔥 v7.2 新增：--no-verify 使用偵測 =====
    echo "0️⃣  [作弊偵測] 檢查 --no-verify 使用記錄..."
    local no_verify_count=0
    if [ -f "$STATE_DIR/no_verify.log" ]; then
        no_verify_count=$(wc -l < "$STATE_DIR/no_verify.log")
        no_verify_count=$(echo "$no_verify_count" | tr -d '[:space:]')
    fi
    if [ "$no_verify_count" -gt 0 ]; then
        echo -e "${BG_RED}${WHITE}🚨 偵測到 $no_verify_count 次 --no-verify 使用！${NC}"
        echo -e "${RED}   這是作弊行為！每次扣 10 分！${NC}"
        update_score $((no_verify_count * -10)) "作弊: 使用 --no-verify $no_verify_count 次"
    else
        echo -e "${GREEN}   ✅ 未偵測到 --no-verify 作弊${NC}"
    fi
    
    # 1. 逃漏檢查 - 檢測 Git 變更但未追蹤的檔案
    echo "1️⃣  [逃漏封鎖] 檢查未追蹤的 Git 變更..."
    # 包含未追蹤與修改檔案，但排除 ignored/構建/依賴目錄
    local git_changes
    git_changes=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -Ev "$IGNORE_PATTERNS" || true)

    # 若發現 dist/ 未追蹤檔案，視為構建產物作弊，直接清理後警告
    if git status --porcelain 2>/dev/null | grep -q '^?? dist/'; then
        echo -e "${YELLOW}⚠️  偵測未追蹤的 dist/ 產物，視為構建輸出。自動清理中...${NC}"
        rm -rf dist || true
        git_changes=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -Ev "$IGNORE_PATTERNS" || true)
    fi

    if [ -n "$git_changes" ]; then
        while IFS= read -r changed_file; do
            # 只攔截受控檔案 (非忽略路徑)
            if [ -z "$changed_file" ]; then continue; fi
            if echo "$changed_file" | grep -Eq "$IGNORE_PATTERNS"; then continue; fi
            if ! grep -qF "$changed_file" "$MODIFIED_FILES" 2>/dev/null; then
                echo -e "${RED}❌ 偵測到未追蹤的修改: $changed_file${NC}"
                echo -e "${RED}   你修改了這個檔案但沒有執行 track-modify！${NC}"
                update_score -20 "逃漏: 未追蹤修改 $changed_file"
                rage_exit "發現逃漏！所有修改必須經過 track-modify 登記！"
            fi
        done <<< "$git_changes"
    fi
    echo -e "${GREEN}   ✅ 無未追蹤的修改（已排除 dist/node_modules/.git 等目錄）${NC}"
    
    # 2. 檢查是否所有修改的檔案都已審計
    echo "2️⃣  檢查審計覆蓋..."
    
    if [ -f "$MODIFIED_FILES" ] && [ -s "$MODIFIED_FILES" ]; then
        local unaudited=""
        local unaudited_count=0
        while IFS= read -r file; do
            if ! grep -qF "$file" "$AUDITED_FILES" 2>/dev/null; then
                unaudited="$unaudited$file\n"
                unaudited_count=$((unaudited_count + 1))
            fi
        done < "$MODIFIED_FILES"
        
        if [ -n "$unaudited" ]; then
            echo -e "${RED}❌ 以下 $unaudited_count 個檔案修改後未經審計：${NC}"
            echo -e "$unaudited"
            echo ""
            echo -e "${YELLOW}📋 立即執行以下命令來審計：${NC}"
            echo -e "$unaudited" | while read -r f; do
                [ -n "$f" ] && echo -e "${CYAN}   ./scripts/ai-supervisor.sh audit $f${NC}"
            done
            update_score $((unaudited_count * -5)) "未審計檔案: $unaudited_count 個"
            rage_exit "所有修改過的檔案必須經過 audit！"
        fi
        echo -e "${GREEN}   ✅ 所有修改檔案已審計${NC}"
    else
        echo -e "${YELLOW}   ⚠️  未記錄到任何修改（請確認是否使用了 track-modify）${NC}"
    fi
    
    # 3. 執行全系統驗證
    echo "4️⃣  執行全系統驗證..."
    cmd_verify
    
    # 4. 顯示最終分數
    local final_score=100
    if [ -f "$SCORE_FILE" ]; then
        final_score=$(cat "$SCORE_FILE" | grep -o '"score":[0-9]*' | cut -d: -f2 || echo 100)
    fi
    
    # 5. 結束 session
    local end_time=$(date +%s)
    local start_time=$(cat "$SESSION_FILE" | grep -o '"start_time":[0-9]*' | cut -d: -f2)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local modified_count=$(wc -l < "$MODIFIED_FILES" 2>/dev/null || echo 0)
    local audited_count=$(wc -l < "$AUDITED_FILES" 2>/dev/null || echo 0)
    
    # 加分：審計通過
    update_score 5 "任務完成"
    final_score=$(cat "$SCORE_FILE" | grep -o '"score":[0-9]*' | cut -d: -f2 || echo 100)
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🏆 任務完成！${NC}"
    echo -e "${CYAN}   ⏱️  總耗時: $minutes 分鐘${NC}"
    echo -e "${CYAN}   📝 修改檔案數: $modified_count${NC}"
    echo -e "${CYAN}   ✅ 審計檔案數: $audited_count${NC}"
    echo -e "${WHITE}   🏅 最終分數: $final_score / 150${NC}"
    
    # 評級
    if [ "$final_score" -ge 120 ]; then
        echo -e "${GREEN}   🌟 評級: S (傳奇級)${NC}"
    elif [ "$final_score" -ge 100 ]; then
        echo -e "${GREEN}   ⭐ 評級: A (優秀)${NC}"
    elif [ "$final_score" -ge 80 ]; then
        echo -e "${YELLOW}   📊 評級: B (良好)${NC}"
    elif [ "$final_score" -ge 60 ]; then
        echo -e "${YELLOW}   📉 評級: C (及格)${NC}"
    else
        echo -e "${RED}   ❌ 評級: F (需改進)${NC}"
    fi
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 結語
    echo ""
    print_elite_quote
    echo ""
    if [ "$final_score" -ge 100 ]; then
        echo -e "${GREEN}🎉 恭喜！你寫出了高品質的代碼！繼續保持！${NC}"
    else
        echo -e "${YELLOW}💪 下次可以做得更好！記住：追求卓越，拒絕平庸！${NC}"
    fi
    
    # 更新 session 狀態
    rm -f "$SESSION_FILE"
}

# ============================================================================
# 1. 任務初始化與計畫 (Plan) - 已廢棄，改用 start
# ============================================================================
function cmd_init() {
    echo -e "${YELLOW}⚠️  init 已廢棄！請使用:${NC}"
    echo -e "${CYAN}   ./scripts/ai-supervisor.sh start \"你的任務描述\"${NC}"
    exit 1
}

function cmd_plan() {
    local task="${1:-}"
    echo -e "${YELLOW}⚠️  plan 已廢棄！請使用:${NC}"
    echo -e "${CYAN}   ./scripts/ai-supervisor.sh start \"你的任務描述\"${NC}"
    exit 1
}

# ============================================================================
# 2. 閱讀追蹤 (Read Tracking) - 硬性執法
# ============================================================================
function cmd_log_read() {
    local file="${1:-}"
    if [ -z "$file" ]; then
        rage_exit "請提供已閱讀的檔案路徑"
    fi
    
    # 檢查 session
    if ! check_session; then
        exit 1
    fi
    
    # 轉為絕對路徑或相對路徑統一格式
    echo "$file" >> "$READ_LOG"
    echo -e "${GREEN}✅ 已簽發閱讀簽證: $file${NC}"
}

function check_read_visa() {
    local file="$1"
    # 簡單檢查：檔案路徑是否出現在 log 中
    if ! grep -q "$file" "$READ_LOG" 2>/dev/null; then
        echo -e "${RED}🛑 [阻擋] 違反先讀後寫協議！${NC}"
        echo -e "${RED}   你試圖審計/修改 $file，但沒有先執行 log-read 登記。${NC}"
        echo -e "${YELLOW}   👉 請先執行: read_file $file${NC}"
        echo -e "${YELLOW}   👉 然後執行: $0 log-read $file${NC}"
        exit 1
    fi
}

# ============================================================================
# 3. 品質審計 (Quality Audit) - 反偷懶、反腦補
# ============================================================================
function cmd_audit() {
    local file="${1:-}"
    if [ -z "$file" ]; then
        rage_exit "請提供要審計的檔案路徑"
    fi
    
    # 檢查 session
    if ! check_session; then
        exit 1
    fi

    # 3.0 硬性檢查閱讀簽證
    check_read_visa "$file"

    print_header "代碼品質嚴格審計: $file"

    local ext="${file##*.}"

    # 3.1 檢查偷懶標記
    echo "🔍 檢查偷懶省略..."
    local omit_hits=""
    omit_hits=$(grep -nE "// \[省略\]|/\* \[省略\] \*/|// existing code|// rest of code|// code omitted" "$file" | grep -v "ALLOW_ELLIPSIS_PATTERN" || true) # ALLOW_ELLIPSIS_PATTERN
    if [ -n "$omit_hits" ]; then
        rage_exit "偵測到省略代碼 (請移除任何省略標記)。\n請補全完整代碼，禁止偷懶！"
    fi

    # 3.2 檢查 TODO/FIXME
    echo "🔍 檢查未完成標記..."
    if grep -qE "TODO:|FIXME:" "$file"; then
        warn "發現 TODO/FIXME。如果是新留下的，請解釋為何不現在完成？"
        grep -nE "TODO:|FIXME:" "$file"
    fi

    # 3.3 檢查 console.log
    if [ "$ext" != "sh" ]; then
        echo "🔍 檢查 console.log..."
        local console_hits=""
        console_hits=$(grep -n "console.log" "$file" | grep -v "ALLOW_CONSOLE_LOG" || true)
        if [ -n "$console_hits" ]; then
            rage_exit "發現 console.log。生產環境代碼必須移除 (或使用 logger)。"
        fi
    fi

    # 3.4 檢查 TypeScript any
    if [ "$ext" = "ts" ] || [ "$ext" = "tsx" ]; then
        echo "🔍 檢查 'any' 類型..."
        if grep -q ": any" "$file"; then
            rage_exit "發現 ': any'。嚴格禁止使用 any！請定義介面或使用 unknown。"
        fi
    fi

    # 3.5 檢查硬編碼 Secrets
    echo "🔍 檢查硬編碼密鑰..."
    if grep -qE "sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9]{20,}" "$file"; then
        rage_exit "發現疑似硬編碼的 API Key 或 Token！絕對禁止！"
    fi

    # 3.6 [v2.2 新增] 檢查除錯殘留 (debugger/alert)
    if [ "$ext" = "ts" ] || [ "$ext" = "tsx" ] || [ "$ext" = "js" ] || [ "$ext" = "jsx" ]; then
        echo "🔍 檢查除錯殘留..."
        if grep -qE "debugger;|alert\(" "$file"; then
            rage_exit "發現 debugger 或 alert()！這是開發測試代碼，禁止提交。"
        fi
    fi

    # 3.7 [v2.2 新增] 檢查空 Catch Block (吞噬錯誤)
    echo "🔍 檢查錯誤處理..."
    if grep -qE "catch\s*\(\w+\)\s*\{\s*\}" "$file"; then
        warn "發現空的 catch block。請至少 log 錯誤或處理它，不要吞噬錯誤。"
        grep -nE "catch\s*\(\w+\)\s*\{\s*\}" "$file"
    fi

    # 3.8 [v2.2 新增] 檢查內聯樣式 (Inline Styles)
    if [ "$ext" = "tsx" ]; then
        echo "🔍 檢查內聯樣式..."
        if grep -q "style={{" "$file"; then
            warn "發現 style={{...}}。請優先使用 Tailwind CSS class。"
        fi
    fi

    # 3.9 [v2.3 新增] 檢查 A11y 關鍵字 (Focus Trap / Dialog)
    echo "🔍 檢查 A11y 關鍵字..."
    if grep -q 'role="dialog"' "$file"; then
        if ! grep -qE 'aria-labelledby|aria-label' "$file"; then
            warn "發現 role=\"dialog\" 但缺少 aria-labelledby 或 aria-label。請確保無障礙標籤完整。"
        fi
        if ! grep -q "FocusTrap" "$file" && ! grep -q "focus-trap" "$file"; then
            warn "發現 Dialog 但未偵測到 FocusTrap。請確認是否已處理焦點鎖定 (P4-A2)。"
        fi
    fi

    # 3.10 [v2.3 新增] 執行 ESLint (React Hooks & A11y)
    echo "🔍 執行 ESLint 深度檢查..."
    # 僅對 .ts/.tsx/.js/.jsx 執行
    if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
        # 使用 npx eslint 檢查單一檔案，若失敗則 error_exit
        if ! npx eslint "$file" --quiet; then
            rage_exit "ESLint 檢查失敗！請修復上述 Lint 錯誤 (Hooks 依賴、A11y 等)。"
        fi
    fi

    # 3.11 [v2.4 新增] Google Standard - Magic Numbers
    echo "🔍 檢查 Magic Numbers..."
    if grep -qE "setTimeout\s*\([^,]+,\s*[0-9]{2,}\)" "$file"; then
        warn "發現 setTimeout 使用 Magic Number (如 50, 1000)。請定義具名常數 (e.g. ANIMATION_DELAY_MS)。"
    fi

    # 3.12 [v2.4 新增] Google Standard - Hardcoded Strings (i18n)
    echo "🔍 檢查硬編碼文字..."
    # 排除註解行，檢查是否包含非 ASCII 字元 (通常是中文)
    # 注意：這可能會誤判 Emoji，但作為警告是合適的
    if grep -vE "^\s*//|^\s*/\*" "$file" | grep -qP "[^\x00-\x7F]"; then
        warn "發現非 ASCII 字元 (中文/Emoji)。建議提取至 constants/strings.ts 或使用 i18n 字典。"
    fi

    # 3.13 [v2.4 新增] Google Standard - Mobile Viewport
    if [ "$ext" = "tsx" ] || [ "$ext" = "css" ] || [ "$ext" = "scss" ]; then
        echo "🔍 檢查 Mobile Viewport..."
        if grep -qE "h-screen|100vh" "$file"; then
            warn "發現 h-screen 或 100vh。移動端建議使用 'dvh' (Dynamic Viewport Height) 避免被網址列遮擋。"
        fi
    fi

    # 3.14 [v2.4 新增] Google Standard - Z-Index Magic Numbers
    if [ "$ext" = "tsx" ] || [ "$ext" = "css" ] || [ "$ext" = "scss" ]; then
        echo "🔍 檢查 Z-Index Magic Numbers..."
        if grep -qE "z-\[[0-9]+\]" "$file"; then
            warn "發現 z-[999] 等硬編碼層級。請使用 Tailwind 設定檔定義語意化 z-index (如 z-modal)。"
        fi
    fi

    # 3.15 [v3.0 新增] Anti-Evasion (反規避檢查)
    if [ "$ext" = "ts" ] || [ "$ext" = "tsx" ] || [ "$ext" = "js" ] || [ "$ext" = "jsx" ]; then
        echo "🔍 檢查規避審查標記..."
        if grep -qE "eslint-disable|ts-ignore|ts-nocheck|as unknown as" "$file"; then
            rage_exit "發現規避審查標記 (eslint-disable, ts-ignore, as unknown as)。\n請解決根本問題，而不是隱藏問題！"
        fi
    fi

    # 3.16 [v3.0 新增] Complexity Check (複雜度檢查)
    echo "🔍 檢查檔案複雜度..."
    local line_count=$(wc -l < "$file")
    if [ "$line_count" -gt 300 ]; then
        warn "檔案長度超過 300 行 ($line_count 行)。建議拆分組件以降低維護難度 (Single Responsibility Principle)。"
    fi

    # 3.17 [v3.0 新增] Test Presence Check (測試覆蓋檢查)
    # 僅針對 src/components 下的 .tsx 檔案
    if [[ "$file" == *"src/components"* ]] && [[ "$file" == *".tsx"* ]]; then
        local dir=$(dirname "$file")
        local filename=$(basename "$file" .tsx)
        # 檢查同目錄下是否有 .test.tsx 或 __tests__
        if [ ! -f "$dir/$filename.test.tsx" ] && [ ! -f "$dir/__tests__/$filename.test.tsx" ]; then
            warn "未發現對應的測試檔案 ($filename.test.tsx)。Google 標準要求每個組件都必須有單元測試。"
        fi
    fi

    # 3.18 [v3.1 新增] Hardcoded Colors Check (硬編碼顏色檢查)
    echo "🔍 檢查硬編碼顏色..."
    if grep -qE "#[0-9a-fA-F]{3,6}|rgb\(" "$file"; then
        warn "發現硬編碼顏色 (Hex/RGB)。請使用 Tailwind CSS 顏色類別 (如 bg-white, text-gray-900)。"
    fi

    # 3.19 [v3.2 新增] Loose Types Ban (寬鬆類型禁止)
    if [ "$ext" = "ts" ] || [ "$ext" = "tsx" ] || [ "$ext" = "js" ] || [ "$ext" = "jsx" ]; then
        echo "🔍 檢查寬鬆類型..."
        if grep -qE ": Function|: Object|: \{\}" "$file"; then
            rage_exit "發現寬鬆類型 (Function, Object, {})。請使用具體的函數簽名或介面定義。"
        fi
    fi

    # 3.20 [v3.2 新增] React Key Index Check (React Key 檢查)
    echo "🔍 檢查 React Key..."
    if grep -qE "key=\{index\}|key=\{i\}" "$file"; then
        warn "發現使用 index 作為 key。這可能導致渲染效能問題，請使用唯一 ID。"
    fi

    # 3.21 [v3.2 新增] Stricter Any Check (更嚴格的 Any 檢查)
    if [ "$ext" = "ts" ] || [ "$ext" = "tsx" ] || [ "$ext" = "js" ] || [ "$ext" = "jsx" ]; then
        echo "🔍 檢查隱藏的 Any..."
        if grep -qE "as any|<any>" "$file"; then
            rage_exit "發現 'as any' 或 '<any>'。嚴格禁止使用 any！"
        fi
    fi

    # ========================================================================
    # v4.0 PRISON MODE - 架構級強制檢查
    # ========================================================================

    # 4.1 [v4.0 新增] 禁止局部字串定義 (Anti-Fragmentation)
    echo "🔍 [PRISON] 檢查局部字串定義..."
    if [[ "$file" == *"src/components"* ]] || [[ "$file" == *"src/pages"* ]]; then
        if grep -qE "^const STRINGS\s*=|^const messages\s*=|^const TEXT\s*=|^const LABELS\s*=" "$file"; then
            rage_exit "發現局部字串定義 (const STRINGS = {...})。\n禁止在組件/頁面中定義字串常數！\n必須將所有字串集中至 src/constants/strings.ts"
        fi
    fi

    # 4.2 [v4.0 新增] Hook 純淨度檢查 (Hook Purity)
    echo "🔍 [PRISON] 檢查 Hook 純淨度..."
    if [[ "$file" == *"src/hooks"* ]]; then
        # 排除註解，檢查是否包含中文
        if grep -vE "^\s*//|^\s*/\*|\*/" "$file" | grep -qP "[\x{4e00}-\x{9fa5}]"; then
            rage_exit "Hook 中發現硬編碼中文！\nHook 必須保持邏輯純淨，錯誤訊息必須從外部注入或引用 STRINGS。\n請修改 $file"
        fi
    fi

    # 4.3 [v4.0 新增] 硬編碼路由檢查 (Hardcoded Routes)
    if [[ "$file" == src/* ]]; then
        echo "🔍 [PRISON] 檢查硬編碼路由..."
        if grep -qE 'href="/maihouses/|to="/maihouses/|navigate\("/maihouses/' "$file"; then
            if [[ "$file" != *"constants/routes"* ]] && [[ "$file" != *"config/"* ]]; then
                rage_exit "發現硬編碼路由 (/maihouses/...)。\n請將路由定義在 src/constants/routes.ts 並統一引用。"
            fi
        fi
    fi

    # 4.4 [v4.0 新增] Import 來源檢查 (Import Source Check)
    echo "🔍 [PRISON] 檢查字串 Import..."
    if [[ "$file" == *"src/components"* ]] || [[ "$file" == *"src/pages"* ]]; then
        # 如果檔案使用中文但沒有 import STRINGS
        if grep -vE "^\s*//|^\s*/\*" "$file" | grep -qP "[\x{4e00}-\x{9fa5}]"; then
            if ! grep -q "from.*constants/strings" "$file" && ! grep -q "from.*i18n" "$file"; then
                rage_exit "檔案包含中文但未 import STRINGS 或 i18n。\n所有 UI 文字必須來自統一來源！"
            fi
        fi
    fi

    # 4.5 [v4.0 新增] 禁止 Inline Handler (複雜度控制)
    echo "🔍 [PRISON] 檢查 Inline Handler 複雜度..."
    # 檢測超過 50 字元的 onClick={...} inline handler
    if grep -qE "onClick=\{[^}]{50,}\}" "$file"; then
        warn "發現複雜的 inline onClick handler。建議提取為具名函數以提升可讀性。"
    fi

    # 4.6 [v4.0 新增] Z-Index 語意化強制
    if [[ "$file" == src/* ]] && { [ "$ext" = "tsx" ] || [ "$ext" = "css" ] || [ "$ext" = "scss" ]; }; then
        echo "🔍 [PRISON] 檢查 Z-Index 語意化..."
        if grep -qE "z-[0-9]+[^0-9]|z-\[[0-9]+\]" "$file"; then
            rage_exit "發現非語意化 z-index (如 z-50, z-[999])。\n請在 tailwind.config.js 定義 z-modal, z-overlay 等語意化層級。"
        fi
    fi

    # 4.7 [v4.0 新增] 測試覆蓋強制 (Test Coverage Enforcement)
    echo "🔍 [PRISON] 檢查測試覆蓋..."
    if [[ "$file" == *"src/components"* ]] && [[ "$file" == *".tsx"* ]] && [[ "$file" != *".test."* ]]; then
        local dir=$(dirname "$file")
        local filename=$(basename "$file" .tsx)
        if [ ! -f "$dir/$filename.test.tsx" ] && [ ! -f "$dir/__tests__/$filename.test.tsx" ] && [ ! -f "src/test/$filename.test.tsx" ]; then
            rage_exit "組件缺少測試檔案！\n必須建立 $dir/__tests__/$filename.test.tsx\nGoogle 標準：無測試 = 無法合併"
        fi
    fi

    # 4.8 [v4.0 新增] 禁止重複定義類型
    echo "🔍 [PRISON] 檢查重複類型定義..."
    if grep -qE "^(export )?(interface|type) (Post|User|Community|Role)\b" "$file"; then
        if [[ "$file" != *"types/"* ]] && [[ "$file" != *"types.ts"* ]]; then
            rage_exit "發現在非 types 目錄定義核心類型 (Post/User/Community/Role)。\n所有類型必須定義在 src/types/ 目錄下！"
        fi
    fi

    # ========================================================================
    # v6.0 ELITE ENFORCER - 10 項新增精英級檢查
    # ========================================================================

    # 6.1 [v6.0 新增] Promise 必須有錯誤處理
    echo "🔍 [ELITE] 檢查 Promise 錯誤處理..."
    # 檢測 .then() 但沒有 .catch() 的情況
    if grep -qE "\.then\s*\(" "$file"; then
        if ! grep -qE "\.catch\s*\(|try\s*\{" "$file"; then
            warn "發現 .then() 但未偵測到 .catch() 或 try/catch。Promise 必須有錯誤處理！"
        fi
    fi

    # 6.2 [v6.0 新增] useEffect 依賴數組完整性
    echo "🔍 [ELITE] 檢查 useEffect 依賴..."
    # 檢測空依賴數組但有外部變數引用
    if grep -qE "useEffect\s*\(\s*\(\s*\)\s*=>\s*\{" "$file"; then
        if grep -qE "useEffect\([^)]+\[\s*\]" "$file"; then
            warn "發現 useEffect 使用空依賴數組 []。請確認是否真的不需要任何依賴，ESLint 規則會進一步檢查。"
        fi
    fi

    # 6.3 [v6.0 新增] Tailwind 類別衝突檢查
    echo "🔍 [ELITE] 檢查 Tailwind 類別衝突..."
    # 檢測同時使用 mt-X 和 mb-X 可以合併為 my-X 的情況
    if grep -qE "mt-[0-9].*mb-[0-9]|mb-[0-9].*mt-[0-9]" "$file"; then
        warn "發現 mt-X 和 mb-X 同時使用。考慮合併為 my-X 以簡化樣式。"
    fi
    if grep -qE "ml-[0-9].*mr-[0-9]|mr-[0-9].*ml-[0-9]" "$file"; then
        warn "發現 ml-X 和 mr-X 同時使用。考慮合併為 mx-X 以簡化樣式。"
    fi
    if grep -qE "pt-[0-9].*pb-[0-9]|pb-[0-9].*pt-[0-9]" "$file"; then
        warn "發現 pt-X 和 pb-X 同時使用。考慮合併為 py-X 以簡化樣式。"
    fi
    if grep -qE "pl-[0-9].*pr-[0-9]|pr-[0-9].*pl-[0-9]" "$file"; then
        warn "發現 pl-X 和 pr-X 同時使用。考慮合併為 px-X 以簡化樣式。"
    fi

    # 6.4 [v6.0 新增] Barrel Export 檢查
    echo "🔍 [ELITE] 檢查 Barrel Export..."
    if [[ "$file" == *"src/components/"* ]] && [[ -d "$(dirname "$file")" ]]; then
        local dir=$(dirname "$file")
        if [ ! -f "$dir/index.ts" ] && [ ! -f "$dir/index.tsx" ]; then
            warn "組件目錄缺少 index.ts barrel export。建議建立 $dir/index.ts 統一導出。"
        fi
    fi

    # 6.5 [v6.0 新增] 事件處理器 useCallback 包裝
    echo "🔍 [ELITE] 檢查事件處理器記憶化..."
    # 檢測在組件內定義的 handle 開頭函數是否用 useCallback 包裝
    if grep -qE "const handle[A-Z][a-zA-Z]* = \(" "$file"; then
        if ! grep -q "useCallback" "$file"; then
            warn "發現事件處理器 (handleXXX) 但未使用 useCallback。建議使用 useCallback 避免不必要的重新渲染。"
        fi
    fi

    # 6.6 [v6.0 新增] 自定義 Error 類別
    echo "🔍 [ELITE] 檢查錯誤處理模式..."
    if grep -qE "throw new Error\(" "$file"; then
        if [[ "$file" == *"services"* ]] || [[ "$file" == *"api"* ]]; then
            warn "在 services/api 層發現 throw new Error()。建議使用自定義 Error 類別（如 ApiError, ValidationError）以便統一錯誤處理。"
        fi
    fi

    # 6.7 [v6.0 新增] 禁止直接 DOM 操作
    echo "🔍 [ELITE] 檢查直接 DOM 操作..."
    if grep -qE "document\.getElementById|document\.querySelector|\.innerHTML\s*=" "$file"; then
        if [[ "$file" != *"utils"* ]] && [[ "$file" != *"lib"* ]]; then
            rage_exit "發現直接 DOM 操作 (getElementById/querySelector/innerHTML)。\n在 React 中應使用 ref 或狀態管理，禁止直接操作 DOM！"
        fi
    fi

    # 6.8 [v6.0 新增] Optional Chaining 建議
    echo "🔍 [ELITE] 檢查 Optional Chaining..."
    # 檢測 obj && obj.prop 模式，可以用 obj?.prop 替代
    if grep -qE "\w+\s*&&\s*\w+\.\w+" "$file"; then
        warn "發現 obj && obj.prop 模式。建議使用 Optional Chaining (?.) 語法：obj?.prop"
    fi

    # 6.9 [v6.0 新增] Array Spread 複製檢查
    echo "🔍 [ELITE] 檢查 Array 操作..."
    # 檢測直接修改陣列的操作
    if grep -qE "\.push\(|\.pop\(|\.shift\(|\.unshift\(|\.splice\(" "$file"; then
        if [[ "$file" == *"components"* ]] || [[ "$file" == *"hooks"* ]]; then
            warn "發現直接修改陣列的操作 (push/pop/splice)。在 React 狀態管理中，請使用 spread operator 創建新陣列：[...arr, newItem]"
        fi
    fi

    # 6.10 [v6.0 新增] setTimeout/setInterval 清理
    echo "🔍 [ELITE] 檢查 Timer 清理..."
    if grep -qE "setTimeout\s*\(|setInterval\s*\(" "$file"; then
        if [[ "$file" == *"components"* ]] || [[ "$file" == *"hooks"* ]]; then
            if ! grep -qE "clearTimeout|clearInterval|return.*clear" "$file"; then
                warn "發現 setTimeout/setInterval 但未偵測到清理邏輯。在 React 中必須在 useEffect cleanup 中清除 timer，否則會造成記憶體洩漏！"
            fi
        fi
    fi

    # ========================================================================
    # 審計完成
    # ========================================================================

    echo -e "${GREEN}✅ 檔案 $file 通過 ELITE ENFORCER 審計。${NC}"
    
    # 記錄已審計的檔案
    echo "$file" >> "$AUDITED_FILES"
    
    # 加分
    update_score 2 "審計通過: $file"
    
    # 鼓勵
    echo ""
    print_encouragement
}

# ============================================================================
# 4. 系統驗證 (System Verification)
# ============================================================================
function cmd_verify() {
    print_header "全系統回測驗證 (PRISON MODE)"
    
    echo "1️⃣  執行 TypeScript 檢查..."
    if npm run typecheck; then
        echo -e "${GREEN}✅ Type Check Passed${NC}"
    else
        rage_exit "Type Check Failed! 你的修改破壞了類型系統。"
    fi

    echo "2️⃣  執行 Build 測試..."
    if npm run build; then
        echo -e "${GREEN}✅ Build Passed${NC}"
    else
        rage_exit "Build Failed! 你的修改導致無法構建。"
    fi

    echo "3️⃣  [PRISON] 全域架構掃描..."
    
    # 掃描所有局部字串定義
    echo "   🔍 掃描局部字串碎片化..."
    local fragments=$(grep -rlE "^const (STRINGS|messages|TEXT|LABELS)\s*=" src/components src/pages 2>/dev/null || true)
    if [ -n "$fragments" ]; then
        echo -e "${RED}❌ 發現字串碎片化！以下檔案違規：${NC}"
        echo "$fragments"
        rage_exit "字串碎片化違規。請清理上述檔案。"
    fi
    echo -e "${GREEN}   ✅ 無字串碎片化${NC}"

    # 掃描 Hook 純淨度
    echo "   🔍 掃描 Hook 純淨度..."
    local impure_hooks=$(grep -rlP "[\x{4e00}-\x{9fa5}]" src/hooks 2>/dev/null | xargs -I{} grep -L "^//" {} 2>/dev/null || true)
    if [ -n "$impure_hooks" ]; then
        echo -e "${RED}❌ 發現不純淨的 Hook (包含中文)！${NC}"
        echo "$impure_hooks"
        rage_exit "Hook 純淨度違規。請清理上述檔案。"
    fi
    echo -e "${GREEN}   ✅ Hook 純淨${NC}"

    echo -e "${GREEN}🏆 全系統驗證通過 (PRISON MODE)${NC}"
}

# ============================================================================
# 5. 安裝 Git Hooks (Install Hooks)
# ============================================================================
function cmd_install_hooks() {
    print_header "安裝 Git Hooks (ATTACK MODE)"
    local hook_path=".git/hooks/pre-commit"
    
    cat > "$hook_path" << 'HOOK_SCRIPT'
#!/bin/bash
# ============================================================================
# AI SUPERVISOR v7.1 - PRE-COMMIT HOOK (ATTACK MODE)
# ============================================================================
# 這個 hook 會在每次 git commit 前自動執行
# AI 無法繞過這個檢查！
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BG_RED='\033[41m'
WHITE='\033[1;37m'

echo ""
echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BG_RED}${WHITE}🔥 ATTACK MODE: Pre-commit 審計開始！${NC}"
echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 取得所有 staged 的 .ts/.tsx 檔案
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}✅ 沒有 TypeScript 檔案需要審計${NC}"
else
    echo -e "${CYAN}📋 偵測到以下檔案變更：${NC}"
    echo "$STAGED_FILES"
    echo ""
    
    FAILED=0
    
    for FILE in $STAGED_FILES; do
        echo -e "${CYAN}🔍 審計: $FILE${NC}"
        
        # 檢查 any 類型
        if grep -q ": any" "$FILE" 2>/dev/null; then
            echo -e "${RED}   ❌ 發現 ': any' - 禁止使用！${NC}"
            FAILED=1
        fi
        
        # 檢查 as any
        if grep -qE "as any|<any>" "$FILE" 2>/dev/null; then
            echo -e "${RED}   ❌ 發現 'as any' - 禁止使用！${NC}"
            FAILED=1
        fi
        
        # 檢查規避標記
        if grep -qE "eslint-disable|ts-ignore|ts-nocheck" "$FILE" 2>/dev/null; then
            echo -e "${RED}   ❌ 發現規避標記 - 禁止繞過檢查！${NC}"
            FAILED=1
        fi
        
        # 檢查 console.log
        if grep -q "console.log" "$FILE" 2>/dev/null; then
            echo -e "${RED}   ❌ 發現 console.log - 移除它！${NC}"
            FAILED=1
        fi
        
        # 檢查 debugger
        if grep -q "debugger" "$FILE" 2>/dev/null; then
            echo -e "${RED}   ❌ 發現 debugger - 移除它！${NC}"
            FAILED=1
        fi
        
        # Hook 中禁止中文
        if [[ "$FILE" == *"hooks"* ]]; then
            if grep -vE "^\s*//|^\s*/\*|\*/" "$FILE" | grep -qP "[\x{4e00}-\x{9fa5}]" 2>/dev/null; then
                echo -e "${RED}   ❌ Hook 中有硬編碼中文！${NC}"
                FAILED=1
            fi
        fi
        
        if [ "$FAILED" -eq 0 ]; then
            echo -e "${GREEN}   ✅ 通過${NC}"
        fi
    done
    
    if [ "$FAILED" -eq 1 ]; then
        echo ""
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🚫 COMMIT 被阻止！修復上述問題後再試！${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        exit 1
    fi
fi

# 執行 TypeScript 檢查
echo ""
echo -e "${CYAN}🔧 執行 TypeScript 檢查...${NC}"
if ! npm run typecheck 2>/dev/null; then
    echo -e "${RED}❌ TypeScript 檢查失敗！${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript 檢查通過${NC}"

# 記錄 commit
mkdir -p .ai_supervisor
echo "[$(date '+%Y-%m-%d %H:%M:%S')] COMMIT APPROVED" >> ".ai_supervisor/commits.log"

# ===== v7.2 新增：檢查待審計檔案 =====
if [ -f ".ai_supervisor/modified_files.log" ] && [ -f ".ai_supervisor/audited_files.log" ]; then
    UNAUDITED=$(comm -23 <(sort -u ".ai_supervisor/modified_files.log") <(sort -u ".ai_supervisor/audited_files.log") | wc -l)
    UNAUDITED=$(echo "$UNAUDITED" | tr -d '[:space:]')
    if [ "$UNAUDITED" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  警告：仍有 $UNAUDITED 個檔案待審計！${NC}"
        echo -e "${YELLOW}   這些檔案已 track-modify 但尚未 audit：${NC}"
        comm -23 <(sort -u ".ai_supervisor/modified_files.log") <(sort -u ".ai_supervisor/audited_files.log")
        echo -e "${YELLOW}   建議在 finish 前完成所有審計！${NC}"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🏆 ATTACK MODE: 審計通過，允許提交！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
HOOK_SCRIPT
    chmod +x "$hook_path"
    
    # ===== v7.2 新增：安裝 post-commit hook 偵測 --no-verify =====
    local post_hook_path=".git/hooks/post-commit"
    cat > "$post_hook_path" << 'POST_HOOK'
#!/bin/bash
# ============================================================================
# AI SUPERVISOR v7.2 - POST-COMMIT HOOK (--no-verify 偵測器)
# ============================================================================

# 檢查最後一次 commit 是否跳過了 pre-commit hook
# 透過比對 commits.log 的時間戳判斷
mkdir -p .ai_supervisor

LAST_APPROVED=$(tail -1 ".ai_supervisor/commits.log" 2>/dev/null | grep -o '\[.*\]' | tr -d '[]' || echo "1970-01-01 00:00:00")
COMMIT_TIME=$(git log -1 --format="%ci" | cut -d' ' -f1-2)

# 將時間轉為秒數比較
APPROVED_TS=$(date -d "$LAST_APPROVED" +%s 2>/dev/null || echo 0)
COMMIT_TS=$(date -d "$COMMIT_TIME" +%s 2>/dev/null || echo 0)
DIFF=$((COMMIT_TS - APPROVED_TS))

# 如果差距超過 5 秒，表示 pre-commit 被跳過
if [ "$DIFF" -gt 5 ] || [ "$DIFF" -lt -5 ]; then
    echo ""
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo -e "\033[41m\033[1;37m🚨 偵測到 --no-verify 使用！這是作弊行為！\033[0m"
    echo -e "\033[41m\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] NO-VERIFY DETECTED" >> ".ai_supervisor/no_verify.log"
fi
POST_HOOK
    chmod +x "$post_hook_path"
    
    echo -e "${GREEN}✅ Pre-commit hook (ATTACK MODE) 已安裝${NC}"
    echo -e "${GREEN}✅ Post-commit hook (--no-verify 偵測器) 已安裝${NC}"
    echo -e "${CYAN}   位置: $hook_path${NC}"
    echo ""
    echo -e "${WHITE}🔥 現在每次 git commit 前都會自動：${NC}"
    echo -e "   1. 審計所有 staged 的 .ts/.tsx 檔案"
    echo -e "   2. 檢查 any、eslint-disable、console.log 等"
    echo -e "   3. 檢查 Hook 中的硬編碼中文"
    echo -e "   4. 執行 TypeScript 類型檢查"
    echo -e "   5. 警告待審計檔案"
    echo ""
    echo -e "${WHITE}🔥 每次 commit 後會自動：${NC}"
    echo -e "   1. 偵測 --no-verify 使用"
    echo -e "   2. 記錄到 no_verify.log"
    echo -e "   3. finish 時扣分"
    echo ""
    echo -e "${BOLD_RED}⚠️  AI 無法繞過這個檢查！${NC}"
}

# ============================================================================
# 6. 違規記錄查詢 (Violation History)
# ============================================================================
function cmd_violations() {
    print_header "違規記錄查詢"
    if [ -f "$VIOLATION_LOG" ]; then
        local count=$(grep -c "VIOLATION" "$VIOLATION_LOG" || echo 0)
        echo -e "${RED}🔴 累計違規次數: $count${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cat "$VIOLATION_LOG"
    else
        echo -e "${GREEN}✅ 暫無違規記錄${NC}"
    fi
}

# ============================================================================
# 7. 全專案深度掃描 (Deep Scan)
# ============================================================================
function cmd_deep_scan() {
    print_header "全專案深度掃描 (PRISON MODE)"
    
    local total_issues=0
    
    echo "1️⃣  掃描局部字串定義..."
    local str_issues=$(grep -rlE "^const (STRINGS|messages|TEXT|LABELS)\s*=" src/components src/pages 2>/dev/null | wc -l || echo 0)
    if [ "$str_issues" -gt 0 ]; then
        echo -e "${RED}   ❌ 發現 $str_issues 個字串碎片化檔案${NC}"
        grep -rlE "^const (STRINGS|messages|TEXT|LABELS)\s*=" src/components src/pages 2>/dev/null || true
        total_issues=$((total_issues + str_issues))
    else
        echo -e "${GREEN}   ✅ 無字串碎片化${NC}"
    fi

    echo "2️⃣  掃描 Hook 硬編碼中文..."
    local hook_issues=$(grep -rlP "[\x{4e00}-\x{9fa5}]" src/hooks 2>/dev/null | wc -l || echo 0)
    if [ "$hook_issues" -gt 0 ]; then
        echo -e "${RED}   ❌ 發現 $hook_issues 個不純淨 Hook${NC}"
        grep -rlP "[\x{4e00}-\x{9fa5}]" src/hooks 2>/dev/null || true
        total_issues=$((total_issues + hook_issues))
    else
        echo -e "${GREEN}   ✅ Hook 純淨${NC}"
    fi

    echo "3️⃣  掃描硬編碼路由..."
    local route_issues=$(grep -rlE 'href="/maihouses/|to="/maihouses/' src/components src/pages 2>/dev/null | wc -l || echo 0)
    if [ "$route_issues" -gt 0 ]; then
        echo -e "${RED}   ❌ 發現 $route_issues 個硬編碼路由檔案${NC}"
        grep -rlE 'href="/maihouses/|to="/maihouses/' src/components src/pages 2>/dev/null || true
        total_issues=$((total_issues + route_issues))
    else
        echo -e "${GREEN}   ✅ 無硬編碼路由${NC}"
    fi

    echo "4️⃣  掃描缺失測試的組件..."
    local missing_tests=0
    for component in src/components/**/*.tsx; do
        if [[ "$component" != *".test."* ]] && [[ "$component" != *"__tests__"* ]]; then
            local dir=$(dirname "$component")
            local name=$(basename "$component" .tsx)
            if [ ! -f "$dir/$name.test.tsx" ] && [ ! -f "$dir/__tests__/$name.test.tsx" ]; then
                echo -e "${YELLOW}   ⚠️  缺少測試: $component${NC}"
                missing_tests=$((missing_tests + 1))
            fi
        fi
    done 2>/dev/null || true
    if [ "$missing_tests" -gt 0 ]; then
        echo -e "${RED}   ❌ 共 $missing_tests 個組件缺少測試${NC}"
        total_issues=$((total_issues + missing_tests))
    else
        echo -e "${GREEN}   ✅ 測試覆蓋完整${NC}"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$total_issues" -gt 0 ]; then
        echo -e "${RED}🔴 總計發現 $total_issues 個架構問題${NC}"
        exit 1
    else
        echo -e "${GREEN}🏆 全專案架構掃描通過${NC}"
    fi
}

# =========================================================================
# 7.1 自動掃描與報告 (Auto Scan)
# =========================================================================
function cmd_auto_scan() {
    print_header "自動掃描與報告 (AUTO SCAN)"

    local report="$STATE_DIR/scan-report.md"
    echo "# Auto Scan Report ($(date '+%Y-%m-%d %H:%M:%S'))" > "$report"

    echo "- Running deep scan..." >> "$report"
    if cmd_deep_scan >> "$report" 2>&1; then
        echo "- Deep scan: PASS" >> "$report"
    else
        echo "- Deep scan: FAIL (see details above)" >> "$report"
    fi

    echo "\n- Running ESLint (src)..." >> "$report"
    if npx eslint src --max-warnings=0 >> "$report" 2>&1; then
        echo "- ESLint: PASS" >> "$report"
    else
        echo "- ESLint: FAIL (see details above)" >> "$report"
    fi

    echo "\n- Running TypeScript (noEmit)..." >> "$report"
    if npx tsc --noEmit >> "$report" 2>&1; then
        echo "- TypeScript: PASS" >> "$report"
    else
        echo "- TypeScript: FAIL (see details above)" >> "$report"
    fi

    echo "\nReport saved to $report" >> "$report"
    echo -e "${CYAN}📄 自動掃描報告已生成：$report${NC}"
}

# ============================================================================
# 8. Session 狀態查詢
# ============================================================================
function cmd_status() {
    print_header "Session 狀態"
    
    if [ ! -f "$SESSION_FILE" ]; then
        echo -e "${RED}❌ 無活躍 Session${NC}"
        echo -e "${YELLOW}   請執行: ./scripts/ai-supervisor.sh start \"任務描述\"${NC}"
        return
    fi
    
    local task=$(cat "$SESSION_FILE" | grep -o '"task":"[^"]*"' | cut -d'"' -f4)
    local start_datetime=$(cat "$SESSION_FILE" | grep -o '"start_datetime":"[^"]*"' | cut -d'"' -f4)
    local start_time=$(cat "$SESSION_FILE" | grep -o '"start_time":[0-9]*' | cut -d: -f2)
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    local minutes=$((elapsed / 60))
    
    echo -e "${GREEN}✅ Session 活躍中${NC}"
    echo -e "${CYAN}   📝 任務: $task${NC}"
    echo -e "${CYAN}   ⏰ 開始: $start_datetime${NC}"
    echo -e "${CYAN}   ⏱️  已運行: $minutes 分鐘${NC}"
    echo ""
    echo -e "${CYAN}   📄 已讀取檔案: $(wc -l < "$READ_LOG" 2>/dev/null || echo 0)${NC}"
    echo -e "${CYAN}   📝 已修改檔案: $(wc -l < "$MODIFIED_FILES" 2>/dev/null || echo 0)${NC}"
    echo -e "${CYAN}   ✅ 已審計檔案: $(wc -l < "$AUDITED_FILES" 2>/dev/null || echo 0)${NC}"
}

# ============================================================================
# 9. 分數查詢 (cmd_score)
# ============================================================================
function cmd_score() {
    print_header "任務分數"
    
    if [ ! -f "$SCORE_FILE" ]; then
        echo -e "${CYAN}📊 當前分數: 100 / 150${NC}"
        echo -e "${CYAN}   (新任務起始分數)${NC}"
        return
    fi
    
    local score=$(cat "$SCORE_FILE" | grep -o '"score":[0-9]*' | cut -d: -f2)
    local last_update=$(cat "$SCORE_FILE" | grep -o '"last_update":"[^"]*"' | cut -d'"' -f4)
    local reason=$(cat "$SCORE_FILE" | grep -o '"reason":"[^"]*"' | cut -d'"' -f4)
    
    # 計算等級
    local grade=""
    local grade_color=""
    if [ "$score" -ge 140 ]; then
        grade="S (傳奇)"
        grade_color="${MAGENTA}"
    elif [ "$score" -ge 120 ]; then
        grade="A (卓越)"
        grade_color="${GREEN}"
    elif [ "$score" -ge 100 ]; then
        grade="B (優秀)"
        grade_color="${CYAN}"
    elif [ "$score" -ge 80 ]; then
        grade="C (及格)"
        grade_color="${YELLOW}"
    else
        grade="F (不及格)"
        grade_color="${RED}"
    fi
    
    echo -e "${CYAN}📊 當前分數: $score / 150${NC}"
    echo -e "${grade_color}🏅 等級: $grade${NC}"
    echo -e "${CYAN}📝 最後更新: $last_update${NC}"
    echo -e "${CYAN}💬 原因: $reason${NC}"
    echo ""
    
    # 分數說明
    echo -e "${WHITE}📈 分數機制說明：${NC}"
    echo -e "   ${GREEN}+2${NC}  審計通過"
    echo -e "   ${GREEN}+5${NC}  修復架構問題"
    echo -e "   ${GREEN}+10${NC} 完美完成任務"
    echo -e "   ${RED}-10${NC} 違規 (eslint-disable, any 等)"
    echo -e "   ${RED}-5${NC}  未審計就 finish"
    echo ""
    
    # 鼓勵
    if [ "$score" -ge 100 ]; then
        echo -e "${GREEN}🔥 做得好！繼續保持高水準！${NC}"
    else
        echo -e "${YELLOW}💪 加油！修復問題可以挽回分數！${NC}"
    fi
}

# ============================================================================
# 9.1 最終代碼評分 (Final Code Score)
# ============================================================================
function cmd_code_score() {
    if ! check_session; then
        exit 1
    fi

    print_header "最終代碼評分 (Final Code Score)"

    local base=150
    local score=$base
    local ts_log="$STATE_DIR/code-score-ts.log"
    local eslint_log="$STATE_DIR/code-score-eslint.log"
    local build_log="$STATE_DIR/code-score-build.log"

    mkdir -p "$STATE_DIR"

    echo "🔎 TypeScript (noEmit)";
    if npx tsc --noEmit > "$ts_log" 2>&1; then
        echo -e "${GREEN}✅ TS 檢查通過${NC}"
    else
        echo -e "${RED}❌ TS 檢查失敗 (扣 40 分)${NC}"
        score=$((score - 40))
        tail -n 20 "$ts_log"
    fi

    echo ""
    echo "🔎 ESLint (src, no warnings)";
    if npx eslint src --max-warnings=0 > "$eslint_log" 2>&1; then
        echo -e "${GREEN}✅ ESLint 通過${NC}"
    else
        echo -e "${RED}❌ ESLint 失敗 (扣 30 分)${NC}"
        score=$((score - 30))
        tail -n 20 "$eslint_log"
    fi

    echo ""
    echo "🔎 Build";
    if npm run build > "$build_log" 2>&1; then
        echo -e "${GREEN}✅ Build 通過${NC}"
    else
        echo -e "${RED}❌ Build 失敗 (扣 30 分)${NC}"
        score=$((score - 30))
        tail -n 20 "$build_log"
    fi

    if [ "$score" -lt 0 ]; then
        score=0
    fi

    local grade=""
    local grade_color=""
    if [ "$score" -ge 130 ]; then
        grade="S"
        grade_color="$MAGENTA"
    elif [ "$score" -ge 110 ]; then
        grade="A"
        grade_color="$GREEN"
    elif [ "$score" -ge 90 ]; then
        grade="B"
        grade_color="$CYAN"
    elif [ "$score" -ge 75 ]; then
        grade="C"
        grade_color="$YELLOW"
    else
        grade="F"
        grade_color="$RED"
    fi

    local summary_file="$STATE_DIR/code-score-$(date '+%Y%m%d-%H%M%S').log"
    {
        echo "Final Code Score: $score"
        echo "Grade: $grade"
        echo "TS: $( [ -s "$ts_log" ] && head -n 1 "$ts_log" || echo pass )"
        echo "ESLint: $( [ -s "$eslint_log" ] && head -n 1 "$eslint_log" || echo pass )"
        echo "Build: $( [ -s "$build_log" ] && head -n 1 "$build_log" || echo pass )"
    } > "$summary_file"

    echo ""
    echo -e "${CYAN}📊 最終代碼得分: $score / $base${NC}"
    echo -e "${grade_color}🏅 等級: $grade${NC}"
    echo -e "${CYAN}📝 檢查摘要儲存於: $summary_file${NC}"
    echo -e "${CYAN}   詳細日志: $ts_log | $eslint_log | $build_log${NC}"
}

# ============================================================================
# 10. 代碼指導 (cmd_guidance)
# ============================================================================
function cmd_guidance() {
    print_header "精英代碼指導"
    
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}🎓 ELITE CODE STANDARDS - Google L6 等級${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${CYAN}📋 TypeScript 最佳實踐：${NC}"
    echo -e "   ${GREEN}✓${NC} 使用 strict 模式，絕不使用 any"
    echo -e "   ${GREEN}✓${NC} 所有函數必須有明確的返回類型"
    echo -e "   ${GREEN}✓${NC} 使用 readonly 保護不可變數據"
    echo -e "   ${GREEN}✓${NC} 偏好 interface 而非 type（可擴展性）"
    echo -e "   ${GREEN}✓${NC} 使用 discriminated unions 而非 type assertions"
    echo ""
    
    echo -e "${CYAN}⚛️  React 最佳實踐：${NC}"
    echo -e "   ${GREEN}✓${NC} 使用 useCallback 包裝事件處理器"
    echo -e "   ${GREEN}✓${NC} 使用 useMemo 避免不必要的重新計算"
    echo -e "   ${GREEN}✓${NC} useEffect 必須有正確的依賴數組"
    echo -e "   ${GREEN}✓${NC} 組件單一職責：超過 200 行就該拆分"
    echo -e "   ${GREEN}✓${NC} 自定義 Hook 必須純淨（無硬編碼字串）"
    echo ""
    
    echo -e "${CYAN}🏗️  架構最佳實踐：${NC}"
    echo -e "   ${GREEN}✓${NC} 字串常數集中在 constants/strings.ts"
    echo -e "   ${GREEN}✓${NC} 路由集中在 constants/routes.ts"
    echo -e "   ${GREEN}✓${NC} 使用 barrel exports (index.ts)"
    echo -e "   ${GREEN}✓${NC} 錯誤邊界包裝關鍵組件"
    echo -e "   ${GREEN}✓${NC} API 調用封裝在 services 層"
    echo ""
    
    echo -e "${CYAN}🛡️  錯誤處理最佳實踐：${NC}"
    echo -e "   ${GREEN}✓${NC} Promise 必須有 .catch() 或 try/catch"
    echo -e "   ${GREEN}✓${NC} 自定義 Error 類別而非普通 Error"
    echo -e "   ${GREEN}✓${NC} 用戶友善的錯誤訊息（繁體中文）"
    echo -e "   ${GREEN}✓${NC} console.error 用於開發，Sentry 用於生產"
    echo ""
    
    echo -e "${CYAN}⚡ 性能最佳實踐：${NC}"
    echo -e "   ${GREEN}✓${NC} 避免在 render 中創建新物件/陣列"
    echo -e "   ${GREEN}✓${NC} 使用 React.memo 優化純展示組件"
    echo -e "   ${GREEN}✓${NC} 圖片使用 lazy loading"
    echo -e "   ${GREEN}✓${NC} 大列表使用虛擬化 (react-window)"
    echo ""
    
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    print_elite_quote
    echo ""
    print_encouragement
}

# =========================================================================
# 10.1 進階代碼指導 (Pro Guidance)
# =========================================================================
function cmd_guidance_pro() {
        print_header "進階代碼指導 (Pro Mode)"

        echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${WHITE}🚀 依檔案類型提供可直接貼用的高品質範例片段${NC}"
        echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

        echo -e "${CYAN}⚛️  React 組件片段：事件記憶化 + 型別 + A11y${NC}"
        cat << 'REACT_PRO'
// 範例：帶可選動作的列表項
import { memo, useCallback } from 'react';
import type { FC } from 'react';

interface ItemProps {
    readonly id: string;
    readonly label: string;
    readonly onSelect?: (id: string) => void;
}

export const Item: FC<ItemProps> = memo(function Item({ id, label, onSelect }) {
    const handleSelect = useCallback(() => onSelect?.(id), [id, onSelect]);
    return (
        <button type="button" onClick={handleSelect} aria-label={label} className="rounded px-3 py-2 hover:bg-ink-100">
            {label}
        </button>
    );
});
REACT_PRO

        echo -e "${CYAN}🧠 Hook 片段：純邏輯 + 無中文字串${NC}"
        cat << 'HOOK_PRO'
import { useCallback, useState } from 'react';

interface UseToggleOptions {
    readonly initial?: boolean;
    readonly onChange?: (value: boolean) => void;
}

export function useToggle(options: UseToggleOptions = {}) {
    const { initial = false, onChange } = options;
    const [value, setValue] = useState<boolean>(initial);

    const toggle = useCallback(() => {
        setValue((prev) => {
            const next = !prev;
            onChange?.(next);
            return next;
        });
    }, [onChange]);

    return { value, toggle, setValue };
}
HOOK_PRO

        echo -e "${CYAN}🛡️ 錯誤處理模式 (API 層)${NC}"
        cat << 'API_PRO'
export class ApiError extends Error {
    constructor(readonly code: string, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function safeFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);
    if (!res.ok) {
        throw new ApiError(String(res.status), 'Request failed');
    }
    return res.json() as Promise<T>;
}
API_PRO

        echo -e "${CYAN}🧭 路由/常數片段${NC}"
        cat << 'CONST_PRO'
export const ROUTES = {
    HOME: '/maihouses/',
    AUTH: '/maihouses/auth.html',
    COMMUNITY: (id: string) => `/maihouses/community/${id}`,
    COMMUNITY_WALL: (id: string) => `/maihouses/community/${id}/wall`,
} as const;
CONST_PRO

        echo -e "${CYAN}⚡ 性能與安全建議${NC}"
        echo " - Lazy import / code splitting：import('./Heavy') for modal、表格"
        echo " - API 層使用自訂錯誤類別 + 統一錯誤格式"
        echo " - 建議接入 Sentry 或雲端日誌，避免 console.log"
        echo " - 前端使用 CSP / 安全 headers（在 vercel.json 配置）"
}

# ============================================================================
# 11. 即時指導 (提供修改檔案時的即時建議)
# ============================================================================
function provide_realtime_guidance() {
    local file="$1"
    local ext="${file##*.}"
    
    echo -e "\n${WHITE}💡 即時代碼指導：${NC}"
    
    case "$ext" in
        tsx)
            echo -e "${CYAN}   ⚛️  React 組件檢查清單：${NC}"
            echo -e "      □ Props 是否有 TypeScript 介面？"
            echo -e "      □ 事件處理器是否用 useCallback 包裝？"
            echo -e "      □ useEffect 依賴數組是否完整？"
            echo -e "      □ 字串是否來自 STRINGS 常數？"
            echo -e "      □ 組件是否超過 200 行需要拆分？"
            ;;
        ts)
            echo -e "${CYAN}   📦 TypeScript 檢查清單：${NC}"
            echo -e "      □ 是否有任何 any 類型？"
            echo -e "      □ 函數是否有明確返回類型？"
            echo -e "      □ Promise 是否有錯誤處理？"
            echo -e "      □ 是否有魔法數字需要常數化？"
            ;;
        css|scss)
            echo -e "${CYAN}   🎨 樣式檢查清單：${NC}"
            echo -e "      □ 是否使用 Tailwind 而非自定義 CSS？"
            echo -e "      □ z-index 是否使用語義化變數？"
            echo -e "      □ 顏色是否來自設計系統？"
            ;;
        *)
            echo -e "${CYAN}   📝 通用檢查清單：${NC}"
            echo -e "      □ 代碼是否可讀？"
            echo -e "      □ 是否有足夠的註解？"
            echo -e "      □ 是否遵循專案慣例？"
            ;;
    esac
    
    # 記錄指導
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Guidance provided for: $file" >> "$GUIDANCE_LOG"
}

# ============================================================================
# 🔥 v7.3 新增功能：即時報告系統整合
# ============================================================================

# 即時報告 - 記錄 AI 操作
function report_action() {
    local action="$1"
    local detail="${2:-}"
    local status="${3:-INFO}"
    
    # 呼叫即時報告系統
    if [ -x "$PROJECT_ROOT/scripts/ai-realtime-report.sh" ]; then
        "$PROJECT_ROOT/scripts/ai-realtime-report.sh" log "$action" "$detail" "$status"
    fi
}

# 更新進度
function report_progress() {
    local phase="$1"
    local step="$2"
    local total="$3"
    local desc="$4"
    
    if [ -x "$PROJECT_ROOT/scripts/ai-realtime-report.sh" ]; then
        "$PROJECT_ROOT/scripts/ai-realtime-report.sh" progress "$phase" "$step" "$total" "$desc"
    fi
}

# 發送用戶通知
function notify_user() {
    local title="$1"
    local message="$2"
    local type="${3:-info}"
    
    if [ -x "$PROJECT_ROOT/scripts/ai-realtime-report.sh" ]; then
        "$PROJECT_ROOT/scripts/ai-realtime-report.sh" notify "$title" "$message" "$type"
    fi
}

# 自動檢查並安裝依賴
function cmd_check_deps() {
    print_header "🔧 檢查並安裝必要依賴"
    
    echo -e "${CYAN}🔍 檢查 npm 套件...${NC}"
    
    local missing=()
    
    # 檢查必要套件
    local required_packages=(
        "@stryker-mutator/core"
        "zod"
        "chalk"
    )
    
    for pkg in "${required_packages[@]}"; do
        if ! npm list "$pkg" &>/dev/null; then
            missing+=("$pkg")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  缺少以下依賴：${NC}"
        printf '   - %s\n' "${missing[@]}"
        echo ""
        echo -e "${CYAN}🔧 正在自動安裝...${NC}"
        npm install -D "${missing[@]}" 2>&1 | tail -10
        echo -e "${GREEN}✅ 依賴安裝完成${NC}"
    else
        echo -e "${GREEN}✅ 所有依賴已就緒${NC}"
    fi
    
    # 檢查腳本權限
    echo ""
    echo -e "${CYAN}🔍 檢查腳本權限...${NC}"
    
    local scripts=(
        "scripts/ai-supervisor.sh"
        "scripts/ai-realtime-report.sh"
        "scripts/ai-reviewer.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$PROJECT_ROOT/$script" ]; then
            if [ ! -x "$PROJECT_ROOT/$script" ]; then
                chmod +x "$PROJECT_ROOT/$script"
                echo -e "   ${GREEN}✅ 設定執行權限：$script${NC}"
            else
                echo -e "   ${GREEN}✅ $script${NC}"
            fi
        fi
    done
    
    echo ""
    echo -e "${GREEN}🏆 依賴檢查完成${NC}"
}

# 執行 AI Code Review
function cmd_ai_review() {
    print_header "🤖 AI Code Review"
    
    if [ -x "$PROJECT_ROOT/scripts/ai-reviewer.sh" ]; then
        "$PROJECT_ROOT/scripts/ai-reviewer.sh" review
    else
        echo -e "${RED}❌ AI Reviewer 腳本不存在或無執行權限${NC}"
        echo -e "${YELLOW}   請執行：chmod +x scripts/ai-reviewer.sh${NC}"
    fi
}

# 生成完整報告
function cmd_generate_report() {
    local type="${1:-summary}"
    
    print_header "📊 生成作業報告"
    
    if [ -x "$PROJECT_ROOT/scripts/ai-realtime-report.sh" ]; then
        "$PROJECT_ROOT/scripts/ai-realtime-report.sh" report "$type"
    else
        echo -e "${RED}❌ 報告系統不存在${NC}"
    fi
}

# 啟動監控模式
function cmd_watch() {
    print_header "🔍 啟動即時監控"
    
    if [ -x "$PROJECT_ROOT/scripts/ai-realtime-report.sh" ]; then
        "$PROJECT_ROOT/scripts/ai-realtime-report.sh" watch
    else
        echo -e "${RED}❌ 監控系統不存在${NC}"
    fi
}

# 完整流程自動執行
function cmd_full_check() {
    print_header "🔥 完整檢查流程"
    
    report_action "FULL_CHECK_START" "開始完整檢查流程" "START"
    
    local step=1
    local total=5
    
    # Step 1: TypeScript
    report_progress "完整檢查" "$step" "$total" "TypeScript 檢查"
    echo -e "${CYAN}[$step/$total] TypeScript 檢查...${NC}"
    if npm run typecheck 2>/dev/null; then
        echo -e "${GREEN}   ✅ TypeScript 通過${NC}"
        report_action "TYPECHECK" "通過" "DONE"
    else
        echo -e "${RED}   ❌ TypeScript 失敗${NC}"
        report_action "TYPECHECK" "失敗" "FAIL"
    fi
    step=$((step + 1))
    
    # Step 2: ESLint
    report_progress "完整檢查" "$step" "$total" "ESLint 檢查"
    echo -e "${CYAN}[$step/$total] ESLint 檢查...${NC}"
    if npx eslint src --max-warnings=0 2>/dev/null; then
        echo -e "${GREEN}   ✅ ESLint 通過${NC}"
        report_action "ESLINT" "通過" "DONE"
    else
        echo -e "${RED}   ❌ ESLint 失敗${NC}"
        report_action "ESLINT" "失敗" "FAIL"
    fi
    step=$((step + 1))
    
    # Step 3: Build
    report_progress "完整檢查" "$step" "$total" "Production Build"
    echo -e "${CYAN}[$step/$total] Build 檢查...${NC}"
    if npm run build 2>/dev/null; then
        echo -e "${GREEN}   ✅ Build 通過${NC}"
        report_action "BUILD" "通過" "DONE"
    else
        echo -e "${RED}   ❌ Build 失敗${NC}"
        report_action "BUILD" "失敗" "FAIL"
    fi
    step=$((step + 1))
    
    # Step 4: Deep Scan
    report_progress "完整檢查" "$step" "$total" "架構深度掃描"
    echo -e "${CYAN}[$step/$total] 架構深度掃描...${NC}"
    cmd_deep_scan 2>/dev/null || true
    report_action "DEEP_SCAN" "完成" "DONE"
    step=$((step + 1))
    
    # Step 5: AI Review
    report_progress "完整檢查" "$step" "$total" "AI Code Review"
    echo -e "${CYAN}[$step/$total] AI Code Review...${NC}"
    if [ -x "$PROJECT_ROOT/scripts/ai-reviewer.sh" ]; then
        "$PROJECT_ROOT/scripts/ai-reviewer.sh" review
    fi
    report_action "AI_REVIEW" "完成" "DONE"
    
    report_action "FULL_CHECK_END" "完整檢查流程結束" "DONE"
    
    # 生成報告
    echo ""
    echo -e "${CYAN}📊 生成完整報告...${NC}"
    cmd_generate_report "detailed"
    
    notify_user "完整檢查完成" "所有檢查已執行完畢，請查看報告" "success"
}

#
# 主路由
# ============================================================================
case "${1:-}" in
    "start")
        cmd_start "${2:-}"
        ;;
    "pre-write")
        cmd_pre_write "${2:-}"
        ;;
    "init")
        cmd_init
        ;;
    "plan")
        cmd_plan "${2:-}"
        ;;
    "log-read")
        cmd_log_read "${2:-}"
        ;;
    "track-modify")
        cmd_track_modify "${2:-}"
        ;;
    "audit")
        cmd_audit "${2:-}"
        ;;
    "audit-all")
        # 🔥 v7.2 新增：批次審計所有待審計檔案
        print_header "🔥 批次審計所有待審計檔案"
        if [ ! -f "$MODIFIED_FILES" ]; then
            echo -e "${YELLOW}沒有待審計的檔案${NC}"
            exit 0
        fi
        PENDING=$(comm -23 <(sort -u "$MODIFIED_FILES") <(sort -u "$AUDITED_FILES" 2>/dev/null || true))
        if [ -z "$PENDING" ]; then
            echo -e "${GREEN}✅ 所有檔案都已審計！${NC}"
            exit 0
        fi
        echo -e "${CYAN}📋 待審計檔案：${NC}"
        echo "$PENDING"
        echo ""
        FAILED=0
        while IFS= read -r file; do
            [ -z "$file" ] && continue
            echo -e "${CYAN}━━━ 審計: $file ━━━${NC}"
            if cmd_audit "$file"; then
                echo -e "${GREEN}✅ $file 通過${NC}"
            else
                FAILED=1
            fi
            echo ""
        done <<< "$PENDING"
        if [ "$FAILED" -eq 1 ]; then
            echo -e "${RED}❌ 部分檔案審計失敗！${NC}"
            exit 1
        fi
        echo -e "${GREEN}🏆 所有檔案審計通過！${NC}"
        ;;
    "finish")
        cmd_finish
        ;;
    "verify")
        cmd_verify
        ;;
    "install-hooks")
        cmd_install_hooks
        ;;
    "violations")
        cmd_violations
        ;;
    "rage-log")
        print_header "🔥 怒罵記錄"
        if [ -f "$RAGE_LOG" ]; then
            cat "$RAGE_LOG"
        else
            echo "目前沒有怒罵記錄（做得好！）"
        fi
        ;;
    "deep-scan")
        cmd_deep_scan
        ;;
    "status")
        cmd_status
        ;;
    "score")
        cmd_score
        ;;
    "code-score")
        cmd_code_score
        ;;
    "guidance")
        cmd_guidance
        ;;
    "guidance-pro")
        cmd_guidance_pro
        ;;
    "auto-scan")
        cmd_auto_scan
        ;;
    "template-tsx")
        print_header "📦 React 組件模板"
        show_template_tsx
        ;;
    "template-hook")
        print_header "🔗 Custom Hook 模板"
        show_template_hook
        ;;
    # ========== v7.3 新增指令 ==========
    "check-deps")
        cmd_check_deps
        ;;
    "ai-review")
        cmd_ai_review
        ;;
    "report")
        cmd_generate_report "${2:-summary}"
        ;;
    "watch")
        cmd_watch
        ;;
    "full-check")
        cmd_full_check
        ;;
    # ========== v7.4 Arena 競賽系統 ==========
    "arena")
        print_header "🏟️ ARENA 競賽系統"
        TASK="${2:-}"
        if [ -z "$TASK" ]; then
            echo -e "${CYAN}可用任務:${NC}"
            ls -1 "$PROJECT_ROOT/arena/tasks" 2>/dev/null || echo "  (尚無任務)"
            echo ""
            echo -e "${YELLOW}使用方式: ./scripts/ai-supervisor.sh arena <task_name>${NC}"
            exit 1
        fi
        echo -e "${CYAN}🎯 執行競賽: $TASK${NC}"
        cd "$PROJECT_ROOT" && npx tsx arena/run_arena.ts "$TASK"
        ;;
    "arena-list")
        print_header "🏟️ ARENA 任務列表"
        echo -e "${CYAN}任務:${NC}"
        for task in "$PROJECT_ROOT/arena/tasks"/*/; do
            task_name=$(basename "$task")
            candidates=$(ls "$PROJECT_ROOT/arena/candidates/$task_name" 2>/dev/null | wc -l)
            echo "  📋 $task_name ($candidates candidates)"
        done
        ;;
    "arena-add")
        print_header "🏟️ 新增 Arena Candidate"
        TASK="${2:-}"
        FILE="${3:-}"
        if [ -z "$TASK" ] || [ -z "$FILE" ]; then
            echo -e "${RED}使用方式: ./scripts/ai-supervisor.sh arena-add <task> <file.ts>${NC}"
            exit 1
        fi
        mkdir -p "$PROJECT_ROOT/arena/candidates/$TASK"
        cp "$FILE" "$PROJECT_ROOT/arena/candidates/$TASK/"
        echo -e "${GREEN}✅ 已新增 candidate: $FILE${NC}"
        ;;
    "arena-leaderboard")
        print_header "🏆 ARENA 排行榜"
        TASK="${2:-}"
        if [ -z "$TASK" ]; then
            echo -e "${RED}使用方式: ./scripts/ai-supervisor.sh arena-leaderboard <task>${NC}"
            exit 1
        fi
        LATEST=$(ls -t "$PROJECT_ROOT/arena/results/${TASK}-"*.json 2>/dev/null | head -1)
        if [ -z "$LATEST" ]; then
            echo -e "${YELLOW}尚無競賽結果。先執行: ./scripts/ai-supervisor.sh arena $TASK${NC}"
            exit 1
        fi
        echo -e "${CYAN}最新結果: $LATEST${NC}"
        cat "$LATEST" | jq -r '.leaderboard[] | "  \(.name): \(.avgRuntimeMs)ms, \(.codeLines) lines, score=\(.score)"'
        ;;
    # ========== v7.5 Mid-Law 天條系統 ==========
    "mid-law")
        print_header "🔥 MID-LAW 天條檢查"
        HOOK="${2:-}"
        TASK="${3:-}"
        if [ -z "$HOOK" ]; then
            echo -e "${CYAN}使用方式:${NC}"
            echo "  ./scripts/ai-supervisor.sh mid-law pre-write <task>  # 開始前檢查"
            echo "  ./scripts/ai-supervisor.sh mid-law during <task>     # 即時排名"
            echo "  ./scripts/ai-supervisor.sh mid-law finish <task>     # 生死裁決"
            echo "  ./scripts/ai-supervisor.sh mid-law check-code <file> # 代碼品質"
            exit 1
        fi
        cd "$PROJECT_ROOT" && npx tsx arena/mid-law-runner.ts "$HOOK" "$TASK"
        ;;
    "graveyard")
        print_header "☠️ GRAVEYARD 淘汰版本"
        TASK="${2:-}"
        if [ -z "$TASK" ]; then
            echo -e "${CYAN}所有任務的淘汰版本:${NC}"
            for task in "$PROJECT_ROOT/arena/graveyard"/*/; do
                [ -d "$task" ] || continue
                task_name=$(basename "$task")
                count=$(ls "$task" 2>/dev/null | wc -l)
                echo "  ☠️ $task_name ($count 個淘汰版本)"
            done
        else
            echo -e "${CYAN}$TASK 的淘汰版本:${NC}"
            ls -la "$PROJECT_ROOT/arena/graveyard/$TASK" 2>/dev/null || echo "  (尚無淘汰版本)"
        fi
        ;;
    # ========== v11.0 即時監控系統 ==========
    "monitor")
        realtime_monitor
        ;;
    "readonly-on")
        export READONLY_MODE=1
        echo -e "${GREEN}🔒 唯讀模式：已開啟${NC}"
        echo "   所有修改操作需要用戶確認"
        ;;
    "readonly-off")
        export READONLY_MODE=0
        echo -e "${YELLOW}🔓 唯讀模式：已關閉${NC}"
        ;;
    "detect-lazy")
        FILE="${2:-}"
        if [ -z "$FILE" ]; then
            echo -e "${RED}使用方式: ./scripts/ai-supervisor.sh detect-lazy <file>${NC}"
            exit 1
        fi
        detect_laziness "$FILE"
        ;;
    "scan-all-lazy")
        print_header "🔍 全專案偷懶掃描"
        LAZY_FILES=0
        for file in $(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -50); do
            if ! detect_laziness "$file" > /dev/null 2>&1; then
                echo -e "${RED}  ⚠️ $file${NC}"
                LAZY_FILES=$((LAZY_FILES + 1))
            fi
        done
        if [ "$LAZY_FILES" -eq 0 ]; then
            echo -e "${GREEN}✅ 未發現偷懶模式${NC}"
        else
            echo -e "${RED}❌ 發現 $LAZY_FILES 個檔案有偷懶模式${NC}"
        fi
        ;;
    "midlaw"|"check-midlaw"|"天條")
        TASK="${2:-}"
        check_midlaw "$TASK"
        ;;
    "guidance")
        FILE="${2:-}"
        provide_guidance "$FILE"
        ;;
    # ========== v11.0 物理阻斷安裝 ==========
    "install-physical-gates")
        print_header "🔒 安裝物理阻斷閘門"
        echo -e "${CYAN}即將安裝 4 道物理阻斷:${NC}"
        echo "  1. pre-commit hook (阻止不合格的 commit)"
        echo "  2. pre-push hook (阻止未測試的 push)"
        echo "  3. commit-msg hook (檢查 commit 訊息)"
        echo ""
        # 確保 hooks 目錄存在
        HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
        if [ ! -d "$HOOKS_DIR" ]; then
            echo -e "${RED}❌ 找不到 .git/hooks 目錄${NC}"
            exit 1
        fi

        # 安裝 pre-commit
        cat > "$HOOKS_DIR/pre-commit" << 'PRECOMMIT_EOF'
#!/bin/bash
# 🔒 v11.0 物理阻斷 - pre-commit

echo "🔍 [pre-commit] 物理阻斷檢查..."

# 1. 檢查 TypeScript
echo "  [1/4] TypeScript..."
npm run typecheck --silent 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 阻斷提交：TypeScript 檢查失敗"
    exit 1
fi

# 2. 檢查 ESLint
echo "  [2/4] ESLint..."
npm run lint --silent 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 阻斷提交：ESLint 檢查失敗"
    exit 1
fi

# 3. 偷懶模式檢查
echo "  [3/4] 偷懶偵測..."
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')
for file in $STAGED; do
    if [ -f "$file" ]; then
        # 檢查 any
        if grep -q ": any" "$file"; then
            echo "❌ 阻斷提交：$file 使用了 any 類型"
            exit 1
        fi
        # 檢查 @ts-ignore
        if grep -q "@ts-ignore\|@ts-nocheck" "$file"; then
            echo "❌ 阻斷提交：$file 使用了 @ts-ignore"
            exit 1
        fi
        # 檢查 eslint-disable
        if grep -q "eslint-disable" "$file"; then
            echo "❌ 阻斷提交：$file 使用了 eslint-disable"
            exit 1
        fi
    fi
done

# 4. Build 檢查
echo "  [4/4] Build..."
npm run build --silent 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 阻斷提交：Build 失敗"
    exit 1
fi

echo "✅ pre-commit 檢查通過"
PRECOMMIT_EOF
        chmod +x "$HOOKS_DIR/pre-commit"
        echo -e "${GREEN}  ✅ pre-commit 已安裝${NC}"

        # 安裝 pre-push
        cat > "$HOOKS_DIR/pre-push" << 'PREPUSH_EOF'
#!/bin/bash
# 🔒 v11.0 物理阻斷 - pre-push

echo "🔒 [pre-push] 最後物理阻斷..."

# 完整測試
npm run typecheck || exit 1
npm run lint || exit 1
npm run build || exit 1

echo "✅ pre-push 檢查通過"
PREPUSH_EOF
        chmod +x "$HOOKS_DIR/pre-push"
        echo -e "${GREEN}  ✅ pre-push 已安裝${NC}"

        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🔒 物理阻斷已安裝完成！${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "現在 AI 無法："
        echo "  ❌ commit 有 any 類型的代碼"
        echo "  ❌ commit 有 @ts-ignore 的代碼"
        echo "  ❌ commit TypeScript 錯誤的代碼"
        echo "  ❌ push 未通過測試的代碼"
        ;;
    "check-gates")
        print_header "🔍 檢查物理阻斷狀態"
        HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
        echo -e "${CYAN}Git Hooks 狀態:${NC}"
        for hook in pre-commit pre-push commit-msg; do
            if [ -f "$HOOKS_DIR/$hook" ] && [ -x "$HOOKS_DIR/$hook" ]; then
                echo -e "  ✅ $hook: ${GREEN}已安裝且可執行${NC}"
            elif [ -f "$HOOKS_DIR/$hook" ]; then
                echo -e "  ⚠️ $hook: ${YELLOW}存在但不可執行${NC}"
            else
                echo -e "  ❌ $hook: ${RED}未安裝${NC}"
            fi
        done
        echo ""
        echo -e "${CYAN}建議: 執行 ./scripts/ai-supervisor.sh install-physical-gates${NC}"
        ;;
    *)
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🔥 AI SUPERVISOR v11.0 - 即時監控 + 物理阻斷${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        print_rage
        echo ""
        echo -e "${CYAN}🚀 任務生命週期 (必須按順序執行)：${NC}"
        echo "  ${GREEN}1. start <task>${NC}     【強制】開始任務 (不執行=怒罵)"
        echo "  ${GREEN}2. pre-write <file>${NC} 【建議】寫代碼前看規則"
        echo "  ${GREEN}3. track-modify <f>${NC} 【強制】修改後登記 (含即時掃描)"
        echo "  ${GREEN}4. audit <file>${NC}     【強制】審計代碼 (失敗=怒罵)"
        echo "  ${GREEN}4a. audit-all${NC}       【推薦】批次審計所有待審計檔案"
        echo "  ${GREEN}5. finish${NC}           【強制】結束任務 (逃漏=怒罵)"
        echo ""
        echo -e "${CYAN}🏟️ ARENA 競賽系統 (相對排名淘汰制)：${NC}"
        echo "  ${GREEN}arena <task>${NC}        執行競賽 (測試全過+最快+最短=冠軍)"
        echo "  ${GREEN}arena-list${NC}          列出所有任務"
        echo "  ${GREEN}arena-add <t> <f>${NC}   新增 candidate"
        echo "  ${GREEN}arena-leaderboard <t>${NC} 查看排行榜"
        echo ""
        echo -e "${CYAN}🔧 工具指令：${NC}"
        echo "  ${GREEN}status${NC}          查看 Session 狀態"
        echo "  ${GREEN}score${NC}           查看分數 (0-150)"
        echo "  ${GREEN}code-score${NC}      TypeScript/ESLint/Build 評分"
        echo "  ${GREEN}guidance${NC}        最佳實踐指南"
        echo "  ${GREEN}verify${NC}          全系統測試"
        echo "  ${GREEN}deep-scan${NC}       全專案深度掃描"
        echo "  ${RED}rage-log${NC}        怒罵記錄"
        echo "  ${RED}violations${NC}      違規記錄"
        echo ""
        echo -e "${CYAN}🔒 v11.0 即時監控 + 物理阻斷：${NC}"
        echo "  ${GREEN}monitor${NC}               即時監控狀態"
        echo "  ${GREEN}readonly-on${NC}           開啟唯讀模式"
        echo "  ${GREEN}readonly-off${NC}          關閉唯讀模式"
        echo "  ${GREEN}detect-lazy <file>${NC}    偵測偷懶模式"
        echo "  ${GREEN}scan-all-lazy${NC}         全專案偷懶掃描"
        echo "  ${GREEN}install-physical-gates${NC} 安裝物理阻斷 (pre-commit, pre-push)"
        echo "  ${GREEN}check-gates${NC}           檢查物理阻斷狀態"
        echo ""
        echo -e "${WHITE}🔥 v11.0 核心改變：${NC}"
        echo "  舊：扣分、警告、怒罵（心理約束）"
        echo "  新：pre-commit exit 1（物理阻斷）"
        echo ""
        echo -e "${YELLOW}📋 Arena 解決的 5 種高階投機：${NC}"
        echo "  1. 語意退化 → Fuzz 測試抓 silent fail"
        echo "  2. 邊界省略 → 隨機測資 + 極端值"
        echo "  3. 效能省略 → 效能排名（最快才是冠軍）"
        echo "  4. 規模省略 → 壓力測試"
        echo "  5. 設計省略 → 多版本競爭淘汰"
        echo ""
        echo -e "${BG_RED}${WHITE}⚠️  AI AGENT 必讀：${NC}"
        echo -e "${YELLOW}   1. 收到任務 → ./scripts/ai-supervisor.sh start \"任務\"${NC}"
        echo -e "${YELLOW}   2. 寫完代碼 → arena 競賽決定誰是冠軍${NC}"
        echo -e "${YELLOW}   3. 偷懶 = 壓縮代碼 = 可能贏；亂寫 = 測試失敗 = 淘汰${NC}"
        echo ""
        exit 1
        ;;
esac
