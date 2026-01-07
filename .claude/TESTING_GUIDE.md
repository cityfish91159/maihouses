# Skills & MCP 測試指南

這個文檔提供完整的測試步驟，驗證 Claude Skills 和 MCP Servers 是否正確配置並可用。

---

## 🧪 快速測試清單

### ✅ 基礎檢查

```bash
# 1. 檢查 Skills 目錄結構
ls -la .claude/skills/

# 2. 檢查 settings.json 權限
grep -A 3 "permissions" .claude/settings.json

# 3. 檢查 MCP 配置
cat .mcp.json

# 4. 檢查所有 SKILL.md frontmatter
head -n 5 .claude/skills/*/SKILL.md
```

**預期結果：**

- ✅ skills 目錄存在，包含 4 個 skill 資料夾
- ✅ settings.json 包含 `"allow": ["Skill"]`
- ✅ .mcp.json 包含 4 個 MCP servers
- ✅ 每個 SKILL.md 有正確的 YAML frontmatter

---

## 🎯 測試 Skills

### 測試 1: code-validator Skill

**測試方法 1 - 創建測試檔案:**

```bash
# 創建一個有問題的測試檔案
cat > /tmp/test-bad-code.ts << 'EOF'
function test(data: any) {
  console.log(data)
  return data
}
EOF
```

**測試對話:**

```
您對 Claude 說：
「請審查 /tmp/test-bad-code.ts 的代碼品質」

預期 Claude 的行為：
✓ 自動使用 code-validator skill
✓ Read 檔案
✓ Grep 搜尋禁止模式
✓ 發現問題：
  - 使用了 any 類型
  - 使用了 console.log
✓ 提供修復建議
```

**測試方法 2 - 審查現有檔案:**

```
您對 Claude 說：
「幫我檢查 src/components/ 下的代碼品質」

預期：
✓ 自動使用 code-validator skill
✓ 列出所有檢查項目
✓ 回報完整的驗證報告
```

---

### 測試 2: type-checker Skill

**測試方法 1 - 執行 typecheck:**

```
您對 Claude 說：
「執行 TypeScript 類型檢查」

預期：
✓ 自動使用 type-checker skill
✓ 執行 npm run typecheck
✓ 分析錯誤（如果有）
✓ 提供修復建議
```

**測試方法 2 - 修復類型錯誤:**

```
您對 Claude 說：
「這個檔案有類型錯誤，幫我修復」

預期：
✓ 自動使用 type-checker skill
✓ Read 錯誤檔案
✓ Grep 搜尋相關類型定義
✓ Edit 修復類型問題
✓ 重新執行 typecheck 驗證
```

---

### 測試 3: pre-commit-validator Skill

**測試方法:**

```
您對 Claude 說：
「我想要 commit 代碼了，幫我檢查」

預期：
✓ 自動使用 pre-commit-validator skill
✓ 執行 git status
✓ 執行 npm run typecheck
✓ 執行 npm run lint
✓ 執行 npm run build (如果有)
✓ 檢查禁止模式
✓ 檢查敏感資訊
✓ 提供完整驗證報告
✓ 建議 commit message
```

---

### 測試 4: read-before-edit Skill

**測試方法 1 - 修改檔案:**

```
您對 Claude 說：
「幫我修改 package.json，加入一個新的 script」

預期：
✓ 自動使用 read-before-edit skill
✓ 先 Read package.json
✓ 理解現有結構
✓ 然後才 Edit
```

**測試方法 2 - 觸發 hooks:**

如果您直接要求 Edit 而沒有 Read：

```
您對 Claude 說：
「直接編輯這個檔案」

預期：
✓ PreToolUse hook 觸發提醒
✓ read-before-edit skill 提醒必須先讀
✓ Claude 會先 Read 再 Edit
```

---

## 🔧 測試 MCP Servers

### 測試 1: filesystem MCP

**測試方法:**

```
您對 Claude 說：
「列出 src/ 目錄下所有 .tsx 檔案」

預期：
✓ 使用 filesystem MCP server
✓ 遍歷目錄
✓ 列出所有匹配檔案
```

---

### 測試 2: puppeteer MCP

**測試方法:**

```
您對 Claude 說：
「用 puppeteer 打開 https://www.google.com 並截圖」

預期：
✓ 使用 puppeteer MCP server
✓ 啟動瀏覽器
✓ 打開網頁
✓ 截圖並返回
```

**注意:** 首次使用會自動下載 Chromium，可能需要等待。

---

### 測試 3: fetch MCP

**測試方法:**

```
您對 Claude 說：
「調用 https://api.github.com/repos/anthropics/anthropic-sdk-typescript 並顯示 stars 數量」

預期：
✓ 使用 fetch MCP server
✓ 發送 HTTP GET 請求
✓ 解析 JSON 返回
✓ 顯示結果
```

---

### 測試 4: git MCP

**測試方法:**

```
您對 Claude 說：
「分析最近 10 次 commit 的統計資料」

預期：
✓ 使用 git MCP server
✓ 獲取 commit 歷史
✓ 分析數據
✓ 提供統計報告
```

---

## 🎭 組合測試 (Skills + MCP)

### 測試場景 1: 完整開發流程

```
您對 Claude 說：
「我要新增一個功能，請：
1. 先審查相關代碼
2. 修改檔案
3. 檢查類型
4. 驗證可以提交」

預期執行流程：
1. [read-before-edit] 先讀取相關檔案
2. [code-validator] 審查現有代碼
3. [Edit] 修改檔案
4. [type-checker] 執行類型檢查
5. [pre-commit-validator] 提交前驗證
```

### 測試場景 2: API 測試 + 代碼審查

```
您對 Claude 說：
「測試 /api/users endpoint，並審查相關的 TypeScript 代碼」

預期執行流程：
1. [MCP fetch] 調用 API 測試
2. [read-before-edit] 閱讀 API 代碼
3. [type-checker] 檢查類型定義
4. [code-validator] 審查代碼品質
```

### 測試場景 3: Web 測試 + 前端審查

```
您對 Claude 說：
「用 puppeteer 測試登入頁面，然後審查前端代碼」

預期執行流程：
1. [MCP puppeteer] 打開網頁測試
2. [MCP puppeteer] 截圖驗證
3. [read-before-edit] 閱讀前端組件
4. [code-validator] 審查 React 代碼
```

---

## 🔍 驗證 Skills 是否被載入

### 方法 1: 檢查配置

```bash
# 檢查 skills 目錄
find .claude/skills -name "SKILL.md" -type f

# 檢查每個 skill 的 name 和 description
for file in .claude/skills/*/SKILL.md; do
  echo "=== $file ==="
  grep -A 2 "^name:" "$file"
  echo ""
done
```

### 方法 2: 詢問 Claude

```
您對 Claude 說：
「你現在有哪些 skills 可用？」

預期回答：
✓ 列出 4 個 skills
✓ 說明每個 skill 的用途
✓ 解釋何時會使用
```

---

## 🔍 驗證 MCP Servers 是否可用

### 方法 1: 檢查配置

```bash
# 檢查 .mcp.json
cat .mcp.json | jq '.mcpServers | keys'

# 預期輸出：
# [
#   "fetch",
#   "filesystem",
#   "git",
#   "puppeteer"
# ]
```

### 方法 2: 詢問 Claude

```
您對 Claude 說：
「你可以訪問哪些 MCP servers？」

預期回答：
✓ 列出 4 個 MCP servers
✓ 說明每個的功能
✓ 提供使用範例
```

---

## 🐛 故障排除

### 問題 1: Skills 沒有被觸發

**檢查步驟：**

```bash
# 1. 確認 permissions
grep "Skill" .claude/settings.json

# 2. 確認 SKILL.md 格式
head -n 10 .claude/skills/code-validator/SKILL.md

# 3. 確認 description 清晰
grep "description:" .claude/skills/*/SKILL.md
```

**解決方法：**

- 確保 settings.json 有 `"allow": ["Skill"]`
- 確保每個 SKILL.md 有正確的 YAML frontmatter
- 確保 description 清楚描述觸發時機

### 問題 2: MCP Servers 無法連接

**檢查步驟：**

```bash
# 1. 確認 .mcp.json 格式正確
cat .mcp.json | jq '.'

# 2. 確認 npx 可用
which npx

# 3. 測試單獨執行 MCP server
npx -y @modelcontextprotocol/server-filesystem --help
```

**解決方法：**

- 確保 Node.js 和 npx 已安裝
- 首次使用時，MCP server 會自動下載
- 檢查網絡連接

### 問題 3: 權限問題

**檢查步驟：**

```bash
# 確認檔案權限
ls -la .claude/skills/
ls -la .mcp.json
```

**解決方法：**

```bash
# 如果權限不對，修復：
chmod -R 755 .claude/skills/
chmod 644 .mcp.json
```

---

## ✅ 完整測試腳本

創建一個測試腳本來自動驗證：

```bash
#!/bin/bash

echo "🧪 開始測試 Claude Skills + MCP 配置..."
echo ""

# 測試 1: Skills 目錄
echo "📁 測試 1: 檢查 Skills 目錄"
if [ -d ".claude/skills" ]; then
  skill_count=$(ls -d .claude/skills/*/ 2>/dev/null | wc -l)
  echo "✅ Skills 目錄存在，包含 $skill_count 個 skills"
else
  echo "❌ Skills 目錄不存在"
fi
echo ""

# 測試 2: Settings 權限
echo "🔐 測試 2: 檢查 Settings 權限"
if grep -q '"allow".*"Skill"' .claude/settings.json; then
  echo "✅ Skill 權限已啟用"
else
  echo "❌ Skill 權限未啟用"
fi
echo ""

# 測試 3: MCP 配置
echo "🔧 測試 3: 檢查 MCP 配置"
if [ -f ".mcp.json" ]; then
  mcp_count=$(cat .mcp.json | jq '.mcpServers | length' 2>/dev/null)
  echo "✅ MCP 配置存在，包含 $mcp_count 個 servers"
else
  echo "❌ MCP 配置不存在"
fi
echo ""

# 測試 4: SKILL.md frontmatter
echo "📝 測試 4: 檢查 SKILL.md frontmatter"
for skill_file in .claude/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    skill_name=$(grep "^name:" "$skill_file" | cut -d: -f2 | tr -d ' ')
    if [ -n "$skill_name" ]; then
      echo "✅ $skill_name - frontmatter 正確"
    else
      echo "❌ $skill_file - frontmatter 缺少 name"
    fi
  fi
done
echo ""

echo "✨ 測試完成！"
```

保存為 `.claude/test-config.sh` 並執行：

```bash
chmod +x .claude/test-config.sh
./.claude/test-config.sh
```

---

## 📊 預期測試結果

如果一切正常，您應該看到：

```
🧪 開始測試 Claude Skills + MCP 配置...

📁 測試 1: 檢查 Skills 目錄
✅ Skills 目錄存在，包含 4 個 skills

🔐 測試 2: 檢查 Settings 權限
✅ Skill 權限已啟用

🔧 測試 3: 檢查 MCP 配置
✅ MCP 配置存在，包含 4 個 servers

📝 測試 4: 檢查 SKILL.md frontmatter
✅ code-validator - frontmatter 正確
✅ pre-commit-validator - frontmatter 正確
✅ read-before-edit - frontmatter 正確
✅ type-checker - frontmatter 正確

✨ 測試完成！
```

---

## 🎯 實戰測試建議

### 最簡單的測試（推薦從這裡開始）

```
1. 對 Claude 說：「你有哪些 skills？」
   → 應該列出 4 個 skills

2. 對 Claude 說：「你可以用哪些 MCP servers？」
   → 應該列出 4 個 MCP servers

3. 對 Claude 說：「幫我檢查 package.json 的格式」
   → 應該自動使用 read-before-edit skill 先讀取

4. 對 Claude 說：「我想 commit 了」
   → 應該自動使用 pre-commit-validator skill
```

### 進階測試

```
5. 創建有問題的測試代碼，要求 Claude 審查
   → 測試 code-validator skill

6. 要求 Claude 用 fetch 調用公開 API
   → 測試 MCP fetch server

7. 要求 Claude 用 puppeteer 截圖某個網站
   → 測試 MCP puppeteer server
```

---

## 📚 相關文檔

- Skills 說明: `.claude/skills/README.md`
- MCP 指南: `.claude/MCP_GUIDE.md`
- 專案規範: `CLAUDE.md`

---

**開始測試，享受 AI 輔助開發！** 🚀
