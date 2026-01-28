# Trust Room 隱私保護使用指南

## 快速開始

Trust Room 隱私保護工具函數位於 `src/lib/trustPrivacy.ts`，提供統一的隱私保護邏輯。

---

## 核心函數

### 1. `getBuyerDisplayName()`

根據檢視者角色返回買方顯示名稱。

```typescript
import { getBuyerDisplayName } from "@/lib/trustPrivacy";

// 在 UAG Dashboard（房仲視角）
const buyerInfo = getBuyerDisplayName(trustCase, "agent");
console.log(buyerInfo.name);        // "買方-ABCD"
console.log(buyerInfo.isAnonymous); // true
console.log(buyerInfo.fullText);    // "買方: 買方-ABCD"

// 在 Trust Room（買方視角）
const buyerInfo = getBuyerDisplayName(trustCase, "buyer");
console.log(buyerInfo.name);        // "王小明"
console.log(buyerInfo.isAnonymous); // false
console.log(buyerInfo.fullText);    // "王小明"
```

### 2. `getAgentDisplayInfo()`

根據檢視者角色返回房仲顯示資訊。

```typescript
import { getAgentDisplayInfo } from "@/lib/trustPrivacy";

// 在 Trust Room（買方視角）
const agentInfo = getAgentDisplayInfo("張三", "信義房屋", "buyer");
console.log(agentInfo.name);     // "張三"
console.log(agentInfo.company);  // "信義房屋"
console.log(agentInfo.fullText); // "對接房仲: 張三 (信義房屋)"

// 在 UAG Dashboard（房仲視角）
const agentInfo = getAgentDisplayInfo("張三", "信義房屋", "agent");
console.log(agentInfo.name);     // "您"
console.log(agentInfo.fullText); // "您 (信義房屋)"
```

### 3. `shouldShowSensitiveInfo()`

判斷是否應該顯示敏感資訊。

```typescript
import { shouldShowSensitiveInfo } from "@/lib/trustPrivacy";

// 檢視自己的資料
shouldShowSensitiveInfo("agent", "agent"); // true
shouldShowSensitiveInfo("buyer", "buyer"); // true

// 檢視他人的資料
shouldShowSensitiveInfo("agent", "buyer"); // false
shouldShowSensitiveInfo("buyer", "agent"); // false

// 系統視角
shouldShowSensitiveInfo("system", "agent"); // true
shouldShowSensitiveInfo("system", "buyer"); // true
```

---

## 類型定義

### ViewerRole

```typescript
type ViewerRole = "agent" | "buyer" | "system";
```

### BuyerDisplayInfo

```typescript
interface BuyerDisplayInfo {
  name: string;           // 顯示名稱（可能是代號）
  isAnonymous: boolean;   // 是否為匿名顯示
  fullText: string;       // 完整顯示文字
}
```

### AgentDisplayInfo

```typescript
interface AgentDisplayInfo {
  name: string;              // 顯示名稱
  company?: string;          // 公司名稱（可選）
  fullText: string;          // 完整顯示文字
}
```

---

## 實際使用案例

### 案例 1: Trust Room Header 顯示房仲資訊

**檔案**: `src/pages/Assure/Detail.tsx`

```tsx
import { getAgentDisplayInfo } from "../../lib/trustPrivacy";

export default function AssureDetail() {
  const { tx, role } = useTrustRoom();

  return (
    <header>
      {/* 其他 header 內容 */}

      {/* 房仲資訊顯示（買方視角） */}
      {tx && role === "buyer" && (
        <div className="mt-1 text-xs text-blue-200">
          {getAgentDisplayInfo(
            tx.agentName,
            tx.agentCompany,
            "buyer",
          ).fullText}
        </div>
      )}
    </header>
  );
}
```

### 案例 2: UAG Dashboard 案件選擇器

**檔案**: `src/pages/UAG/components/TrustFlow/CaseSelector.tsx`

```tsx
import { getBuyerDisplayName } from "../../../../lib/trustPrivacy";

export function CaseSelector({ cases }: CaseSelectorProps) {
  return (
    <div>
      {cases.map((c) => {
        const buyerDisplay = getBuyerDisplayName(c, "agent");
        return (
          <button key={c.id}>
            <div>{buyerDisplay.name}</div>
            {/* 其他案件資訊 */}
          </button>
        );
      })}
    </div>
  );
}
```

### 案例 3: 事件時間軸顯示參與者

**檔案**: `src/pages/UAG/components/TrustFlow/EventTimeline.tsx`

```tsx
import { getBuyerDisplayName } from "../../../../lib/trustPrivacy";

export function EventTimeline({ selectedCase }: EventTimelineProps) {
  return (
    <div>
      {selectedCase.events.map((event) => (
        <div key={event.id}>
          <span>
            {event.actor === "agent"
              ? "房仲"
              : event.actor === "buyer"
                ? getBuyerDisplayName(selectedCase, "agent").name
                : "系統"}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## 買方臨時代號生成規則

買方代號格式：`買方-XXXX`

**生成邏輯**（優先順序）：
1. 使用 `buyerId` 前 4 碼（大寫）
2. Fallback: 使用 `caseId` 前 4 碼（大寫）
3. 最終 Fallback: `買方-****`

**範例**：
```typescript
// buyerId = "ABCD1234"
getBuyerDisplayName({ id: "...", buyerId: "ABCD1234", buyerName: "王小明" }, "agent")
// 返回: { name: "買方-ABCD", isAnonymous: true, fullText: "買方: 買方-ABCD" }

// buyerId = "", caseId = "550e8400-e29b-41d4..."
getBuyerDisplayName({ id: "550e8400-e29b-41d4...", buyerId: "", buyerName: "王小明" }, "agent")
// 返回: { name: "買方-550E", isAnonymous: true, fullText: "買方: 買方-550E" }
```

---

## 測試

完整測試檔案位於 `src/lib/__tests__/trustPrivacy.test.ts`。

執行測試：
```bash
npm test src/lib/__tests__/trustPrivacy.test.ts
```

測試覆蓋：
- ✅ 16 個測試案例
- ✅ 所有邊界情況
- ✅ 類型安全驗證

---

## 注意事項

### 1. 資料來源
確保 `Transaction` 和 `TrustCase` 包含以下欄位：

**Transaction**（Trust Room）:
```typescript
{
  agentName?: string | null;
  agentCompany?: string | null;
  buyerName?: string | null;
  buyerId?: string | null;
}
```

**TrustCase**（UAG Dashboard）:
```typescript
{
  id: string;
  buyerId: string;
  buyerName: string;
}
```

### 2. Null/Undefined 處理
所有函數都能安全處理 `null` 或 `undefined` 輸入：
```typescript
getAgentDisplayInfo(null, null, "buyer")
// 返回: { name: "房仲", company: undefined, fullText: "對接房仲: 房仲" }
```

### 3. 角色驗證
始終傳入正確的 `viewerRole`：
- `"agent"` - 房仲視角（UAG Dashboard）
- `"buyer"` - 買方視角（Trust Room）
- `"system"` - 系統視角（管理後台、日誌）

---

## 擴展建議

### 1. 新增其他角色
如需新增其他角色（如管理員、稽核員），在 `ViewerRole` 類型中新增：
```typescript
type ViewerRole = "agent" | "buyer" | "system" | "admin" | "auditor";
```

並在函數中加入對應邏輯。

### 2. 更細緻的權限控制
可基於 `shouldShowSensitiveInfo()` 擴展更多權限控制邏輯：
```typescript
function canEditCase(viewerRole: ViewerRole, caseOwner: string): boolean {
  return viewerRole === "agent" || viewerRole === "system";
}

function canViewFullHistory(viewerRole: ViewerRole): boolean {
  return viewerRole === "system";
}
```

---

## 相關文件

- [Trust Room 實作報告](../TRUST_PRIVACY_IMPLEMENTATION.md)
- [Trust Flow 類型定義](../src/types/trust-flow.types.ts)
- [CLAUDE.md - 專案規範](../CLAUDE.md)

---

## 支援

如有問題或建議，請參考：
1. 測試檔案：`src/lib/__tests__/trustPrivacy.test.ts`
2. 型別定義：`src/lib/trustPrivacy.ts`
3. 實作報告：`TRUST_PRIVACY_IMPLEMENTATION.md`
