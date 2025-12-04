# 社區牆開發紀錄

> **最後更新**: 2025/12/05 15:35  
> **狀態**: React 版完成 + 嚴重缺失已修復 (2/11)

---

## 📁 核心檔案

### React 組件
- `src/pages/Community/Wall.tsx` - 主頁面 (含 URL 同步、ErrorBoundary)
- `src/pages/Community/components/` - 子組件 (Topbar, Posts, QA, Reviews, Sidebar...)
- `src/pages/Community/components/WallErrorBoundary.tsx` - 錯誤邊界 (🆕 2025/12/05)

### 資料與 Hooks
- `src/hooks/useCommunityWallData.ts` - 統一資料源 (Mock/API 雙模式)
- `src/hooks/useCommunityWallQuery.ts` - React Query 封裝
- `src/pages/Community/mockData.ts` - Mock 測試資料
- `src/pages/Community/types.ts` - TypeScript 型別定義

### API
- `api/community/wall.ts` - 讀取社區牆資料
- `api/community/question.ts` - 問答功能
- `api/community/like.ts` - 按讚功能

### 資料庫
- `supabase/migrations/20241201_community_wall.sql` - Schema

---

## 🌐 部署網址

| 環境 | URL |
|------|-----|
| **生產環境** | https://maihouses.vercel.app/maihouses/community/{uuid}/wall |
| **Mock 模式** | 加上 `?mock=true` 參數 |
| **測試範例** | `/maihouses/community/test-uuid/wall?mock=true` |

---

## 🔐 權限設計

| 功能 | 訪客 | 會員 | 住戶 | 房仲 |
|------|------|------|------|------|
| 評價 | 2則+模糊 | 全部 | 全部 | 全部 |
| 公開牆 | 2則+模糊 | 全部 | +發文 | +發物件 |
| 私密牆 | ❌ | ❌ | ✅+發文 | ✅唯讀 |
| 問答 | 1則+模糊 | 可問 | 可答 | 專家答 |
| 按讚 | ❌ | ✅ | ✅ | ✅ |

---

## 📝 重要更新紀錄

### 2025/12/05 15:35 - 文檔精簡部署

**變更內容**：
- TODO.md: 從 1575 行精簡至 195 行（刪除舊 P0-P2 項目，僅保留 11 項審計缺失）
- DEV_LOG.md: 從 1233 行精簡至 135 行（移除冗余代碼範例和重複說明）
- Commit: `5a93f1f` (TODO), `7f78006` (DEV_LOG)
- 部署狀態: ✅ 已推送至生產環境

---

### 2025/12/05 15:21 - 嚴重缺失修復 (#1, #3)

**缺失 #1：useMock 狀態未與 URL 同步**
- 問題：切換 Mock 模式後重新整理頁面會丟失狀態
- 修復：
  - `Wall.tsx` 使用 `useSearchParams` 讀取 URL `?mock=true`
  - 優先級：URL > localStorage > false
  - 包裝 `setUseMock` 同步更新 URL 和 localStorage
  - 開發環境支援 `?role=resident` 持久化
- 驗證：tsc ✓, build ✓, vitest 4/4 ✓, 已部署生產環境

**缺失 #3：Error Boundary 層級不足**
- 問題：組件 runtime error 會導致白屏
- 修復：
  - 新增 `WallErrorBoundary.tsx` 類組件
  - 實作 `getDerivedStateFromError` 和 `componentDidCatch`
  - 提供友善錯誤 UI (重新載入、回首頁按鈕)
  - 開發環境顯示完整錯誤堆疊
  - Wall.tsx 拆分為 WallInner + ErrorBoundary 包裹
- 驗證：tsc ✓, build ✓, 生產環境 bundle 包含 ErrorBoundary 文字 ✓

**部署資訊**：
- Commit: `6a915d3`
- 檔案變更: 21 files, +639/-212
- Bundle: `react-vendor-BABxjSf5.js`, `index-B8kDm-Of.js` (428.55 kB)

---

### 2025/12/04 - 權限與狀態管理優化

#### API 整合改善
- 移除 `communityService.ts` 內部快取，統一由 React Query 管理
- 修復發文後列表不更新問題
- `convertApiData` 支援 `mockFallback` 參數，優先使用 API 社區資訊

#### UI/UX 優化
- 新增 `WallSkeleton` / `PostSkeleton` 載入骨架屏
- 留言數改為條件渲染（0 則不顯示）
- 評價區隱藏無效績效資料
- 401/403 錯誤顯示「請先登入」提示

#### Mock 模式強化
- 實作真實狀態更新 (toggleLike, createPost, askQuestion, answerQuestion)
- 修復 toggleLike 邏輯錯誤（新增 `likedPosts` Set 追蹤用戶按讚狀態）
- `useEffect` 在切換模式時重置狀態，避免污染

#### TypeScript 型別完善
- API 型別支援 `comments_count`, `is_pinned`, `agent.stats` 等欄位
- 修復 `author.floor` → `floor` 轉換避免 undefined 錯誤

---

### 2025/12/03 - React Query 重構

#### 架構改善
- 從 `useCommunityWall.ts` 遷移至 `useCommunityWallQuery.ts`
- 引入 React Query 取代手寫狀態管理
- Optimistic Updates 支援即時 UI 反饋

#### 新增組件
- `LockedOverlay.tsx` - 模糊鎖定遮罩 (訪客/會員權限差異化)
- `RoleSwitcher.tsx` - 開發環境身份切換器
- `MockToggle.tsx` - Mock/API 模式切換

#### 資料結構標準化
- 統一 API 和 Mock 資料格式
- 新增 `communityWallConverters.ts` 轉換模組

---

### 2025/12/02 - 組件化重構

#### 拆分前
- `Wall.tsx` 單一檔案 748 行，難以維護

#### 拆分後
- `Wall.tsx` 縮減至 ~120 行（邏輯層）
- 8 個獨立組件：Topbar, ReviewsSection, PostsSection, QASection, Sidebar, RoleSwitcher, MockToggle, BottomCTA
- `types.ts` 統一型別定義
- `mockData.ts` 測試資料獨立

#### 優勢
- 組件職責單一，易於測試
- 型別安全完整
- 可讀性大幅提升

---

### 2025/12/01 - MVP 完成

#### 功能實作
- 評價區塊（星級評分、圖片輪播）
- 公開牆 / 私密牆切換
- 問答區塊（發問/回答）
- 按讚功能
- 權限控制（訪客模糊鎖定）
- 底部 CTA（註冊/驗證引導）

#### 技術棧
- 原生 HTML/CSS/JS
- Supabase 後端
- 響應式設計 (RWD)

---

## 🔧 開發指令

```bash
# 開發
npm run dev              # 啟動開發伺服器 (port 5173)

# 測試
npx tsc --noEmit         # TypeScript 類型檢查
npx vitest run           # 執行單元測試
npm run build            # 生產構建

# 部署
git push origin main     # 推送至 GitHub, Vercel 自動部署
```

---

## 🐛 已知問題 (待修復)

詳見 `docs/COMMUNITY_WALL_TODO.md` (2/11 完成)

**待修復嚴重缺失 (P0)**：
- #2: 角色切換持久化測試
- #5: QA Modal Focus Trap (無障礙)
- #6: Tab 鍵盤支援 (ARIA)
- #11: 環境變數驗證

**待修復中等缺失 (P1)**：
- #4: Loading Skeleton a11y
- #7: React Query DevTools
- #8: Hook JSDoc 註解
- #9: Mock 時間戳動態化
- #10: Optimistic Update race condition

---

## 📚 相關文件

- `docs/COMMUNITY_WALL_TODO.md` - 待辦事項清單
- `.github/copilot-instructions.md` - 專案開發規範
- `supabase/migrations/20241201_community_wall.sql` - 資料庫 Schema

---
