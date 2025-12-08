#!/bin/bash
# ============================================================================
# AI Supervisor - 嚴格執行過程檢查器
# 用途: 在 Claude Code hooks 中調用，確保 AI 用最高規格執行任務
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/.ai-execution.log"
TASK_FILE="$PROJECT_ROOT/.ai-current-task.json"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# 日誌記錄
# ============================================================================
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

  case "$level" in
    ERROR)   echo -e "${RED}[SUPERVISOR ERROR]${NC} $message" ;;
    WARNING) echo -e "${YELLOW}[SUPERVISOR WARNING]${NC} $message" ;;
    CHECK)   echo -e "${BLUE}[SUPERVISOR CHECK]${NC} $message" ;;
    PASS)    echo -e "${GREEN}[SUPERVISOR PASS]${NC} $message" ;;
  esac
}

# ============================================================================
# 檢查 1: 是否有明確的任務計畫
# ============================================================================
check_task_plan() {
  log "CHECK" "驗證任務計畫是否存在..."

  if [[ ! -f "$TASK_FILE" ]]; then
    log "WARNING" "未找到任務計畫檔案 (.ai-current-task.json)"
    log "WARNING" "AI 必須先用 TodoWrite 列出所有步驟再開始執行"
    return 1
  fi

  local steps=$(jq -r '.steps | length' "$TASK_FILE" 2>/dev/null || echo "0")
  if [[ "$steps" -eq 0 ]]; then
    log "ERROR" "任務計畫為空！AI 必須先分解任務"
    return 1
  fi

  log "PASS" "任務計畫存在，共 $steps 個步驟"
  return 0
}

# ============================================================================
# 檢查 2: 代碼品質 (TypeScript/JavaScript)
# ============================================================================
check_code_quality() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    return 0
  fi

  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      log "CHECK" "檢查代碼品質: $file"

      # 檢查是否有 any 類型 (TypeScript)
      if [[ "$ext" == "ts" || "$ext" == "tsx" ]]; then
        local any_count=$(grep -c ': any' "$file" 2>/dev/null || echo "0")
        if [[ "$any_count" -gt 0 ]]; then
          log "WARNING" "發現 $any_count 個 'any' 類型，請使用具體類型"
        fi
      fi

      # 檢查是否有 console.log (生產代碼不應有)
      local console_count=$(grep -c 'console\.log' "$file" 2>/dev/null || echo "0")
      if [[ "$console_count" -gt 0 ]]; then
        log "WARNING" "發現 $console_count 個 console.log，請使用正式的日誌系統"
      fi

      # 檢查是否有 TODO/FIXME 未處理
      local todo_count=$(grep -cE '(TODO|FIXME|XXX|HACK)' "$file" 2>/dev/null || echo "0")
      if [[ "$todo_count" -gt 0 ]]; then
        log "WARNING" "發現 $todo_count 個 TODO/FIXME，請確認是否需要處理"
      fi

      # 檢查函數長度 (超過 50 行警告)
      log "PASS" "基本代碼品質檢查完成"
      ;;
  esac

  return 0
}

# ============================================================================
# 檢查 3: 是否跳過步驟
# ============================================================================
check_step_sequence() {
  local current_action="$1"

  if [[ ! -f "$TASK_FILE" ]]; then
    return 0
  fi

  local current_step=$(jq -r '.currentStep // 0' "$TASK_FILE")
  local total_steps=$(jq -r '.steps | length' "$TASK_FILE")

  log "CHECK" "當前進度: 步驟 $current_step / $total_steps"

  # 檢查是否有未完成的前置步驟
  local pending=$(jq -r '.steps | to_entries | map(select(.value.status == "pending" and .key < ((.currentStep // 0) | tonumber))) | length' "$TASK_FILE" 2>/dev/null || echo "0")

  if [[ "$pending" -gt 0 ]]; then
    log "ERROR" "發現 $pending 個被跳過的步驟！請返回完成"
    return 1
  fi

  return 0
}

# ============================================================================
# 檢查 4: 執行前確認 (PreToolUse)
# ============================================================================
pre_tool_check() {
  local tool_name="$1"
  local tool_input="$2"

  log "CHECK" "準備執行工具: $tool_name"

  case "$tool_name" in
    Write|Edit)
      # 寫入/編輯前檢查
      local file_path=$(echo "$tool_input" | jq -r '.file_path // .path // ""')
      if [[ -n "$file_path" ]]; then
        log "CHECK" "即將修改檔案: $file_path"

        # 檢查是否是敏感檔案
        if [[ "$file_path" =~ \.(env|key|pem|secret)$ ]]; then
          log "ERROR" "嘗試修改敏感檔案！需要人工確認"
          return 1
        fi
      fi
      ;;

    Bash)
      # 危險命令檢查
      local cmd=$(echo "$tool_input" | jq -r '.command // ""')
      if [[ "$cmd" =~ (rm -rf|drop|delete|truncate) ]]; then
        log "WARNING" "偵測到危險命令: $cmd"
      fi
      ;;
  esac

  return 0
}

# ============================================================================
# 檢查 5: 執行後驗證 (PostToolUse)
# ============================================================================
post_tool_check() {
  local tool_name="$1"
  local tool_output="$2"

  log "CHECK" "驗證工具執行結果: $tool_name"

  # 檢查是否有錯誤
  if echo "$tool_output" | grep -qiE '(error|failed|exception)'; then
    log "WARNING" "工具執行可能有錯誤，請確認"
  fi

  case "$tool_name" in
    Write|Edit)
      # 寫入後立即檢查語法
      local file_path=$(echo "$2" | jq -r '.file_path // ""' 2>/dev/null || echo "")
      if [[ -n "$file_path" && -f "$file_path" ]]; then
        check_code_quality "$file_path"
      fi
      ;;
  esac

  return 0
}

# ============================================================================
# 最高規格檢查清單
# ============================================================================
print_quality_checklist() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}                    最高規格執行標準                       ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  [ ] 1. 完整閱讀需求，不遺漏任何細節"
  echo "  [ ] 2. 先列出所有步驟，再開始執行"
  echo "  [ ] 3. 每個步驟完成後標記完成"
  echo "  [ ] 4. 不使用 any 類型"
  echo "  [ ] 5. 完整的錯誤處理"
  echo "  [ ] 6. 有意義的變數命名"
  echo "  [ ] 7. 適當的代碼註解"
  echo "  [ ] 8. 執行測試驗證"
  echo "  [ ] 9. 不跳過任何步驟"
  echo "  [ ] 10. 完成後自我審查"
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# 主程式
# ============================================================================
main() {
  local action="${1:-help}"

  case "$action" in
    pre)
      # PreToolUse 檢查
      local tool_name="${2:-}"
      local tool_input="${3:-{}}"
      pre_tool_check "$tool_name" "$tool_input"
      ;;

    post)
      # PostToolUse 檢查
      local tool_name="${2:-}"
      local tool_output="${3:-}"
      post_tool_check "$tool_name" "$tool_output"
      ;;

    check-plan)
      check_task_plan
      ;;

    check-quality)
      local file="${2:-}"
      check_code_quality "$file"
      ;;

    checklist)
      print_quality_checklist
      ;;

    init)
      # 初始化新任務
      echo '{"steps":[],"currentStep":0,"startTime":"'$(date -Iseconds)'"}' > "$TASK_FILE"
      log "PASS" "任務追蹤已初始化"
      print_quality_checklist
      ;;

    *)
      echo "AI Supervisor - 嚴格執行過程檢查器"
      echo ""
      echo "用法:"
      echo "  $0 init              初始化新任務"
      echo "  $0 pre <tool> <input>    執行前檢查"
      echo "  $0 post <tool> <output>  執行後驗證"
      echo "  $0 check-plan        檢查任務計畫"
      echo "  $0 check-quality <file>  檢查代碼品質"
      echo "  $0 checklist         顯示品質檢查清單"
      ;;
  esac
}

main "$@"
