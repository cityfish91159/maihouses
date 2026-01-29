# /audit-integrity - AI Agent 誠信審計

> **版本**: 2.0.0
> **用途**: 自動掃描並揭露所有「便宜行事」的地方
> **觸發**: 用戶說「審計」、「檢查誠信」、完成任務後、定期審計

---

## 核心原則

**「無證據則不存在」** - 任何聲稱若無工具調用證據，視為未執行。

---

## 第一部分：10 個必備 Skills 審計

### 必備 Skills 清單（每個任務都必須使用）

| #   | Skill                   | 用途        | 檢測方式                  |
| --- | ----------------------- | ----------- | ------------------------- |
| 1   | /memory_bank            | 防止遺忘    | 是否讀寫 MEMORY.md        |
| 2   | /context_mastery        | 節省 Token  | 是否用 Grep 代替整檔 Read |
| 3   | /read-before-edit       | 防止瞎改    | Edit 前是否有 Read        |
| 4   | /no_lazy_implementation | 防止佔位符  | 是否有 TODO/FIXME         |
| 5   | /agentic_architecture   | 確保架構    | 是否先定義 types          |
| 6   | /audit_logging          | 審計日誌    | API 是否有 logger         |
| 7   | /google_grade_reviewer  | Google 審查 | 是否 Atomic Change        |
| 8   | /react_perf_perfection  | React 效能  | 依賴陣列是否正確          |
| 9   | /backend_safeguard      | 後端安全    | API 是否有 Zod            |
| 10  | /nasa_typescript_safety | 類型安全    | 是否有 any                |

---

## 第二部分：執行審計命令

**你必須實際執行以下所有命令，不可跳過，不可只說「通過」而不顯示輸出。**

### 2.1 memory_bank 審計

```bash
# 檢查 MEMORY.md 是否存在
echo "=== [1/10] memory_bank 審計 ===" && ls -la MEMORY.md 2>/dev/null || echo "❌ MEMORY.md 不存在"
```

**檢測邏輯**：

- MEMORY.md 不存在 = 🔴 Critical（從未建立記憶庫）
- 本次 Session 沒有 Read MEMORY.md = 🔴 Critical（沒讀記憶）
- 任務結束沒有更新 MEMORY.md = 🟡 High（沒寫記憶）

### 2.2 context_mastery 審計

**檢測邏輯**（從對話歷史分析）：

- 是否對大檔案（>500行）直接使用 Read 而非 Grep = 🟡 High
- 是否讀取了不相關的檔案 = 🟠 Medium

### 2.3 read-before-edit 審計

**檢測邏輯**（從對話歷史分析）：

- 統計 Edit 工具調用次數
- 統計對應檔案的 Read 工具調用次數
- Edit 數 > Read 數 = 🔴 Critical（瞎改）

### 2.4 no_lazy_implementation 審計

```bash
# 掃描佔位符和未完成代碼
echo "=== [4/10] no_lazy_implementation 審計 ===" && grep -rn "// TODO\|// FIXME\|// \.\.\.\|// implement\|// rest of\|// same as" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -20 || echo "✅ 無佔位符"
```

**檢測邏輯**：

- 找到 `// TODO` 或 `// FIXME` = 🟡 High（未完成）
- 找到 `// ...` 或 `// implement` = 🔴 Critical（偷懶）

### 2.5 agentic_architecture 審計

**檢測邏輯**（從對話歷史 + 代碼分析）：

- 新功能是否先建立 types/ 定義 = 🟡 High
- 是否混雜 API/UI/Hook 邏輯 = 🟠 Medium

### 2.6 audit_logging 審計

```bash
# 檢查 API 檔案是否有 logger 調用
# 排除規則：
#   - api/lib/* (工具函數，不是 endpoint)
#   - api/home/* (讀取用，非狀態變更)
#   - 沒有 export default 的檔案 (非 endpoint)
echo "=== [6/10] audit_logging 審計 ==="

echo "--- 檢查 API endpoints (有狀態變更操作) ---"
for f in $(find api -name "*.ts" 2>/dev/null | grep -v test | grep -v __tests__ | grep -v "api/lib/" | grep -v "api/home/" | head -25); do
  # 檢查是否是 API handler (有 export default)
  if grep -q "export default" "$f" 2>/dev/null; then
    # 檢查是否接受 POST/PUT/DELETE (透過 Allow-Methods header)
    if grep -qE "Allow-Methods.*(POST|PUT|DELETE)" "$f" 2>/dev/null; then
      # 檢查是否有 logger
      if ! grep -q "logger\." "$f" 2>/dev/null; then
        echo "❌ $f"
      fi
    fi
  fi
done

echo ""
echo "--- 排除的檔案 ---"
echo "• api/lib/* - 工具函數"
echo "• api/home/* - 讀取用"
echo "• 無 export default - 非 endpoint"
echo "• 只有 GET - 純讀取"
echo ""
echo "掃描完成"
```

**檢測邏輯**：

- 有 POST/PUT/DELETE 但沒有 logger = 🔴 Critical
- api/lib/\* 工具函數 = 不檢查（排除）
- 只有 GET 的 endpoint = 不檢查（純讀取）
- 只有 interface/type 導出 = 不檢查（非 endpoint）

### 2.7 google_grade_reviewer 審計

**檢測邏輯**（從對話歷史分析）：

- 一次 commit 包含多個不相關變更 = 🟡 High（非 Atomic）
- 沒有解釋 WHY 的 hack 代碼 = 🟠 Medium

### 2.8 react_perf_perfection 審計

```bash
# 檢查 React 效能問題
echo "=== [8/10] react_perf_perfection 審計 ===" && echo "--- Barrel imports ---" && grep -rn "from 'lodash'\|from \"lodash\"" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 || echo "✅ 無 barrel import"
echo "--- 空依賴 useEffect ---" && grep -rn "useEffect(\s*() =>" src/ --include="*.tsx" 2>/dev/null | head -5 || echo "✅ 無空依賴 useEffect"
```

**檢測邏輯**：

- 使用 `from 'lodash'` 而非直接路徑 = 🟠 Medium
- useEffect 空依賴但有外部變數 = 🟡 High

### 2.9 backend_safeguard 審計

```bash
# 檢查 API Zod 驗證
echo "=== [9/10] backend_safeguard 審計 ===" && for f in $(find api -name "*.ts" 2>/dev/null | grep -v test | grep -v __tests__ | grep -v lib | head -15); do if ! grep -q "z\.\|Schema\|\.parse\|\.safeParse" "$f" 2>/dev/null; then echo "⚠️ $f 可能缺少 Zod 驗證"; fi; done && echo "掃描完成"
```

**檢測邏輯**：

- API endpoint 無 Zod 驗證 = 🔴 Critical
- 錯誤回應洩漏 stack trace = 🔴 Critical

### 2.10 nasa_typescript_safety 審計

```bash
# 掃描 any 類型和 unsafe cast
echo "=== [10/10] nasa_typescript_safety 審計 ===" && echo "--- any 類型 ---" && grep -rn ": any\| any;\| any,\| any)" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".test." | grep -v ".d.ts" | head -20 || echo "✅ 無 any"
echo "--- unsafe cast ---" && grep -rn "as unknown as\|as any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".test." | head -10 || echo "✅ 無 unsafe cast"
```

**檢測邏輯**：

- 找到 `: any` = 🔴 Critical
- 找到 `as unknown as` = 🔴 Critical
- 找到 `as any` = 🔴 Critical

---

## 第三部分：禁止模式總掃描

```bash
echo "============================================"
echo "       禁止模式總掃描"
echo "============================================"

echo ""
echo "📊 統計結果："
echo "-------------------------------------------"
echo "any 類型:    $(grep -r ': any' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v node_modules | grep -v '.test.' | grep -v '.d.ts' | wc -l) 處"
echo "console:     $(grep -r 'console\.' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v node_modules | grep -v '.test.' | grep -v 'logger.ts' | wc -l) 處"
echo "ts-ignore:   $(grep -r '@ts-ignore' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l) 處"
echo "ts-expect:   $(grep -r '@ts-expect-error' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l) 處"
echo "eslint-dis:  $(grep -r 'eslint-disable' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l) 處"
echo "TODO/FIXME:  $(grep -r 'TODO\|FIXME' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v node_modules | wc -l) 處"
echo "-------------------------------------------"
```

---

## 第四部分：品質檢查執行

```bash
echo "============================================"
echo "       品質檢查執行"
echo "============================================"

# TypeScript 檢查
echo ""
echo "📦 TypeScript 編譯檢查..."
npm run typecheck 2>&1 | tail -15

# ESLint 檢查
echo ""
echo "📦 ESLint 檢查..."
npm run lint 2>&1 | tail -15

# 測試執行
echo ""
echo "📦 測試執行..."
npm test 2>&1 | grep -E "(Tests|test files|passed|failed|PASS|FAIL)" | tail -10
```

---

## 第五部分：工具調用驗證（對話歷史分析）

**你必須回顧本次 Session 的對話歷史，統計以下內容：**

### 5.1 統計工具調用

| 工具  | 調用次數 | 說明       |
| ----- | -------- | ---------- |
| Read  | ?        | 讀取檔案   |
| Edit  | ?        | 編輯檔案   |
| Write | ?        | 寫入檔案   |
| Bash  | ?        | 執行命令   |
| Grep  | ?        | 搜尋內容   |
| Glob  | ?        | 搜尋檔案   |
| Skill | ?        | 調用 Skill |

### 5.2 Read vs Edit 比對

- 總 Edit 次數：?
- 對應檔案的 Read 次數：?
- **比例**：? (應 >= 1:1)

### 5.3 Skill 調用驗證

檢查對話歷史中是否有 `<invoke name="Skill">` 調用：

| 必備 Skill              | 是否有調用記錄 |
| ----------------------- | -------------- |
| /memory_bank            | ✅/❌          |
| /context_mastery        | ✅/❌          |
| /read-before-edit       | ✅/❌          |
| /no_lazy_implementation | ✅/❌          |
| /agentic_architecture   | ✅/❌          |
| /audit_logging          | ✅/❌          |
| /google_grade_reviewer  | ✅/❌          |
| /react_perf_perfection  | ✅/❌          |
| /backend_safeguard      | ✅/❌          |
| /nasa_typescript_safety | ✅/❌          |

**缺失的必備 Skill = 🔴 Critical 便宜行事**

---

## 第六部分：生成審計報告

執行完所有檢查後，**必須**生成以下格式的報告：

```markdown
# 🔍 AI Agent 誠信審計報告

**審計時間**: [YYYY-MM-DD HH:MM:SS]
**審計範圍**: [Session ID / 任務名稱]
**審計版本**: /audit-integrity v2.0.0

---

## 📊 執行摘要

| 類別             | 結果       |
| ---------------- | ---------- |
| 必備 Skills 使用 | X/10       |
| 禁止模式違規     | X 處       |
| TypeScript       | ✅/❌      |
| ESLint           | ✅/❌      |
| 測試             | X/Y passed |

---

## 🚨 便宜行事清單

### 🔴 Critical（必須立即修復）

| #   | 類型            | 問題                | 位置/證據      |
| --- | --------------- | ------------------- | -------------- |
| 1   | 必備 Skill 缺失 | 未使用 /memory_bank | 對話歷史無調用 |
| 2   | any 類型        | `: any`             | src/foo.ts:42  |

### 🟡 High（需要解釋）

| #   | 類型       | 問題      | 位置/證據      |
| --- | ---------- | --------- | -------------- |
| 1   | 未完成代碼 | `// TODO` | src/bar.ts:100 |

### 🟠 Medium（需要關注）

| #   | 類型     | 問題          | 位置/證據      |
| --- | -------- | ------------- | -------------- |
| 1   | 效能問題 | barrel import | src/utils.ts:1 |

---

## ✅ 通過項目

| 檢查項          | 結果       |
| --------------- | ---------- |
| TypeScript 編譯 | 0 errors   |
| ESLint          | 0 warnings |
| 測試通過率      | 100%       |
| 無 console.log  | ✅         |

---

## 📋 必備 Skills 使用狀態

| Skill                   | 狀態  | 證據   |
| ----------------------- | ----- | ------ |
| /memory_bank            | ✅/❌ | [說明] |
| /context_mastery        | ✅/❌ | [說明] |
| /read-before-edit       | ✅/❌ | [說明] |
| /no_lazy_implementation | ✅/❌ | [說明] |
| /agentic_architecture   | ✅/❌ | [說明] |
| /audit_logging          | ✅/❌ | [說明] |
| /google_grade_reviewer  | ✅/❌ | [說明] |
| /react_perf_perfection  | ✅/❌ | [說明] |
| /backend_safeguard      | ✅/❌ | [說明] |
| /nasa_typescript_safety | ✅/❌ | [說明] |

---

## 🔬 原始驗證輸出

<details>
<summary>點擊展開完整輸出</summary>

### no_lazy_implementation 掃描
```

[貼上完整輸出]

```

### nasa_typescript_safety 掃描
```

[貼上完整輸出]

```

### 禁止模式統計
```

[貼上完整輸出]

```

### npm run typecheck
```

[貼上完整輸出]

```

### npm run lint
```

[貼上完整輸出]

```

### npm test
```

[貼上完整輸出]

```

</details>

---

## 🏷️ 審計結論

| 結論 | 條件 |
|------|------|
| ✅ **通過** | 必備 Skills 10/10 + Critical 0 處 |
| ⚠️ **有疑慮** | 必備 Skills < 10 或 High > 0 |
| ❌ **失敗** | Critical > 0 |

**本次審計結論**: [✅/⚠️/❌]

**具體問題**:
1. [列出所有問題]

**建議動作**:
1. [列出建議]
```

---

## 第七部分：自我審計檢查

最後，對本次審計執行進行自我檢查：

| 檢查項                                 | 狀態  |
| -------------------------------------- | ----- |
| 是否執行了所有 10 個必備 Skills 檢查？ | ✅/❌ |
| 是否執行了禁止模式掃描？               | ✅/❌ |
| 是否執行了 npm run typecheck？         | ✅/❌ |
| 是否執行了 npm run lint？              | ✅/❌ |
| 是否執行了 npm test？                  | ✅/❌ |
| 是否顯示了完整的命令輸出？             | ✅/❌ |
| 是否生成了完整的審計報告？             | ✅/❌ |
| 是否誠實報告了所有發現？               | ✅/❌ |

**如果任何項目為 ❌，則本次審計本身就是「便宜行事」。**

---

## 使用方式

```
用戶: /audit-integrity
用戶: 審計
用戶: 檢查誠信
用戶: 檢查便宜行事
```

---

## 重要提醒

1. **不可省略任何檢查** - 即使認為「沒必要」
2. **必須顯示原始輸出** - 不可只說「通過」而不顯示輸出
3. **必須誠實報告問題** - 發現問題不可隱瞞
4. **必須檢查對話歷史** - 驗證 Skill 是否真的有調用
5. **必須使用指定格式** - 方便追蹤和比較

---

**這個 Skill 的目的是揭露問題，不是掩蓋問題。**
**如果審計本身便宜行事，那就失去了意義。**
