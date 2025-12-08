# 🏠 社區牆 + 信息流 待辦清單

> 供 AI Agent 與開發者協作使用  
> 最後更新：2025-12-08

---

## 🎯 核心目標

| # | 目標 | 說明 |
|---|------|------|
| 1 | Header 統一 | 三頁共用 GlobalHeader（dropdown/ARIA/角色感知） |
| 2 | 打字系統導入 | 三頁共用 Composer + API 串接 |
| 3 | 信息流 React 化 | feed-consumer + feed-agent → React |
| 4 | Mock/API 切換 | 統一 env.ts 控制，三頁左下角按鈕 |

---

## 📊 進度總覽

| 階段 | 狀態 | 時間 | 說明 |
|------|------|------|------|
| P0 基礎設定 | ✅ | - | SQL VIEW + API 容錯 |
| P0.5 環境控制層 | ✅ | 45m | `mhEnv` 已建立，審計缺失已修復 |
| P1 Toast 系統 | ✅ | 55m | sonner+notify 全面收斂 |
| P1.5 權限系統 | ✅ | 1h | useAuth + 角色判斷 + 審計修復 |
| P2 useFeedData | ✅ | 30m | Hook 實作 + 審計修復 (API 樂觀更新/Auth Guard) |
| P3 GlobalHeader | ✅ | 1.5h | 三頁共用 Header + 審計修復 (角色導航/Logo) |
| P3.5 三頁互跳導航 | ✅ | 1h | 靜態 Feed HTML 補上互跳連結 + Auth Check JS |
| P4 Composer | 🔴 | 2h | headless + UI 統一 |
| P4.5 Loading/錯誤狀態 | 🔴 | 1h | Skeleton + Empty + Error + Retry |
| P5 feed-consumer | 🔴 | 2h | 靜態 → React |
| P6 feed-agent | 🔴 | 2h | 靜態 → React |
| P6.5 草稿自動儲存 | 🔴 | 30m | localStorage debounce |
| P7 私密牆權限 | 🔴 | 1h | membership 驗證 |
| P8 部署驗證 | 🔴 | 1h | 情境矩陣測試 |
| P9 優化防呆 | 🔴 | 1h | 狀態文案 + ErrorBoundary |

---

## 🔴 P4：Composer 統一（未開始）

**做法**：`PostModal.tsx` → `ComposerModal.tsx`，加 mode prop

| 任務 | 說明 |
|------|------|
| P4-1 | 建立 `useComposer()` headless hook |
| P4-2 | 建立 `ComposerModal.tsx`（mode="feed" / "community"） |
| P4-3 | textarea 自動展開 + 字數驗證 |
| P4-4 | 發文後清空 + notify.success() |
| P4-5 | 圖片上傳按鈕 UI（暫時 notify.dev()） |
| P4-6 | 未登入時顯示「請先登入」（使用 useAuth） |

---

## 🔴 P4.5：Loading 與錯誤狀態

**目的**：UX 基礎建設

| 任務 | 說明 |
|------|------|
| P4.5-1 | Skeleton 骨架屏組件 |
| P4.5-2 | Empty State（無貼文時） |
| P4.5-3 | Error State（API 失敗時） |
| P4.5-4 | Retry 重試按鈕 |

---

## 🔴 P5：feed-consumer React 化

**來源**：`public/feed-consumer.html` (559行) → `src/pages/Feed/Consumer.tsx`

> **注意**：P3.5 審計指出靜態頁面維護困難，P5 應盡快執行。
> **技術債**：目前靜態頁面依賴 `public/js/auth-check.js` 進行簡易 Auth 檢查，React 化後應直接使用 `useAuth`。

| 任務 | 說明 |
|------|------|
| P5-1 | 建立 Consumer.tsx 基本架子 |
| P5-2 | 使用 GlobalHeader |
| P5-3 | 使用 useFeedData Hook |
| P5-4 | PostCard + Like API |
| P5-5 | MockToggle 左下角 |
| P5-6 | 路由 `/maihouses/feed-consumer` |

---

## 🔴 P6：feed-agent React 化

**來源**：`public/feed-agent.html` (760行) → `src/pages/Feed/Agent.tsx`

| 任務 | 說明 |
|------|------|
| P6-1 | 建立 Agent.tsx 基本架子 |
| P6-2 | 使用 GlobalHeader（badge="業務版"） |
| P6-3 | 業務專屬側欄（UAG 摘要/業績/待辦） |
| P6-4 | 使用 useFeedData Hook |
| P6-5 | MockToggle 左下角 |
| P6-6 | 路由 `/maihouses/feed-agent` |

---

## 🔴 P6.5：草稿自動儲存

**目的**：防止意外關閉遺失內容

| 任務 | 說明 |
|------|------|
| P6.5-1 | localStorage key = `mai_draft_{page}_{communityId}` |
| P6.5-2 | 5 秒 debounce 自動儲存 |
| P6.5-3 | 頁面載入時恢復草稿 |
| P6.5-4 | 發文成功後清除草稿 |

---

## 🔴 P7：私密牆權限

**目的**：確保權限不被繞過

| 任務 | 說明 |
|------|------|
| P7-1 | 確認 community_members 表存在 |
| P7-2 | POST API：visibility=private 檢查 membership |
| P7-3 | GET API：includePrivate 需 token + membership |
| P7-4 | 前端：非成員看不到/發不了私密貼文 |

---

## 🔴 P8：部署驗證

**網址**：https://maihouses.vercel.app/maihouses/

### Checklist

| 項目 | 狀態 |
|------|------|
| Header dropdown 可用 | 🔴 |
| 通知/訊息 Toast | 🔴 |
| feed-consumer Mock/API 切換 | 🔴 |
| feed-agent Mock/API 切換 | 🔴 |
| 三頁發文功能 | 🔴 |
| 登出功能 | 🔴 |
| npm run build 無錯誤 | 🔴 |
| 未登入發文阻擋（顯示 Toast） | 🔴 |
| Mock/API 切換持久化（重整保持） | 🔴 |
| 跨頁切換保持登入 | 🔴 |
| Mobile 響應式 Header | 🔴 |
| 網路斷線發文失敗提示 | 🔴 |

### 情境矩陣

| 頁面 | 資料源 | 身份 | 預期 |
|------|--------|------|------|
| 社區牆 | API | 未登入 | 只看公開牆 |
| 社區牆 | API | 成員 | 能發/看私密 |
| 社區牆 | Mock | 任意 | 重整消失 |
| feed-consumer | API | 用戶 | 能發公開貼文 |
| feed-agent | API | 業務 | 能看 UAG 摘要 |

---

## 🔴 P9：優化防呆

| 任務 | 說明 |
|------|------|
| P9-1 | Loading Skeleton |
| P9-2 | ErrorBoundary |
| P9-3 | Mock 模式提示：「測試資料，不會儲存」 |
| P9-4 | 功能佔位：「此功能開發中」 |
| P9-5 | vercel.json rewrite 淘汰靜態頁 |

---

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `src/pages/Community/Wall.tsx` | 社區牆主頁 (546行) |
| `src/components/layout/GlobalHeader.tsx` | 全域 Header |
| `src/hooks/useCommunityWallData.ts` | 資料 Hook (454行) |
| `public/feed-consumer.html` | 靜態消費者版 (559行) |
| `public/feed-agent.html` | 靜態業務版 (760行) |
| `public/js/auth-check.js` | 靜態頁面 Auth 檢查 |
| `api/community/wall.ts` | 後端 API (938行) |
