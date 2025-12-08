#!/bin/bash
# ============================================================================
# AI Audit Script - 嚴格代碼審計
# 用途: 在提交前檢查代碼品質，防止便宜行事
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_error() {
  echo -e "${RED}[AUDIT ERROR]${NC} $1"
  ((ERRORS++))
}

log_warning() {
  echo -e "${YELLOW}[AUDIT WARNING]${NC} $1"
  ((WARNINGS++))
}

log_pass() {
  echo -e "${GREEN}[AUDIT PASS]${NC} $1"
}

log_check() {
  echo -e "${BLUE}[AUDIT CHECK]${NC} $1"
}

# ============================================================================
# 檢查 1: 硬編碼顏色 (Hardcoded Colors)
# ============================================================================
check_hardcoded_colors() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    🎨 檢查硬編碼顏色                                        ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # 查找所有 .tsx 和 .ts 文件中的硬編碼顏色
  local hardcoded=$(grep -rn '#[0-9A-Fa-f]\{6\}' "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null || true)

  if [[ -n "$hardcoded" ]]; then
    local count=$(echo "$hardcoded" | wc -l)
    log_error "發現 $count 處硬編碼顏色！"
    echo ""
    echo "應該使用 Tailwind 變數 (brand-*, ink-*) 或 CSS 變數"
    echo ""
    echo "問題檔案："
    echo "$hardcoded" | cut -d: -f1 | sort -u | head -10 | while read file; do
      local file_count=$(echo "$hardcoded" | grep -c "$file" || echo "0")
      echo "  → $file ($file_count 處)"
    done
    echo ""
  else
    log_pass "沒有發現硬編碼顏色"
  fi
}

# ============================================================================
# 檢查 2: any 類型
# ============================================================================
check_any_types() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    📝 檢查 any 類型                                         ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local any_types=$(grep -rn ': any' "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null || true)

  if [[ -n "$any_types" ]]; then
    local count=$(echo "$any_types" | wc -l)
    log_error "發現 $count 處 'any' 類型！這是便宜行事！"
    echo ""
    echo "$any_types" | head -10
    echo ""
  else
    log_pass "沒有發現 any 類型"
  fi
}

# ============================================================================
# 檢查 3: console.log
# ============================================================================
check_console_log() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    🔍 檢查 console.log                                      ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local console_logs=$(grep -rn 'console\.log' "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null || true)

  if [[ -n "$console_logs" ]]; then
    local count=$(echo "$console_logs" | wc -l)
    log_warning "發現 $count 處 console.log"
    echo ""
    echo "$console_logs" | head -10
    echo ""
  else
    log_pass "沒有發現 console.log"
  fi
}

# ============================================================================
# 檢查 4: @ts-ignore 和 eslint-disable
# ============================================================================
check_suppressions() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    🚫 檢查錯誤抑制                                          ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local suppressions=$(grep -rn '@ts-ignore\|@ts-nocheck\|eslint-disable' "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null || true)

  if [[ -n "$suppressions" ]]; then
    local count=$(echo "$suppressions" | wc -l)
    log_error "發現 $count 處錯誤抑制！這是便宜行事！"
    echo ""
    echo "$suppressions"
    echo ""
  else
    log_pass "沒有發現錯誤抑制"
  fi
}

# ============================================================================
# 檢查 5: TODO 任務完成驗證
# ============================================================================
check_todo_completion() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    ✅ 檢查 TODO 任務完成狀態                                ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local todo_file="$PROJECT_ROOT/docs/COMMUNITY_WALL_TODO.md"

  if [[ -f "$todo_file" ]]; then
    # 檢查標記為完成但實際上可能沒完成的任務
    local completed_tasks=$(grep -E '^\| .+ \| ✅' "$todo_file" 2>/dev/null || true)

    if [[ -n "$completed_tasks" ]]; then
      echo "標記為完成的任務："
      echo "$completed_tasks"
      echo ""
      log_warning "請手動驗證以上任務是否真正完成"
    fi

    # 檢查未完成的任務
    local pending_tasks=$(grep -E '^\| .+ \| 🔴' "$todo_file" 2>/dev/null || true)
    if [[ -n "$pending_tasks" ]]; then
      echo "未完成的任務："
      echo "$pending_tasks"
      echo ""
    fi
  fi
}

# ============================================================================
# 檢查 6: 硬編碼字串 (非國際化)
# ============================================================================
check_hardcoded_strings() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    📝 檢查硬編碼中文字串                                    ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # 檢查 JSX 中的硬編碼中文（不在 STRINGS 常數中）
  local hardcoded_cn=$(grep -rn ">[^<]*[\u4e00-\u9fff]" "$PROJECT_ROOT/src" --include="*.tsx" 2>/dev/null | grep -v "STRINGS\." | head -20 || true)

  if [[ -n "$hardcoded_cn" ]]; then
    log_warning "發現可能的硬編碼中文字串（建議使用常數）"
    echo ""
  else
    log_pass "中文字串管理良好"
  fi
}

# ============================================================================
# 檢查 7: 假數據檢測 (Fake Data Detection) - 嚴格！
# ============================================================================
check_fake_data() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    🚨 檢查假數據 (Fake Data)                               ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local fake_data_found=0

  # 1. 檢測 Notification Badge (原子組件不應有業務狀態)
  local notification_badges=$(grep -rn 'Notification Badge\|notification-badge\|badge.*rounded-full' "$PROJECT_ROOT/src/components" --include="*.tsx" 2>/dev/null || true)
  if [[ -n "$notification_badges" ]]; then
    log_error "原子組件中發現 Notification Badge！原子組件不應包含業務狀態"
    echo "$notification_badges"
    echo ""
    fake_data_found=1
  fi

  # 2. 檢測硬編碼數字 (可能是假的計數)
  local hardcoded_counts=$(grep -rn '>\s*[0-9]\+\s*<\|"[0-9]\+"\|count.*[0-9]' "$PROJECT_ROOT/src/components" --include="*.tsx" 2>/dev/null | grep -v 'size=\|width=\|height=\|stroke\|viewBox\|key=\|index\|length\|px\|rem\|em' || true)
  if [[ -n "$hardcoded_counts" ]]; then
    log_warning "可能的硬編碼計數（假數據）:"
    echo "$hardcoded_counts" | head -10
    echo ""
  fi

  # 3. 檢測未連接真實數據的狀態指示器
  local status_indicators=$(grep -rn 'bg-red-\|bg-green-\|bg-yellow-\|bg-\[#FF\|status\|indicator' "$PROJECT_ROOT/src/components" --include="*.tsx" 2>/dev/null | grep -v 'Props\|interface\|type ' || true)
  if [[ -n "$status_indicators" ]]; then
    log_warning "發現狀態指示器，請確認是否連接真實數據:"
    echo "$status_indicators" | head -10
    echo ""
  fi

  # 4. 檢測假的用戶資料
  local fake_users=$(grep -rn 'user.*@\|example\.com\|test@\|demo@\|John Doe\|Jane\|Lorem ipsum' "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null || true)
  if [[ -n "$fake_users" ]]; then
    log_error "發現假用戶資料！生產代碼不應有測試數據"
    echo "$fake_users"
    echo ""
    fake_data_found=1
  fi

  # 5. 檢測 mock 數據
  local mock_data=$(grep -rn 'mock\|Mock\|MOCK\|dummy\|Dummy\|fake\|Fake\|placeholder' "$PROJECT_ROOT/src" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v 'test\|spec\|\.test\.\|\.spec\.' || true)
  if [[ -n "$mock_data" ]]; then
    log_error "發現 mock/dummy/fake 數據在非測試檔案中！"
    echo "$mock_data"
    echo ""
    fake_data_found=1
  fi

  if [[ "$fake_data_found" -eq 0 ]]; then
    log_pass "沒有發現明顯的假數據"
  fi
}

# ============================================================================
# 檢查 8: 特定任務驗證 - Logo 原子素材
# ============================================================================
check_logo_atomic() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    🏠 檢查 Logo 原子素材導入                                ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local logo_file="$PROJECT_ROOT/src/components/Logo/Logo.tsx"

  if [[ -f "$logo_file" ]]; then
    # 檢查是否有硬編碼顏色
    local hardcoded_in_logo=$(grep -n '#[0-9A-Fa-f]\{6\}' "$logo_file" 2>/dev/null || true)

    if [[ -n "$hardcoded_in_logo" ]]; then
      log_error "Logo 組件中發現硬編碼顏色！"
      echo "$hardcoded_in_logo"
      echo ""
      echo "Logo 應該使用 Tailwind CSS 變數 (brand-*, ink-*)"
    else
      log_pass "Logo 組件沒有硬編碼顏色"
    fi

    # 檢查是否有假的通知徽章
    local fake_badge=$(grep -n 'Badge\|badge\|rounded-full.*bg-\[#\|notification' "$logo_file" 2>/dev/null || true)
    if [[ -n "$fake_badge" ]]; then
      log_error "Logo 組件中發現假通知徽章！原子組件不應有業務狀態"
      echo "$fake_badge"
      echo ""
    else
      log_pass "Logo 組件沒有假通知徽章"
    fi

    # 檢查是否使用真正的圖片資源
    local uses_image=$(grep -c 'img\|src=' "$logo_file" 2>/dev/null || echo "0")
    if [[ "$uses_image" -eq 0 ]]; then
      log_warning "Logo 組件沒有使用圖片資源，使用的是手繪 SVG"
    fi
  fi
}

# ============================================================================
# 最終報告
# ============================================================================
final_report() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    📊 審計報告                                              ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [[ "$ERRORS" -gt 0 ]]; then
    echo -e "${RED}❌ 審計失敗！發現 $ERRORS 個錯誤，$WARNINGS 個警告${NC}"
    echo ""
    echo "AI Agent 便宜行事！必須修復以上問題才能提交。"
    echo ""
    exit 1
  elif [[ "$WARNINGS" -gt 0 ]]; then
    echo -e "${YELLOW}⚠️ 審計通過（有警告）：$WARNINGS 個警告${NC}"
    echo ""
  else
    echo -e "${GREEN}✅ 審計通過！代碼品質良好${NC}"
    echo ""
  fi
}

# ============================================================================
# 主程式
# ============================================================================
main() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}    🔍 AI 代碼審計 - 防止便宜行事                            ${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  check_hardcoded_colors
  check_any_types
  check_console_log
  check_suppressions
  check_todo_completion
  check_hardcoded_strings
  check_fake_data
  check_logo_atomic

  final_report
}

main "$@"
