# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

所有ui/ux設計都必須來自/ui-ux-pro-max 嚴格禁止自己亂做

## 開發指令

```bash
# 安裝依賴
npm install

# 開發伺服器
npm run dev                    # 啟動 Vite 開發伺服器 (http://localhost:5173/maihouses/)
npm run dev:force              # 強制重新預構建依賴

# 品質檢查
npm run typecheck              # TypeScript 類型檢查
npm run lint                   # ESLint 代碼風格檢查
npm run gate                   # 品質關卡（typecheck + lint 合併）

# 測試
npm test                       # 執行所有單元測試 (Vitest)
npm run test:watch             # 監視模式測試
npx vitest run src/path/to/file.test.ts  # 執行單一測試檔案

# 構建
npm run build                  # TypeScript 編譯 + Vite 構建
npm run build:local            # 先執行品質關卡再構建
npm run preview                # 預覽構建結果 (port 4173)

# 部署
npm run deploy                 # 構建並部署到 GitHub Pages
```

---

## 技術架構

### 技術棧

- **前端**: React 18 + TypeScript + Vite 7
- **樣式**: Tailwind CSS 3
- **狀態管理**: Zustand + React Query (TanStack Query)
- **後端**: Vercel Serverless Functions (`/api` 目錄)
- **資料庫**: Supabase (PostgreSQL) + RPC Functions
- **類型驗證**: Zod Schema
- **測試**: Vitest + Testing Library + Playwright (E2E)

### 專案結構

```
maihouses/
├── api/                    # Vercel Serverless Functions
│   ├── community/          # 社區牆 API (貼文、按讚、問答)
│   ├── trust/              # 信任驗證流程 API
│   ├── property/           # 房源相關 API
│   ├── uag/                # UAG 業務廣告系統 API
│   └── lib/                # 共用工具
├── src/
│   ├── components/         # React UI 組件
│   │   ├── Feed/           # 動態牆組件
│   │   ├── MaiMai/         # 吉祥物互動組件
│   │   └── UAG/            # UAG 儀表板組件
│   ├── pages/              # 頁面路由
│   │   ├── Chat/           # AI 對話頁面
│   │   ├── Community/      # 社區牆頁面
│   │   ├── Feed/           # 動態牆頁面
│   │   ├── UAG/            # 業務後台頁面
│   │   └── Property/       # 房源詳情頁面
│   ├── features/           # 功能模組
│   ├── hooks/              # 自訂 React Hooks
│   ├── services/           # API 服務層
│   ├── types/              # TypeScript 類型定義
│   ├── lib/                # 工具函數
│   ├── stores/             # Zustand 狀態 stores
│   └── constants/          # 常數定義
├── supabase/
│   └── migrations/         # 資料庫 Migration SQL
└── tests/
    └── e2e/                # Playwright E2E 測試
```

### 關鍵模組

| 模組                         | 說明                                       |
| ---------------------------- | ------------------------------------------ |
| `src/lib/supabase.ts`        | Supabase 客戶端初始化                      |
| `src/services/openai.ts`     | AI 對話服務 + 繁體中文 system prompt       |
| `src/types/property-page.ts` | 房源 Zod Schema 類型定義                   |
| `src/hooks/useAuth.ts`       | 認證狀態 hook                              |
| `src/pages/UAG/`             | UAG 業務廣告後台 (增量更新 + 智慧快取架構) |

### 環境變數

```bash
# 前端 (VITE_ 前綴，會暴露到瀏覽器)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx
VITE_OPENAI_API_KEY=sk-xxxxxx        # 可選：直連 OpenAI
VITE_AI_PROXY_URL=https://xxx        # 可選：AI 代理 URL

# 後端 (Vercel Functions)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx
```

---

## 語言規範

**所有回應必須使用繁體中文（台灣用語）**

- ✅ 對用戶的回應、任務說明、進度報告
- ✅ 錯誤訊息、代碼註解、技術概念解釋
- ❌ 例外：代碼本身、技術指令、專有技術術語

---

## 代碼品質強制標準

### 禁止清單

| 禁止項目            | 原因           | 替代方案                        |
| ------------------- | -------------- | ------------------------------- |
| `: any`             | 失去類型安全   | 定義具體 interface/type         |
| `console.log`       | 生產環境不應有 | 使用 `src/lib/logger.ts` 或移除 |
| `// @ts-ignore`     | 隱藏類型錯誤   | 修復根本問題                    |
| `// eslint-disable` | 隱藏代碼問題   | 修復根本問題                    |
| 硬編碼密鑰          | 安全風險       | 使用環境變數                    |

### 類型安全

```typescript
// ❌ 禁止
const data: any = fetchData();

// ✅ 正確 - 使用專案已定義的 Zod Schema
import type { FeaturedPropertyCard } from '../types/property-page';
const data: FeaturedPropertyCard = fetchData();
```

### 錯誤處理

```typescript
// ❌ 禁止 - 無錯誤處理
const fetchUser = async (id: string) => {
  const res = await fetch(`/api/user/${id}`);
  return res.json();
};

// ✅ 正確 - 完整錯誤處理
const fetchUser = async (id: string): Promise<User> => {
  const res = await fetch(`/api/user/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.status}`);
  }
  return res.json();
};
```

### TypeScript 配置特性

本專案使用嚴格的 TypeScript 設定：

- `strict: true`
- `noUncheckedIndexedAccess: true` - 索引存取返回 `T | undefined`
- `exactOptionalPropertyTypes: true` - 可選屬性不等於 `undefined`

---

## 先讀後寫規範

**修改任何檔案前，必須先閱讀相關檔案**

```
要修改的檔案本身
    ├── 該檔案 import 的模組
    ├── 相關類型定義 (types/*.ts)
    ├── 相關 API/服務層
    └── 相關 hooks 和 context
```

---

## 任務完成標準

每次完成任務前必須確認：

- [ ] `npm run typecheck` 通過
- [ ] `npm run lint` 通過
- [ ] 沒有使用 `any` 類型
- [ ] 所有函數都有錯誤處理
- [ ] 遵循現有代碼風格

---

## Git 提交規範

```bash
feat: 新增 XXX 功能
fix: 修復 XXX 問題
refactor: 重構 XXX 模組
style: 調整 XXX 樣式
docs: 更新 XXX 文件
chore: 雜項更新
test: 新增/修改測試
```

---

## 🚨 防偷懶強制執行機制

**此區塊為強制規則，AI 必須嚴格遵守，不可省略任何步驟**

### 自動觸發條件表

| 觸發條件 | 必須執行的 Skill | 理由 |
|---------|-----------------|------|
| 修改任何 `.tsx` 檔案 | `/read-before-edit` | 確保理解現有代碼再修改 |
| 修改超過 3 個檔案 | `/code-review` | 大範圍修改需要審查 |
| 修改 `api/` 目錄下檔案 | `/backend_safeguard` + `/security_audit` | API 安全是 P0 |
| 新增功能完成後 | `/rigorous_testing` | 沒測試就不算完成 |
| 準備 commit 前 | `/pre-commit-validator` | 最後一道防線 |
| UI/UX 相關修改 | `/ui-ux-pro-max` | 設計必須來自這裡 |
| 修改 Supabase RLS/RPC | `/draconian_rls_audit` | 資料庫安全 |

### 任務完成檢查清單（每次必須回報）

完成任何任務後，必須在回應中包含以下檢查結果：

```
## ✅ 任務完成檢查
- [ ] typecheck: [通過/失敗]
- [ ] lint: [通過/失敗]
- [ ] 無 any 類型: [是/否]
- [ ] 已執行相關 Skills: [列出執行的 skills]
- [ ] 測試狀態: [通過/跳過/不適用]
```

### 禁止偷懶行為

以下行為**嚴格禁止**，違反將導致任務失敗：

1. **跳過 Skills** - 符合觸發條件時必須執行對應 Skill
2. **假裝執行** - 說「已執行」但沒有實際跑
3. **省略檢查** - 不跑 typecheck/lint 就說完成
4. **忽略錯誤** - 看到錯誤但不修復
5. **過度簡化** - 用 `// TODO` 或 placeholder 交差

### Claude Code Buddy 整合

本專案已安裝 CCB，用於跨會話記憶：

**記憶重要決策時使用：**
```
buddy-remember "為什麼 [某功能] 這樣設計"
```

**查詢歷史決策：**
```
buddy-remember "[查詢關鍵字]"
```

**複雜任務規劃：**
```
generate-smart-plan
```

### 強制執行優先級

```
P0 (必須) - typecheck + lint + 無 any
P1 (重要) - 相關 Skills 執行
P2 (建議) - CCB 記憶更新
```
