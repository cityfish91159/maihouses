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
# 檢查 2: 代碼品質 (TypeScript/JavaScript) - 最高規格
# ============================================================================
check_code_quality() {
  local file="$1"
  local has_error=0

  if [[ ! -f "$file" ]]; then
    return 0
  fi

  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      log "CHECK" "🔍 嚴格檢查代碼品質: $file"

      # 1. 禁止 any 類型 (TypeScript) - 嚴重違規
      if [[ "$ext" == "ts" || "$ext" == "tsx" ]]; then
        local any_matches=$(grep -n ': any' "$file" 2>/dev/null || true)
        if [[ -n "$any_matches" ]]; then
          log "ERROR" "🚨 發現 'any' 類型 - 這是便宜行事！必須定義具體類型"
          echo "$any_matches" | while read line; do
            log "ERROR" "  → $line"
          done
          has_error=1
        fi
      fi

      # 2. 禁止 console.log - 生產代碼不應有
      local console_matches=$(grep -n 'console\.log' "$file" 2>/dev/null || true)
      if [[ -n "$console_matches" ]]; then
        log "ERROR" "🚨 發現 console.log - 必須移除或使用正式 logger"
        echo "$console_matches" | while read line; do
          log "ERROR" "  → $line"
        done
        has_error=1
      fi

      # 3. 禁止 @ts-ignore - 不可隱藏類型錯誤
      local ts_ignore=$(grep -n '@ts-ignore\|@ts-nocheck' "$file" 2>/dev/null || true)
      if [[ -n "$ts_ignore" ]]; then
        log "ERROR" "🚨 發現 @ts-ignore - 必須修復根本問題，不可隱藏錯誤"
        has_error=1
      fi

      # 4. 禁止 eslint-disable - 不可隱藏代碼問題
      local eslint_disable=$(grep -n 'eslint-disable' "$file" 2>/dev/null || true)
      if [[ -n "$eslint_disable" ]]; then
        log "ERROR" "🚨 發現 eslint-disable - 必須修復根本問題"
        has_error=1
      fi

      # 5. 檢查無意義的變數名
      local bad_vars=$(grep -nE '\b(let|const|var)\s+(a|b|x|y|temp|tmp|foo|bar|data|result)\s*[=:]' "$file" 2>/dev/null || true)
      if [[ -n "$bad_vars" ]]; then
        log "WARNING" "⚠️ 發現無意義的變數名 - 請使用有意義的命名"
        echo "$bad_vars" | head -3 | while read line; do
          log "WARNING" "  → $line"
        done
      fi

      # 6. 檢查 TODO/FIXME 未處理
      local todo_count=$(grep -cE '(TODO|FIXME|XXX|HACK)' "$file" 2>/dev/null || echo "0")
      if [[ "$todo_count" -gt 0 ]]; then
        log "WARNING" "⚠️ 發現 $todo_count 個 TODO/FIXME，請確認是否本次應完成"
      fi

      # 7. 檢查是否缺少錯誤處理 (async 函數沒有 try-catch)
      local async_without_try=$(grep -c 'async.*=>' "$file" 2>/dev/null || echo "0")
      local try_count=$(grep -c 'try\s*{' "$file" 2>/dev/null || echo "0")
      if [[ "$async_without_try" -gt "$try_count" ]]; then
        log "WARNING" "⚠️ 可能缺少錯誤處理 - async 函數應有 try-catch"
      fi

      # 8. 檢查硬編碼的數字/字串 (魔術數字)
      local magic_numbers=$(grep -nE '(setTimeout|setInterval)\s*\([^,]+,\s*[0-9]{4,}' "$file" 2>/dev/null || true)
      if [[ -n "$magic_numbers" ]]; then
        log "WARNING" "⚠️ 發現硬編碼的數字 - 考慮使用常數"
      fi

      if [[ "$has_error" -eq 1 ]]; then
        log "ERROR" "❌ 代碼品質檢查失敗 - 必須修復以上問題"
        return 1
      fi

      log "PASS" "✅ 代碼品質檢查通過"
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
# 檢查 6: 編輯後即時檢查 (Post-Edit Real-time Check)
# ============================================================================
post_edit_check() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}         🔍 [監督系統] 編輯後即時品質檢查                    ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # 檢查最近修改的檔案
  local recent_files=$(git diff --name-only HEAD 2>/dev/null | head -5)

  if [[ -z "$recent_files" ]]; then
    recent_files=$(git diff --name-only 2>/dev/null | head -5)
  fi

  local has_issue=0

  if [[ -n "$recent_files" ]]; then
    echo -e "\n📝 檢查最近修改的檔案:"
    for file in $recent_files; do
      if [[ -f "$PROJECT_ROOT/$file" ]]; then
        echo -e "  → $file"
        check_code_quality "$PROJECT_ROOT/$file" || has_issue=1
      fi
    done
  fi

  echo ""
  echo -e "${YELLOW}📋 提醒 AI Agent:${NC}"
  echo "  1. 確認修改符合需求"
  echo "  2. 沒有使用 any 類型"
  echo "  3. 有完整的錯誤處理"
  echo "  4. 變數命名有意義"
  echo ""

  if [[ "$has_issue" -eq 1 ]]; then
    echo -e "${RED}⚠️ 發現品質問題，請立即修正！${NC}"
    return 1
  fi

  return 0
}

# ============================================================================
# 檢查 7: 最終檢查 (Final Check before Stop)
# ============================================================================
final_check() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}         🏁 [監督系統] 任務結束前最終檢查                    ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local all_pass=1

  # 1. 檢查是否有未提交的變更
  local uncommitted=$(git status --porcelain 2>/dev/null | wc -l)
  if [[ "$uncommitted" -gt 0 ]]; then
    echo -e "${YELLOW}⚠️ 有 $uncommitted 個未提交的變更${NC}"
  fi

  # 2. 快速 TypeScript 檢查
  echo -e "\n🔍 執行 TypeScript 類型檢查..."
  if command -v npm &> /dev/null && [[ -f "$PROJECT_ROOT/package.json" ]]; then
    if npm run typecheck --silent 2>/dev/null; then
      echo -e "${GREEN}✅ TypeScript 檢查通過${NC}"
    else
      echo -e "${RED}❌ TypeScript 檢查失敗 - 請修復類型錯誤${NC}"
      all_pass=0
    fi
  fi

  # 3. 檢查所有修改的檔案
  echo -e "\n🔍 檢查所有修改的檔案品質..."
  local changed_files=$(git diff --name-only HEAD~1 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' || true)

  for file in $changed_files; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
      check_code_quality "$PROJECT_ROOT/$file" || all_pass=0
    fi
  done

  # 4. 最終報告
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [[ "$all_pass" -eq 1 ]]; then
    echo -e "${GREEN}✅ 最終檢查通過 - 任務完成${NC}"
  else
    echo -e "${RED}❌ 最終檢查發現問題 - 請在結束前修復${NC}"
    echo ""
    echo -e "${YELLOW}AI Agent 必須:${NC}"
    echo "  1. 修復所有類型錯誤"
    echo "  2. 移除所有 any 類型"
    echo "  3. 確保沒有 console.log"
    echo "  4. 補齊錯誤處理"
  fi

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  return 0
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

    post-edit)
      # 編輯後即時檢查
      post_edit_check
      ;;

    final-check)
      # 最終檢查
      final_check
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
      echo "  $0 init                  初始化新任務"
      echo "  $0 pre <tool> <input>    執行前檢查"
      echo "  $0 post <tool> <output>  執行後驗證"
      echo "  $0 post-edit             編輯後即時檢查"
      echo "  $0 final-check           最終檢查"
      echo "  $0 check-plan            檢查任務計畫"
      echo "  $0 check-quality <file>  檢查代碼品質"
      echo "  $0 checklist             顯示品質檢查清單"
      ;;
  esac
}

main "$@"
