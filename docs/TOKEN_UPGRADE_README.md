# Token 升級機制 - 快速導覽

> **Team 10 - 整合團隊** | 完成時間：2026-01-28 | 狀態：✅ 完成

---

## 📚 文件導覽

### 🎯 快速開始

1. **我想了解整合細節** → [TOKEN_UPGRADE_INTEGRATION.md](./TOKEN_UPGRADE_INTEGRATION.md)
   - 實作概述
   - 程式碼說明
   - API 規格
   - 測試計畫

2. **我想手動測試** → [token-upgrade-test-guide.html](./token-upgrade-test-guide.html)
   - 互動式測試介面
   - 一鍵設定 Token
   - 測試腳本範例

3. **我想看工作流程** → [token-upgrade-workflow.md](./token-upgrade-workflow.md)
   - 完整流程圖
   - 錯誤處理流程
   - 時序圖
   - 監控指標

4. **我想看完成報告** → [TEAM10_TOKEN_UPGRADE_INTEGRATION_COMPLETE.md](../TEAM10_TOKEN_UPGRADE_INTEGRATION_COMPLETE.md)
   - 任務摘要
   - 完成項目
   - 驗證結果
   - 交付清單

---

## 🚀 快速測試

### 方法 1：使用互動式測試指南

```bash
# 在瀏覽器開啟
open docs/token-upgrade-test-guide.html
```

### 方法 2：手動測試

```javascript
// 1. 在 Console 設定 Token
localStorage.setItem('pending_trust_token', '00000000-0000-0000-0000-000000000001');

// 2. 訪問登入頁面
window.location.href = '/maihouses/auth.html';

// 3. 登入後觀察 Console 輸出
// 應看到：[auth] Trust case upgraded successfully: {...}

// 4. 確認 Token 已清除
localStorage.getItem('pending_trust_token'); // 應回傳 null
```

### 方法 3：自動驗證

```bash
# 執行驗證腳本
node scripts/verify-token-upgrade-integration.js
```

---

## 📁 檔案結構

```
maihouses/
├── public/
│   └── auth.html                              # ✅ 整合 Token 升級邏輯
│
├── api/
│   └── trust/
│       ├── upgrade-case.ts                    # ✅ API 端點
│       └── __tests__/
│           └── upgrade-case.test.ts           # ✅ API 測試
│
├── docs/
│   ├── TOKEN_UPGRADE_INTEGRATION.md           # 📘 整合文件
│   ├── token-upgrade-test-guide.html          # 🧪 測試指南
│   ├── token-upgrade-workflow.md              # 📊 工作流程圖
│   └── TOKEN_UPGRADE_README.md                # 📖 本檔案
│
├── scripts/
│   └── verify-token-upgrade-integration.js    # ✅ 驗證腳本
│
└── TEAM10_TOKEN_UPGRADE_INTEGRATION_COMPLETE.md  # 📋 完成報告
```

---

## 🔧 核心實作

### 修改檔案

**檔案：** `public/auth.html`

**位置：** 第 1604-1644 行（`successRedirect` 函數）

**功能：** 在用戶登入成功後，檢查 localStorage 是否有待升級的 token，如果有則呼叫 API 進行升級。

### API 端點

**端點：** `POST /api/trust/upgrade-case`

**請求：**

```json
{
  "token": "UUID",
  "userId": "user-id",
  "userName": "用戶名稱"
}
```

**回應：**

```json
{
  "success": true,
  "data": {
    "case_id": "case-uuid",
    "message": "案件已成功升級為已註冊用戶"
  }
}
```

---

## ✅ 驗證清單

- ✅ 程式碼修改完成
- ✅ TypeScript 檢查通過
- ✅ 驗證腳本通過
- ✅ 文件完整
- ✅ 測試工具齊全

---

## 🎓 技術亮點

### 1. 非阻塞設計

Token 升級不會阻塞登入流程，即使失敗也不影響用戶體驗。

### 2. 自動清理

無論成功或失敗，都會清除 localStorage 中的 token，避免重複嘗試。

### 3. 完整錯誤處理

分別處理成功、業務邏輯失敗、網路錯誤三種情況。

### 4. 智慧用戶名稱提取

優先使用 Google 名稱，其次使用 Email 前綴，最後使用預設值。

---

## 📊 測試覆蓋

| 場景        | 說明                 | 狀態   |
| ----------- | -------------------- | ------ |
| ✅ 正常流程 | Token 有效，升級成功 | 已驗證 |
| ✅ 無 Token | 跳過升級邏輯         | 已驗證 |
| ✅ API 失敗 | Token 無效或已過期   | 已驗證 |
| ✅ 網路錯誤 | 網路中斷或超時       | 已驗證 |

---

## 🔗 相關資源

### 內部連結

- [API 文件](./api-trust-upgrade-case.md)
- [Trust Privacy Guide](./trust-privacy-guide.md)
- [Migration Status](../supabase/migrations/MIGRATION_STATUS.md)

### 外部資源

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Vercel Functions Docs](https://vercel.com/docs/functions)

---

## 💡 常見問題

### Q1：Token 會被重複使用嗎？

**A：** 不會。無論升級成功或失敗，token 都會從 localStorage 清除。

### Q2：升級失敗會影響登入嗎？

**A：** 不會。升級邏輯是非阻塞的，失敗不影響正常登入和重定向。

### Q3：如何追蹤升級成功率？

**A：** 可在 Console 查看日誌，或整合 Analytics 追蹤事件。

### Q4：多裝置登入會怎樣？

**A：** Token 只能使用一次，第一個登入的裝置會成功升級，其他裝置會收到「Token 已使用」錯誤。

### Q5：Token 有效期多久？

**A：** 由後端設定，預設為 7 天（可在 RPC 函數中調整）。

---

## 📞 支援

### 問題回報

如遇到問題，請提供：

1. 瀏覽器 Console 日誌
2. Network 標籤截圖
3. localStorage 內容
4. 使用的瀏覽器和版本

### 聯絡方式

- **團隊**：Team 10 - 整合團隊
- **專案**：MaiHouses Trust Room

---

## 🏆 致謝

感謝所有參與此次整合的團隊成員！

特別感謝：

- **Team 5**：提供 `upgrade-case.ts` API 端點
- **Product Team**：提供需求和測試回饋

---

**文件版本**：1.0
**最後更新**：2026-01-28
**維護者**：Team 10 - 整合團隊
