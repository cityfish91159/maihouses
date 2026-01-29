# TrustRoom Components

安心留痕相關組件庫

## DataCollectionModal

資料收集 Modal，用於收集用戶的基本資料以進行法律留痕。

### Props

```typescript
interface DataCollectionModalProps {
  isOpen: boolean; // Modal 開啟狀態
  onSubmit: (data: {
    // 送出回調
    name: string;
    phone: string;
    email: string;
  }) => void;
  onSkip: () => void; // 跳過/關閉回調
  isSubmitting?: boolean; // 送出中狀態（選填）
}
```

### 使用範例

```typescript
import { useState } from 'react';
import { DataCollectionModal } from '@/components/TrustRoom';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: { name: string; phone: string; email: string }) => {
    setIsSubmitting(true);
    try {
      // 呼叫 API 儲存資料
      await saveTrustData(data);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        開啟資料收集 Modal
      </button>

      <DataCollectionModal
        isOpen={isOpen}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
```

### 功能特性

- ✅ **表單驗證**：姓名和電話為必填，Email 為選填
- ✅ **Zod Schema 驗證**：完整的類型安全和運行時驗證
- ✅ **無障礙性 (A11y)**：完整的 ARIA 屬性和鍵盤導航支援
  - Focus Trap：Tab 循環在 Modal 內
  - Escape 鍵關閉
  - 自動聚焦第一個輸入框
- ✅ **響應式設計**：在桌面和移動裝置上都有良好體驗
- ✅ **Loading 狀態**：送出時禁用所有互動元素
- ✅ **表單自動重置**：使用 React key prop 模式，Modal 重新開啟時自動清空

### 驗證規則

```typescript
// 姓名
- 必填
- 最多 50 字

// 電話
- 必填
- 最多 20 字
- 只允許數字、連字號、加號、括號、空格

// Email
- 選填
- 最多 100 字
- 符合 Email 格式
```

### 樣式規範

組件使用專案的 Design Tokens：

- 品牌色：`brand-600`, `brand-700`
- 語意化陰影：`shadow-2xl`
- 動畫：`animate-in fade-in zoom-in-95`
- z-index：`z-modal` (定義於 tailwind.config.cjs)

### 測試覆蓋

- ✅ Modal 顯示/隱藏
- ✅ 必填欄位驗證
- ✅ 表單送出
- ✅ 跳過功能
- ✅ Loading 狀態
- ✅ 無障礙性 (ARIA)
