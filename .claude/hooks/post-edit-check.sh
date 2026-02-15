#!/usr/bin/env bash
# PostToolUse hook: Edit/Write 後強制檢查
# 有違規 → exit 1 阻擋，不是只印警告

FILE=$(echo "$CLAUDE_TOOL_INPUT" | node -e "
  const d = require('fs').readFileSync(0, 'utf8');
  try { console.log(JSON.parse(d).file_path || ''); }
  catch { console.log(''); }
" 2>/dev/null)

if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

if [ ! -f "$FILE" ]; then
  exit 0
fi

FAILED=0

# 1. TypeScript 錯誤（只檢查被改的檔案相關錯誤）
TS_ERRORS=$(npx tsc --noEmit --pretty 2>&1 | grep -A2 "$FILE" | head -20)
if [ -n "$TS_ERRORS" ]; then
  echo "BLOCKED: TypeScript 錯誤（必須修復才能繼續）:"
  echo "$TS_ERRORS"
  FAILED=1
fi

# 2. console.log
HITS=$(grep -nE 'console\.(log|warn|error|info|debug)\(' "$FILE" 2>/dev/null | grep -v '// allowed' | grep -v 'logger\.')
if [ -n "$HITS" ]; then
  echo "BLOCKED: console.log 禁止項:"
  echo "$HITS"
  FAILED=1
fi

# 3. : any
HITS2=$(grep -nE ':\s*any\b' "$FILE" 2>/dev/null)
if [ -n "$HITS2" ]; then
  echo "BLOCKED: : any 禁止項:"
  echo "$HITS2"
  FAILED=1
fi

# 4. inline style
HITS3=$(grep -nE 'style=\{|style="' "$FILE" 2>/dev/null)
if [ -n "$HITS3" ]; then
  echo "BLOCKED: inline style 禁止項:"
  echo "$HITS3"
  FAILED=1
fi

if [ $FAILED -eq 1 ]; then
  echo ""
  echo "=== 以上違規必須修復，不准繼續下一步 ==="
  exit 1
fi
