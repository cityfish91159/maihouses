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
READ_TRACKING_FILE="$PROJECT_ROOT/.ai-read-files.log"

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
    BLOCK)   echo -e "${RED}[SUPERVISOR BLOCK]${NC} $message" ;;
  esac
}

# ============================================================================
# 強制先讀後寫機制 (Read Before Write Enforcement)
# ============================================================================

# 記錄已讀取的檔案
record_file_read() {
  local file_path="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  # 標準化路徑
  local normalized_path=$(realpath "$file_path" 2>/dev/null || echo "$file_path")

  # 記錄到追蹤檔案
  echo "[$timestamp] READ: $normalized_path" >> "$READ_TRACKING_FILE"
  log "PASS" "📖 已記錄閱讀: $file_path"
}

# 檢查檔案是否已被讀取
check_file_was_read() {
  local file_path="$1"

  # 標準化路徑
  local normalized_path=$(realpath "$file_path" 2>/dev/null || echo "$file_path")
  local filename=$(basename "$file_path")

  # 如果追蹤檔案不存在，表示沒有讀取任何檔案
  if [[ ! -f "$READ_TRACKING_FILE" ]]; then
    return 1
  fi

  # 檢查是否有讀取記錄 (檢查完整路徑或檔名)
  if grep -q "READ:.*$filename" "$READ_TRACKING_FILE" 2>/dev/null; then
    return 0
  fi

  return 1
}

# 獲取相關檔案清單 (前後端相關檔案)
get_related_files() {
  local file_path="$1"
  local filename=$(basename "$file_path")
  local dirname=$(dirname "$file_path")
  local name_without_ext="${filename%.*}"

  echo ""
  echo -e "${BLUE}📁 相關檔案建議閱讀清單:${NC}"

  # 1. 同目錄下的 index 檔案
  if [[ -f "$dirname/index.ts" ]]; then
    echo "  → $dirname/index.ts"
  fi
  if [[ -f "$dirname/index.tsx" ]]; then
    echo "  → $dirname/index.tsx"
  fi

  # 2. 相關的類型定義檔案
  if [[ -f "$dirname/types.ts" ]]; then
    echo "  → $dirname/types.ts"
  fi
  if [[ -f "$dirname/${name_without_ext}.types.ts" ]]; then
    echo "  → $dirname/${name_without_ext}.types.ts"
  fi

  # 3. 相關的測試檔案
  if [[ -f "$dirname/${name_without_ext}.test.ts" ]]; then
    echo "  → $dirname/${name_without_ext}.test.ts"
  fi
  if [[ -f "$dirname/${name_without_ext}.test.tsx" ]]; then
    echo "  → $dirname/${name_without_ext}.test.tsx"
  fi

  # 4. 如果是組件，檢查相關的 hooks 和 utils
  if [[ "$file_path" =~ components ]]; then
    local hooks_dir="${dirname/components/hooks}"
    if [[ -d "$hooks_dir" ]]; then
      echo "  → $hooks_dir/ (相關 hooks)"
    fi
  fi

  # 5. 如果是頁面，檢查相關的 API 路由
  if [[ "$file_path" =~ pages ]]; then
    echo "  → src/api/ (相關 API)"
    echo "  → src/services/ (相關服務)"
  fi

  echo ""
}

# 強制先讀後寫檢查
enforce_read_before_write() {
  local file_path="$1"
  local tool_name="$2"

  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}    🚨 [監督系統] 強制先讀後寫檢查                          ${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if check_file_was_read "$file_path"; then
    log "PASS" "✅ 檔案已讀取，允許 $tool_name: $file_path"
    return 0
  else
    log "BLOCK" "🚫 禁止 $tool_name！必須先 Read 檔案: $file_path"
    echo ""
    echo -e "${RED}❌ 操作被阻止！${NC}"
    echo ""
    echo -e "${YELLOW}AI Agent 違反規則：嘗試修改未閱讀的檔案${NC}"
    echo ""
    echo "必須執行以下步驟："
    echo "  1. 先使用 Read 工具閱讀: $file_path"
    echo "  2. 理解現有代碼結構和邏輯"
    echo "  3. 確認修改位置和影響範圍"
    echo "  4. 然後才能執行 $tool_name"

    get_related_files "$file_path"

    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # 返回錯誤碼，阻止操作
    return 1
  fi
}

# 清除讀取記錄 (新任務開始時)
clear_read_tracking() {
  if [[ -f "$READ_TRACKING_FILE" ]]; then
    rm -f "$READ_TRACKING_FILE"
  fi
  log "PASS" "🔄 已清除讀取追蹤記錄"
}

# ============================================================================
# 強制任務計劃 - 必須先列出要修改的檔案
# ============================================================================
TASK_PLAN_FILE="$PROJECT_ROOT/.ai-task-plan.json"

# 檢查是否有任務計劃
check_task_plan_exists() {
  if [[ ! -f "$TASK_PLAN_FILE" ]]; then
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}    🚨 [監督系統] 缺少任務計劃！                            ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}AI Agent 必須在開始前：${NC}"
    echo ""
    echo "  1. 完整理解用戶需求"
    echo "  2. 列出所有需要修改的檔案"
    echo "  3. 說明每個檔案的修改原因"
    echo "  4. 確認前後端相關檔案都已識別"
    echo ""
    echo -e "${BLUE}範例任務計劃格式：${NC}"
    echo '  {'
    echo '    "task": "實作用戶登入功能",'
    echo '    "files_to_modify": ['
    echo '      {"path": "src/pages/Login.tsx", "reason": "新增登入表單"},'
    echo '      {"path": "src/api/auth.ts", "reason": "新增登入 API 呼叫"},'
    echo '      {"path": "src/types/auth.ts", "reason": "定義登入相關類型"}'
    echo '    ],'
    echo '    "files_to_read": ['
    echo '      "src/context/AuthContext.tsx",'
    echo '      "src/hooks/useAuth.ts"'
    echo '    ]'
    echo '  }'
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    return 1
  fi
  return 0
}

# 驗證要修改的檔案是否在計劃中
validate_file_in_plan() {
  local file_path="$1"
  local filename=$(basename "$file_path")

  if [[ ! -f "$TASK_PLAN_FILE" ]]; then
    return 1
  fi

  # 檢查檔案是否在計劃的修改清單中
  if jq -e ".files_to_modify[] | select(.path | contains(\"$filename\"))" "$TASK_PLAN_FILE" > /dev/null 2>&1; then
    return 0
  fi

  return 1
}

# 顯示任務計劃
show_task_plan() {
  if [[ -f "$TASK_PLAN_FILE" ]]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}    📋 當前任務計劃                                        ${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    local task=$(jq -r '.task // "未定義"' "$TASK_PLAN_FILE")
    echo -e "任務: ${GREEN}$task${NC}"
    echo ""

    echo -e "${YELLOW}需要修改的檔案:${NC}"
    jq -r '.files_to_modify[]? | "  → \(.path) - \(.reason)"' "$TASK_PLAN_FILE" 2>/dev/null || echo "  (無)"
    echo ""

    echo -e "${YELLOW}需要閱讀的檔案:${NC}"
    jq -r '.files_to_read[]? | "  → \(.)"' "$TASK_PLAN_FILE" 2>/dev/null || echo "  (無)"
    echo ""

    # 檢查哪些檔案已讀取
    echo -e "${YELLOW}閱讀進度:${NC}"
    local files_to_read=$(jq -r '.files_to_read[]?' "$TASK_PLAN_FILE" 2>/dev/null)
    local files_to_modify=$(jq -r '.files_to_modify[].path?' "$TASK_PLAN_FILE" 2>/dev/null)
    local all_files="$files_to_read $files_to_modify"

    for file in $all_files; do
      local filename=$(basename "$file")
      if check_file_was_read "$file"; then
        echo -e "  ✅ $file"
      else
        echo -e "  ❌ $file ${RED}(未讀取)${NC}"
      fi
    done

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  fi
}

# 檢查是否所有計劃中的檔案都已讀取
check_all_planned_files_read() {
  if [[ ! -f "$TASK_PLAN_FILE" ]]; then
    return 1
  fi

  local all_read=1
  local files_to_read=$(jq -r '.files_to_read[]?' "$TASK_PLAN_FILE" 2>/dev/null)
  local files_to_modify=$(jq -r '.files_to_modify[].path?' "$TASK_PLAN_FILE" 2>/dev/null)

  # 檢查 files_to_read
  for file in $files_to_read; do
    if ! check_file_was_read "$file"; then
      all_read=0
      log "WARNING" "計劃中的檔案未讀取: $file"
    fi
  done

  # 檢查 files_to_modify
  for file in $files_to_modify; do
    if ! check_file_was_read "$file"; then
      all_read=0
      log "WARNING" "要修改的檔案未讀取: $file"
    fi
  done

  return $((1 - all_read))
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

    # === 強制先讀後寫相關命令 ===

    record-read)
      # 記錄檔案已讀取
      local file_path="${2:-}"
      if [[ -n "$file_path" ]]; then
        record_file_read "$file_path"
      fi
      ;;

    check-read)
      # 檢查檔案是否已讀取
      local file_path="${2:-}"
      if check_file_was_read "$file_path"; then
        echo -e "${GREEN}✅ 檔案已讀取: $file_path${NC}"
      else
        echo -e "${RED}❌ 檔案未讀取: $file_path${NC}"
        exit 1
      fi
      ;;

    enforce-read)
      # 強制先讀後寫檢查
      local file_path="${2:-}"
      local tool_name="${3:-Edit}"
      enforce_read_before_write "$file_path" "$tool_name"
      ;;

    show-plan)
      # 顯示任務計劃和閱讀進度
      show_task_plan
      ;;

    check-all-read)
      # 檢查所有計劃中的檔案是否已讀取
      if check_all_planned_files_read; then
        echo -e "${GREEN}✅ 所有計劃中的檔案都已讀取${NC}"
      else
        echo -e "${RED}❌ 還有檔案未讀取${NC}"
        show_task_plan
        exit 1
      fi
      ;;

    # === 原有命令 ===

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
      # 初始化新任務 - 清除所有追蹤記錄
      clear_read_tracking
      echo '{"steps":[],"currentStep":0,"startTime":"'$(date -Iseconds)'"}' > "$TASK_FILE"
      rm -f "$TASK_PLAN_FILE" 2>/dev/null || true
      log "PASS" "🔄 任務追蹤已初始化"
      echo ""
      echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${BLUE}    🚀 新任務開始 - AI Agent 必須遵守以下流程              ${NC}"
      echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo ""
      echo "  1️⃣  完整理解用戶需求，不清楚就問"
      echo "  2️⃣  列出所有要修改的檔案和原因"
      echo "  3️⃣  先 Read 所有相關檔案（前端+後端+類型）"
      echo "  4️⃣  確認理解後才能開始 Edit/Write"
      echo "  5️⃣  每完成一步就標記完成"
      echo "  6️⃣  最後執行驗證（typecheck, lint, test）"
      echo ""
      echo -e "${YELLOW}⚠️  禁止：跳過步驟、腦補需求、便宜行事、偷懶省略${NC}"
      echo ""
      echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      ;;

    *)
      echo "AI Supervisor - 嚴格執行過程檢查器 v2.0"
      echo ""
      echo "用法:"
      echo ""
      echo "  任務管理:"
      echo "    $0 init                    初始化新任務（清除所有記錄）"
      echo "    $0 show-plan               顯示任務計劃和閱讀進度"
      echo "    $0 checklist               顯示品質檢查清單"
      echo ""
      echo "  先讀後寫強制機制:"
      echo "    $0 record-read <file>      記錄檔案已讀取"
      echo "    $0 check-read <file>       檢查檔案是否已讀取"
      echo "    $0 enforce-read <file>     強制先讀後寫檢查"
      echo "    $0 check-all-read          檢查所有計劃檔案是否已讀取"
      echo ""
      echo "  品質檢查:"
      echo "    $0 check-quality <file>    檢查代碼品質"
      echo "    $0 post-edit               編輯後即時檢查"
      echo "    $0 final-check             最終檢查"
      echo ""
      echo "  Hook 觸發:"
      echo "    $0 pre <tool> <input>      執行前檢查"
      echo "    $0 post <tool> <output>    執行後驗證"
      ;;
  esac
}

main "$@"
