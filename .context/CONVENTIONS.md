# 工程慣例與規範

> 補充 `CLAUDE.md` 未展開的細節。兩份搭配閱讀，此處不重複 `CLAUDE.md` 已有的規則。

---

## 一、SOLID 原則（展開說明）

### S — Single Responsibility

- 每個元件/函式/hook 只負責一件事
- 超過 80 行的元件必須拆分
- 超過 3 個 state → 抽 custom hook
- 超過 2 個子區塊 → 拆成子元件

### O — Open/Closed

- 元件透過 props 擴展功能，不修改既有元件邏輯

### L — Liskov Substitution

- 子類型（如不同的 Card 元件）可互換使用

### I — Interface Segregation

- TypeScript interface 不包含使用者不需要的屬性，拆成小介面再組合

### D — Dependency Inversion

- 元件依賴抽象（interface/type），不直接依賴具體的 Supabase client

---

## 二、DRY 規則

- 2 處以上重複邏輯必須抽成共用函式或 hook
- UI 模式重複出現時抽成共用元件（如 PropertyCard、StatusBadge）
- API 呼叫模式統一用 service layer 封裝

---

## 三、Composition over Inheritance

- 使用 custom hooks 組合邏輯，不使用 class component
- 小元件組合成大元件，不建立萬能元件
- 範例：`useUAGScore()` + `useLeadFilter()` 組合成 `useLeadDashboard()`

---

## 四、程式碼品質模式

### 4.1 Type-First Development（型別優先）

```typescript
// ✅ 先定義 interface，再寫實作
interface Lead {
  id: string
  grade: 'S' | 'A' | 'B' | 'C' | 'F'
  intent: number
  purchasedAt: string | null
  remainingHours: number
}

// ❌ 禁止 any — 用 unknown + type narrowing
```

- 所有函式的參數和回傳值必須有明確型別
- API response 一律定義對應的 interface
- 共用型別放在 `src/types/`
- Props interface 命名為 `{ComponentName}Props`

### 4.2 Early Return Pattern

```typescript
// ✅ Guard clause，提前返回
function processLead(lead: Lead | null): string {
  if (!lead) return 'N/A'
  if (lead.grade === 'F') return '不合格'
  if (!lead.purchasedAt) return '未購買'
  return `已購買 - ${lead.grade}級`
}
```

- 禁止超過 2 層巢狀 — 用 early return 展平

### 4.3 Explicit over Implicit

```typescript
// ✅ 用命名常數
const UAG_PROTECTION_DAYS = 7
const MAX_S_QUOTA = 5
const LEAD_PRICE_MAP = { S: 500, A: 300, B: 150, C: 80 } as const

// ❌ 禁止 magic number
```

### 4.4 Fail Fast

```typescript
// ✅ 函式開頭驗證輸入
function purchaseLead(agentId: string, leadId: string, grade: string) {
  if (!agentId) throw new Error('Agent ID is required')
  if (!leadId) throw new Error('Lead ID is required')
  if (!['S', 'A', 'B', 'C'].includes(grade)) {
    throw new Error(`Invalid grade: ${grade}`)
  }
  // ... 正式邏輯
}
```

### 4.5 Immutability

```typescript
// ✅ 用 spread 或 map 產生新物件
const updatedLeads = leads.map(lead =>
  lead.id === targetId ? { ...lead, status: 'purchased' } : lead
)

// ❌ 禁止直接 mutate
```

---

## 五、React 元件規範

### 5.1 元件只負責 UI

```typescript
// ✅ 邏輯抽離到 hook，元件只渲染
const LeadCard: React.FC<LeadCardProps> = ({ lead, onPurchase }) => (
  <div className="lead-card">
    <GradeBadge grade={lead.grade} />
    <LeadInfo lead={lead} />
    <PurchaseButton onClick={() => onPurchase(lead.id)} />
  </div>
)

// ❌ 禁止在元件內直接呼叫 Supabase
```

### 5.2 Custom Hook 設計

```typescript
function useLeadPurchase() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const purchase = async (leadId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await leadService.purchaseLead(leadId)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : '購買失敗')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { purchase, isLoading, error }
}
```

**Hook 命名規範**：
- `use{Feature}` — 功能 hook（如 `useUAGDashboard`）
- `use{Feature}Query` — 資料讀取（如 `useLeadsQuery`）
- `use{Feature}Mutation` — 資料寫入（如 `useLeadPurchase`）

### 5.3 非同步操作三態處理

所有非同步操作必須處理：loading / error / empty

```typescript
function LeadList() {
  const { leads, isLoading, error } = useLeadsQuery()

  if (isLoading) return <Skeleton count={5} />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />
  if (leads.length === 0) return <EmptyState message="目前沒有精準客" />

  return leads.map(lead => <LeadCard key={lead.id} lead={lead} />)
}
```

### 5.4 事件處理命名

```typescript
// Props 用 on 開頭
interface Props {
  onPurchase: (id: string) => void
  onFilter: (grade: string) => void
}

// Handler 用 handle 開頭
const handlePurchase = (id: string) => { ... }
const handleFilter = (grade: string) => { ... }
```

---

## 六、Supabase 規範

### 6.1 Service Layer 封裝

```typescript
// src/services/leadService.ts
export const leadService = {
  async getLeadsByGrade(grade: Lead['grade']): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('grade', grade)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`查詢失敗: ${error.message}`)
    return data ?? []
  },
}
```

### 6.2 資料轉換層

```typescript
// Supabase snake_case → 前端 camelCase 統一在 service layer 轉換
function transformLead(raw: LeadRow): Lead {
  return {
    id: raw.id,
    grade: raw.grade,
    intent: raw.intent,
    purchasedAt: raw.purchased_at,
    remainingHours: raw.remaining_hours,
  }
}
```

- Supabase 表和欄位一律 `snake_case`
- 前端 TypeScript 一律 `camelCase`
- 轉換在 service layer 完成，元件不接觸原始資料

### 6.3 RLS 與安全

- 所有表必須啟用 RLS
- 前端只使用 `anon key`，絕不暴露 `service_role_key`
- 敏感操作使用 RPC function，在資料庫端做原子操作
- SQL migration 檔案放在 `supabase/migrations/`，含完整 RLS 政策

### 6.4 SQL 檔案規範

```sql
-- ============================================
-- 功能名稱：精準客購買交易
-- 建立日期：2025-02-12
-- ============================================

-- 1. 建表
CREATE TABLE IF NOT EXISTS leads ( ... );

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_leads_grade ON leads(grade);

-- 3. RLS 政策
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents_can_view_leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. RPC 函式
CREATE OR REPLACE FUNCTION purchase_lead_transaction(...)
```

---

## 七、Vercel Serverless API 規範

### 7.1 統一回傳格式

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```

### 7.2 API handler 結構

```typescript
// api/uag/leads/purchase.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 方法檢查
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '只允許 POST' },
    })
  }

  // 2. 認證檢查
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '未登入' },
    })
  }

  // 3. 參數驗證（Zod safeParse）

  try {
    // 4. 商業邏輯
    const result = await supabase.rpc('purchase_lead_transaction', { ... })
    return res.status(200).json({ success: true, data: result })
  } catch (err) {
    // 5. 錯誤處理
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '系統錯誤' },
    })
  }
}
```

---

## 八、CSS / Tailwind 規範

### 8.1 品牌色

```typescript
const BRAND_COLORS = {
  primary: '#00385a',     // 深藍 — 主要 CTA
  primaryHover: '#004E7C',
  accent: '#0066A2',      // 輔助藍
  lightBg: '#E6F3FA',     // 淺藍背景
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
}
```

### 8.2 響應式設計

- **Mobile First**：預設寫手機版，再用 breakpoint 擴展
- 斷點：`sm:640px` / `md:768px` / `lg:1024px` / `xl:1280px`
- 觸控目標最小 44×44px
- 文字最小 14px（手機）/ 16px（桌面）

### 8.3 CSS 禁止事項

- `!important` — 除非覆蓋第三方套件
- inline style — 除非動態計算值
- magic number margin/padding — 用 Tailwind spacing scale 或 CSS 變數

---

## 九、命名規範總表

| 類型 | 規範 | 範例 |
|------|------|------|
| 元件 | PascalCase | `LeadCard.tsx` |
| Hook | camelCase + `use` 前綴 | `useLeadPurchase.ts` |
| Service | camelCase + `Service` 後綴 | `leadService.ts` |
| 型別/Interface | PascalCase | `Lead`, `PurchaseResult` |
| 常數 | UPPER_SNAKE_CASE | `MAX_S_QUOTA` |
| CSS class | kebab-case 或 Tailwind | `lead-card` |
| Supabase 表/欄 | snake_case | `trust_transactions` |
| API route | kebab-case | `/api/uag/leads/purchase` |
| 事件 Props | `on` + 動作 | `onPurchase` |
| Handler | `handle` + 動作 | `handlePurchase` |

---

## 十、錯誤處理模式

```typescript
// 統一錯誤訊息提取
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '發生未知錯誤'
}

// API 呼叫統一用 try/catch
try {
  const result = await leadService.purchaseLead(id)
  toast.success('購買成功！')
} catch (err) {
  toast.error(getErrorMessage(err))
}
```

> 注意：前端日誌統一使用 `src/lib/logger.ts`，不直接使用 `console.log`（見 `CLAUDE.md` 禁止清單）。

---

## 十一、完整禁止清單

> 補充 `CLAUDE.md` 禁止清單的展開說明。

1. 絕不使用 `any` — 用 `unknown` + type guard
2. 絕不在前端暴露 `service_role_key` — 只放 Vercel 環境變數
3. 絕不寫超過 3 層巢狀 — 用 early return
4. 絕不在元件內直接呼叫 Supabase — 走 service layer
5. 絕不用 `!important` — 除非覆蓋第三方套件
6. 絕不忽略 TypeScript 錯誤 — 不加 `@ts-ignore`
7. 絕不建議換框架 — 不建議改用 Next.js、Firebase 等
8. 絕不省略錯誤處理 — 每個 async 都要 try/catch
9. 絕不使用 `var` — 只用 `const`（優先）或 `let`
10. 絕不 commit `.env` — 只 commit `.env.example`

---

## 十二、專案術語表

> 補充 `ARCHITECTURE.md` 術語表的完整版。

| 中文名稱 | 英文代號 | 說明 |
|---------|---------|------|
| 精準客 | UAG Lead | User Activity Grading 系統篩選的客戶 |
| 客戶分級 | UAG Grade | S/A/B/C/F 五級評分 |
| 兩好一公道 | Two Good One Fair | 房仲揭露制度：2 個優點 + 1 個誠實缺點 |
| 安心留痕 | Trust Room | 交易追蹤系統 |
| 社區牆 | Community Wall | 住戶評論系統 |
| 保護期 | Protection Period | 購買精準客後的獨佔期（7天）|
| 電梯時刻 | Elevator Moment | 精準客推送通知的展示機制 |
| 邁房子 | MaiHouses | 平台品牌名稱 |

---

## 十三、完成檢查清單（展開版）

- [ ] 功能正確：需求全部實作
- [ ] 型別安全：無 `any`、無 `as` 斷言
- [ ] 錯誤處理：loading / error / empty 三態
- [ ] 安全性：RLS 啟用、無密鑰暴露
- [ ] 效能：無不必要的 re-render
- [ ] Supabase：查詢有適當的 index
- [ ] `npm run gate` 通過
- [ ] 相關測試通過
