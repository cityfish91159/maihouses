#!/bin/bash
# ============================================================================
# AI SUPERVISOR - 極度嚴格的 AI 行為監督腳本 (v2.0)
# ============================================================================
# 設計理念：
# 1. 零信任 (Zero Trust)：假設 AI 會偷懶、會遺漏、會腦補。
# 2. 強制程序 (Mandatory Procedure)：必須先讀後寫，必須先計畫後執行。
# 3. 自動審計 (Auto Audit)：代碼提交前必須通過靜態分析。
# ============================================================================

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 狀態檔案
PROJECT_ROOT="$(pwd)"
STATE_DIR="$PROJECT_ROOT/.ai_supervisor"
READ_LOG="$STATE_DIR/read_files.log"
PLAN_FILE="$STATE_DIR/plan.json"

mkdir -p "$STATE_DIR"

# ============================================================================
# 核心功能函數
# ============================================================================

function print_header() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ 🛡️  AI SUPERVISOR: $1${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

function error_exit() {
    echo -e "${RED}❌ [嚴格阻擋] $1${NC}"
    exit 1
}

function warn() {
    echo -e "${YELLOW}⚠️  [警告] $1${NC}"
}

# ============================================================================
# 1. 任務初始化與計畫 (Plan)
# ============================================================================
function cmd_init() {
    rm -rf "$STATE_DIR"
    mkdir -p "$STATE_DIR"
    touch "$READ_LOG"
    print_header "任務初始化"
    echo "✅ 監督狀態已重置。請開始你的表演。"
    echo "👉 下一步：執行 ./scripts/ai-supervisor.sh plan \"任務描述\""
}

function cmd_plan() {
    local task="$1"
    if [ -z "$task" ]; then
        error_exit "必須提供任務描述！不能盲目開工。"
    fi
    
    print_header "任務規劃階段"
    echo "📝 任務: $task"
    echo "🔍 正在掃描相關檔案..."
    
    # 1. 嘗試關鍵字搜尋
    grep -r "$task" src api --include="*.ts" --include="*.tsx" --include="*.js" | cut -d: -f1 | sort | uniq > "$STATE_DIR/related_files.txt"
    
    # 2. 如果找不到，列出最近修改的檔案 (Git status)
    if [ ! -s "$STATE_DIR/related_files.txt" ]; then
        echo "⚠️  關鍵字搜尋無結果，切換至 Git 變更偵測..."
        git status --porcelain | awk '{print $2}' | grep -E "\.(ts|tsx|js)$" > "$STATE_DIR/related_files.txt" || true
    fi

    local count=$(wc -l < "$STATE_DIR/related_files.txt")
    if [ "$count" -gt 0 ]; then
        echo -e "${GREEN}找到 $count 個潛在相關檔案 (已存入 $STATE_DIR/related_files.txt):${NC}"
        cat "$STATE_DIR/related_files.txt"
    else
        warn "找不到相關檔案。請手動確認涉及範圍。"
        echo "建議執行: find src -name '*component*'"
    fi
    
    echo "{\"task\": \"$task\", \"status\": \"planning\"}" > "$PLAN_FILE"
    echo -e "\n${YELLOW}👉 規定：在修改任何檔案前，必須先使用 read_file 讀取它。${NC}"
    echo -e "${YELLOW}👉 規定：修改後必須執行 ./scripts/ai-supervisor.sh audit <file>${NC}"
}

# ============================================================================
# 2. 閱讀追蹤 (Read Tracking) - 硬性執法
# ============================================================================
function cmd_log_read() {
    local file="$1"
    if [ -z "$file" ]; then
        error_exit "請提供已閱讀的檔案路徑"
    fi
    # 轉為絕對路徑或相對路徑統一格式
    echo "$file" >> "$READ_LOG"
    echo -e "${GREEN}✅ 已簽發閱讀簽證: $file${NC}"
}

function check_read_visa() {
    local file="$1"
    # 簡單檢查：檔案路徑是否出現在 log 中
    if ! grep -q "$file" "$READ_LOG"; then
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
    local file="$1"
    if [ -z "$file" ]; then
        error_exit "請提供要審計的檔案路徑"
    fi

    # 3.0 硬性檢查閱讀簽證
    check_read_visa "$file"

    print_header "代碼品質嚴格審計: $file"

    # 3.1 檢查偷懶標記
    echo "🔍 檢查偷懶省略..."
    if grep -qE "// \.\.\.|/\* \.\.\.*/|// existing code|// rest of code|// code omitted" "$file"; then
        error_exit "偵測到省略代碼 (如 // ...)。\n請補全完整代碼，禁止偷懶！"
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
        warn "發現 console.log。生產環境代碼應移除。"
    fi

    # 3.4 檢查 TypeScript any
    echo "🔍 檢查 'any' 類型..."
    if grep -q ": any" "$file"; then
        warn "發現 ': any'。請使用具體類型定義。"
        grep -n ": any" "$file" | head -n 5
    fi

    # 3.5 檢查硬編碼 Secrets
    echo "🔍 檢查硬編碼密鑰..."
    if grep -qE "sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9]{20,}" "$file"; then
        error_exit "發現疑似硬編碼的 API Key 或 Token！絕對禁止！"
    fi

    # 3.6 [v2.2 新增] 檢查除錯殘留 (debugger/alert)
    echo "🔍 檢查除錯殘留..."
    if grep -qE "debugger;|alert\(" "$file"; then
        error_exit "發現 debugger 或 alert()！這是開發測試代碼，禁止提交。"
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

    echo -e "${GREEN}✅ 檔案 $file 通過靜態審計。${NC}"
}

# ============================================================================
# 4. 系統驗證 (System Verification)
# ============================================================================
function cmd_verify() {
    print_header "全系統回測驗證"
    
    echo "1️⃣  執行 TypeScript 檢查..."
    if npm run typecheck; then
        echo -e "${GREEN}✅ Type Check Passed${NC}"
    else
        error_exit "Type Check Failed! 你的修改破壞了類型系統。"
    fi

    echo "2️⃣  執行 Build 測試..."
    if npm run build; then
        echo -e "${GREEN}✅ Build Passed${NC}"
    else
        error_exit "Build Failed! 你的修改導致無法構建。"
    fi
}

# ============================================================================
# 主路由
# ============================================================================
case "${1:-}" in
    "init")
        cmd_init
        ;;
    "plan")
        cmd_plan "$2"
        ;;
    "log-read")
        cmd_log_read "$2"
        ;;
    "audit")
        cmd_audit "$2"
        ;;
    "verify")
        cmd_verify
        ;;
    *)
        echo "用法: $0 {init|plan|audit|verify}"
        echo "  init        : 初始化新任務"
        echo "  plan <task> : 規劃任務並掃描檔案"
        echo "  audit <file>: 審計單一檔案品質"
        echo "  verify      : 執行全系統測試"
        exit 1
        ;;
esac
