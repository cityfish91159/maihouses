# MCP Servers 配置指南

這個檔案說明 maihouses 專案的 MCP (Model Context Protocol) 配置。

## 🎯 什麼是 MCP？

**MCP = Model Context Protocol**

MCP 是連接 Claude 與外部工具、API、數據庫的開放標準協議。

### MCP vs Skills 對比

```
┌─────────────────────────────────────────────────┐
│                  Claude Agent                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  🧠 Skills (如何做)                             │
│  ├── code-validator                             │
│  ├── type-checker                               │
│  ├── pre-commit-validator                       │
│  └── read-before-edit                           │
│                                                 │
│  🔧 MCP Servers (能力)                          │
│  ├── filesystem (檔案系統訪問)                  │
│  ├── puppeteer (Web 自動化)                     │
│  ├── fetch (HTTP 請求)                          │
│  └── git (Git 操作)                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**關係：**

- **Skills** 定義「流程和規範」（使用 Read, Grep, Bash 等內建工具）
- **MCP** 提供「外部能力」（訪問數據庫、API、服務等）

---

## 📋 已配置的 MCP Servers

### 1. filesystem

**功能：** 檔案系統訪問（超越 Claude Code 內建的 Read/Write）

**用途：**

- 批量文件操作
- 目錄遍歷
- 文件搜尋
- 權限管理

**範例：**

```
「搜尋所有包含 'TODO' 的檔案並列出」
「批量重命名 src/components 下的檔案」
```

---

### 2. puppeteer

**功能：** Web 自動化和網頁截圖

**用途：**

- 網頁截圖
- 表單自動填寫
- 網頁測試
- 數據抓取

**範例：**

```
「打開我們的網站並截圖」
「測試登入流程是否正常」
「抓取競品網站的價格信息」
```

---

### 3. fetch

**功能：** HTTP 請求（GET, POST, PUT, DELETE）

**用途：**

- 調用外部 API
- 測試 API endpoints
- 數據獲取
- Webhook 測試

**範例：**

```
「調用 /api/users 並顯示返回結果」
「測試我們的 API 是否正常運作」
「從 GitHub API 獲取最新 issues」
```

---

### 4. git

**功能：** Git 操作（超越 Bash git 命令）

**用途：**

- 複雜的 Git 操作
- 多倉庫管理
- Git 歷史分析
- 分支策略執行

**範例：**

```
「分析最近 30 天的提交記錄」
「找出修改最頻繁的檔案」
「自動創建 release branch」
```

---

## 🚀 如何使用

### 自動使用（推薦）

Claude 會自動判斷何時使用 MCP servers：

```
您：「抓取我們網站的首頁截圖」
Claude：✓ 自動使用 puppeteer MCP server
       ✓ 打開網頁
       ✓ 截圖
       ✓ 返回圖片
```

### 結合 Skills 使用

MCP 和 Skills 可以協同工作：

```
您：「檢查網站上的登入功能是否正常，並審查相關代碼」
Claude：✓ 使用 puppeteer MCP - 測試網頁登入
       ✓ 使用 filesystem MCP - 讀取相關代碼
       ✓ 使用 code-validator skill - 審查代碼品質
       ✓ 使用 read-before-edit skill - 如需修改先閱讀
```

---

## 🔧 配置檔案

### 位置：`.mcp.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/maihouses"],
      "env": {}
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "env": {}
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "env": {}
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "/home/user/maihouses"],
      "env": {}
    }
  }
}
```

**說明：**

- `command`: 執行命令（npx, uvx, node 等）
- `args`: 命令參數
- `env`: 環境變數（API keys 等）

---

## 📦 添加更多 MCP Servers

### 常用 MCP Servers

```bash
# PostgreSQL 數據庫
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/db"
    }
  }
}

# SQLite 數據庫
{
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite"],
    "env": {
      "DB_PATH": "./data/app.db"
    }
  }
}

# Google Drive
{
  "google-drive": {
    "command": "npx",
    "args": ["-y", "google-drive-mcp"],
    "env": {
      "GOOGLE_API_KEY": "your-api-key"
    }
  }
}

# Slack
{
  "slack": {
    "command": "npx",
    "args": ["-y", "slack-mcp"],
    "env": {
      "SLACK_TOKEN": "xoxb-your-token"
    }
  }
}
```

### 手動添加 Server

編輯 `.mcp.json`，在 `mcpServers` 中添加新的 server 配置。

---

## 🔐 安全注意事項

### API Keys 管理

**❌ 禁止：** 直接寫在 `.mcp.json` 中並提交到 git

```json
// ❌ 不要這樣做
{
  "env": {
    "API_KEY": "sk_live_12345" // 會洩露
  }
}
```

**✅ 正確：** 使用環境變數

```json
// ✅ 這樣做
{
  "env": {
    "API_KEY": "${OPENAI_API_KEY}" // 從環境變數讀取
  }
}
```

然後在 `.env` 或系統環境變數中設置：

```bash
export OPENAI_API_KEY=sk_live_12345
```

### .gitignore

確保敏感配置不被提交：

```gitignore
# 在 .gitignore 中添加
.mcp.local.json
.claude/settings.local.json
.env
```

---

## 📊 輸出限制

MCP tool 輸出有 token 限制：

- **警告閾值**: 10,000 tokens
- **默認上限**: 25,000 tokens
- **可配置上限**: `MAX_MCP_OUTPUT_TOKENS` 環境變數

```bash
# 提高上限到 50,000 tokens
export MAX_MCP_OUTPUT_TOKENS=50000
```

---

## 🎓 最佳實踐

1. **專案級 vs 用戶級**
   - 團隊共用的 MCP → `.mcp.json`（提交到 git）
   - 個人使用的 MCP → `.claude/settings.local.json`（不提交）

2. **保護敏感資訊**
   - API keys 用環境變數
   - 不提交 tokens 到 git

3. **測試連接**

   ```bash
   # 使用 CLI 測試（如果有）
   claude mcp get filesystem
   ```

4. **文檔說明**
   - 在 README 中列出專案需要的 MCP servers
   - 說明如何設置環境變數

5. **合理使用**
   - 簡單操作用 Skills + 內建工具
   - 需要外部集成時用 MCP
   - 兩者結合使用最佳

---

## 🌐 更多 MCP Servers

官方 MCP Servers 列表：

- https://github.com/modelcontextprotocol/servers

社群貢獻的 MCP Servers：

- https://github.com/topics/mcp-server
- https://mcpcat.io/ (MCP Servers 目錄)

**可用超過 3 萬個工具包！**

---

## 📝 範例使用場景

### 場景 1: 自動化測試

```
您：「用 puppeteer 測試我們的註冊流程，然後用 code-validator 審查相關代碼」

Claude 執行：
1. [MCP puppeteer] 打開網站
2. [MCP puppeteer] 填寫註冊表單
3. [MCP puppeteer] 提交並檢查結果
4. [Skill read-before-edit] 閱讀相關代碼
5. [Skill code-validator] 審查代碼品質
6. [回報] 測試結果 + 代碼審查報告
```

### 場景 2: API 開發

```
您：「測試 /api/users endpoint，如果有問題幫我修復」

Claude 執行：
1. [MCP fetch] 調用 API
2. [分析] 檢查返回結果
3. [Skill read-before-edit] 閱讀 API 代碼
4. [Skill type-checker] 檢查類型定義
5. [Edit] 修復問題
6. [MCP fetch] 重新測試
```

### 場景 3: 數據分析

```
您：「分析最近一個月的 git commit，找出最活躍的檔案」

Claude 執行：
1. [MCP git] 獲取 commit 歷史
2. [分析] 統計檔案修改次數
3. [MCP filesystem] 讀取熱點檔案
4. [Skill code-validator] 審查這些檔案
5. [回報] 分析報告 + 優化建議
```

---

## ✅ 驗證清單

- [x] `.mcp.json` 已創建
- [x] 4 個基礎 MCP servers 已配置
  - [x] filesystem
  - [x] puppeteer
  - [x] fetch
  - [x] git
- [x] 與 Skills 協同工作
- [x] 安全配置（無敏感資訊）

---

## 🎯 總結

**現在您擁有：**

1. **4 個 Skills** - 定義代碼品質標準和流程
2. **4 個 MCP Servers** - 提供外部能力和集成
3. **完整配置** - 自動觸發，無需手動指定

**這形成了一個完整的 AI 輔助開發生態系統！** 🚀

---

**Skills 教 Claude 如何做，MCP 給 Claude 能力。兩者結合 = 無限可能！**
