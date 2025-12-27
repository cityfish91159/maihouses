# Claude Skills 說明

這個目錄包含 maihouses 專案的 Claude Agent Skills 配置。

## 📚 可用的 Skills

### 1. code-validator
**用途：** 驗證代碼品質，確保符合 CLAUDE.md 最高規格標準

**自動觸發時機：**
- 修改 `.ts` 或 `.tsx` 檔案後
- 用戶要求代碼審查
- 用戶提到「驗證」、「檢查」、「審查」

**檢查項目：**
- ❌ 禁止 `any` 類型
- ❌ 禁止 `console.log`
- ❌ 禁止 `@ts-ignore`
- ✅ TypeScript 類型檢查通過
- ✅ ESLint 檢查通過
- ✅ 完整錯誤處理
- ✅ 有意義的變數命名

---

### 2. type-checker
**用途：** 執行 TypeScript 類型檢查並修復類型錯誤

**自動觸發時機：**
- 遇到類型錯誤
- 需要定義類型
- 用戶提到「type」、「類型」

**功能：**
- 執行 `npm run typecheck`
- 分析 TypeScript 錯誤
- 提供修復建議
- 定義新的 interface/type
- 使用現有類型定義

**常見修復：**
- TS7006: 隱式 any 參數
- TS2339: 屬性不存在
- TS2345: 參數類型不匹配
- TS18046: 可能為 undefined

---

### 3. pre-commit-validator
**用途：** Git commit 前的完整驗證檢查

**自動觸發時機：**
- 用戶提到「commit」、「提交」
- 用戶提到「push」
- 完成重要功能開發後

**完整檢查清單：**
1. ✅ Git 狀態檢查
2. ✅ TypeScript 類型檢查
3. ✅ ESLint 代碼風格檢查
4. ✅ 單元測試（如果有）
5. ✅ Build 構建檢查
6. ✅ 禁止模式搜尋
7. ✅ 敏感資訊檢查
8. ✅ 檔案大小檢查
9. ✅ 相依性檢查

**驗證標準：** 所有檢查必須 100% 通過

---

### 4. read-before-edit
**用途：** 強制執行「先讀後寫」規範

**自動觸發時機：**
- 每次使用 `Edit` 工具前
- 每次使用 `Write` 工具前
- 實作新功能時

**核心原則：**
```
📖 READ → 🧠 UNDERSTAND → ✏️ EDIT
```

**必讀檔案清單：**
- 要修改的檔案本身
- 該檔案 import 的所有模組
- 相關的類型定義檔案
- 相關的 API/服務層檔案
- 相關的 hooks 和 context
- 相關的組件檔案
- 相關的工具函數

---

## 🚀 如何使用

### 自動觸發（推薦）

Skills 會根據 description 自動觸發，您不需要手動呼叫：

```
用戶：「請幫我審查這個檔案的代碼品質」
Claude：自動使用 code-validator skill

用戶：「修復這些類型錯誤」
Claude：自動使用 type-checker skill

用戶：「我想要提交代碼了」
Claude：自動使用 pre-commit-validator skill

用戶：「修改 Login.tsx 加入記住我功能」
Claude：自動使用 read-before-edit skill
```

### 手動提示（可選）

您也可以明確提到 skill 名稱：

```
「使用 code-validator 檢查這個檔案」
「執行 pre-commit-validator」
「用 type-checker 修復類型問題」
```

---

## 🔧 配置檔案

### settings.json

Skills 權限已在 `.claude/settings.json` 中啟用：

```json
{
  "permissions": {
    "allow": ["Skill"]
  }
}
```

### Skill 目錄結構

```
.claude/skills/
├── code-validator/
│   └── SKILL.md
├── type-checker/
│   └── SKILL.md
├── pre-commit-validator/
│   └── SKILL.md
└── read-before-edit/
    └── SKILL.md
```

---

## 📊 Skills 優先級

當多個 skills 都適用時，Claude 會按照以下優先級選擇：

1. **read-before-edit** - 最高優先級，任何修改前都會觸發
2. **type-checker** - 類型相關問題
3. **code-validator** - 代碼品質審查
4. **pre-commit-validator** - 提交前完整驗證

---

## ⚡ 與 Hooks 整合

Skills 與專案的 hooks 系統完美整合：

- **PreToolUse hooks** - 在 Edit/Write 前提醒最高規格標準
- **PostToolUse hooks** - 在 Edit/Write 後執行驗證
- **Skills** - 提供完整的檢查流程和修復指導

這形成了三層防護：
```
Hooks (強制提醒) → Skills (智能檢查) → 驗證 (自動執行)
```

---

## 🎯 最佳實踐

1. **讓 Claude 自動決定** - description 寫得夠清楚，Claude 會自動選擇合適的 skill
2. **信任自動觸發** - 不需要手動指定，Claude 會在需要時使用
3. **遵循 skill 建議** - Skills 基於 CLAUDE.md 規範，完全值得信賴
4. **驗證結果** - Skill 執行後會有詳細報告

---

## 🔍 檢查 Skills 狀態

```bash
# 列出所有 skills
ls -la .claude/skills/

# 檢查 skill frontmatter
head -n 5 .claude/skills/*/SKILL.md

# 驗證 permissions
grep -A 3 "permissions" .claude/settings.json
```

---

## 📖 相關文檔

- 專案規範：`CLAUDE.md` (專案根目錄)
- Settings 配置：`.claude/settings.json`
- Hooks 系統：`scripts/ai-supervisor.sh`
- 官方文檔：https://docs.anthropic.com/en/docs/claude-code

---

## ✅ 驗證清單

- [x] 4 個 skills 全部創建
- [x] 每個 skill 有正確的 YAML frontmatter
- [x] description 清楚描述觸發時機
- [x] allowed-tools 合理配置
- [x] settings.json 啟用 Skill 權限
- [x] 與專案 CLAUDE.md 規範一致

---

**Skills 已就緒，Claude 現在會自動使用這些專業檢查流程！** 🚀
