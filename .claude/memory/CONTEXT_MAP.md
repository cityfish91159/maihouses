# Context Mastery - 檔案依賴地圖

## 📊 檔案大小分析

| 檔案                                    | 行數 | Token 估算 | 策略                      |
| --------------------------------------- | ---- | ---------- | ------------------------- |
| `api/lib/apiResponse.ts`                | 189  | ~800       | 完整讀取                  |
| `api/lib/__tests__/apiResponse.test.ts` | 241  | ~1000      | 完整讀取                  |
| `api/community/wall.ts`                 | 1098 | ~5000      | **分段讀取** (行 170-220) |

**Token 節省**: 避免重複讀取 wall.ts 完整內容，僅讀取目標函數區域

---

## 🔗 依賴關係圖

```
api/lib/apiResponse.ts (核心模組)
  ├── 被依賴:
  │   ├── api/community/wall.ts (✅ 已使用)
  │   ├── api/uag/send-message.ts (✅ 已使用)
  │   └── api/uag/track.ts (✅ 已使用)
  │
  ├── 測試:
  │   └── api/lib/__tests__/apiResponse.test.ts
  │
  └── 導出:
      ├── ApiResponse<T> interface
      ├── successResponse<T>()
      ├── errorResponse()
      ├── API_ERROR_CODES
      └── API_WARNING_CODES

api/community/wall.ts (問題所在)
  └── 遺留函數: resolveSupabaseErrorDetails (行 176-202)
      └── ❌ 僅定義，未被呼叫！
```

---

## ✅ Context Mastery 結論

### 發現 1: resolveSupabaseErrorDetails **完全未使用**

```bash
Grep 搜尋結果:
- 定義位置: api/community/wall.ts:176
- 呼叫次數: 0 次
```

**結論**: 可以**安全移除**，無需重構！

### 發現 2: 修復順序優化

**原計畫**:

1. P4 → P2 → P3 → P1 → P5

**優化後** (基於依賴分析):

1. **P1** (移除未使用函數) ← **最簡單，先做**
2. **P4** (導出型別) ← 獨立
3. **P2** (errorResponse 型別) ← 依賴 P4
4. **P3** (魔術數字) ← 獨立
5. **P5** (測試) ← 依賴所有修復

### Token 節省策略

```typescript
// ❌ 浪費 Token
Read: file_path="api/community/wall.ts" (完整 1098 行)

// ✅ 節省 Token
Read: file_path="api/community/wall.ts" offset=170 limit=50 (僅 50 行)
```

---

## 📋 最小讀取集合

**必讀**:

- [x] `api/lib/apiResponse.ts` (189 行) - 完整
- [x] `api/lib/__tests__/apiResponse.test.ts` (241 行) - 完整
- [x] `api/community/wall.ts` (行 170-220) - 部分

**不需讀取**:

- [ ] `api/uag/send-message.ts` - 已在審核時讀過
- [ ] `api/uag/track.ts` - 已在審核時讀過
- [ ] `api/community/wall.ts` 其他部分 - 不影響修復

**預估 Token 使用**: ~2000 tokens (vs 原本 ~7000)
**節省比例**: 71%

---

**建立時間**: 2026-01-15 16:12
