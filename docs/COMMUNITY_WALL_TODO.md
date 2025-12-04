# 社區牆 TODO（2025-12-04）

> 最後更新：2025-12-04 19:40
> 審計人：Google 首席前後端處長（嚴謹不嚴苛）

---

## 🔴 首席審計：發現的缺失與便宜行事

### 審計 A：`sortPostsWithPinned` 排序穩定性問題
**現狀**：
```ts
return [...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
```
**問題**：這個 comparator 只能保證 pinned=true 排前面，但 **同為 pinned 或同為非 pinned 的帖子之間順序是 unstable**。JavaScript sort 在不同引擎實現可能產生不一致結果。

**最佳方案**：
1. 補上次要排序鍵：若 pinned 相同，則按 `time`（或原始 index）排序
2. 範例思路：`(b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || originalIndexCompare`
3. 或者直接用 `Array.prototype.toSorted()`（ES2023）配合穩定比較器

---

### 審計 B：ReviewsSection 遺漏 `reviews` 空陣列防禦
**現狀**：
```ts
const reviews = Array.isArray(reviewsProp) ? reviewsProp : (reviewsProp?.items || []);
```
**問題**：若 `reviewsProp` 是 `undefined` 或 `null`，這行可以正確返回 `[]`。但後續 `reviews.length` 在某些極端 edge case（如 API 回傳 `{ items: null }`）會爆炸。

**最佳方案**：
1. 加一層 fallback：`reviewsProp?.items ?? []`
2. 在 converter 層面就保證不會出現 `null`，從源頭防禦
3. 型別上明確 `items: Review[]`（非 `items?: Review[] | null`）

---

### 審計 C：`GUEST_VISIBLE_COUNT = 4` 但 QASection 仍用不同邏輯
**現狀** (`QASection.tsx:106`)：
```ts
const visibleCount = perm.isLoggedIn ? answeredQuestions.length : Math.min(GUEST_VISIBLE_COUNT, answeredQuestions.length);
```
**觀察**：這裡正確使用了 `GUEST_VISIBLE_COUNT`，但與 ReviewsSection 的 slice-first 策略不一致。QA 是直接 `Math.min` 而非 slice。

**這不是錯誤**，但建議統一抽象：
1. 建立 `useGuestVisibleItems<T>(items: T[], canSeeAll: boolean)` hook
2. 回傳 `{ visible: T[], hiddenCount: number, nextHidden: T | null }`
3. 三個區塊（Reviews, Posts, QA）共用同一邏輯

---

### 審計 D：`prompt()` 仍在使用 - **未改掉**
**現狀** (`PostsSection.tsx:279, 298`)：
```ts
const content = prompt('輸入貼文內容：');
const content = prompt('輸入私密貼文內容：');
```
**問題**：TODO 說「5-1 發文 UI 改掉 `prompt()`」，但代碼完全沒動。這是「寫文件不改代碼」的典型案例。

**最佳方案**：
1. 建立 `PostModal.tsx` 組件（參考 QASection 的 AskModal 實作）
2. 包含：controlled textarea、字數驗證、提交 loading 狀態、錯誤處理
3. 用 `onOpenChange` pattern 控制開關
4. 私密/公開用同一 Modal，傳入 `visibility` prop 區分

---

### 審計 E：API `communityInfo` 欄位缺失處理方式偷懶
**現狀** (`api/community/wall.ts:256-268`)：
```ts
const communityInfo = rawCommunity ? {
  name: rawCommunity.name || '未知社區',
  year: rawCommunity.year_built || new Date().getFullYear(),  // ← 用當前年份是錯的！
  units: rawCommunity.total_units || 0,
  managementFee: rawCommunity.management_fee || 0,
  builder: rawCommunity.builder || '未知建商',
  members: 0,          // TODO 註解了但沒實作
  avgRating: 0,        // TODO 註解了但沒實作
  monthlyInteractions: 0,
  forSale: 0,
} : null;
```
**問題**：
1. `year: new Date().getFullYear()` 是敷衍：若 DB 沒有 `year_built`，應該顯示「未知」而非假裝是 2025 年建的
2. `members`, `avgRating` 給 0 但沒任何 TODO 追蹤
3. **這些 TODO 註解等於沒做**

**最佳方案**：
1. `year` 改為 `rawCommunity.year_built ?? null`，前端處理 `null` 顯示「未知」
2. `members` / `avgRating` 若要做：
   - 新增 Supabase View 或 RPC 計算統計值
   - 或在 `community_stats` 表維護快取
3. 若暫不做，**前端要能處理 0 或 null，顯示「-」或「N/A」**

---

### 審計 F：型別定義散落多處，沒有真正 Single Source of Truth
**現狀**：
- `src/types/community.ts` - 定義 `Post`, `Review`, `Question`, `CommunityInfo`, `UnifiedWallData`
- `src/services/communityService.ts` - 定義 `CommunityPost`, `CommunityReview`, `CommunityQuestion`, `CommunityWallData`
- `src/pages/Community/types.ts` - Re-export + 定義 `Permissions`, `getPermissions`

**問題**：
- API 回傳型別 (`CommunityPost`) 和 UI 消費型別 (`Post`) 是兩套
- converter 手動轉換，容易漏欄位
- **診斷報告說「1-3 型別統一來源確認」但實際上仍是三處**

**最佳方案**：
1. API 型別應該由後端或 OpenAPI spec 自動生成
2. 短期方案：在 `communityService.ts` 引入 `zod` schema 做 runtime 驗證
3. 長期方案：用 `supabase gen types` 自動產生 Database Types

---

### 審計 G：`convertApiReview` 硬編碼「房仲公司」字串
**現狀** (`communityWallConverters.ts:63`)：
```ts
const normalizedCompany = company && company !== '房仲公司' ? company : '';
```
**問題**：
- 這個 magic string 是哪來的？為什麼要特別過濾「房仲公司」？
- 若 DB 有其他預設值（如「未知公司」、「N/A」）就漏了
- **沒有任何註解說明意圖**

**最佳方案**：
1. 把這類 placeholder 抽成常數或 config：`const PLACEHOLDER_COMPANY_NAMES = ['房仲公司', '未知公司', 'N/A']`
2. 加註解說明：「// 過濾 DB 預設的 placeholder 值，避免 UI 顯示無意義文字」
3. 或從源頭修正：DB 不應該存這種無意義預設值

---

### 審計 H：Mock 模式的 `toggleLike` 沒有處理 `liked_by` 陣列
**現狀** (`useCommunityWallData.ts:254-275`)：
```ts
setMockData(prev => {
  const updatePosts = (posts: Post[]): Post[] => 
    posts.map(post => {
      if (post.id !== postId) return post;
      const currentLikes = post.likes ?? 0;
      return {
        ...post,
        likes: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
        // ← 缺少 liked_by 更新！
      };
    });
  // ...
});
```
**問題**：只更新 `likes` 數字，沒更新 `liked_by` 陣列。若 UI 有依賴 `liked_by` 判斷是否已按讚，會不一致。

**最佳方案**：
1. 同步更新 `liked_by`：
   ```ts
   liked_by: isLiked 
     ? (post.liked_by || []).filter(id => id !== currentUserId)
     : [...(post.liked_by || []), currentUserId]
   ```
2. 確保 `currentUserId` 在 Mock 模式可取得（可用 localStorage 存假 ID）

---

## ✅ 已完成（2025-12-04 本輪）

### 1. Mock / 型別重複定義整併
- [x] 1-1 刪除 `Wall.backup.tsx` (內含重複 MOCK_DATA)
- [x] 1-2 grep 驗證 MOCK_DATA 只存在 `mockData.ts` 一處
- [x] 1-3 型別統一來源確認 → **但見審計 F，仍有三處定義**

### 2. API communityInfo 對齊
- [x] 2-1 後端 `getAll()` 回傳 `communityInfo` 而非 `community`
- [x] 2-2 後端查詢新增 `year_built, total_units, management_fee, builder` 欄位
- [x] 2-3 `reviews.data` → `reviews.items`，`questions.data` → `questions.items`
- [ ] 2-4 **DB 欄位補齊（SQL migration）** → 未做，API 用假預設值敷衍（見審計 E）

### 3. GUEST_VISIBLE_COUNT 統一
- [x] 3-1 常數改為 4，註解說明「以完整物件為單位」
- [x] 3-2 ReviewsSection 改成先 slice reviews 再展開 pros/cons

### 4. 置頂排序統一
- [x] 4-1 導出 `sortPostsWithPinned()` 於 `communityWallConverters.ts`
- [x] 4-2 `convertApiData` 對 public/private 都套用排序
- [x] 4-3 `useCommunityWallData` Mock 模式也套用 `sortPostsWithPinned`
- [ ] **排序穩定性問題** → 見審計 A

---

## 🔜 待修復清單（按優先級排序）

### P0 - 必須修復（功能錯誤或 UX 嚴重問題）
| ID | 問題 | 影響 | 解法要點 |
|----|------|------|----------|
| D | `prompt()` 未改掉 | UX 極差、無法輸入多行、無驗證 | 建 `PostModal.tsx`，參考 QA Modal |
| H | Mock `toggleLike` 沒更新 `liked_by` | 按讚狀態不一致 | 同步更新陣列 |

### P1 - 應該修復（維護性或一致性問題）
| ID | 問題 | 影響 | 解法要點 |
|----|------|------|----------|
| A | sort 不穩定 | 同 pinned 貼文順序可能跳動 | 加次要排序鍵 |
| E | API year/members 用假值 | 顯示錯誤資訊 | null + 前端處理 |
| F | 型別三處定義 | 維護困難、容易漏欄位 | zod 或 supabase gen |
| G | magic string「房仲公司」 | 不可維護 | 抽常數 + 加註解 |

### P2 - 可以優化（程式碼品質）
| ID | 問題 | 影響 | 解法要點 |
|----|------|------|----------|
| B | reviews null 防禦不完整 | 極端 edge case 爆炸 | converter 層保證 |
| C | slice 邏輯未抽共用 hook | 重複代碼 | `useGuestVisibleItems` |

---

## 📋 執行檢查清單

當標記「已完成」時，必須附上：
- [ ] 實際修改的檔案路徑
- [ ] `npm run typecheck` 通過
- [ ] `npm run test` 通過
- [ ] 若涉及 UI：截圖或錄影證明
- [ ] 若涉及 API：curl 回應範例

**禁止**：
- ❌ 只寫註解說「TODO: 待實作」
- ❌ 只改 fallback 值敷衍
- ❌ 只更新文檔說「已完成」而代碼沒動

---

## 📝 執行紀錄

### 2025-12-04 19:40 - 首席審計完成

**審計範圍**：
- `api/community/wall.ts`
- `src/pages/Community/components/ReviewsSection.tsx`
- `src/pages/Community/components/PostsSection.tsx`
- `src/pages/Community/components/QASection.tsx`
- `src/hooks/communityWallConverters.ts`
- `src/hooks/useCommunityWallData.ts`
- `src/types/community.ts`
- `src/services/communityService.ts`
- `src/pages/Community/types.ts`

**發現缺失**：8 項（A~H）
- P0：2 項（D, H）
- P1：4 項（A, E, F, G）
- P2：2 項（B, C）

**審計結論**：
本輪執行修復了表面問題，但存在「便宜行事」情況：
1. `prompt()` 完全沒改（TODO 寫了 5-1 但代碼沒動）
2. API 欄位缺失用假預設值敷衍（`year: new Date().getFullYear()`）
3. Mock 模式 `liked_by` 沒更新（功能不完整）
4. 型別聲稱統一但實際仍分三處

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
