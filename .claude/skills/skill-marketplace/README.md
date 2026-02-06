# Skill Marketplace Integration

讓 Agent 能自動從 **38,000+ Skills Marketplace** 搜尋、安裝並使用最適合的工具！

## 🚀 快速開始

### 1. 自動觸發（推薦）

Agent 會在以下情況自動搜尋市集：

- 面對複雜任務（測試生成、Docker 部署、API 文檔）
- 需要專業工具
- 本地 skills 無法滿足需求

**範例：**

```
用戶: "幫我生成這個 API 的測試案例"
Agent: [自動搜尋市集] → 找到 api-test-generator → 安裝 → 使用
```

### 2. 手動測試

**搜尋市集：**

```bash
node .claude/skills/skill-marketplace/search-marketplace.cjs "testing"
```

**模擬安裝：**

```bash
# 查看幫助
node .claude/skills/skill-marketplace/install-skill.cjs --help

# 實際安裝需要真實的 SKILL.md URL
# node install-skill.cjs https://raw.githubusercontent.com/.../SKILL.md --temp
```

## 📦 檔案結構

```
skill-marketplace/
├── SKILL.md                    # Skill 定義（Agent 讀取）
├── search-marketplace.cjs      # 市集搜尋 API
├── install-skill.cjs           # Skill 安裝器
└── README.md                   # 此檔案
```

## 🔧 工作原理

```
任務開始
  ↓
解析需求 → 提取關鍵字
  ↓
搜尋市集 → 評估 Skills (相關性、星數、更新時間)
  ↓
選擇最佳 → 安全檢查
  ↓
下載安裝 → 使用 Skill 工具執行
  ↓
完成清理 → 詢問是否保留
```

## 🎯 支援的任務類型

| 任務類型    | 搜尋關鍵字                 | 市集分類           |
| ----------- | -------------------------- | ------------------ |
| API 測試    | `testing`, `api`, `jest`   | Testing & Security |
| Docker 部署 | `docker`, `container`      | DevOps             |
| API 文檔    | `documentation`, `openapi` | Documentation      |
| 資料處理    | `data`, `csv`, `json`      | Data & AI          |
| CI/CD       | `github-actions`, `ci`     | DevOps             |
| 安全掃描    | `security`, `audit`        | Testing & Security |

## 🛡️ 安全機制

**安裝前自動檢查：**

- ✅ YAML frontmatter 格式正確
- ✅ allowed-tools 無危險指令
- ✅ 來源為可信任的 GitHub repo
- ✅ 無可疑的外部連結或 shell 指令

**危險模式警告：**

- `Bash(rm -rf)`
- `Bash(sudo)`
- `curl | bash`
- 存取敏感環境變數

## 📊 範例輸出

**搜尋 "testing":**

```
🔍 搜尋市集: "testing"
✅ 找到 2 個相關 skills:

1. api-test-generator (⭐ 245)
   Automatically generate comprehensive API tests
   分類: Testing & Security | 更新: 2025-12-15

2. playwright-test-gen (⭐ 312)
   Generate end-to-end tests using Playwright
   分類: Testing & Security | 更新: 2025-12-20
```

## 🎨 自訂配置

在 `.claude/settings.json` 中配置：

```json
{
  "skills": {
    "marketplace": {
      "enabled": true,
      "auto_install": false, // 是否自動安裝（false=詢問用戶）
      "min_stars": 50, // 最低星數要求
      "cleanup_after_use": true // 使用後清理臨時 skills
    }
  }
}
```

## 📚 相關資源

- Skills Marketplace: https://skillsmp.com/
- SKILL.md 規範: https://docs.anthropic.com/claude-code/skills
- 本地 Skills: `.claude/skills/README.md`

---

**此 Skill 讓 Agent 具備自我學習能力，能根據任務自動尋找最佳工具！** 🚀
