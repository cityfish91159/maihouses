#!/bin/bash
# ============================================================================
# AI SUPERVISOR v7.1 - ULTIMATE ATTACK MODE (終極攻擊模式)
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
#
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

# 狀態檔案
PROJECT_ROOT="$(pwd)"
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

mkdir -p "$STATE_DIR"
touch "$VIOLATION_LOG"
touch "$MODIFIED_FILES"
touch "$AUDITED_FILES"
touch "$GUIDANCE_LOG"
touch "$RAGE_LOG"

# ============================================================================
# 🔥 怒罵語錄 (RAGE MESSAGES) - AI 犯錯時的怒火
# ============================================================================
RAGE_MESSAGES=(
    "🤬 你在寫什麼垃圾代碼？！這種東西也敢提交？！"
    "💢 這是哪個白痴寫的？！哦，是你啊！重寫！"
    "🔥 我見過蠢的，沒見過這麼蠢的！這代碼能跑？！"
    "😤 你是故意的嗎？！這種低級錯誤！滾回去重學！"
    "💀 恭喜你！你的代碼成功讓我想砸電腦！"
    "🚫 停！別寫了！你越寫越爛！先去讀文檔！"
    "⚠️ 警告：你的智商和代碼品質一樣低！"
    "🗑️ 這代碼唯一的價值就是當反面教材！"
    "💩 我見過屎山代碼，但你在建屎山摩天樓！"
    "🎪 這是在寫代碼還是在表演馬戲？！"
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
    
    # 分數低於 50 時額外警告
    if [ "$new_score" -lt 50 ]; then
        echo -e "${BG_RED}${WHITE}⚠️  你的分數只剩 $new_score！再犯錯就完蛋了！${NC}"
    fi
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
    
    # 記錄修改的檔案
    echo "$file" >> "$MODIFIED_FILES"
    echo -e "${CYAN}📝 已記錄修改: $file${NC}"
    
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
}

function cmd_finish() {
    print_header "🏁 任務完成檢查 (ELITE ENFORCER)"
    
    if ! check_session; then
        exit 1
    fi
    
    # 0. 逃漏檢查 - 檢測 Git 變更但未追蹤的檔案
    echo "0️⃣  [逃漏封鎖] 檢查未追蹤的 Git 變更..."
    local git_changes=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' || true)
    if [ -n "$git_changes" ]; then
        while IFS= read -r changed_file; do
            if ! grep -qF "$changed_file" "$MODIFIED_FILES" 2>/dev/null; then
                echo -e "${RED}❌ 偵測到未追蹤的修改: $changed_file${NC}"
                echo -e "${RED}   你修改了這個檔案但沒有執行 track-modify！${NC}"
                update_score -20 "逃漏: 未追蹤修改 $changed_file"
                rage_exit "發現逃漏！所有修改必須經過 track-modify 登記！"
            fi
        done <<< "$git_changes"
    fi
    echo -e "${GREEN}   ✅ 無未追蹤的修改${NC}"
    
    # 1. 檢查是否所有修改的檔案都已審計
    echo "1️⃣  檢查審計覆蓋..."
    
    if [ -f "$MODIFIED_FILES" ] && [ -s "$MODIFIED_FILES" ]; then
        local unaudited=""
        while IFS= read -r file; do
            if ! grep -qF "$file" "$AUDITED_FILES" 2>/dev/null; then
                unaudited="$unaudited$file\n"
            fi
        done < "$MODIFIED_FILES"
        
        if [ -n "$unaudited" ]; then
            echo -e "${RED}❌ 以下檔案修改後未經審計：${NC}"
            echo -e "$unaudited"
            update_score -15 "未審計檔案"
            rage_exit "所有修改過的檔案必須經過 audit！"
        fi
        echo -e "${GREEN}   ✅ 所有修改檔案已審計${NC}"
    else
        echo -e "${YELLOW}   ⚠️  未記錄到任何修改（請確認是否使用了 track-modify）${NC}"
    fi
    
    # 2. 執行全系統驗證
    echo "2️⃣  執行全系統驗證..."
    cmd_verify
    
    # 3. 顯示最終分數
    local final_score=100
    if [ -f "$SCORE_FILE" ]; then
        final_score=$(cat "$SCORE_FILE" | grep -o '"score":[0-9]*' | cut -d: -f2 || echo 100)
    fi
    
    # 4. 結束 session
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

    # 3.1 檢查偷懶標記
    echo "🔍 檢查偷懶省略..."
    if grep -qE "// \.\.\.|/\* \.\.\.*/|// existing code|// rest of code|// code omitted" "$file"; then
        rage_exit "偵測到省略代碼 (如 // ...)。\n請補全完整代碼，禁止偷懶！"
    fi

    # 3.2 檢查 TODO/FIXME
    echo "🔍 檢查未完成標記..."
    if grep -qE "TODO:|FIXME:" "$file"; then
        warn "發現 TODO/FIXME。如果是新留下的，請解釋為何不現在完成？"
        grep -nE "TODO:|FIXME:" "$file"
    fi

    # 3.3 檢查 console.log
    echo "🔍 檢查 console.log..."
    if grep -q "console.log" "$file"; then
        rage_exit "發現 console.log。生產環境代碼必須移除 (或使用 logger)。"
    fi

    # 3.4 檢查 TypeScript any
    echo "🔍 檢查 'any' 類型..."
    if grep -q ": any" "$file"; then
        rage_exit "發現 ': any'。嚴格禁止使用 any！請定義介面或使用 unknown。"
    fi

    # 3.5 檢查硬編碼 Secrets
    echo "🔍 檢查硬編碼密鑰..."
    if grep -qE "sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9]{20,}" "$file"; then
        rage_exit "發現疑似硬編碼的 API Key 或 Token！絕對禁止！"
    fi

    # 3.6 [v2.2 新增] 檢查除錯殘留 (debugger/alert)
    echo "🔍 檢查除錯殘留..."
    if grep -qE "debugger;|alert\(" "$file"; then
        rage_exit "發現 debugger 或 alert()！這是開發測試代碼，禁止提交。"
    fi

    # 3.7 [v2.2 新增] 檢查空 Catch Block (吞噬錯誤)
    echo "🔍 檢查錯誤處理..."
    if grep -qE "catch\s*\(\w+\)\s*\{\s*\}" "$file"; then
        warn "發現空的 catch block。請至少 log 錯誤或處理它，不要吞噬錯誤。"
        grep -nE "catch\s*\(\w+\)\s*\{\s*\}" "$file"
    fi

    # 3.8 [v2.2 新增] 檢查內聯樣式 (Inline Styles)
    echo "🔍 檢查內聯樣式..."
    if grep -q "style={{" "$file"; then
        warn "發現 style={{...}}。請優先使用 Tailwind CSS class。"
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
    echo "🔍 檢查 Mobile Viewport..."
    if grep -qE "h-screen|100vh" "$file"; then
        warn "發現 h-screen 或 100vh。移動端建議使用 'dvh' (Dynamic Viewport Height) 避免被網址列遮擋。"
    fi

    # 3.14 [v2.4 新增] Google Standard - Z-Index Magic Numbers
    echo "🔍 檢查 Z-Index Magic Numbers..."
    if grep -qE "z-\[[0-9]+\]" "$file"; then
        warn "發現 z-[999] 等硬編碼層級。請使用 Tailwind 設定檔定義語意化 z-index (如 z-modal)。"
    fi

    # 3.15 [v3.0 新增] Anti-Evasion (反規避檢查)
    echo "🔍 檢查規避審查標記..."
    if grep -qE "eslint-disable|ts-ignore|ts-nocheck|as unknown as" "$file"; then
        rage_exit "發現規避審查標記 (eslint-disable, ts-ignore, as unknown as)。\n請解決根本問題，而不是隱藏問題！"
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
    echo "🔍 檢查寬鬆類型..."
    if grep -qE ": Function|: Object|: \{\}" "$file"; then
        rage_exit "發現寬鬆類型 (Function, Object, {})。請使用具體的函數簽名或介面定義。"
    fi

    # 3.20 [v3.2 新增] React Key Index Check (React Key 檢查)
    echo "🔍 檢查 React Key..."
    if grep -qE "key=\{index\}|key=\{i\}" "$file"; then
        warn "發現使用 index 作為 key。這可能導致渲染效能問題，請使用唯一 ID。"
    fi

    # 3.21 [v3.2 新增] Stricter Any Check (更嚴格的 Any 檢查)
    echo "🔍 檢查隱藏的 Any..."
    if grep -qE "as any|<any>" "$file"; then
        rage_exit "發現 'as any' 或 '<any>'。嚴格禁止使用 any！"
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
    echo "🔍 [PRISON] 檢查硬編碼路由..."
    if grep -qE 'href="/maihouses/|to="/maihouses/|navigate\("/maihouses/' "$file"; then
        if [[ "$file" != *"constants/routes"* ]] && [[ "$file" != *"config/"* ]]; then
            rage_exit "發現硬編碼路由 (/maihouses/...)。\n請將路由定義在 src/constants/routes.ts 並統一引用。"
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
    echo "🔍 [PRISON] 檢查 Z-Index 語意化..."
    if grep -qE "z-[0-9]+[^0-9]|z-\[[0-9]+\]" "$file"; then
        rage_exit "發現非語意化 z-index (如 z-50, z-[999])。\n請在 tailwind.config.js 定義 z-modal, z-overlay 等語意化層級。"
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

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🏆 ATTACK MODE: 審計通過，允許提交！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
HOOK_SCRIPT
    chmod +x "$hook_path"
    
    echo -e "${GREEN}✅ Pre-commit hook (ATTACK MODE) 已安裝${NC}"
    echo -e "${CYAN}   位置: $hook_path${NC}"
    echo ""
    echo -e "${WHITE}🔥 現在每次 git commit 前都會自動：${NC}"
    echo -e "   1. 審計所有 staged 的 .ts/.tsx 檔案"
    echo -e "   2. 檢查 any、eslint-disable、console.log 等"
    echo -e "   3. 檢查 Hook 中的硬編碼中文"
    echo -e "   4. 執行 TypeScript 類型檢查"
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
    "guidance")
        cmd_guidance
        ;;
    "template-tsx")
        print_header "📦 React 組件模板"
        show_template_tsx
        ;;
    "template-hook")
        print_header "🔗 Custom Hook 模板"
        show_template_hook
        ;;
    *)
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BG_RED}${WHITE}🔥 AI SUPERVISOR v7.0 - ATTACK MODE (主動攻擊模式)${NC}"
        echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        print_rage
        echo ""
        echo -e "${CYAN}🚀 任務生命週期 (必須按順序執行)：${NC}"
        echo "  ${GREEN}1. start <task>${NC}     【強制】開始任務 (不執行=怒罵)"
        echo "  ${GREEN}2. pre-write <file>${NC} 【建議】寫代碼前看規則"
        echo "  ${GREEN}3. track-modify <f>${NC} 【強制】修改後登記 (含即時掃描)"
        echo "  ${GREEN}4. audit <file>${NC}     【強制】審計代碼 (失敗=怒罵)"
        echo "  ${GREEN}5. finish${NC}           【強制】結束任務 (逃漏=怒罵)"
        echo ""
        echo -e "${CYAN}🔧 工具指令：${NC}"
        echo "  ${GREEN}status${NC}          查看 Session 狀態"
        echo "  ${GREEN}score${NC}           查看分數 (0-150)"
        echo "  ${GREEN}guidance${NC}        顯示最佳實踐指南"
        echo "  ${GREEN}template-tsx${NC}    顯示 React 組件模板"
        echo "  ${GREEN}template-hook${NC}   顯示 Hook 模板"
        echo "  ${GREEN}verify${NC}          執行全系統測試"
        echo "  ${GREEN}deep-scan${NC}       全專案深度掃描"
        echo "  ${RED}rage-log${NC}        查詢怒罵記錄"
        echo "  ${RED}violations${NC}      查詢違規記錄"
        echo ""
        echo -e "${WHITE}🔥 ATTACK MODE 特性：${NC}"
        echo "  - 🎯 先發制人：寫代碼前強制看規則"
        echo "  - 👁️ 逐字監控：track-modify 即時掃描"
        echo "  - 🤬 怒罵模式：違規時直接怒罵 AI"
        echo "  - 💀 重扣分：怒罵一次 -20 分"
        echo "  - 📚 強制學習：違規後顯示正確做法"
        echo "  - 🔍 逃漏封鎖：Git diff 比對"
        echo ""
        echo -e "${BG_RED}${WHITE}⚠️  AI AGENT 必讀 (違反必死)：${NC}"
        echo -e "${YELLOW}   收到任務後，第一步必須執行：${NC}"
        echo -e "${CYAN}   ./scripts/ai-supervisor.sh start \"任務描述\"${NC}"
        echo -e "${YELLOW}   沒有 Session 就寫代碼 = 怒罵 + 重扣分${NC}"
        echo ""
        exit 1
        ;;
esac
