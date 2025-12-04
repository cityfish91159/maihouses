# 社區牆 TODO 摘要

> **最後更新**：2025/12/04 16:45  
> **狀態**：9 / 11 完成（P0 全數關閉，剩餘 P1 × 2）

## ✅ 已完成的缺失
- #1 Mock URL 同步：`Wall.tsx` 將 Mock/Role 狀態寫入 URL + localStorage，並安全處理跨分頁同步與錯誤訊息。
- #2 角色持久化：開發模式角色切換與 Mock 共用 helper，支援 cross-tab `storage` 事件，避免權限回退。
- #3 ErrorBoundary：`WallErrorBoundary.tsx` 提供友善 fallback 與 `componentDidCatch` 日誌。
- #5 QA Focus Trap：`QASection` Modal 加入 `role="dialog"`、Tab 限制與 Escape 關閉，符合 ARIA。
- #6 Posts Tab A11y：`PostsSection` 補上 `tablist/tab/tabpanel` 語意與方向鍵導覽，骨架具 `aria-live`。
- #7 React Query DevTools：`App.tsx` 在 DEV 環境 lazy load DevTools，方便觀察 cache 狀態。
- #8 useCommunityWallData JSDoc：Hook 補完整註解與 `communityId` 缺失時的 Mock fallback。
- #9 Mock 時間戳：`mockData.ts` 改為動態 ISO timestamp，配合 `time.ts` 顯示相對時間。
- #11 環境變數驗證：新增 `src/config/env.ts`，`supabase.ts`、`communityService.ts` 全面使用驗證後的變數。

## 🔧 尚未完成的缺失
- #4 Loading Skeleton a11y：需為 Skeleton 元件加上 `role="status"`、`aria-live`、`sr-only` 文案。
- #10 Optimistic Update race：Likes/Posts 操作須搭配 `cancelQueries` 與 rollback，避免競態造成計數異常。

## 🔍 驗證紀錄
```
npm run typecheck
npm run test
npm run build
```

> 更完整的修復細節請見 `docs/COMMUNITY_WALL_DEV_LOG.md`
