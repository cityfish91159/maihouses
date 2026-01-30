# Code Review 方法論指南

**適用對象:** 所有參與代碼審核的開發者、AI 審核員
**目標:** 建立一致、專業、有效的代碼審核標準

---

## 目錄

1. [為什麼需要 Code Review](#為什麼需要-code-review)
2. [審核前準備](#審核前準備)
3. [7 大審核維度](#7-大審核維度)
4. [審核執行流程](#審核執行流程)
5. [評分標準](#評分標準)
6. [常見錯誤與陷阱](#常見錯誤與陷阱)
7. [實戰案例](#實戰案例)

---

## 為什麼需要 Code Review

### Google 的核心原則

> "There is no such thing as 'perfect' code—there is only **better** code."

Code Review 的目標**不是找錯誤**，而是：
1. ✅ 讓代碼變得**更好**
2. ✅ 確保代碼**健康度持續提升**
3. ✅ 分享知識，提升團隊技能
4. ✅ 維持代碼一致性

### 常見誤區

| ❌ 錯誤做法 | ✅ 正確做法 |
|------------|-----------|
| 只檢查有沒有錯誤 | 評估代碼品質 |
| 追求完美，全部打掉重寫 | 持續改進，接受「足夠好」 |
| 只看片段代碼（grep 幾行） | 理解整體邏輯和脈絡 |
| 給 100 分或 0 分 | 給出合理的 70-90 分範圍 |
| 只說「不好」 | 說明「為什麼不好」和「如何改進」 |

---

## 審核前準備

### 1. 理解審核目標

在開始審核前，必須明確：
- **這個 PR/變更要解決什麼問題？**
- **為什麼要這樣改？**
- **預期的用戶體驗是什麼？**

❌ **錯誤示範:**
```
看到代碼就開始 grep 關鍵字，沒有理解背景
```

✅ **正確做法:**
```
1. 閱讀 PR 描述 / 工單說明
2. 理解業務需求
3. 了解技術背景
4. 再開始看代碼
```

### 2. 建立審核檢查清單

根據專案特性，準備你的 checklist：

**通用檢查項:**
- [ ] 功能是否正確？
- [ ] 代碼是否易讀？
- [ ] 是否有重複代碼？
- [ ] 是否有測試？
- [ ] 是否有安全風險？
- [ ] 是否有效能問題？
- [ ] 是否符合團隊規範？

**專案特定檢查項（以 maihouses 為例）:**
- [ ] 是否使用 design tokens（bg-brand-xxx）？
- [ ] 是否移除硬編碼顏色？
- [ ] 文案是否去 AI 味？
- [ ] 是否使用 SVG 而非 emoji？
- [ ] 是否有無障礙支援（ARIA）？

### 3. 準備審核工具

**自動化工具（必須執行）:**
```bash
npm run typecheck   # TypeScript 類型檢查
npm run lint        # ESLint 代碼風格檢查
npm test            # 單元測試
npm run build       # 建置測試
```

**手動檢查（核心）:**
- 完整閱讀代碼
- 理解邏輯流程
- 思考邊界情況

---

## 7 大審核維度

### 1. 功能正確性 (Functionality)

**檢查重點:**
- 代碼是否做到它應該做的事？
- 是否處理了所有邊界情況？
- 用戶體驗是否符合預期？

**審核方法:**

```
❌ 錯誤: 只看「有沒有新功能」
✅ 正確: 想像用戶實際使用場景
```

**實例:**

```typescript
// ❌ 功能不完整
function formatPhone(phone: string) {
  return phone.slice(0, 4) + '-' + phone.slice(4);
}

// 問題:
// 1. 如果 phone 不足 4 位怎麼辦？
// 2. 如果 phone 是 null/undefined？
// 3. 如果 phone 包含非數字字符？
```

**審核評語:**
```markdown
Line 10: formatPhone 未處理邊界情況
- 缺少輸入驗證
- 缺少長度檢查
- 建議使用 Zod schema 驗證
```

---

### 2. 可讀性 (Readability)

**核心問題:** 其他開發者能看懂嗎？

**檢查清單:**
- [ ] 變數命名是否清晰？
- [ ] 函數是否單一職責？
- [ ] 複雜邏輯是否有註解？
- [ ] 代碼結構是否清晰？

**實例:**

```typescript
// ❌ 可讀性差
const d = new Date();
const t = d.getTime();
const e = new Date(expiresAt);
const diff = e.getTime() - t;
return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

// ✅ 可讀性好
const getDaysRemaining = (expiresAt: string): number => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diff = expires.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / millisecondsPerDay);
  return Math.max(0, daysRemaining);
};
```

**審核評語:**
```markdown
✅ Line 33-38: getDaysRemaining 函數清晰易懂
- 命名明確表達意圖
- 抽取 millisecondsPerDay 常數
- 邏輯步驟清楚
```

---

### 3. 複雜度 (Complexity)

**核心問題:** 代碼可以更簡單嗎？

**警訊:**
- 三層以上的嵌套 if/三元運算
- 超過 50 行的函數
- 重複的代碼塊
- 過度設計的抽象

**實例:**

```typescript
// ❌ 複雜度過高 - 三層嵌套三元
{role === 'agent' ? (
  timeLeft === '已逾期' ? '付款已截止' : isBusy ? '處理中...' : '房仲代付 NT$ 2,000'
) : (
  '等待房仲付款...'
)}

// ✅ 重構 - 抽取函數
const getPaymentButtonText = () => {
  if (role !== 'agent') return '等待房仲付款...';
  if (timeLeft === '已逾期') return '付款已截止';
  if (isBusy) return '處理中...';
  return '房仲代付 NT$ 2,000';
};

{getPaymentButtonText()}
```

**審核評語:**
```markdown
⚠️ Line 351-362: 三元嵌套過深，難以閱讀
建議重構:
1. 抽取為 getPaymentButtonText() 函數
2. 使用 if-return 提前返回
3. 降低認知負擔
```

---

### 4. 測試 (Testing)

**檢查清單:**
- [ ] 是否有對應的測試檔案？
- [ ] 測試是否覆蓋主要邏輯？
- [ ] 是否測試邊界情況？
- [ ] 測試是否易懂？

**審核方法:**

```
對於每個新功能，問自己:
1. 如果這個功能壞了，測試會發現嗎？
2. 如果改了這段代碼，測試會失敗嗎？
3. 測試是否測試了「正確的事」？
```

**實例:**

```typescript
// 代碼
function validatePhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone);
}

// ❌ 缺少測試檔案
// src/lib/validation.ts 存在
// src/lib/__tests__/validation.test.ts 不存在

// ✅ 應該有的測試
describe('validatePhone', () => {
  it('accepts valid Taiwan phone numbers', () => {
    expect(validatePhone('0912345678')).toBe(true);
  });

  it('rejects phone numbers not starting with 09', () => {
    expect(validatePhone('0212345678')).toBe(false);
  });

  it('rejects phone numbers with wrong length', () => {
    expect(validatePhone('091234567')).toBe(false);
    expect(validatePhone('09123456789')).toBe(false);
  });
});
```

**審核評語:**
```markdown
❌ 缺少測試: src/lib/validation.ts
- 風險: 修改正則時可能引入 bug
- 建議: 新增 validation.test.ts
- 應測試: 正常格式、錯誤前綴、錯誤長度、空字串、null
```

---

### 5. 效能 (Performance)

**檢查重點:**
- 是否有不必要的重新渲染？
- 是否有記憶體洩漏？
- 是否有大量計算未優化？

**常見問題:**

**問題 1: 缺少 useMemo/useCallback**
```typescript
// ❌ 每次 render 都重新計算
function Component({ data }) {
  const sorted = data.sort((a, b) => a.value - b.value);
  return <div>{sorted.map(...)}</div>;
}

// ✅ 使用 useMemo
function Component({ data }) {
  const sorted = useMemo(
    () => data.sort((a, b) => a.value - b.value),
    [data]
  );
  return <div>{sorted.map(...)}</div>;
}
```

**問題 2: 不必要的 window.reload()**
```typescript
// ❌ 破壞 SPA 體驗
window.location.reload();

// ✅ 使用狀態管理
const { refetch } = useQuery(...);
await refetch();
```

**審核評語:**
```markdown
🔴 嚴重效能問題 Line 144: window.location.reload()
- 問題: 強制刷新破壞 SPA 體驗，失去所有前端狀態
- 影響: 用戶體驗差，重新載入所有資源
- 建議: 使用 useTrustRoom hook 的 refetch 方法
```

---

### 6. 安全性 (Security)

**檢查清單:**
- [ ] 用戶輸入是否驗證？
- [ ] 是否有 XSS 風險？
- [ ] 是否有 SQL Injection 風險？
- [ ] 敏感資料是否暴露？

**常見風險:**

**風險 1: Token 在 URL 中**
```typescript
// ⚠️ 風險: Token 會出現在瀏覽器歷史記錄
const token = searchParams.get('token');

// 建議: 使用 POST body 或 sessionStorage
```

**風險 2: 錯誤訊息洩漏**
```typescript
// ❌ 可能洩漏後端細節
throw new Error(errorData.error);

// ✅ 過濾敏感訊息
const safeError = errorData.error?.includes('SQL')
  ? '操作失敗，請稍後再試'
  : errorData.error;
throw new Error(safeError);
```

**審核評語:**
```markdown
⚠️ Line 21-22: Token 從 URL 讀取
- 風險: Token 會留在瀏覽器歷史記錄
- 風險: Token 可能被記錄在 server logs
- 建議: 考慮使用 POST body 或 sessionStorage
```

---

### 7. 設計一致性 (Design Consistency)

**檢查重點:**
- 是否符合專案設計規範？
- 是否使用正確的 design tokens？
- UI 是否專業一致？

**專案特定規範（maihouses）:**

**規範 1: 不使用 emoji 作為 icon**
```typescript
// ❌ 違反規範
<span>📞 電話</span>

// ✅ 使用 Lucide SVG
import { Phone } from 'lucide-react';
<Phone className="size-4" /> 電話
```

**規範 2: 使用 design tokens**
```typescript
// ❌ 硬編碼顏色
<div style={{ background: '#1749D7' }}>

// ✅ 使用 design tokens
<div className="bg-brand-700">
```

**規範 3: 文案去 AI 味**
```typescript
// ❌ AI 味重
'此資訊僅供法律留痕使用，不會公開給房仲'

// ✅ 口語化
'資料只用於交易紀錄，不會外流'
```

**審核評語:**
```markdown
✅ Line 200-202: 正確使用 design tokens
- bg-brand-50, text-brand-700 符合規範
- ShieldCheck SVG 取代 emoji
- 文案簡潔口語化
```

---

## 審核執行流程

### Step 1: 第一遍快速掃描（5-10 分鐘）

**目標:** 建立整體印象

```
1. 看檔案結構 - 新增/修改了哪些檔案？
2. 看 import - 引入了什麼依賴？
3. 看 export - 對外暴露什麼？
4. 看主要函數 - 核心邏輯是什麼？
```

**產出:** 心中有個大概的理解

### Step 2: 執行自動化檢查（2-3 分鐘）

```bash
npm run typecheck  # 有 TypeScript 錯誤嗎？
npm run lint       # 有風格問題嗎？
npm test           # 測試通過嗎？
```

**記錄:** 所有錯誤和警告的數量

### Step 3: 深度閱讀代碼（20-30 分鐘）

**閱讀順序:**
1. 從 entry point 開始（如 export default function）
2. 按照執行流程順序讀
3. 遇到複雜邏輯停下來仔細理解
4. 邊讀邊在心裡問「為什麼這樣寫？」

**記錄:**
- 優點（寫得好的地方）
- 問題（需要改進的地方）
- 疑問（不確定的地方）

### Step 4: 檢查邊界情況（10-15 分鐘）

**問自己:**
- 如果輸入是 null/undefined 會怎樣？
- 如果網路斷線會怎樣？
- 如果資料格式不符預期會怎樣？
- 如果用戶狂點按鈕會怎樣？

### Step 5: 評分與撰寫評語（15-20 分鐘）

**評分框架:**
```
95-100 分: 幾乎完美，只有微小建議
85-94 分: 良好，有一些可改進項
75-84 分: 可接受，但有明顯問題需修復
60-74 分: 需要重大改進
<60 分: 建議重寫
```

**撰寫評語原則:**
1. 具體指出行號
2. 說明問題是什麼
3. 解釋為什麼是問題
4. 提供改進建議
5. 附上代碼範例（如果可能）

---

## 評分標準

### 評分維度權重

| 維度 | 權重 | 說明 |
|-----|------|------|
| 功能正確性 | 25% | 最重要 - 代碼必須能正常工作 |
| 可讀性 | 20% | 其他人能看懂嗎？ |
| 測試覆蓋 | 15% | 是否有測試保護？ |
| 安全性 | 15% | 是否有安全風險？ |
| 效能 | 10% | 是否有明顯效能問題？ |
| 設計一致性 | 10% | 是否符合專案規範？ |
| 複雜度 | 5% | 是否過度複雜？ |

### 扣分參考

**P0 - 必須修復（每項 -5 到 -10 分）:**
- 功能不正確
- 有安全漏洞
- 破壞性的效能問題（如 window.reload）
- 無障礙嚴重缺失
- 沒有測試的核心功能

**P1 - 應該修復（每項 -3 到 -5 分）:**
- 代碼重複（違反 DRY）
- 複雜度過高
- 缺少錯誤處理
- 文案/用語不一致
- 魔法數字過多

**P2 - 建議改進（每項 -1 到 -3 分）:**
- 缺少註解
- 變數命名不夠清晰
- 可以更簡潔的寫法
- 微小的一致性問題

### 評分範例

**範例 1: TrustRoom.tsx**

```
基礎分: 100

優點 (+0):
+ 樂觀更新機制專業
+ Realtime 訂閱清理正確
+ 進度條設計創新

P0 問題:
- Toast 缺少 ARIA 屬性 (-10)

P1 問題:
- 文案用語不一致（您/你） (-5)
- 進度計算邏輯可讀性差 (-4)

P2 問題:
- 魔法數字未抽取 (-3)

最終: 100 - 10 - 5 - 4 - 3 = 78/100
```

---

## 常見錯誤與陷阱

### 審核者常犯的錯誤

#### 錯誤 1: 只用 grep，不讀代碼

```bash
❌ 錯誤做法:
grep "emoji" file.tsx
# 沒有 emoji → 給 100 分

✅ 正確做法:
1. Read 完整檔案
2. 理解邏輯
3. 確認 emoji 改為什麼（SVG？文字？）
4. 檢查替代方案是否正確
```

#### 錯誤 2: 過度追求完美

```
❌ 錯誤心態:
「這裡可以用更好的設計模式，整個重寫！」

✅ 正確心態:
「這個實作可以接受，有兩個小改進建議。」
```

Google 原則: **沒有完美的代碼，只有更好的代碼**

#### 錯誤 3: 只說「不好」不說「為什麼」

```markdown
❌ 無用的評語:
「這段代碼寫得不好。」

✅ 有用的評語:
「Line 156-158: 進度計算邏輯使用 3 行完成一個任務，
建議抽取為 getProgressSteps() 函數。
原因: 提升可讀性，降低認知負擔。
範例: (附上重構後的代碼)」
```

#### 錯誤 4: 給不合理的分數

```
❌ 不合理:
- 全部 100 分（太假）
- 全部 60 分（太嚴苛）
- 沒有依據的分數

✅ 合理:
- 70-90 分的正態分佈
- 每個扣分項有明確依據
- 有優點也有缺點
```

#### 錯誤 5: 忽略整體脈絡

```
❌ 只看片段:
Line 144: window.reload()
評語: 「有用到 reload，通過。」

✅ 理解脈絡:
Line 144: window.reload()
評語: 「這是 SPA，使用 window.reload() 會破壞用戶體驗，
應該用 useTrustRoom hook 的 refetch 方法。」
```

---

## 實戰案例

### 案例 1: 審核一個 Modal 組件

**代碼:**
```typescript
export function DataCollectionModal({ isOpen, onSubmit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = () => {
    onSubmit({ name, phone });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50">
      <div className="bg-white p-6 rounded">
        <input value={name} onChange={e => setName(e.target.value)} />
        <input value={phone} onChange={e => setPhone(e.target.value)} />
        <button onClick={handleSubmit}>送出</button>
      </div>
    </div>
  );
}
```

**審核過程:**

**Step 1: 功能正確性**
- ❌ 沒有輸入驗證
- ❌ 沒有錯誤處理
- ❌ 沒有 loading 狀態

**Step 2: 可讀性**
- ⚠️ 缺少 TypeScript 類型
- ⚠️ 缺少 placeholder
- ⚠️ 缺少 label

**Step 3: 無障礙**
- ❌ input 沒有 label
- ❌ Modal 沒有 role="dialog"
- ❌ 沒有 Focus Trap

**Step 4: 設計一致性**
- ❌ 硬編碼顏色 bg-black/50
- ⚠️ 按鈕文字「送出」可更口語化

**評分:**
```
基礎: 100
- 缺少輸入驗證 (-10)
- 缺少類型定義 (-8)
- 無障礙缺失嚴重 (-15)
- 硬編碼顏色 (-5)
- 缺少錯誤處理 (-7)

最終: 55/100 （建議重寫）
```

**評語範例:**
```markdown
## DataCollectionModal 審核

### 🔴 P0 必須修復

**1. 缺少輸入驗證 (Line 13-14)**
- 問題: name 和 phone 可以是空字串
- 風險: 提交無效資料
- 建議: 使用 Zod Schema 驗證

**2. 無障礙嚴重缺失**
- Line 12-13: input 缺少 label，螢幕閱讀器無法識別
- Line 11: Modal 缺少 role="dialog" 和 aria-modal="true"
- 缺少 Focus Trap，用戶可以 tab 到背景元素

**3. 缺少 TypeScript 類型**
- Props 沒有 interface 定義
- onSubmit 參數類型不明確

### 🟡 P1 應該修復

**4. 硬編碼顏色 (Line 11)**
```typescript
className="fixed inset-0 bg-black/50"
建議: className="fixed inset-0 bg-overlay"
```

**5. 缺少錯誤處理**
- onSubmit 可能是 async，沒有處理錯誤
- 沒有 loading 狀態

### 💡 P2 建議

**6. 文案口語化**
- 「送出」→「確認送出」

### 評分: 55/100
建議參考 maihouses 現有的 DataCollectionModal 實作。
```

---

### 案例 2: 審核一個 API 調用

**代碼:**
```typescript
const handleConfirm = async (stepNum: number) => {
  if (!id || !token || confirming || !data) return;
  setConfirming(stepNum);
  const oldData = { ...data };
  setData({
    ...data,
    steps_data: data.steps_data.map((s) =>
      (s.step === stepNum ? { ...s, confirmed: true } : s)
    ),
  });

  try {
    const { data: result, error: rpcError } = await supabase.rpc(
      'confirm_trust_step',
      { p_id: id, p_token: token, p_step: stepNum }
    );

    if (rpcError) throw rpcError;

    if (result?.success) {
      showMessage('success', '確認成功！');
    } else {
      setData(oldData);
      showMessage('error', result?.error || '確認失敗');
    }
  } catch (err) {
    logger.error('[TrustRoom] 確認失敗', { error: err });
    setData(oldData);
    showMessage('error', '確認失敗，請稍後再試');
  } finally {
    setConfirming(null);
  }
};
```

**審核過程:**

**Step 1: 功能正確性**
- ✅ 樂觀更新 + Rollback 機制
- ✅ 錯誤處理完整
- ✅ 防止重複點擊（confirming 檢查）

**Step 2: 安全性**
- ✅ 使用 Supabase RPC（安全）
- ✅ 有 token 驗證

**Step 3: 用戶體驗**
- ✅ 即時反饋（樂觀更新）
- ✅ 錯誤時回滾
- ✅ Loading 狀態管理

**Step 4: 可讀性**
- ✅ 邏輯清晰
- ⚠️ 可加註解說明樂觀更新策略

**評分:**
```
基礎: 100
- 缺少註解 (-2)

最終: 98/100 （優秀）
```

**評語範例:**
```markdown
## handleConfirm 審核

### 🟢 優點

**1. 樂觀更新機制專業 (Line 4-9)**
- 先保存 oldData
- 立即更新 UI（給用戶即時反饋）
- 失敗時回滾（Line 21, 26）
- 這是**生產級**的 UX 處理

**2. 錯誤處理完整 (Line 13-28)**
- try-catch 包覆 async 操作
- 區分 RPC 錯誤和業務錯誤
- 使用 logger 記錄錯誤（便於 debug）
- 用戶友善的錯誤訊息

**3. 防止重複操作 (Line 3)**
- 檢查 confirming 狀態
- finally 中重置狀態
- 避免用戶狂點按鈕

### 💡 建議

**1. 加入註解說明策略**
```typescript
// 樂觀更新: 先更新 UI，失敗時回滾
const oldData = { ...data };
setData({ ... });
```

### 評分: 98/100
這是一個**範例級別**的實作，建議作為團隊參考。
```

---

## 審核報告模板

```markdown
# [功能名稱] Code Review 報告

**審核日期:** YYYY-MM-DD
**審核者:** [你的名字]
**審核範圍:** [檔案清單]

---

## 執行摘要

**總體評分:** XX/100
**通過狀態:** ✅ 通過 / ⚠️ 需改進 / ❌ 不通過

**主要發現:**
- [3-5 個關鍵點]

---

## 自動化檢查結果

```bash
npm run typecheck: [通過/失敗，X 個錯誤]
npm run lint: [通過/失敗，X 個警告]
npm test: [通過/失敗，X/Y 測試通過]
```

---

## [檔案名稱 1]

### ✅ 優點
1. [具體優點，附行號]
2. ...

### 🔴 P0 必須修復
1. [問題描述]
   - **位置:** Line XX
   - **問題:** [是什麼問題]
   - **影響:** [為什麼是問題]
   - **建議:** [如何修復]

### 🟡 P1 應該修復
...

### 💡 P2 建議改進
...

### 評分: XX/100
扣分原因: ...

---

## 跨檔案問題

### 1. [問題類別]
- **影響範圍:** [多個檔案]
- **建議:** [統一修復方案]

---

## 總體建議

### 🔥 必須修復 (P0)
1. [最重要的問題]

### ⚠️ 應該修復 (P1)
1. [次要問題]

### 💡 建議改進 (P2)
1. [改進建議]

---

## 結論

[2-3 段總結評價]
```

---

## 延伸閱讀

- [Google Engineering Practices - Code Review](https://google.github.io/eng-practices/review/)
- [The Complete Code Review Process for 2026](https://www.codeant.ai/blogs/good-code-review-practices-guide)
- [Code Review Checklist](https://blog.codacy.com/code-review-checklist)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**版本:** 1.0
**最後更新:** 2026-01-30
**維護者:** maihouses 開發團隊
