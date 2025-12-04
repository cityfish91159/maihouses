# 社區牆 TODO（2025-12-04）

> 最後更新：2025-12-04 19:10

---

## ✅ 已完成（2025-12-04 本輪）

### 1. Mock / 型別重複定義整併
- [x] 1-1 刪除 `Wall.backup.tsx` (內含重複 MOCK_DATA)
- [x] 1-2 grep 驗證 MOCK_DATA 只存在 `mockData.ts` 一處
- [x] 1-3 型別統一來源確認：`src/types/community.ts` → `types.ts` re-export

### 2. API communityInfo 對齊
- [x] 2-1 後端 `getAll()` 回傳 `communityInfo` 而非 `community`
- [x] 2-2 後端查詢新增 `year_built, total_units, management_fee, builder` 欄位
- [x] 2-3 `reviews.data` → `reviews.items`，`questions.data` → `questions.items`

### 3. GUEST_VISIBLE_COUNT 統一
- [x] 3-1 常數改為 4，註解說明「以完整物件為單位」
- [x] 3-2 ReviewsSection 改成先 slice reviews 再展開 pros/cons

### 4. 置頂排序統一
- [x] 4-1 導出 `sortPostsWithPinned()` 於 `communityWallConverters.ts`
- [x] 4-2 `convertApiData` 對 public/private 都套用排序
- [x] 4-3 `useCommunityWallData` Mock 模式也套用 `sortPostsWithPinned`

---

## 🔜 待辦（優化級，不影響穩定度）

- [ ] 5-1 發文 UI 改掉 `prompt()`（改為 Modal）
- [ ] 5-2 `useLockedItems` 泛型 hook（去重三區塊 slice/hiddenCount 邏輯）
- [ ] 2-4 DB 欄位補齊（SQL migration）：`year_built`, `total_units`, `management_fee`, `builder` 需手動在 Supabase 執行

---

## 📝 執行紀錄

### 2025-12-04 19:10 執行摘要

**修改的檔案**：
| 檔案 | 變更 |
|------|------|
| `api/community/wall.ts` | 回傳格式對齊前端 CommunityWallData |
| `src/pages/Community/types.ts` | GUEST_VISIBLE_COUNT = 4 |
| `src/pages/Community/components/ReviewsSection.tsx` | 先 slice reviews 再展開 |
| `src/hooks/communityWallConverters.ts` | 導出 sortPostsWithPinned，統一排序 |
| `src/hooks/useCommunityWallData.ts` | Mock 模式套用排序 |
| `src/pages/Community/Wall.backup.tsx` | 已刪除 |

**驗證結果**：
```
npm run typecheck  ✓ 無錯誤
npm run test       ✓ 29 passed
npm run build      ✓ 17.14s
git push           ✓ commit 3f961f3
```

**線上網址**：https://maihouses.vercel.app/maihouses/community/test-uuid/wall
