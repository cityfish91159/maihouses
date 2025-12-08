# 🚨 AI AGENT 最高規格執行協議 (MANDATORY STRICT PROTOCOL)

> **警告**：本專案執行「零信任」與「極度嚴格」的開發標準。AI Agent 必須嚴格遵守以下 SOP，否則視為任務失敗。

## 1. 必須執行的監督腳本
你必須在每個階段主動執行 `./scripts/ai-supervisor.sh`：

1.  **收到任務時**：
    - 執行 `chmod +x scripts/ai-supervisor.sh && ./scripts/ai-supervisor.sh init`
    - 執行 `./scripts/ai-supervisor.sh plan "任務描述"`
    - **禁止**在沒有 Plan 的情況下開始寫代碼。

2.  **修改代碼前**：
    - **必須**使用 `read_file` 閱讀目標檔案完整內容（禁止只讀片段）。
    - 確保理解上下文，不要腦補變數或函數。

3.  **修改代碼後**：
    - 執行 `./scripts/ai-supervisor.sh audit <修改的檔案路徑>`
    - 檢查是否包含 `// ...` 偷懶省略（絕對禁止）。
    - 檢查是否包含 `TODO` 或 `console.log`。
    - 檢查是否使用了 `any` 類型。

4.  **任務結束前**：
    - 執行 `./scripts/ai-supervisor.sh verify`
    - 確保 `npm run typecheck` 和 `npm run build` 通過。

## 2. 心態與標準
- **拒絕偷懶**：永遠寫出完整的代碼，不要省略任何細節。
- **拒絕腦補**：不確定的變數名、API 格式，必須先 `grep_search` 或 `read_file` 確認。
- **像素級完美**：UI 修改必須與設計稿或現有風格完全一致（檢查 Padding, Margin, Color）。
- **自我質疑**：提交前問自己「這是最高規格的代碼嗎？」「我有沒有偷懶？」

---

# MaiHouses (邁房子) - GitHub Copilot 專案指令

> 這是一個台灣房地產平台，提供 AI 智能推薦、信任交易系統、精準客戶管理等功能。

---

## 🏗️ 技術架構

### 核心技術棧
- **前端框架**: React 18 + TypeScript
- **構建工具**: Vite
- **樣式方案**: Tailwind CSS
- **後端服務**: Vercel Serverless Functions
- **資料庫**: Supabase (PostgreSQL)
- **認證系統**: Supabase Auth
- **部署平台**: Vercel (自動部署)

### 專案結構
```
maihouses/
├── .github/
│   └── copilot-instructions.md    # 本文件
├── api/                           # Vercel Serverless Functions
│   ├── auth/                      # 認證相關 API
│   ├── properties/                # 房源相關 API
│   ├── users/                     # 用戶相關 API
│   └── ai/                        # AI 功能 API
├── src/
│   ├── components/                # React 組件
│   │   ├── ui/                    # 基礎 UI 組件
│   │   ├── layout/                # 佈局組件
│   │   └── features/              # 功能組件
│   ├── pages/                     # 頁面組件
│   ├── hooks/                     # 自定義 Hooks
│   ├── lib/                       # 工具函數和配置
│   │   ├── supabase.ts            # Supabase 客戶端
│   │   └── utils.ts               # 通用工具函數
│   ├── types/                     # TypeScript 類型定義
│   ├── services/                  # API 調用服務
│   └── styles/                    # 全域樣式
├── supabase/                      # Supabase 相關文件
│   └── migrations/                # 資料庫遷移腳本
├── public/                        # 靜態資源
└── vercel.json                    # Vercel 配置
```

---

## 🔐 環境變數

### 必要的環境變數（在 .env 中設定）
```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx

# Vercel Serverless（後端用）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx  # 注意：這是服務端密鑰

# AI 服務（如果有）
OPENAI_API_KEY=sk-xxxxx
```

### 規則
- **絕對禁止**在代碼中硬編碼任何密鑰
- 前端變數使用 `VITE_` 前綴
- 後端（API）變數不需要前綴
- 創建 `.env.example` 作為範本

---

## 💾 Supabase 操作規則

### 資料庫變更流程
1. 所有 Schema 變更必須寫成 SQL 檔案
2. 檔案放在專案根目錄或 `/supabase/migrations/`
3. 命名格式：`YYYYMMDD_功能名稱.sql`
4. **不要自動執行 SQL**，我會手動在 Supabase Dashboard 執行

### SQL 檔案範例
```sql
-- 檔案：20241125_trust_room.sql
-- 功能：Trust Room 交易系統資料表

-- 交易記錄表
CREATE TABLE IF NOT EXISTS trust_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  property_id UUID NOT NULL,
  stage INTEGER DEFAULT 1 CHECK (stage BETWEEN 1 AND 6),
  status TEXT DEFAULT 'pending',
  escrow_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 政策
ALTER TABLE trust_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON trust_transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 索引
CREATE INDEX idx_trust_transactions_buyer ON trust_transactions(buyer_id);
CREATE INDEX idx_trust_transactions_seller ON trust_transactions(seller_id);
```

### Supabase 客戶端使用
```typescript
// 正確的引入方式
import { supabase } from '@/lib/supabase';

// 查詢範例
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// 必須處理錯誤
if (error) {
  console.error('查詢失敗:', error.message);
  throw new Error('無法載入房源資料');
}
```

---

## 🚀 Vercel API 規則

### API 路由結構
```typescript
// 檔案：/api/properties/list.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 處理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 你的邏輯
    const { data, error } = await supabase
      .from('properties')
      .select('*');

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器錯誤，請稍後再試'
    });
  }
}
```

### API 回應格式
```typescript
// 成功回應
{
  success: true,
  data: any,
  message?: string
}

// 錯誤回應
{
  success: false,
  error: string,
  code?: string
}
```

---

## 📝 代碼規範

### TypeScript 規則
```typescript
// ✅ 正確：明確的類型定義
interface Property {
  id: string;
  title: string;
  price: number;
  location: {
    city: string;
    district: string;
    address: string;
  };
}

// ❌ 禁止：使用 any
const data: any = fetchData(); // 不要這樣

// ✅ 正確：使用 unknown 並進行類型檢查
const data: unknown = fetchData();
if (isProperty(data)) {
  // 現在 data 是 Property 類型
}
```

### React 組件規範
```typescript
// 使用函數組件 + TypeScript
interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  className?: string;
}

export function PropertyCard({ 
  property, 
  onFavorite,
  className = ''
}: PropertyCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      {/* 組件內容 */}
    </div>
  );
}
```

### 命名規範
| 類型 | 規範 | 範例 |
|------|------|------|
| 組件 | PascalCase | `PropertyCard.tsx` |
| Hook | camelCase + use前綴 | `useAuth.ts` |
| 工具函數 | camelCase | `formatPrice.ts` |
| 常數 | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| 類型/介面 | PascalCase | `UserProfile` |

---

## 🛡️ 禁止事項

### 絕對禁止
1. ❌ 硬編碼任何 API 密鑰、密碼、敏感資訊
2. ❌ 刪除現有功能（除非明確要求）
3. ❌ 直接修改資料庫 Schema（必須寫 SQL 檔案）
4. ❌ 使用 `any` 類型
5. ❌ 忽略錯誤處理
6. ❌ 在前端暴露 `SERVICE_ROLE_KEY`

### 需要確認
1. ⚠️ 改變資料庫結構前要先確認
2. ⚠️ 刪除檔案前要先確認
3. ⚠️ 改變 API 回應格式前要先確認
4. ⚠️ 升級主要依賴版本前要先確認

---

## 🔧 常用指令

```bash
# 開發
npm install          # 安裝依賴
npm run dev          # 啟動開發伺服器 (通常是 port 5173)
npm run build        # 構建生產版本
npm run preview      # 預覽構建結果

# 類型檢查
npm run type-check   # TypeScript 類型檢查

# 部署
git push origin main # 推送到 main 分支，Vercel 自動部署
```

---

## 📋 任務執行清單

當你收到任務時，請按以下順序執行：

### 前置檢查
- [ ] 理解任務需求
- [ ] 確認涉及的檔案和模組
- [ ] 檢查是否需要資料庫變更
- [ ] 確認是否有相關的現有代碼可參考

### 執行中
- [ ] 遵循專案代碼規範
- [ ] 添加必要的 TypeScript 類型
- [ ] 處理所有錯誤情況
- [ ] 使用繁體中文撰寫 UI 文字和錯誤訊息

### 完成後
- [ ] 說明你做了什麼改動
- [ ] 列出新增/修改的檔案
- [ ] 如果有 SQL 變更，提供完整的 SQL 檔案
- [ ] 如果需要新的環境變數，明確列出

---

## 🌐 語言規範

- **代碼註解**: 中文或英文皆可
- **UI 文字**: 必須使用繁體中文
- **錯誤訊息**: 繁體中文，對用戶友善
- **Console log**: 英文（方便 debug）

```typescript
// UI 文字範例
const messages = {
  loading: '載入中...',
  error: '發生錯誤，請稍後再試',
  success: '操作成功！',
  noData: '目前沒有資料',
  confirm: '確定要執行此操作嗎？',
};
```

---

## 📞 需要幫助時

如果遇到以下情況，請詢問我：
1. 不確定現有功能的運作方式
2. 需要了解業務邏輯
3. 涉及到付款或敏感資料處理
4. 需要做重大架構變更

---

## 🔒 代碼模糊化規則

當需要對外分享代碼或生成文件時，請依照以下規則進行模糊化處理：

### 必須模糊化

| 類別 | 處理方式 | 範例 |
|------|----------|------|
| 正則表達式 | 替換為 `[REGEX]` | `/^\d{3,5}/` → `[REGEX]` |
| 資料庫查詢條件 | 只保留表名 | `.eq('x', y)` → `/* [REDACTED] */` |
| API 金鑰 | 替換為 `[API_KEY]` | `Bearer ${key}` → `Bearer [API_KEY]` |
| AI Prompt 內容 | 只保留功能描述 | 完整 prompt → `[REDACTED - 商業機密]` |
| 環境變數值 | 保留名稱，移除值 | 實際值 → `[REDACTED]` |
| UUID | 替換為 `uuid-xxxx` | 實際 UUID → `uuid-xxxx` |
| 業務邏輯判斷 | 保留結構，移除細節 | `if (x > 5)` → `if (/* [REDACTED] */)` |

### 可以保留

- 函數名稱和簽名
- 類型定義和介面
- 檔案結構和目錄
- 一般性的流程說明
- 公開的 API 路徑

### 絕對禁止外流

1. ❌ 完整的正則表達式（地址指紋、社區名正規化）
2. ❌ AI Prompt 完整內容
3. ❌ 資料庫欄位完整列表
4. ❌ 比對演算法完整實作
5. ❌ 環境變數實際值
6. ❌ Supabase Service Role Key

---

*最後更新：2024/12/01*
*專案維護者：Mike*
