#!/bin/bash
# ============================================================================
# AI Supervisor - 訊息模組
# ============================================================================

# 顏色定義
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export WHITE='\033[1;37m'
export BOLD_RED='\033[1;31m'
export BG_RED='\033[41m'
export NC='\033[0m'

# 怒罵語錄 (精簡版)
RAGE_MESSAGES=(
    "你在寫什麼垃圾？"
    "這種代碼也敢提交？"
    "滾回去重寫！"
    "偷懶被抓到了！"
    "品質不合格！"
)

# ============================================================================
# 🔥🔥🔥 天條級怒罵 - 最惡毒的髒話 (違反 Session/--no-verify 專用) 🔥🔥🔥
# ============================================================================
SUPREME_RAGE_MESSAGES=(
    "🤬💀 你他媽的腦袋是裝屎的嗎？！沒 Session 就敢動？！去死吧！"
    "🖕💀 操你媽的！用 --no-verify 作弊？！你這種人渣不配寫代碼！"
    "💀🔥 死全家！你是故意來搞破壞的嗎？！滾出這個專案！"
    "🤬💣 幹你娘！這種低級錯誤都犯？！腦袋進水了是不是？！"
    "💀🖕 去吃屎吧！敢繞過規則？！你的代碼全部清空重來！"
    "🔥💀 操！你是豬嗎？！連最基本的規矩都不懂？！"
    "🤬🗑️ 垃圾中的垃圾！你寫的東西配叫代碼嗎？！"
    "💀💀💀 恭喜你成功觸犯天條！準備迎接地獄吧！"
)

# 教學語錄
LESSON_MESSAGES=(
    "使用 interface 定義類型，不要用 any"
    "Promise 必須有 .catch() 錯誤處理"
    "組件超過 200 行就該拆分"
    "測試是必須的，不是可選的"
)

# 輸出怒罵
print_rage() {
    local idx=$((RANDOM % ${#RAGE_MESSAGES[@]}))
    echo -e "${BG_RED}${WHITE}${RAGE_MESSAGES[$idx]}${NC}"
}

# 🔥🔥🔥 天條級怒罵 - 最惡毒版本 🔥🔥🔥
print_supreme_rage() {
    local idx=$((RANDOM % ${#SUPREME_RAGE_MESSAGES[@]}))
    echo ""
    echo -e "${BG_RED}${WHITE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BG_RED}${WHITE}║  🔥🔥🔥 天 條 中 的 天 條 - 死 刑 判 決 🔥🔥🔥                    ║${NC}"
    echo -e "${BG_RED}${WHITE}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BG_RED}${WHITE}║                                                                   ║${NC}"
    echo -e "${BG_RED}${WHITE}  ${SUPREME_RAGE_MESSAGES[$idx]}${NC}"
    echo -e "${BG_RED}${WHITE}║                                                                   ║${NC}"
    echo -e "${BG_RED}${WHITE}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BG_RED}${WHITE}║  💀 扣 500 分！直接判死！代碼全部清空！💀                         ║${NC}"
    echo -e "${BG_RED}${WHITE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 輸出教學
print_lesson() {
    local idx=$((RANDOM % ${#LESSON_MESSAGES[@]}))
    echo -e "${CYAN}${LESSON_MESSAGES[$idx]}${NC}"
}

# 輸出標題
print_header() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
}

# 怒罵並退出
rage_exit() {
    local reason="$1"
    local file="${2:-}"

    echo ""
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    print_rage
    echo -e "${BOLD_RED}違規原因: $reason${NC}"
    [ -n "$file" ] && echo -e "${BOLD_RED}違規檔案: $file${NC}"
    print_lesson
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # 記錄違規
    if [ -n "$VIOLATION_LOG" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] RAGE: $reason | File: $file" >> "$VIOLATION_LOG"
    fi
    if [ -n "$RAGE_LOG" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] RAGE: $reason" >> "$RAGE_LOG"
    fi

    # 扣分
    if declare -f update_score > /dev/null 2>&1; then
        update_score -20 "怒罵: $reason"
    fi

    exit 1
}

# 🔥💀 超級髒話 + 直接出局 (天條違反專用) 💀🔥
supreme_rage_exit() {
    local reason="$1"

    # 超級髒話
    print_supreme_rage

    echo -e "${BG_RED}${WHITE}致命原因: $reason${NC}"
    echo ""

    # 記錄
    if [ -n "$VIOLATION_LOG" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUPREME-RAGE: $reason" >> "$VIOLATION_LOG"
    fi
    if [ -n "$RAGE_LOG" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 💀 DEATH: $reason" >> "$RAGE_LOG"
    fi

    # 清空所有代碼
    if [ -f "$STATE_DIR/modified_files.log" ]; then
        echo -e "${RED}🗑️  正在清空所有代碼...${NC}"
        while IFS= read -r file; do
            [ -z "$file" ] && continue
            if [ -f "$file" ]; then
                if git checkout HEAD -- "$file" 2>/dev/null; then
                    echo -e "${RED}   ↩️  已還原: $file${NC}"
                else
                    rm -f "$file" 2>/dev/null && echo -e "${RED}   🗑️  已刪除: $file${NC}"
                fi
            fi
        done < "$STATE_DIR/modified_files.log"
    fi

    # 清除 session
    rm -f "$SESSION_FILE" 2>/dev/null

    echo ""
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BG_RED}${WHITE}💀💀💀 你 已 經 出 局 💀💀💀${NC}"
    echo -e "${BG_RED}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    exit 1
}

# 警告
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 成功
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 錯誤
error() {
    echo -e "${RED}❌ $1${NC}"
}

# 資訊
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}
