# AI Supervisor 優化清單

> 生成時間: 2025-12-11
> 狀態: 審查完成
> 總問題數: 25+

---

## 🔴 修復優先級

### P0 - 立即修復 (系統完全失效)

| # | 檔案 | 行號 | 問題 |
|---|------|------|------|
| 1 | audit.sh | 741 | 獎勵阻擋只檢查 critical_count，severe 問題仍給獎勵 |
| 2 | watcher.sh | 17, 390 | LAST_HASH="" 導致首輪監控永遠跳過 |
| 3 | watcher.sh | 394, 435 | grep 無 || true，pipefail 退出 |
| 4 | anti-cheat.sh | 64, 72 | 同上 |

### P1 - 儘快修復 (分數計算錯誤)

| # | 檔案 | 行號 | 問題 |
|---|------|------|------|
| 5 | core.sh | 18 | get_score() 可能返回空字串 |
| 6 | core.sh | 41 | delta 空時 -gt 比較崩潰 |
| 7 | audit.sh | 全域 | 獎懲比例失衡，爛代碼可得正分 |
| 8 | watcher.sh | 626-628 | session_start 空時算術崩潰 |

### P2 - 需要修復 (潛在崩潰)

| # | 檔案 | 行號 | 問題 |
|---|------|------|------|
| 9 | core.sh | 119-120 | score 空時比較崩潰 |
| 10 | watcher.sh | 541-543 | score 非數字時比較崩潰 |
| 11 | messages.sh | 50, 56, 72 | 除零錯誤 |

---

## 一、已發現問題

### 1. 致命問題 - 腳本靜默退出 (pipefail)

| 檔案 | 行號 | 問題描述 | 嚴重度 |
|------|------|----------|--------|
| watcher.sh | 394 | `grep -E '\.(ts\|tsx)$'` 無 `\|\| true`，無匹配時 exit 1 導致 pipefail | 致命 |
| watcher.sh | 435 | 同上 | 致命 |
| watcher.sh | 657 | pre-commit hook 內同樣問題 | 致命 |
| anti-cheat.sh | 64 | `grep -E '\.(ts\|tsx)$'` 無 `\|\| true` | 致命 |
| anti-cheat.sh | 72 | 同上 | 致命 |

### 2. 功能失效問題

| 檔案 | 行號 | 問題描述 | 影響 |
|------|------|----------|------|
| watcher.sh | 17, 390 | `LAST_HASH=""` 初始化 + `[ -n "$LAST_HASH" ]` 檢查 = 第一輪監控永遠跳過 | 監控完全失效 |
| core.sh | 18 | `get_score()` 的 `\|\| echo 100` 只在整個 pipe 失敗時觸發，grep 無匹配時返回空字串 | 分數計算錯誤 |

### 3. 邏輯漏洞 - 加減分錯誤

| 檔案 | 行號 | 問題描述 | 後果 |
|------|------|----------|------|
| audit.sh | 741 | 獎勵阻擋只檢查 `critical_count > 0`，不檢查 `severe_count` | 魔術數字等嚴重問題仍可獲得獎勵 |
| audit.sh | 全域 | 獎懲比例失衡：BONUS_PROPER_TYPES=+8, PENALTY_MAGIC_NUMBER=-6 | 寫爛代碼反而可得正分 |

### 4. 潛在崩潰 - 空變數運算

| 檔案 | 行號 | 問題描述 |
|------|------|----------|
| core.sh | 29-30 | `local new_score=$((current_score + delta))` - current_score 可能為空 |
| core.sh | 41 | `[ "$delta" -gt 0 ]` - delta 可能為空或非數字 |
| core.sh | 119-120 | `[ "$score" -lt 80 ]` - score 可能為空 |
| watcher.sh | 336 | 數值比較空變數 |
| watcher.sh | 373-374 | 數值比較空變數 |
| watcher.sh | 452 | `$((SECONDS % 30))` 比較 |
| watcher.sh | 541-543 | 數值比較空變數 |
| watcher.sh | 626, 628-629 | `session_start`/`elapsed` 可能為空導致算術錯誤 |
| messages.sh | 50 | `$((RANDOM % ${#RAGE_MESSAGES[@]}))` - 陣列為空時除零 |
| messages.sh | 56 | 同上 SUPREME_RAGE_MESSAGES |
| messages.sh | 72 | 同上 LESSON_MESSAGES |

---

## 二、審查狀態

- [x] audit.sh (審計邏輯) - 已審查
- [x] core.sh (核心函數) - 已審查
- [x] watcher.sh (即時監控) - 已審查
- [x] anti-cheat.sh (反作弊) - 已審查
- [x] messages.sh (訊息模組) - 已審查
- [x] laziness.sh (偷懶偵測) - 已審查 (無重大問題)
- [ ] ai-supervisor.sh (主入口) - 待審查

---

## 三、詳細審查記錄

---

### audit.sh 審查 (1073+ 行) - 加減分邏輯核心

#### 🔥 致命問題 1: 獎勵阻擋邏輯錯誤 (Line 741)

```bash
# Line 741
if [ "$critical_count" -gt 0 ]; then
    echo -e "${RED}   ⚠️ 有致命錯誤，獎勵不計算！${NC}"
else
    total_penalty=$((total_penalty + total_bonus))  # Line 749
fi
```

**問題**: 只檢查 `critical_count`，不檢查 `severe_count`

**後果**:
1. 魔術數字 → `severe_count++`，`critical_count=0`
2. Line 741 檢查通過（critical_count 不大於 0）
3. **獎勵照給！** Line 749 執行
4. Line 770-775: 即使 `severe_count > 3` 審計失敗，分數已含獎勵

**修復**:
```bash
if [ "$critical_count" -gt 0 ] || [ "$severe_count" -gt 0 ]; then
```

#### 🔥 致命問題 2: 失敗時仍給獎勵 (Line 770-775)

```bash
elif [ "$severe_count" -gt 3 ]; then
    echo -e "${RED}❌ 審計失敗！${NC}"
    update_score $total_penalty "審計失敗"  # total_penalty 已含獎勵！
```

**流程追蹤**:
1. 初始: `total_penalty = 0`
2. 扣分: `total_penalty = -20` (魔術數字 -6, 其他 -14)
3. 獎勵: `total_bonus = +25` (精簡+乾淨+memo等)
4. **Line 749**: `total_penalty = -20 + 25 = +5`
5. **審計失敗，但 update_score(+5)** ← 加分了！

#### 🔥 致命問題 3: 獎懲比例失衡

| 類型 | 分數 | 問題 |
|------|------|------|
| PENALTY_MAGIC_NUMBER | -6 | 魔術數字 |
| BONUS_PROPER_TYPES | +8 | 正確類型 |
| BONUS_CONCISE_FILE | +5 | 精簡檔案 |
| BONUS_SHORT_FUNCTION | +3 | 短函數 |
| BONUS_REACT_MEMO | +5 | memo |
| BONUS_USE_CALLBACK | +5 | useCallback |

**結果**: 一個 50 行的檔案，有魔術數字但用了 memo/useCallback
- 扣分: -6
- 獎勵: +10 + +5 + +5 + +5 = +25 (上限後 +20)
- **淨分: +14 分！寫爛代碼反而加分！**

#### 問題 4: 變數命名誤導

```bash
total_penalty = total_penalty + total_bonus  # Line 749
```

`total_penalty` 名稱暗示「懲罰」，但實際存的是「分數變化」（可正可負）

#### 問題 5: 空變數風險 (Line 591, 652)

```bash
if [ "$console_log" -eq 0 ] 2>/dev/null && ...  # Line 591
if [ "$early_return" -ge 2 ] 2>/dev/null; then  # Line 652
```

`2>/dev/null` 隱藏了錯誤，但若變數為空：
- 比較失敗，條件為 false
- 邏輯錯誤被隱藏

#### 問題 6: grep | tr 的 || echo 0 可能無效

```bash
local any_count=$(grep -c ": any" "$file" 2>/dev/null | tr -d '\n' || echo 0)
```

在 pipefail 下：
- 若 grep 找到 0 個匹配 → 輸出 "0"，exit 0
- 若 grep 找到 N 個匹配 → 輸出 "N"，exit 0
- 若檔案不存在 → grep exit 2，`|| echo 0` 觸發

實際上這部分 OK，但建議改用更清晰的寫法：
```bash
local any_count=$(grep -c ": any" "$file" 2>/dev/null || echo 0)
any_count=${any_count:-0}
```

---

### watcher.sh 審查 (781+ 行)

#### 🔥 致命問題 1: LAST_HASH 初始化導致首輪跳過 (Line 17, 390)

```bash
# Line 17
LAST_HASH=""

# Line 390
if [ "$current_hash" != "$LAST_HASH" ] && [ -n "$LAST_HASH" ]; then
    # 這裡永遠不會在第一輪執行！因為 LAST_HASH 是空的
```

**問題**: `[ -n "$LAST_HASH" ]` 在第一輪永遠為 false

**後果**: 監控啟動後的第一次變化檢測永遠跳過

**修復**:
```bash
# 方案 1: 移除 -n 檢查
if [ "$current_hash" != "$LAST_HASH" ]; then

# 方案 2: 初始化為已知值
LAST_HASH=$(git status --porcelain 2>/dev/null | md5sum | cut -d' ' -f1)
```

#### 🔥 致命問題 2: grep 無 || true 導致 pipefail (Line 394, 435, 657)

```bash
# Line 394
local changed_files=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -E '\.(ts|tsx)$')

# Line 435
local git_changes=$(git status --porcelain 2>/dev/null | grep -E '\.(ts|tsx)$' | wc -l)

# Line 657 (pre-commit hook)
staged_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx)$')
```

**問題**: 若無 .ts/.tsx 檔案，grep 返回 exit 1，pipefail 導致腳本退出

**修復**:
```bash
local changed_files=$(git status --porcelain 2>/dev/null | sed 's/^.. //' | grep -E '\.(ts|tsx)$' || true)
```

#### 問題 3: pre-commit hook 空變數崩潰 (Line 626-628)

```bash
session_start=$(grep -o '"start_time":[0-9]*' "$STATE_DIR/session.json" | cut -d: -f2)
current_time=$(date +%s)
elapsed=$((current_time - session_start))  # session_start 空時崩潰！
```

**修復**:
```bash
session_start=$(grep -o '"start_time":[0-9]*' "$STATE_DIR/session.json" 2>/dev/null | cut -d: -f2 || echo "0")
session_start=${session_start:-0}
```

#### 問題 4: 數值比較空變數 (Line 541-543)

```bash
if [ "$score" != "N/A" ]; then
    [ "$score" -lt 80 ] && score_color="${RED}"        # score 非數字會崩
    [ "$score" -lt 100 ] && [ "$score" -ge 80 ] && ... # 同上
fi
```

**修復**:
```bash
if [[ "$score" =~ ^-?[0-9]+$ ]]; then
    [ "$score" -lt 80 ] && score_color="${RED}"
```

#### 問題 5: pre-commit hook 無 set -e 但檢查不完整

pre-commit hook (Line 557-685) 內的 bash 腳本：
- 沒有 `set -e`，某些命令失敗不會中止
- Line 657 的 grep 失敗會導致 staged_files 為空但不報錯
- 但後續 `if [ -n "$staged_files" ]` 會正確跳過

---

### core.sh 審查 (276 行)

#### 問題 1: get_score() 返回值不可靠 (Line 16-22)

```bash
get_score() {
    if [ -f "$SCORE_FILE" ]; then
        grep -o '"score":[0-9-]*' "$SCORE_FILE" | cut -d: -f2 || echo 100
    else
        echo 100
    fi
}
```

**問題**:
- 正則 `[0-9-]*` 允許負號在任意位置，應該是 `-?[0-9]+`
- 如果 SCORE_FILE 存在但內容損壞（如空檔或格式錯誤），grep 無匹配時 exit 1，`|| echo 100` 會觸發 - 這部分 OK
- 但如果內容是 `{"score":}` (無數字)，grep 不匹配，返回 100 - 這可能隱藏問題

**修復建議**:
```bash
get_score() {
    local score=""
    if [ -f "$SCORE_FILE" ]; then
        score=$(grep -o '"score":-\?[0-9]\+' "$SCORE_FILE" 2>/dev/null | cut -d: -f2)
    fi
    echo "${score:-100}"  # 空則返回 100
}
```

#### 問題 2: update_score() 空變數崩潰 (Line 25-95)

| 行號 | 程式碼 | 問題 |
|------|--------|------|
| 30 | `$((current_score + delta))` | current_score 空時，算術仍可運作（視為 0），但語意錯誤 |
| 41 | `[ "$delta" -gt 0 ]` | delta 空或非數字時崩潰：`[: : integer expression expected` |
| 45 | `[ "$new_score" -lt 90 ]` | new_score 空時崩潰 |
| 53 | `[ "$new_score" -lt "$AUTO_RESTART_THRESHOLD" ]` | 同上 |

**修復建議**:
```bash
local current_score=$(get_score)
current_score=${current_score:-100}
local delta="${1:-0}"
[[ ! "$delta" =~ ^-?[0-9]+$ ]] && delta=0
local new_score=$((current_score + delta))
```

#### 問題 3: grep | cut 無錯誤處理 (Line 107-108, 219, 254-255)

```bash
local task=$(grep -o '"task":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)
local start=$(grep -o '"start_datetime":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)
```

**問題**: 如果 SESSION_FILE 格式錯誤或欄位缺失，pipefail 會導致腳本退出

**修復建議**:
```bash
local task=$(grep -o '"task":"[^"]*"' "$SESSION_FILE" 2>/dev/null | cut -d'"' -f4 || echo "未知")
```

#### 問題 4: realtime_monitor() 數值比較 (Line 117-126)

```bash
local score=$(get_score)
[ "$score" -lt 80 ] && score_color="${RED}"
[ "$score" -lt 100 ] && [ "$score" -ge 80 ] && score_color="${YELLOW}"
local to_death=$((score - 80))
[ "$to_death" -le 20 ] && ...
```

**問題**: 如果 score 非數字或空，所有比較都會崩潰

#### 問題 5: check_session() 扣分邏輯 (Line 160-169)

```bash
if [ ! -f "$SESSION_FILE" ]; then
    ...
    update_score -20 "未啟動 Session 就操作"
    exit 1
fi
```

**問題**: 如果沒有 Session 也沒有 SCORE_FILE，會建立新的 SCORE_FILE (100-20=80)，但這不是有效的 Session 狀態

#### 問題 6: finish_session() 數值比較 (Line 237-242)

```bash
if [ "$score" -ge 90 ]; then
    echo -e "${GREEN}🏆 優秀！${NC}"
elif [ "$score" -ge 80 ]; then
```

**問題**: score 空時崩潰

---

### anti-cheat.sh 審查 (444 行)

#### 🔥 致命問題 1: grep 無 || true (Line 64, 72)

```bash
# Line 64
local untracked=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '\.(ts|tsx)$')

# Line 72
local modified=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx)$')
```

**問題**: 若無 .ts/.tsx 檔案，grep 返回 exit 1，pipefail 導致腳本退出

**修復**:
```bash
local untracked=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '\.(ts|tsx)$' || true)
```

#### 問題 2: detect_no_verify 誤報 (Line 118-124)

```bash
if [ -f "$HOME/.bash_history" ]; then
    local no_verify_count=$(grep -c "\-\-no-verify" "$HOME/.bash_history" 2>/dev/null || true)
    if [ -n "$no_verify_count" ] && [ "$no_verify_count" -gt 0 ]; then
        detected=1
    fi
fi
```

**問題**: 檢查整個 bash history，包含舊的合法使用（如管理員維護），會誤報

**建議**: 只檢查最近 N 條記錄，或在 session 期間檢查

---

### messages.sh 審查 (175 行)

#### 🔥 致命問題 1: 除零錯誤 (Line 50, 56, 72)

```bash
# Line 50
local idx=$((RANDOM % ${#RAGE_MESSAGES[@]}))

# Line 56
local idx=$((RANDOM % ${#SUPREME_RAGE_MESSAGES[@]}))

# Line 72
local idx=$((RANDOM % ${#LESSON_MESSAGES[@]}))
```

**問題**: 若陣列為空，`${#ARRAY[@]}` 返回 0，導致除零錯誤

**修復**:
```bash
print_rage() {
    local count=${#RAGE_MESSAGES[@]}
    [ "$count" -eq 0 ] && return
    local idx=$((RANDOM % count))
    echo -e "${BG_RED}${WHITE}${RAGE_MESSAGES[$idx]}${NC}"
}
```

---

### laziness.sh 審查 (94 行)

**結論**: 無重大問題

所有 grep 都在 `if` 條件內，不會觸發 pipefail 退出。

---

