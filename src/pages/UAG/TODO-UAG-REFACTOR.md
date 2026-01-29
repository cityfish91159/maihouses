# UAG 重構改進計畫

> 建立日期：2026-01-10
> 狀態：待執行

---

## 改進項目

### 1. 拆分 useUAG.ts Hook ⏳

**問題：** `useUAG.ts` 承擔過多職責（數據獲取、購買邏輯、Realtime 訂閱）

**方案：** 拆分為三個專職 Hook

- `useUAGData.ts` - 數據獲取與快取管理
- `useLeadPurchase.ts` - 購買邏輯與樂觀更新
- `useRealtimeUpdates.ts` - S 級升級 Realtime 訂閱

**影響檔案：**

- `src/pages/UAG/hooks/useUAG.ts`
- `src/pages/UAG/index.tsx`

---

### 2. 重構 Lead 類型定義 ⏳

**問題：** `Lead.id` 在不同狀態下含義不同

- 未購買時：`id = session_id`
- 已購買時：`id = purchase UUID`

**方案：** 區分為兩種類型

```typescript
interface BaseLead {
  session_id: string;
  name: string;
  grade: Grade;
  intent: number;
  // ...共用欄位
}

interface UnpurchasedLead extends BaseLead {
  status: 'new';
}

interface PurchasedLead extends BaseLead {
  status: 'purchased';
  purchase_id: string; // UUID
  purchased_at: string;
  conversation_id?: string;
  notification_status?: NotificationStatus;
  remainingHours?: number;
}

type Lead = UnpurchasedLead | PurchasedLead;
```

**影響檔案：**

- `src/pages/UAG/types/uag.types.ts`
- `src/pages/UAG/services/uagService.ts`
- `src/pages/UAG/components/AssetMonitor.tsx`
- `src/pages/UAG/components/ActionPanel.tsx`

---

### 3. 增加核心流程單元測試 ⏳

**問題：** 目前只有 `AssetMonitor-buttons.test.tsx`，核心流程缺乏測試

**需新增測試：**

- [ ] `useUAG.test.ts` - 購買流程測試
- [ ] `useLeadSelection.test.ts` - 選中狀態測試
- [ ] `uagService.test.ts` - 數據轉換測試
- [ ] `ActionPanel.test.tsx` - 購買按鈕互動測試

**測試重點：**

- 購買成功/失敗的狀態變化
- 樂觀更新與回滾
- Mock/Live 模式切換
- 配額驗證邏輯

---

### 4. 移除 console.log ⏳

**問題：** 生產環境不應有 console.log（違反 CLAUDE.md 規範）

**方案：**

- 搜尋所有 `console.log` / `console.warn` / `console.error`
- 改用 `src/lib/logger.ts` 或直接移除
- 保留必要的錯誤處理（透過 Sentry）

**影響檔案：**

- `src/pages/UAG/hooks/useUAG.ts`
- `src/pages/UAG/services/uagService.ts`
- `api/uag/send-message.ts`
- `api/uag/track.ts`

---

### 5. 整合演示版本代碼 ⏳

**問題：** `UAGDeAIDemo.tsx` 和 `UAGDeAIDemoV2.tsx` 與主版本重複代碼多

**方案：** 透過 feature flag 統一管理

```typescript
// uag-config.ts
export const UAG_FEATURES = {
  showAI: true, // 是否顯示 AI 建議
  showRadar: true, // 是否顯示雷達
  demoMode: false, // 演示模式（簡化 UI）
};

// index.tsx
const features = useUAGFeatures(); // 從 URL 參數或配置讀取
```

**影響檔案：**

- `src/pages/UAG/index.tsx`
- `src/pages/UAG/uag-config.ts`
- 可刪除：`UAGDeAIDemo.tsx`, `UAGDeAIDemoV2.tsx`

---

## 執行順序建議

1. **移除 console.log** - 最簡單，立即可做
2. **重構 Lead 類型** - 釐清資料模型
3. **拆分 useUAG Hook** - 降低複雜度
4. **增加單元測試** - 確保重構正確性
5. **整合演示版本** - 減少維護成本

---

## 備註

完成每項後記得：

- [ ] `npm run typecheck` 通過
- [ ] `npm run lint` 通過
- [ ] 相關測試通過
