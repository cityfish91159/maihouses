# Trust Room (安心留痕) UX 重設計規劃

**版本**: 1.0
**日期**: 2026-01-30
**規範來源**: ui-ux-pro-max
**目標**: 移除所有 emoji、導入深藍色原子設計系統、去除 AI 味道

---

## 實作進度總覽

### Phase 1: trust.types.ts 更新
- [x] 1.1 移除 `STEP_ICONS` emoji 常數
- [x] 1.2 新增 `STEP_ICONS_SVG` Lucide 圖示映射
- [x] 1.3 更新 `STEP_DESCRIPTIONS` 文案（去 AI 味）
- [x] 1.4 更新 `STEP_NAMES` 文案（口語化）

#### Phase 1 施工紀錄 (2026-01-30)
- `src/types/trust.types.ts`: 移除 `STEP_ICONS`，新增 `STEP_ICONS_SVG`，更新 `STEP_NAMES`/`STEP_DESCRIPTIONS` 文案
- `src/pages/TrustRoom.tsx`: 改用 `STEP_ICONS_SVG` 渲染步驟圖示（避免引用舊常數）
- `src/components/TrustManager.tsx`: 移除未使用 `STEP_ICONS` import

### Phase 2: TrustRoom.tsx 重構
- [x] 2.1 移除 `COLORS` 物件（硬編碼 hex）
- [x] 2.2 移除 `styles` 物件（inline styles）
- [x] 2.3 改用 Tailwind classes + tokens
- [x] 2.4 替換 `🛡️ 安心交易` 徽章為 `ShieldCheck` SVG
- [x] 2.5 替換 `⏰` 過期提示為 `Clock` SVG
- [x] 2.6 替換 `✓` 確認圖示為 `Check` SVG
- [x] 2.7 替換步驟數字圖示為對應 SVG
- [x] 2.8 更新進度條樣式（深藍漸層）
- [x] 2.9 更新卡片樣式（brand tokens）
- [x] 2.10 更新按鈕樣式
- [x] 2.11 更新 Toast 訊息樣式

#### Phase 2 施工紀錄 (2026-01-30)
- `src/pages/TrustRoom.tsx`: 完全重構
  - 移除 `COLORS` 硬編碼物件
  - 移除 `styles` inline styles 物件（約 120 行）
  - 改用 Tailwind classes 引用 brand tokens
  - 新增 `ShieldCheck`, `Clock`, `Check` Lucide 圖示
  - 背景改用 `bg-gradient-to-br from-bg-base to-brand-50`
  - 進度條使用 `bg-gradient-to-r from-brand-700 to-success`
  - 按鈕使用 `bg-brand-700` 搭配 `hover:bg-brand-600`
  - Toast 使用 `bg-success` / `bg-danger` 語意色
  - 所有 emoji 已替換為 SVG 圖示
  - 進度條寬度改用 class 映射（移除 `style`）
  - 互動按鈕高度調整為 44px（符合 touch target）
  - 徽章文字調整為 `text-xs` 可讀性
  - Toast 提升至 `z-modal`
  - 載入狀態補上 spinner
  - 步驟標題改用 `STEP_NAMES`
  - 抽出 `MS_PER_DAY` 常數，避免 magic number
  - URL token 加註安全風險提醒
  - Loading 區塊改為 Skeleton UI
  - 步驟圖示渲染抽為函式
  - 確認按鈕加入 spinner/disabled 視覺提示

### Phase 3: Assure/Detail.tsx 優化
- [x] 3.1 更新 Header 色彩為品牌深藍
- [x] 3.2 移除 `📢` emoji（房仲帶看紀錄）
- [x] 3.3 移除 `📝` emoji（新增補充紀錄）
- [x] 3.4 移除 `👨‍💼` `👤` emoji（角色標示）
- [x] 3.5 替換角色圖示為 `Briefcase` / `User` SVG
- [x] 3.6 更新空狀態文案（去 AI 味）
- [x] 3.7 更新演示模式按鈕文案
- [x] 3.8 更新各步驟操作文案
- [x] 3.9 統一卡片樣式為 brand tokens

#### Phase 3 施工紀錄 (2026-01-30)
- `src/pages/Assure/Detail.tsx`: 完全重構
  - Header 改用 `bg-brand-700` + `ShieldCheck` 圖示 + 「安心留痕」標題
  - 進度條改用 `from-brand-700 to-success` 漸層
  - 「📢 房仲帶看紀錄」→ `<Megaphone>` + 文字
  - 「📝 新增補充紀錄」→ `<FilePlus>` + 「補充紀錄」
  - 「👨‍💼」「👤」→ `<Briefcase>` / `<User>` 角色徽章
  - 空狀態文案：「目前未檢測到...」→「沒有找到你的交易紀錄，想先體驗看看嗎？」
  - 演示按鈕：「啟動演示模式 (Demo Mode)」→「體驗看看」
  - 確認按鈕：「確認無誤並送出」→「確認送出」
  - 等待狀態：「等待房仲提交...」→「房仲還沒送出」
  - 進度條寬度改用 class 映射（移除 inline style）
  - 步驟卡片/付款區/清單配色改用 brand tokens
  - 進度條寬度常數抽到 `src/constants/progress.ts`
  - 移除未使用 hook 解構與 `useLocation`
  - 資料提交後改用 `fetchData` 更新（移除 `window.location.reload()`）
  - Header/徽章/提示文字最小字級調整為 `text-xs`
  - 重置/付款改為雙擊確認（避免原生 `confirm()`）

### Phase 4: DataCollectionModal.tsx 微調
- [x] 4.1 更新標題文案（去 AI 味）
- [x] 4.2 更新隱私說明文案
- [x] 4.3 更新按鈕文案
- [x] 4.4 確認 SVG 圖示已使用（已有 Lucide）

#### Phase 4 施工紀錄 (2026-01-30)
- `src/components/TrustRoom/DataCollectionModal.tsx`: 文案更新
  - 標題：「請填寫基本資料以保全交易過程全貌」→「留下聯絡方式，方便後續聯繫」
  - 隱私說明：「此資訊僅供法律留痕使用，不會公開給房仲」→「資料只用於交易紀錄，不會外流」
  - 按鈕：「送出」→「確認送出」
  - Placeholder：「請輸入您的姓名」→「你的名字」
  - Modal 配色與邊框改用 brand tokens（去除灰藍色系）
  - 按鈕高度調整為 `min-h-[44px]`
  - 移除 `animate-in` 系列類別（避免依賴外部插件）
  - 隱私區塊圖示改為 `Info`，減少重複 Shield
  - 精簡頂部註解，移除多餘 Skills 標註
  - `FOCUS_DELAY_MS` 與 focusable selector 抽為常數
  - Email 驗證改用 `.email().or(z.literal(''))` 簡化

### Phase 5: 整合驗證
- [x] 5.1 `npm run typecheck` 通過
- [x] 5.2 `npm run lint` 通過
- [ ] 5.3 Mock 模式功能正常（待手動驗證）
- [ ] 5.4 正式模式功能正常（待手動驗證）
- [ ] 5.5 手機版響應式正常（待手動驗證）
- [ ] 5.6 桌面版響應式正常（待手動驗證）
- [x] 5.7 無任何 emoji 殘留（Trust Room 相關檔案已確認）
- [x] 5.8 無任何 inline styles 殘留（TrustRoom.tsx 已移除 styles 物件）
- [x] 5.9 無任何硬編碼 hex 值（TrustRoom.tsx 已移除 COLORS 物件）

#### Phase 5 施工紀錄 (2026-01-30)
- `npm run gate` 通過（typecheck + lint）
- Trust Room 相關檔案 emoji 掃描：無殘留
- 待手動驗證：Mock 模式、正式模式、響應式
- 新增測試：progress 計算、資料收集 Zod schema、TrustRoom 整合渲染
 - `npm run typecheck` 通過
 - `npm run lint` 通過
 - `vitest run`（progress / schema / TrustRoom / DataCollectionModal）通過
 - `constants/progress` 型別改為 tuple + union，避免索引 undefined
 - TrustRoom 介面細節優化：步驟間距、進度條背景、Toast safe-area、案件編號截斷
 - Loading Skeleton 加入 shimmer，錯誤狀態補卡片與重試
 - 確認按鈕觸控高度提升至 48px

### Phase 6: MaiMai 吉祥物整合（極簡存在感）
- [x] 6.1 建立 `useTrustRoomMaiMai` Hook
- [x] 6.2 首次進入：wave 表情 + 3 秒後淡出
- [x] 6.3 完成步驟確認：happy 表情 + 1.5 秒動畫
- [x] 6.4 全部完成：celebrate 表情 + confetti 慶祝
- [x] 6.5 錯誤狀態：shy 表情顯示
- [x] 6.6 位置：右下角固定，不遮擋主要內容
- [x] 6.7 手機版響應式尺寸調整
- [x] 6.8 效能：lazy load + requestAnimationFrame

#### Phase 6 施工紀錄 (2026-01-30)
- `src/hooks/useTrustRoomMaiMai.ts`: 新增 MaiMai 狀態管理（wave/happy/celebrate/shy/idle）與 idle timer
- `src/components/TrustRoom/TrustRoomMaiMai.tsx`: 封裝 MaiMai + confetti，桌機/手機尺寸對應
- `src/pages/TrustRoom.tsx`: lazy 載入 MaiMai，成功/失敗/全完成觸發對應狀態
- 補上 MaiMai Hook / 元件 JSDoc 說明
 - TriggerOptions 新增 onComplete，idleDelay 加註說明
 - MaiMai 手機尺寸調整為 64px，加入 safe-area
 - Confetti 手機粒子減半、origin 自適應
 - 新增 `useTrustRoomMaiMai` 單元測試
- `src/pages/TrustRoom.tsx`: 手機版響應式修正（Header padding、徽章橫向滑動、步驟圖示/標題尺寸調整、Toast 間距）
- `src/pages/TrustRoom.tsx`: safe-area 左右邊距、確認按鈕 haptic、深色模式補強

### Phase 7: 手機優先 UI 優化（ui-ux-pro-max 審查）
- [x] 7.1 **Touch Target Size**：確認按鈕 `py-3` + `min-h-[48px]`（>= 44px 觸控區域）
- [x] 7.2 **徽章文字尺寸**：維持 `text-xs` (12px)，手機可讀性符合
- [x] 7.3 **進度條視覺權重**：`h-2` → `h-2.5`，加強視覺存在感
- [x] 7.4 **Safe Area 處理**：加入 `pb-[calc(1rem+env(safe-area-inset-bottom))]`
- [x] 7.5 **Toast 位置優化**：手機版改為 `left-4 right-4 top-4` 全寬
- [x] 7.6 **觸控間距確認**：維持 `gap-2` 以上

#### Phase 7 審查依據 (ui-ux-pro-max)
| 問題 | 嚴重度 | 規範 |
|------|--------|------|
| Touch Target Size | HIGH | Minimum 44x44px touch targets |
| Touch Spacing | MEDIUM | Minimum 8px gap between touch targets |
| Typography | MEDIUM | 12px minimum for mobile readability |
| Safe Area | MEDIUM | Account for iOS safe areas |
| Toast Position | LOW | Avoid browser chrome overlap |

#### Phase 7 施工紀錄 (2026-01-30)
- `src/pages/TrustRoom.tsx`: 進度條高度調整為 `h-2.5`
- `src/pages/TrustRoom.tsx`: 主容器補 bottom safe-area padding
- `src/pages/TrustRoom.tsx`: Toast 改為手機全寬 + safe-area top
- `src/pages/TrustRoom.tsx`: 確認按鈕新增 `py-3`，觸控高度 >= 48px
- `src/pages/TrustRoom.tsx`: 步驟圖示尺寸調整為 `size-11 sm:size-12`
- `src/lib/haptic.ts`: 抽出 `triggerHaptic` 工具並於 TrustRoom 使用
### Phase 8: Assure/Detail.tsx 組件拆分重構

> ⚠️ **重要說明**：此 Phase 為大規模重構，需謹慎進行。
> 目標：解決 `Assure/Detail.tsx` Line 289-531 步驟卡片邏輯過於複雜的問題（單一 render 超過 200 行）

#### 8.1 子組件拆分計畫

| 組件名稱 | 檔案路徑 | 職責 |
|---------|---------|------|
| `<StepCard />` | `src/components/Assure/StepCard.tsx` | 步驟卡片主體容器，處理樣式狀態（past/current/future） |
| `<StepIcon />` | `src/components/Assure/StepIcon.tsx` | 步驟圖示，整合 STEP_ICONS_SVG |
| `<StepContent />` | `src/components/Assure/StepContent.tsx` | 步驟內容顯示（帶看紀錄、付款計時器等） |
| `<StepActions />` | `src/components/Assure/StepActions.tsx` | 操作按鈕區塊（送出、確認、付款） |
| `<PaymentTimer />` | `src/components/Assure/PaymentTimer.tsx` | Step 5 付款倒數計時器 |
| `<ChecklistPanel />` | `src/components/Assure/ChecklistPanel.tsx` | Step 6 交屋清單 |
| `<SupplementList />` | `src/components/Assure/SupplementList.tsx` | 補充紀錄列表 |

#### 8.2 重構步驟

- [x] 8.2.1 建立 `src/components/Assure/` 目錄
- [x] 8.2.2 提取 `<StepIcon />` 組件（最小依賴，先行測試）
- [x] 8.2.3 提取 `<StepCard />` 容器組件
- [x] 8.2.4 提取 `<StepContent />` 內容組件
- [x] 8.2.5 提取 `<StepActions />` 操作組件
- [x] 8.2.6 提取 `<PaymentTimer />` 付款計時器
- [x] 8.2.7 提取 `<ChecklistPanel />` 交屋清單
- [x] 8.2.8 提取 `<SupplementList />` 補充紀錄
- [x] 8.2.9 更新 `Detail.tsx` 使用新組件
- [ ] 8.2.10 驗證功能正常（Mock + 正式模式）

#### 8.3 Props 設計原則

```typescript
// StepCard.tsx
interface StepCardProps {
  stepKey: string;
  step: TrustStep;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  children: React.ReactNode;
}

// StepActions.tsx
interface StepActionsProps {
  stepKey: string;
  step: TrustStep;
  role: 'agent' | 'buyer';
  isBusy: boolean;
  onSubmit: (step: string) => void;
  onConfirm: (step: string, note?: string) => void;
}

// PaymentTimer.tsx
interface PaymentTimerProps {
  timeLeft: string;
  role: 'agent' | 'buyer';
  isBusy: boolean;
  onPay: () => void;
}
```

#### 8.4 測試策略

- [ ] 每個子組件需有獨立單元測試
- [ ] 保留 Detail.tsx 整合測試
- [ ] 重構後執行 `npm run gate` 確認品質

#### 8.5 風險控管

| 風險 | 緩解措施 |
|------|---------|
| 引入新 bug | 逐步提取，每步驗證 |
| Props drilling | 必要時使用 Context |
| 效能下降 | 使用 React.memo 優化 |
| 樣式錯亂 | 保持 Tailwind class 不變 |

#### 8.6 預估複雜度

- **總行數減少**：Detail.tsx 預計從 570 行降至 ~250 行
- **子組件總行數**：~400 行（分散在 7 個檔案）
- **可維護性提升**：每個組件職責單一，易於測試和修改

#### Phase 8 施工紀錄 (2026-01-30)
- `src/components/Assure/StepIcon.tsx`: 抽出步驟圖示（使用 STEP_ICONS_SVG）
- `src/components/Assure/StepCard.tsx`: 卡片容器（狀態樣式 + icon/連線）
- `src/components/Assure/StepContent.tsx`: 內容區塊（標題、狀態、子區塊）
- `src/components/Assure/StepActions.tsx`: 操作按鈕區（送出/確認/付款）
- `src/components/Assure/PaymentTimer.tsx`: 付款倒數區塊
- `src/components/Assure/ChecklistPanel.tsx`: 交屋清單區塊
- `src/components/Assure/SupplementList.tsx`: 補充紀錄列表
- `src/pages/Assure/Detail.tsx`: 使用新組件重構步驟渲染
- `src/components/Assure/__tests__`: 新增各子組件單元測試
- `src/components/Assure/StepCard.tsx`: 圖示容器調整為 44px（size-11）
- `src/components/Assure/PaymentTimer.tsx`: 按鈕高度修正 + aria-disabled + 文字函式化
- `src/components/Assure/ChecklistPanel.tsx`: 確認按鈕高度修正、文字行距提升
- `src/components/Assure/StepActions.tsx`: 按鈕高度修正、textarea aria-label、拆分 Agent/Buyer 行為
- `src/components/Assure/StepContent.tsx`: props 分組（state/handlers）降低 drilling
- `src/components/Assure/SupplementList.tsx`: key 改為 role+timestamp

### Phase 9: 房仲資料 API 化

> 詳細設計規格見「十一、房仲資料 API 化設計」

- [x] 9.1 資料庫 Schema 擴充（`20260130_agent_profile_extension.sql`）
- [x] 9.2 Supabase Storage Bucket 建立（`agent-avatars`）
- [x] 9.3 信任分計算 RPC（`fn_calculate_trust_score`）
- [x] 9.4 GET /api/agent/profile 端點
- [x] 9.5 GET /api/agent/me 端點
- [x] 9.6 PUT /api/agent/profile 端點
- [x] 9.7 POST /api/agent/avatar 端點
- [x] 9.8 UAG 個人資料頁面
- [x] 9.9 Property 頁面 AgentTrustCard 改用真實 API
- [x] 9.10 Mock 頁面欄位調整（成交率→服務評價、累積成交→完成案件）

#### Phase 9 施工紀錄 (2026-01-30)
- `supabase/migrations/20260130_agent_profile_extension.sql`: 擴充 agents 欄位、建立 avatar bucket/RLS、信任分 RPC + trigger
- `api/agent/profile.ts`: GET/PUT 房仲資料端點（含 Zod 驗證）
- `api/agent/me.ts`: 取得登入房仲資料（含 points/quota）
- `api/agent/avatar.ts`: 头像上傳（multipart + storage + 更新 avatar_url）
- `api/lib/supabase.ts`: 共用 Supabase Admin client
- `src/services/agentService.ts`: 前端 API service（profile/me/avatar）
- `src/pages/UAG/Profile/*`: 新增個人資料頁（AvatarUploader/BasicInfo/Metrics）
- `src/pages/UAG/hooks/useAgentProfile.ts`: 改用 /api/agent/me
- `src/components/AgentTrustCard.tsx`: 改用真實 API + 指標改版
- `src/pages/PropertyDetailPage.tsx`: Demo 物件傳入 isDemo

#### Phase 9 Code Review (2026-01-30)

**審核分數：91/100** ✅ 通過

**優點：**
- API 架構清晰，前後端類型一致
- Zod Schema 驗證完整（輸入驗證、.strict() 防額外欄位）
- RLS 政策設計安全（Storage bucket 有完整 INSERT/SELECT/UPDATE 政策）
- Trust Score 計算機制專業（基礎分 60，各維度加分有上限）
- React Query 整合專業（enabled 條件控制、staleTime、Optimistic Update）

**P1 待修復：**
- `api/agent/profile.ts` L28：phone 正則 `\\d` 應為 `\d`
- `AgentTrustCard.tsx` L124-135：時段按鈕缺少 `min-h-[44px]`
- `BasicInfoSection.tsx` L195-207：專長/證照按鈕缺少 `min-h-[44px]`

**P2 建議：**
- 抽取 API helper 函數（toNumber, normalizeStringArray, calcServiceYears）
- BookingModal 獨立為單獨組件

---

### Phase 10: 物件詳情頁社區評價修復

- [x] 10.1 修正「註冊查看全部」按鈕路徑（`/auth.html` → `/maihouses/auth.html`）
- [x] 10.2 CommunityReviews 組件接收 `communityId` props
- [x] 10.3 PropertyDetailPage 傳入 `communityId`（從 property 取得）
- [x] 10.4 CommunityReviews 內部呼叫 API 取得評價總數（使用 useEffect + fetch）
- [x] 10.5 評價數量顯示改為動態（移除硬編碼 `6`）
- [x] 10.6 API 錯誤時 graceful fallback（顯示「註冊查看更多評價」）

#### Phase 10 問題說明

| 問題 | 位置 | 嚴重度 | 說明 |
|------|------|--------|------|
| 路徑錯誤 | `CommunityReviews.tsx` L121 | P0 | `/auth.html` 缺少 `/maihouses/` 前綴，導致 404 |
| 數字硬編碼 | `CommunityReviews.tsx` L126 | P1 | 評價數量寫死為 `6`，應從 API 動態取得 |

#### Phase 10 技術說明

**現有 API：**
- `GET /api/community/wall?communityId=xxx&type=reviews`
- 回傳：`{ success: true, data: { total: number, ... } }`

**修改檔案：**
1. `src/components/PropertyDetail/CommunityReviews.tsx`
   - 新增 props：`communityId?: string`
   - 內部使用 `useEffect` 呼叫 API 取得 `total`
   - 按鈕文案改為：`註冊查看全部 ${total} 則評價`
   - 路徑修正：`/maihouses/auth.html?redirect=community`

2. `src/pages/PropertyDetailPage.tsx`
   - 傳入：`<CommunityReviews isLoggedIn={isLoggedIn} communityId={property.communityId} />`

**注意事項：**
- 若 `communityId` 為空，顯示預設文案「註冊查看更多評價」
- API 錯誤時 graceful fallback，不影響頁面渲染

#### Phase 10 施工紀錄 (2026-01-30)

- `src/components/PropertyDetail/CommunityReviews.tsx`:
  - 路徑修正：`/auth.html` → `/maihouses/auth.html`
  - 新增 `communityId` prop
  - 新增 `useEffect` 呼叫 `/api/community/wall?type=reviews` 取得評價總數
  - 按鈕文案改為動態：有數據 → `註冊查看全部 ${total} 則評價`，無數據 → `註冊查看更多評價`
  - 移除 emoji `💬`，改用 `<MessageSquare>` SVG
  - 按鈕加入 `min-h-[44px]` 符合觸控規範
- `src/services/propertyService.ts`:
  - `PropertyData` 介面新增 `communityId?: string`
  - `getPropertyByPublicId` 回傳 `community_id` 欄位
- `src/pages/PropertyDetailPage.tsx`:
  - 傳入：`<CommunityReviews isLoggedIn={isLoggedIn} communityId={property.communityId} />`

---

### Phase 11: 聯絡按鈕回歸本職 + 安心留痕自然嵌入

> **問題**: 三按鈕都跳 ContactModal（違反心智模型）；聯絡流程中沒有安心留痕的串接入口
>
> **目標**: 三按鈕各司其職 + 在聯絡觸發的面板中自然嵌入 `TrustAssureHint`（安心留痕提示）

**A. 三按鈕回歸本職**
- [x] 11.1 `AgentTrustCard.tsx` - 按鈕改為開啟各自面板（LINE / 電話 / 預約）
- [x] 11.2 `LineLinkPanel.tsx` - 新增 LINE 連結面板 Modal（有 lineId 直開，無則 fallback）
- [x] 11.3 `CallConfirmPanel.tsx` - 新增致電確認面板 Modal（有 phone 直撥，無則 fallback）
- [x] 11.4 `BookingModal.tsx` - 新增安心留痕提示區塊
- [x] 11.5 `PropertyDetailPage.tsx` - 移除統一導向 ContactModal，改為開啟各面板
- [x] 11.6 `MobileActionBar.tsx` / `MobileCTA.tsx` - 對齊桌面版邏輯
- [x] 11.7 `ContactModal.tsx` - 降級為通用兜底，移除假「已建立安心留痕」文字

**B. 安心留痕自然嵌入**
- [x] 11.8 `TrustAssureHint.tsx` - 新增安心留痕提示區塊組件（四情境通用）
- [x] 11.9 四情境邏輯實作（A: 登入+已開啟 / B: 登入+未開啟 / C: 未登入+已開啟 / D: 未登入+未開啟）
- [x] 11.10 `LineLinkPanel` / `CallConfirmPanel` / `BookingModal` 嵌入 `TrustAssureHint`

**C. 整合驗證**
- [x] 11.11 Mock 資料更新（`lineId` / `phone` / `trustEnabled`）
- [x] 11.12 追蹤事件驗證（含安心留痕勾選事件）
- [x] 11.13 `npm run gate` 通過

#### Phase 11 問題說明

| 按鈕 | 用戶預期 | 目前行為 | 問題 |
|------|---------|---------|------|
| 加 LINE 聊聊 | 直接開啟 LINE | 跳出 ContactModal | Mental Model Mismatch |
| 預約看屋 | 選擇時段 | 跳出 ContactModal | 功能被泛化 |
| 致電諮詢 | 直接撥打電話 | 跳出 ContactModal | Unnecessary Friction |

#### Phase 11 設計方案

| 按鈕 | 有聯絡資訊時 | 無聯絡資訊時（兜底） |
|------|------------|-------------------|
| 加 LINE 聊聊 | `line://ti/p/{LINE_ID}` | ContactModal（預設 LINE） |
| 預約看屋 | BookingModal（時段選擇器） | BookingModal |
| 致電諮詢 | `tel:{PHONE}` | ContactModal（預設電話） |

---

## 一、現況分析

### 1.1 現有問題清單

| 問題類型 | 現況 | 位置 |
|---------|------|------|
| **Emoji 圖示** | `🛡️` `⏰` `✓` `📞` `🏠` `💰` `📝` `🤝` `🔑` | `TrustRoom.tsx`, `trust.types.ts` |
| **Emoji 文字** | `📢 房仲帶看紀錄` `📝 新增補充紀錄` `👨‍💼` `👤` | `Assure/Detail.tsx` |
| **缺乏品牌一致性** | 使用 inline style，未使用 Tailwind tokens | `TrustRoom.tsx` |
| **AI 味道** | 罐頭式語句、過度正式的語氣 | 各處文案 |
| **色彩不一致** | 硬編碼 hex 值，未引用首頁深藍色系統 | `TrustRoom.tsx` COLORS 物件 |

### 1.2 品牌色彩系統（從首頁擷取）

根據 `tailwind.config.cjs` 和 `src/index.css`，MaiHouses 品牌色彩系統：

```css
/* Primary Brand - 深藍系 */
--brand: #00385a;           /* 主品牌色 */
--brand-600: #004E7C;       /* 中間藍 */
--brand-light: #009FE8;     /* 亮藍強調 */
--primary-dark: #002a44;    /* 深色背景 */

/* Text */
--text-primary: #0A2246;    /* 深色文字 */
--text-muted: #6C7B91;      /* 次要文字 */

/* Background */
--bg-base: #F6F9FF;         /* 淺藍背景 */
--bg-page: #EEF2F7;         /* 頁面背景 */
--bg-elevated: #FFFFFF;     /* 卡片白底 */

/* Semantic */
--success: #0F6A23;         /* 成功綠 */
--danger: #DC2626;          /* 危險紅 */
--border: #E6EDF7;          /* 邊框 */
```

---

## 二、設計規範 (ui-ux-pro-max)

### 2.1 字體配對

根據搜尋結果，採用 **Corporate Trust** 字體組合：

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

/* Tailwind Config */
fontFamily: {
  heading: ['Lexend', 'sans-serif'],
  body: ['Source Sans 3', 'sans-serif']
}
```

**選擇理由**：
- Lexend 設計用於提高可讀性，適合金融/法律服務
- Source Sans 3 中性專業，適合表單與內文
- 兩者皆有 Google Fonts 支援

### 2.2 色彩規範

採用 **B2B Service** + **Legal Services** 調色盤：

| Token | Hex | 用途 |
|-------|-----|------|
| `brand-primary` | `#00385A` | 主按鈕、標題、品牌元素 |
| `brand-secondary` | `#004E7C` | 次要按鈕、hover 狀態 |
| `brand-accent` | `#009FE8` | 連結、進度條高亮 |
| `success` | `#0F6A23` | 已完成狀態、確認徽章 |
| `warning` | `#D97706` | 即將過期提示 |
| `danger` | `#DC2626` | 錯誤、過期狀態 |
| `bg-page` | `#F6F9FF` | 頁面背景 |
| `bg-card` | `#FFFFFF` | 卡片背景 |
| `text-primary` | `#0A2246` | 主文字 |
| `text-muted` | `#6C7B91` | 次要文字 |
| `border` | `#E6EDF7` | 邊框、分隔線 |

### 2.3 SVG 圖示系統

**圖示來源**: Lucide React（已在專案中使用）

| 步驟 | 原 Emoji | 新 SVG 圖示 | Lucide 名稱 |
|------|---------|------------|-------------|
| 1 - 已電聯 | 📞 | 電話圖示 | `Phone` |
| 2 - 已帶看 | 🏠 | 房屋圖示 | `Home` |
| 3 - 已出價 | 💰 | 錢幣圖示 | `Banknote` |
| 4 - 已斡旋 | 📝 | 文件圖示 | `FileText` |
| 5 - 已成交 | 🤝 | 握手圖示 | `Handshake` |
| 6 - 已交屋 | 🔑 | 鑰匙圖示 | `Key` |
| 安心交易徽章 | 🛡️ | 盾牌圖示 | `ShieldCheck` |
| 即將過期 | ⏰ | 時鐘圖示 | `Clock` |
| 已確認 | ✓ | 勾選圖示 | `Check` |

---

## 三、元件重設計

### 3.1 TrustRoom.tsx 重構

#### A. 移除 inline styles，改用 Tailwind

```tsx
// Before (現況)
const COLORS = {
  primary: '#1749D7',
  ...
};
const styles: Record<string, React.CSSProperties> = { ... };

// After (目標)
// 完全使用 Tailwind classes，引用 tailwind.config.cjs tokens
```

#### B. 徽章元件

```tsx
// Before
<span style={styles.badge}>🛡️ 安心交易</span>

// After
<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
  <ShieldCheck className="size-3.5" />
  安心交易
</span>
```

#### C. 步驟圖示

```tsx
// Before (trust.types.ts)
export const STEP_ICONS: Record<number, string> = {
  1: '📞',
  2: '🏠',
  ...
};

// After - 新增 SVG 圖示映射
import { Phone, Home, Banknote, FileText, Handshake, Key } from 'lucide-react';

export const STEP_ICONS_SVG: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Phone,
  2: Home,
  3: Banknote,
  4: FileText,
  5: Handshake,
  6: Key,
};
```

### 3.2 Assure/Detail.tsx 重構

#### A. Header 優化

```tsx
// Before
<header className={`${isMock ? 'bg-indigo-900' : 'bg-slate-900'} ...`}>
  <h1>MaiHouses <span>DEMO</span></h1>
</header>

// After - 使用品牌色
<header className="sticky top-0 z-overlay bg-brand-700 text-white shadow-brand-lg">
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-2">
      <ShieldCheck className="size-5 text-brand-light" />
      <span className="font-heading text-lg font-bold">安心留痕</span>
      {isMock && (
        <span className="rounded bg-warning-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-200">
          演示模式
        </span>
      )}
    </div>
    ...
  </div>
</header>
```

#### B. 步驟卡片

```tsx
// Before - emoji 在文字中
<p className="mb-2 border-b pb-1 text-xs font-bold text-gray-500">
  📢 房仲帶看紀錄
</p>

// After - SVG 圖示
<div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
  <FileText className="size-4 text-brand-600" />
  <span className="text-xs font-semibold text-text-muted">房仲帶看紀錄</span>
</div>
```

#### C. 角色徽章

```tsx
// Before
{tx.supplements.map((s, i) => (
  <span>{s.role === 'agent' ? '👨‍💼' : '👤'}</span>
))}

// After
<span className={cn(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
  s.role === 'agent'
    ? "bg-brand-50 text-brand-700"
    : "bg-emerald-50 text-emerald-700"
)}>
  {s.role === 'agent' ? <Briefcase className="size-3" /> : <User className="size-3" />}
  {s.role === 'agent' ? '房仲' : '買方'}
</span>
```

---

## 四、文案優化 - 去除 AI 味道

### 4.1 原則

1. **口語化**：使用台灣人日常說話的方式
2. **簡潔**：不要過度解釋
3. **實用**：直接說重點，不要廢話
4. **人味**：避免機器式罐頭語句

### 4.2 文案對照表

| 位置 | 原文案 (AI 味) | 新文案 (人味) |
|------|---------------|---------------|
| 標題 | 安心交易 | 交易紀錄 |
| 副標題 | 請填寫基本資料以保全交易過程全貌 | 留下聯絡方式，方便後續聯繫 |
| 隱私說明 | 此資訊僅供法律留痕使用，不會公開給房仲 | 資料只用於交易紀錄，不會外流 |
| 步驟說明 1 | 房仲已與您電話聯繫 | 房仲打來了 |
| 步驟說明 2 | 房仲已帶您實地看屋 | 看過房子了 |
| 步驟說明 3 | 您已向屋主提出價格 | 出價了 |
| 步驟說明 4 | 正在進行價格協商 | 在談價中 |
| 步驟說明 5 | 恭喜！交易已成交 | 成交了 |
| 步驟說明 6 | 完成交屋手續 | 拿到鑰匙 |
| 空狀態 | 目前未檢測到有效的登入憑證 (Token)。您可以進入演示模式來測試功能。 | 沒有找到你的交易紀錄，想先體驗看看嗎？ |
| 演示按鈕 | 啟動演示模式 (Demo Mode) | 體驗看看 |
| 提交按鈕 | 確認無誤並送出 | 確認送出 |
| 等待狀態 | 等待房仲提交... | 房仲還沒送出 |
| 補充紀錄 | 若之前的留言有誤，請在此新增補充說明。已送出的內容無法修改。 | 有話要補充？之前送出的改不了，但可以在這裡加註。 |

### 4.3 STEP_DESCRIPTIONS 更新

```typescript
// src/types/trust.types.ts

export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: '房仲打來了',
  2: '看過房子了',
  3: '出價了',
  4: '在談價中',
  5: '成交了',
  6: '拿到鑰匙',
};
```

---

## 五、視覺元素規範

### 5.1 卡片樣式

```tsx
// 標準卡片
<div className="rounded-xl border border-border bg-bg-card p-4 shadow-card">
  ...
</div>

// 強調卡片（當前步驟）
<div className="rounded-xl border-2 border-brand-500 bg-brand-50/30 p-4 shadow-brand-sm ring-2 ring-brand-100">
  ...
</div>

// 完成卡片
<div className="rounded-xl border border-success/30 bg-success/5 p-4">
  ...
</div>
```

### 5.2 按鈕樣式

```tsx
// 主要按鈕
<button className="w-full rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white shadow-brand-sm transition-all hover:bg-brand-600 hover:shadow-brand-md active:scale-[0.98]">
  確認送出
</button>

// 次要按鈕
<button className="w-full rounded-xl border border-border bg-white px-4 py-3 font-semibold text-text-primary transition-all hover:bg-bg-base hover:border-brand-300">
  稍後再說
</button>

// 危險按鈕
<button className="w-full rounded-xl bg-danger px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-red-700">
  重置進度
</button>
```

### 5.3 進度條

```tsx
<div className="h-2 w-full overflow-hidden rounded-full bg-border">
  <div
    className="h-2 rounded-full bg-gradient-to-r from-brand-700 to-success transition-all duration-500"
    style={{ width: `${(currentStep / 6) * 100}%` }}
  />
</div>
```

### 5.4 徽章樣式

```tsx
// 品牌徽章
<span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-100">
  <ShieldCheck className="size-3.5" />
  交易紀錄
</span>

// 狀態徽章 - 進行中
<span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
  進行中
</span>

// 狀態徽章 - 已完成
<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
  <Check className="size-3" />
  已確認
</span>

// 警告徽章
<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
  <Clock className="size-3" />
  3 天後到期
</span>
```

---

## 六、MaiMai 吉祥物整合規格

### 6.1 設計理念：極簡存在感

MaiMai 在 Trust Room 中的角色是「無聲陪伴者」，不主動干擾使用者，只在關鍵時刻給予視覺回饋。

**核心原則**：
- 不說話、不彈窗、不搶注意力
- 只用表情和動作傳達情感
- 出現短暫、消失自然

### 6.2 觸發時機與表情

| 時機 | 表情 | 動作 | 持續時間 |
|------|------|------|---------|
| 首次進入頁面 | `wave` | 從右下角滑入，揮手打招呼 | 3 秒後淡出 |
| 完成步驟確認 | `happy` | 原地跳躍一下 | 1.5 秒後回到 idle |
| 全部 6 步完成 | `celebrate` | 跳躍 + 放煙火 (confetti) | 3 秒 |
| API 錯誤發生 | `shy` | 縮小 + 微微顫抖 | 顯示到錯誤消失 |
| 長時間閒置 (>30s) | `idle` | 偶爾眨眼 | 持續 |

### 6.3 位置與尺寸

```css
/* 桌面版 */
.maimai-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 80px;
  height: 80px;
  z-index: 50;
  pointer-events: none; /* 不干擾點擊 */
}

/* 手機版 */
@media (max-width: 640px) {
  .maimai-container {
    bottom: 16px;
    right: 16px;
    width: 56px;
    height: 56px;
  }
}
```

### 6.4 動畫規格

```typescript
// useTrustRoomMaiMai Hook
interface TrustRoomMaiMaiState {
  visible: boolean;
  mood: MaiMaiMood;
  showConfetti: boolean;
}

const ANIMATION_CONFIG = {
  fadeInDuration: 300,      // ms
  fadeOutDuration: 500,     // ms
  waveDisplayTime: 3000,    // 首次進入揮手時間
  happyDisplayTime: 1500,   // 確認步驟開心時間
  celebrateDuration: 3000,  // 慶祝動畫時間
};
```

### 6.5 效能考量

- **Lazy Load**: MaiMai SVG 組件使用 `React.lazy()` 延遲載入
- **RAF**: 動畫使用 `requestAnimationFrame` 而非 `setInterval`
- **條件渲染**: 只在需要時 render MaiMai 組件
- **GPU 加速**: 使用 `transform` 和 `opacity` 觸發 GPU 合成

### 6.6 整合方式

```tsx
// src/pages/TrustRoom.tsx
import { useTrustRoomMaiMai } from '../hooks/useTrustRoomMaiMai';
import { MaiMaiBase } from '../components/MaiMai';

export default function TrustRoom() {
  const { maiMaiState, triggerHappy, triggerCelebrate } = useTrustRoomMaiMai();

  const handleConfirm = async (stepNum: number) => {
    // ... 原本的確認邏輯
    if (result?.success) {
      const allDone = checkAllStepsDone();
      if (allDone) {
        triggerCelebrate();
      } else {
        triggerHappy();
      }
    }
  };

  return (
    <div>
      {/* 主要內容 */}

      {/* MaiMai 吉祥物 */}
      {maiMaiState.visible && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none sm:bottom-4 sm:right-4">
          <MaiMaiBase
            mood={maiMaiState.mood}
            size={80}
            className="sm:size-14"
          />
          {maiMaiState.showConfetti && <Confetti />}
        </div>
      )}
    </div>
  );
}
```

---

## 七、實作檔案清單

### 需修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `src/types/trust.types.ts` | 移除 STEP_ICONS emoji，新增 STEP_ICONS_SVG，更新 STEP_DESCRIPTIONS 文案 |
| `src/pages/TrustRoom.tsx` | 完全重構，移除 inline styles，改用 Tailwind tokens，整合 MaiMai |
| `src/pages/Assure/Detail.tsx` | 移除所有 emoji，使用 Lucide icons，優化文案 |
| `src/components/TrustRoom/DataCollectionModal.tsx` | 更新文案去除 AI 味，微調樣式 |
| `tailwind.config.cjs` | 確認 tokens 完整性（已足夠） |
| `src/index.css` | 如需新增字體則更新 |

### 新增的檔案

| 檔案 | 用途 |
|------|------|
| `src/hooks/useTrustRoomMaiMai.ts` | MaiMai 狀態管理 Hook |

---

## 八、驗收標準

### 8.1 視覺驗收

- [ ] 所有 emoji 已被 SVG 圖示取代
- [ ] 色彩使用與首頁一致（深藍色系）
- [ ] 卡片、按鈕、徽章樣式符合規範
- [ ] 進度條漸層正確顯示
- [ ] 響應式設計在手機/桌面皆正常

### 8.2 文案驗收

- [ ] 所有文案已更新為口語化版本
- [ ] 無「恭喜」「您」等 AI 味詞彙
- [ ] 訊息簡潔直接，無廢話

### 8.3 功能驗收

- [ ] Mock 模式正常運作
- [ ] 正式模式（有 token）正常運作
- [ ] 步驟確認流程正常
- [ ] DataCollectionModal 正常彈出與提交

### 8.4 MaiMai 驗收

- [ ] 首次進入：wave 表情正確顯示並 3 秒後淡出
- [ ] 步驟確認：happy 表情正確觸發 1.5 秒
- [ ] 全部完成：celebrate + confetti 動畫正常
- [ ] 錯誤狀態：shy 表情正確顯示
- [ ] 手機版：尺寸適當（56px），位置正確
- [ ] 不遮擋：pointer-events: none，不影響互動
- [ ] 效能：無明顯卡頓，動畫流暢

### 8.5 程式碼品質

- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告
- [ ] 無 inline styles（全部改用 Tailwind）
- [ ] 無硬編碼 hex 值

---

## 九、時程建議

| 階段 | 工作項目 | 複雜度 |
|------|---------|--------|
| Phase 1 | 更新 `trust.types.ts` 的圖示與文案 | 低 |
| Phase 2 | 重構 `TrustRoom.tsx`（inline styles → Tailwind） | 高 |
| Phase 3 | 優化 `Assure/Detail.tsx` emoji 與文案 | 中 |
| Phase 4 | 微調 `DataCollectionModal.tsx` 文案 | 低 |
| Phase 5 | 整合測試與視覺 QA | 中 |
| Phase 6 | MaiMai 吉祥物整合 | 中 |

---

## 十、附錄：SVG 圖示參考

所有圖示皆來自 Lucide React（MIT License），已在專案中安裝。

```tsx
import {
  Phone,        // 電聯
  Home,         // 帶看
  Banknote,     // 出價
  FileText,     // 斡旋
  Handshake,    // 成交
  Key,          // 交屋
  ShieldCheck,  // 安心徽章
  Clock,        // 時間/過期
  Check,        // 確認勾選
  User,         // 買方
  Briefcase,    // 房仲
  AlertCircle,  // 警告
  RotateCcw,    // 重置
  Zap,          // 演示模式
} from 'lucide-react';
```

---

## 十一、房仲資料 API 化設計

> **目標**：將 Property 頁面右側的房仲資料從 Mock 連接到真實 API，並在 UAG 後台提供編輯功能。
> **適用範圍**：正式版新增詳情頁（Mock 頁面欄位調整為與 API 一致即可，不接 API）

### 11.1 現況分析

| 顯示項目 | 目前來源 | 狀態 |
|---------|---------|------|
| 姓名 | `agents.name` | ✅ 有真實欄位 |
| 大頭照 | `agents.avatar_url` | ✅ 有欄位但無上傳功能 |
| 公司 | `agents.company` | ✅ 有真實欄位 |
| 信任分 92 | `agents.trust_score` | ✅ 有欄位，需定義計算邏輯 |
| 獲得鼓勵 156 | `agents.encouragement_count` | ✅ 真實累計 |
| 成交率 62% | `Math.min(95, 60 + (trustScore % 30))` | ❌ **假計算，建議移除** |
| 累積成交 322 | `encouragementCount * 2 + 10` | ❌ **假計算，需改為真實** |
| 服務年資 4年 | 無欄位 | ❌ 需新增 |

### 11.2 指標調整方案

#### 移除「成交率」，改為「服務評價」

成交率問題：
- 難以驗證真實性
- 分母（帶看次數）難以定義
- 對新手房仲不公平

**建議替代：服務評價 (`service_rating`)**
```typescript
interface ServiceRating {
  score: number;        // 1-5 星，顯示平均值
  review_count: number; // 評價數量
}
// 顯示：「⭐ 4.8 (32則評價)」
```

#### 「累積成交」改為「完成案件」

```typescript
interface AgentMetrics {
  completed_cases: number;  // 已完成案件數（來自 Trust Room）
  active_listings: number;  // 目前刊登物件數
  service_years: number;    // 服務年資（自動計算）
}
```

### 11.3 資料庫 Schema 擴充

#### Migration: `20260130_agent_profile_extension.sql`

```sql
-- 基本資料（房仲可編輯）
ALTER TABLE agents ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE agents ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE agents ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS line_id VARCHAR(50);

-- 指標欄位（系統計算/統計）
ALTER TABLE agents ADD COLUMN IF NOT EXISTS service_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS completed_cases INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS active_listings INTEGER DEFAULT 0;

-- 預設值補齊
UPDATE agents SET joined_at = created_at WHERE joined_at IS NULL;

-- 索引
CREATE INDEX IF NOT EXISTS idx_agents_trust_score ON agents (trust_score DESC);
```

#### Supabase Storage Bucket

```sql
-- agent-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-avatars',
  'agent-avatars',
  true,
  2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS 政策
CREATE POLICY "Agents can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-avatars');

CREATE POLICY "Agents can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### 信任分計算 RPC

```sql
CREATE OR REPLACE FUNCTION fn_calculate_trust_score(p_agent_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score INTEGER := 60;  -- 基礎分
  v_agent agents%ROWTYPE;
BEGIN
  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id;

  IF NOT FOUND THEN
    RETURN 60;
  END IF;

  -- 服務評價加分 (最高 +20)
  v_score := v_score + LEAST(20, COALESCE(v_agent.service_rating, 0)::INTEGER * 4);

  -- 完成案件加分 (最高 +10)
  v_score := v_score + LEAST(10, COALESCE(v_agent.completed_cases, 0) / 5);

  -- 鼓勵數加分 (最高 +10)
  v_score := v_score + LEAST(10, COALESCE(v_agent.encouragement_count, 0) / 20);

  RETURN LEAST(100, v_score);
END;
$$;

-- 自動更新觸發器
CREATE OR REPLACE FUNCTION fn_update_agent_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.trust_score := fn_calculate_trust_score(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agents_trust_score
  BEFORE UPDATE ON agents
  FOR EACH ROW
  WHEN (
    OLD.service_rating IS DISTINCT FROM NEW.service_rating OR
    OLD.completed_cases IS DISTINCT FROM NEW.completed_cases OR
    OLD.encouragement_count IS DISTINCT FROM NEW.encouragement_count
  )
  EXECUTE FUNCTION fn_update_agent_trust_score();
```

### 11.4 API 端點設計

#### GET /api/agent/profile - 取得房仲資料（公開）

**檔案：** `api/agent/profile.ts`

```typescript
// 請求
GET /api/agent/profile?id={agent_id}

// 公開端點，不需認證（Property 頁面使用）

// 回應
{
  success: true,
  data: {
    id: string,
    name: string,
    avatar_url: string | null,
    company: string,
    bio: string | null,
    specialties: string[],
    certifications: string[],
    phone: string | null,
    line_id: string | null,

    // 指標
    trust_score: number,         // 1-100
    encouragement_count: number,
    service_rating: number,      // 1.0-5.0
    review_count: number,
    completed_cases: number,
    service_years: number,       // 自動計算
  }
}
```

#### GET /api/agent/me - 取得當前房仲資料（UAG 用）

**檔案：** `api/agent/me.ts`

```typescript
// 請求
GET /api/agent/me
Authorization: Bearer <jwt>

// 回應：同 profile，但包含更多私密欄位
{
  success: true,
  data: {
    ...profile,
    email: string,
    points: number,
    quota_s: number,
    quota_a: number,
    created_at: string,
  }
}
```

#### PUT /api/agent/profile - 更新房仲資料

**檔案：** `api/agent/profile.ts`

```typescript
// 請求
PUT /api/agent/profile
Authorization: Bearer <jwt>
Content-Type: application/json

{
  name?: string,           // 1-50 字
  bio?: string,            // 最多 500 字
  specialties?: string[],  // 最多 10 項
  certifications?: string[],
  phone?: string,          // 台灣手機格式
  line_id?: string,
  joined_at?: string,      // ISO date
}

// 回應
{
  success: true,
  data: { updated_at: string }
}
```

#### POST /api/agent/avatar - 上傳大頭照

**檔案：** `api/agent/avatar.ts`

```typescript
// 請求
POST /api/agent/avatar
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

FormData: { avatar: File }

// 驗證
// - 格式：image/jpeg, image/png, image/webp
// - 大小：最大 2MB
// - 建議尺寸：400x400px（自動縮放）

// 回應
{
  success: true,
  data: {
    avatar_url: string  // 公開 URL
  }
}
```

### 11.5 UAG 個人資料頁面

#### 目錄結構

```
src/pages/UAG/
├── Profile/
│   ├── index.tsx              # 主頁面
│   ├── BasicInfoSection.tsx   # 基本資料區塊
│   ├── AvatarUploader.tsx     # 照片上傳元件
│   ├── MetricsDisplay.tsx     # 指標展示（唯讀）
│   └── hooks/
│       └── useAgentProfile.ts # 資料 Hook
```

#### 表單欄位設計

| 欄位 | 類型 | 可編輯 | 驗證規則 |
|-----|------|-------|---------|
| 大頭照 | 圖片上傳 | ✅ | jpg/png/webp, ≤2MB |
| 姓名 | 文字 | ✅ | 必填, 1-50字 |
| 公司 | 文字 | ❌ | 系統設定 |
| 自我介紹 | 多行文字 | ✅ | 最多 500 字 |
| 專長區域 | 多選標籤 | ✅ | 預設選項，最多 10 項 |
| 證照 | 多選標籤 | ✅ | 預設選項 |
| 聯繫電話 | 電話 | ✅ | 台灣手機格式 |
| LINE ID | 文字 | ✅ | 選填 |
| 入行時間 | 日期選擇 | ✅ | 用於計算服務年資 |
| 信任分 | 數字 | ❌ | 系統自動計算 |
| 服務評價 | 星等 | ❌ | 來自客戶評價 |
| 完成案件 | 數字 | ❌ | 來自 Trust Room |
| 獲得鼓勵 | 數字 | ❌ | 來自客戶點擊 |

#### 專長區域/證照預設選項

```typescript
const SPECIALTY_OPTIONS = [
  '台北市', '新北市', '桃園市', '台中市', '高雄市',
  '預售屋', '新成屋', '中古屋', '商辦', '店面',
  '透天', '公寓', '大樓', '別墅', '土地',
];

const CERTIFICATION_OPTIONS = [
  '不動產經紀人',
  '不動產營業員',
  '地政士',
  '估價師',
];
```

### 11.6 Property 頁面指標顯示調整

#### AgentTrustCard 改用真實 API

```typescript
// 移除假計算
// ❌ 舊版
const dealRate = Math.min(95, 60 + (trustScore % 30));
const totalDeals = encouragementCount * 2 + 10;

// ✅ 新版
const { data: agent } = useQuery({
  queryKey: ['agent-profile', agentId],
  queryFn: () => fetchAgentProfile(agentId),
});
```

#### 卡片顯示設計

```
┌─────────────────────────────────────┐
│  [照片]  王小明                      │
│          永慶房屋 · 服務 4 年        │
│                                     │
│  信任分      服務評價     完成案件   │
│    92      ⭐ 4.8(32)      45 件    │
│                                     │
│  ❤️ 獲得 156 次鼓勵                  │
│                                     │
│  [💬 LINE 諮詢]    [📞 來電諮詢]     │
└─────────────────────────────────────┘
```

**變更說明：**
- ❌ 移除「成交率」（無法驗證）
- ✅ 新增「服務評價」（來自客戶）
- ✅ 「累積成交」改為「完成案件」（來自 Trust Room）
- ✅ 新增「服務年資」（自動計算）

### 11.7 指標計算邏輯

#### 信任分 (trust_score)

```
基礎分：60 分
+ 服務評價加分：rating × 4（最高 +20）
+ 完成案件加分：cases ÷ 5（最高 +10）
+ 獲得鼓勵加分：count ÷ 20（最高 +10）
= 總分（最高 100）
```

#### 服務評價 (service_rating)

```typescript
// 來源：客戶在 Trust Room 完成後的回饋
// 計算：所有評分的平均值
service_rating = SUM(ratings) / COUNT(ratings)
review_count = COUNT(ratings)
```

#### 完成案件 (completed_cases)

```typescript
// 來源：Trust Room 狀態為 'completed' 的案件數
completed_cases = COUNT(trust_cases WHERE status = 'completed' AND agent_id = ?)
```

#### 服務年資

```typescript
// 自動計算，不儲存
const serviceYears = Math.floor(
  (Date.now() - new Date(agent.joined_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
);
```

### 11.8 檔案清單

#### 新增檔案

| 檔案 | 說明 |
|-----|------|
| `supabase/migrations/20260130_agent_profile_extension.sql` | Schema 擴充 |
| `api/agent/profile.ts` | GET/PUT 房仲資料 |
| `api/agent/me.ts` | GET 當前房仲（含私密欄位） |
| `api/agent/avatar.ts` | POST 上傳大頭照 |
| `src/pages/UAG/Profile/index.tsx` | 個人資料主頁 |
| `src/pages/UAG/Profile/BasicInfoSection.tsx` | 基本資料區塊 |
| `src/pages/UAG/Profile/AvatarUploader.tsx` | 照片上傳元件 |
| `src/pages/UAG/Profile/MetricsDisplay.tsx` | 指標展示 |
| `src/pages/UAG/Profile/hooks/useAgentProfile.ts` | 資料 Hook |
| `src/types/agent.types.ts` | Agent 類型定義 |
| `src/services/agentService.ts` | Agent API 服務 |

#### 修改檔案

| 檔案 | 修改內容 |
|-----|---------|
| `src/components/AgentTrustCard.tsx` | 改用真實 API，移除假計算 |
| `src/pages/UAG/index.tsx` | 新增 Profile 路由 |
| `src/types/supabase-schema.ts` | 更新 AgentRow 類型 |

### 11.9 Mock 頁面欄位調整

> Mock 頁面（`/maihouses/property/MH-100001`）不接 API，但欄位需調整為與正式版一致。

| 原欄位 | 調整後 |
|-------|--------|
| 成交率 62% | 服務評價 ⭐ 4.8(32) |
| 累積成交 322 | 完成案件 45 件 |
| (無) | 服務年資 4 年 |

### 11.10 驗收標準

- [ ] `npm run typecheck` 通過
- [ ] `npm run lint` 通過
- [ ] 無 `any` 類型
- [ ] API 有完整 Zod 驗證
- [ ] RLS 政策正確設定
- [ ] 照片上傳支援 jpg/png/webp
- [ ] 照片大小限制 2MB
- [ ] UAG 個人資料頁可正常編輯
- [ ] Property 頁面顯示真實資料
- [ ] 信任分自動計算正確
- [ ] Mock 頁面欄位與正式版一致

### 11.11 實作優先順序

| 優先級 | 內容 |
|-------|------|
| P0 | 資料庫 Schema 擴充 |
| P0 | GET API（讀取） |
| P1 | PUT/POST API（寫入） |
| P1 | UAG 個人資料頁面 |
| P2 | Property 頁面更新 |
| P2 | Mock 頁面欄位調整 |

---

## Phase 11: 聯絡按鈕回歸本職 + 安心留痕自然嵌入

> **問題**: 三按鈕都導向同一個 ContactModal（違反心智模型），且聯絡流程中完全沒有安心留痕的入口。
> **目標**: 讓三按鈕各司其職，同時在每個聯絡面板中自然嵌入安心留痕提示，讓消費者在聯絡房仲時知道有這個服務。

### 11.1 現況問題分析

| 問題類別 | 現況 | 影響 |
|---------|------|------|
| **Mental Model Mismatch** | 三個按鈕（加 LINE / 致電 / 預約）點擊後都跳出相同 ContactModal | 用戶預期 LINE 直接開、電話直接撥，結果都要填表 |
| **Unnecessary Friction** | 所有聯絡操作都需要填表 | 增加流失率，尤其手機版 |
| **No Differentiation** | 三個按鈕功能完全相同 | 浪費介面空間 |
| **安心留痕斷裂** | 聯絡流程中沒有安心留痕的入口 | 消費者不知道有這個保障服務，錯失串接時機 |
| **假文案** | ContactModal 顯示「已建立安心留痕」但沒有真正建立 | 誤導用戶 |

### 11.2 設計方案概覽

#### A. 三按鈕行為規格

| 按鈕 | 觸發 UI | 有聯絡資訊時 | 無聯絡資訊時 |
|------|---------|------------|------------|
| **加 LINE 聊聊** | `LineLinkPanel` | 顯示 LINE 深層連結按鈕，一鍵開啟 | 顯示 fallback 表單，請用戶留 LINE ID |
| **致電諮詢** | `CallConfirmPanel` | 顯示電話號碼 + 撥打按鈕 | 顯示 fallback 表單，請房仲回電 |
| **預約看屋** | `BookingModal` | 時段選擇器（保留現有） | 時段選擇器 |

#### B. 安心留痕嵌入：`TrustAssureHint`

每個面板（LineLinkPanel / CallConfirmPanel / BookingModal）底部都嵌入 `TrustAssureHint` 提示區塊。根據登入狀態和房仲是否已開啟安心留痕，顯示不同內容：

| 情境 | `isLoggedIn` | `trustEnabled` | 提示色 | checkbox 文案 | 勾選後動作 |
|------|-------------|----------------|--------|-------------|-----------|
| **A** | `true` | `true` | 藍色 (`brand-50`) | 同時建立安心留痕案件 | 呼叫 `auto-create-case`（帶 `userId`） |
| **B** | `true` | `false` | 琥珀色 (`amber-50`) | 同時要求房仲開啟安心留痕 | 呼叫 `requestEnable()`，在 lead 中附帶要求 |
| **C** | `false` | `true` | 藍色 (`brand-50`) | 同時建立安心留痕案件 | 呼叫 `auto-create-case`（不帶 `userId`，匿名案件） |
| **D** | `false` | `false` | 琥珀色 (`amber-50`) | 請房仲開啟安心留痕 | 在 lead 中附帶要求，不呼叫 API |

### 11.3 `TrustAssureHint` 組件設計

#### Props Interface

```typescript
// src/components/PropertyDetail/TrustAssureHint.tsx

interface TrustAssureHintProps {
  /** 用戶是否已登入 */
  isLoggedIn: boolean;
  /** 該物件的房仲是否已開啟安心留痕 */
  trustEnabled: boolean;
  /** 物件 ID（用於建立案件） */
  propertyId: string;
  /** 房仲 ID */
  agentId: string;
  /** checkbox 勾選狀態由外部控制 */
  checked: boolean;
  /** checkbox 勾選變更回調 */
  onCheckedChange: (checked: boolean) => void;
}
```

#### 組件結構

```tsx
<div className={cn(
  'mt-4 rounded-lg border p-3',
  trustEnabled
    ? 'border-brand-200 bg-brand-50'      // 情境 A/C：藍色
    : 'border-amber-200 bg-amber-50'       // 情境 B/D：琥珀色
)}>
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="mt-0.5 size-4 rounded border-gray-300 text-brand-600"
    />
    <div>
      <p className="text-sm font-medium text-text-primary">
        {getCheckboxLabel(isLoggedIn, trustEnabled)}
      </p>
      <p className="mt-0.5 text-xs text-text-muted">
        {getHintDescription(isLoggedIn, trustEnabled)}
      </p>
    </div>
  </label>
  <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
    <ShieldCheck className="size-3.5" />
    <span>安心留痕：交易過程全程記錄，保障雙方權益</span>
  </div>
</div>
```

#### 文案對照表

| 情境 | checkbox 文案 | 說明文字 |
|------|-------------|---------|
| A (登入+已開啟) | 同時建立安心留痕案件 | 交易紀錄會自動建立，幫你記錄每一步 |
| B (登入+未開啟) | 同時要求房仲開啟安心留痕 | 我們會通知房仲開啟交易紀錄功能 |
| C (未登入+已開啟) | 同時建立安心留痕案件 | 不用登入也能建立，之後可用手機綁定 |
| D (未登入+未開啟) | 請房仲開啟安心留痕 | 會在訊息中附帶你的要求 |

### 11.4 `LineLinkPanel` 組件設計

#### Props Interface

```typescript
// src/components/PropertyDetail/LineLinkPanel.tsx

interface LineLinkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** 房仲 LINE ID（有值 → 直開，無值 → fallback） */
  agentLineId?: string;
  agentName: string;
  /** 安心留痕相關 */
  isLoggedIn: boolean;
  trustEnabled: boolean;
  onTrustAction?: (checked: boolean) => Promise<void>;
  onFallbackContact?: (trustChecked: boolean) => void;
}
```

#### 有 LINE ID 時的 UI

```
┌─────────────────────────────────────┐
│  加 LINE 聊聊                    ✕  │
│                                     │
│  [LINE 圖示]                        │
│  點擊下方按鈕直接開啟 LINE          │
│  加入 王小明 的好友                  │
│                                     │
│  ┌─ [開啟 LINE] ──────────────────┐ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ TrustAssureHint ──────────────┐ │
│  │ ☑ 同時建立安心留痕案件          │ │
│  │   交易紀錄會自動建立...         │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 無 LINE ID 時的 Fallback UI

```
┌─────────────────────────────────────┐
│  加 LINE 聊聊                    ✕  │
│                                     │
│  房仲尚未設定 LINE ID               │
│  留下你的 LINE ID，房仲會主動加你   │
│                                     │
│  [你的 LINE ID: _______________]    │
│  [送出]                             │
│                                     │
│  ┌─ TrustAssureHint ──────────────┐ │
│  │ ☑ 請房仲開啟安心留痕            │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 11.5 `CallConfirmPanel` 組件設計

#### Props Interface

```typescript
// src/components/PropertyDetail/CallConfirmPanel.tsx

interface CallConfirmPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** 房仲電話（有值 → 顯示號碼+撥打，無值 → fallback） */
  agentPhone?: string;
  agentName: string;
  /** 安心留痕相關 */
  isLoggedIn: boolean;
  trustEnabled: boolean;
  onTrustAction?: (checked: boolean) => Promise<void>;
  onFallbackContact?: (trustChecked: boolean) => void;
}
```

#### 有電話時的 UI

```
┌─────────────────────────────────────┐
│  致電諮詢                        ✕  │
│                                     │
│  [電話圖示]                         │
│  王小明 的聯絡電話                   │
│  0912-345-678                       │
│                                     │
│  ┌─ [撥打電話] ───────────────────┐ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ TrustAssureHint ──────────────┐ │
│  │ ☑ 同時建立安心留痕案件          │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 無電話時的 Fallback UI

```
┌─────────────────────────────────────┐
│  致電諮詢                        ✕  │
│                                     │
│  房仲尚未設定聯絡電話               │
│  留下你的電話，房仲會回電給你       │
│                                     │
│  [你的電話: ___________________]    │
│  [送出]                             │
│                                     │
│  ┌─ TrustAssureHint ──────────────┐ │
│  │ ☑ 請房仲開啟安心留痕            │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 11.6 `BookingModal` 安心留痕嵌入

在現有 `BookingModal` 的時段選擇器下方，加入 `TrustAssureHint`：

```
┌─────────────────────────────────────┐
│  預約看屋                        ✕  │
│                                     │
│  選擇你方便的時段                    │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ 上午  │ │ 下午  │ │ 晚上  │     │
│  └───────┘ └───────┘ └───────┘     │
│                                     │
│  [備註: _______________________]    │
│                                     │
│  ┌─ TrustAssureHint ──────────────┐ │
│  │ ☑ 同時建立安心留痕案件          │ │
│  │   交易紀錄會自動建立...         │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ [確認預約] ───────────────────┐ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 11.7 按鈕觸發流程圖

```
用戶點擊「加 LINE 聊聊」
    └─ 開啟 LineLinkPanel
       ├─ 有 lineId → 顯示「開啟 LINE」按鈕
       │   ├─ 點擊 → window.open(`https://line.me/R/ti/p/${lineId}`)
       │   └─ 若勾選安心留痕 → 執行對應情境動作
       └─ 無 lineId → 顯示 fallback 表單
           ├─ 送出 → 建立 lead（附帶用戶 LINE ID）
           └─ 若勾選安心留痕 → 在 lead 中附帶要求

用戶點擊「致電諮詢」
    └─ 開啟 CallConfirmPanel
       ├─ 有 phone → 顯示電話號碼 + 「撥打電話」按鈕
       │   ├─ 點擊 → window.location.href = `tel:${phone}`
       │   └─ 若勾選安心留痕 → 執行對應情境動作
       └─ 無 phone → 顯示 fallback 表單
           ├─ 送出 → 建立 lead（請房仲回電）
           └─ 若勾選安心留痕 → 在 lead 中附帶要求

用戶點擊「預約看屋」
    └─ 開啟 BookingModal
       ├─ 選擇時段 → 送出預約
       └─ 若勾選安心留痕 → 執行對應情境動作
```

### 11.8 安心留痕情境動作詳細邏輯

```typescript
// 根據情境決定安心留痕動作
async function handleTrustAssureAction(
  scenario: 'A' | 'B' | 'C' | 'D',
  context: { propertyId: string; agentId: string; userId?: string }
): Promise<void> {
  switch (scenario) {
    case 'A':
      // 登入 + 已開啟 → 直接建立案件
      await fetch('/api/trust/auto-create-case', {
        method: 'POST',
        body: JSON.stringify({
          property_id: context.propertyId,
          agent_id: context.agentId,
          user_id: context.userId,
        }),
      });
      break;

    case 'B':
      // 登入 + 未開啟 → 通知房仲開啟
      await fetch('/api/property/enable-trust', {
        method: 'POST',
        body: JSON.stringify({
          property_id: context.propertyId,
          requested_by: context.userId,
        }),
      });
      break;

    case 'C':
      // 未登入 + 已開啟 → 建立匿名案件
      await fetch('/api/trust/auto-create-case', {
        method: 'POST',
        body: JSON.stringify({
          property_id: context.propertyId,
          agent_id: context.agentId,
          // 不帶 user_id，後續可用手機綁定
        }),
      });
      break;

    case 'D':
      // 未登入 + 未開啟 → 在 lead 中附帶要求（不另外呼叫 API）
      // 由呼叫方在建立 lead 時附帶 trustAssureRequested: true
      break;
  }
}

// 情境判斷 helper
function getTrustScenario(isLoggedIn: boolean, trustEnabled: boolean): 'A' | 'B' | 'C' | 'D' {
  if (isLoggedIn && trustEnabled) return 'A';
  if (isLoggedIn && !trustEnabled) return 'B';
  if (!isLoggedIn && trustEnabled) return 'C';
  return 'D';
}
```

### 11.9 `AgentTrustCard` 按鈕改造

#### 修改說明

現有 `AgentTrustCard.tsx` 三個按鈕都呼叫同一個 `onContactClick()`，改為各自開啟對應面板。

```typescript
// 原本（所有按鈕同一個 callback）
<button onClick={() => onContactClick?.()}>加 LINE 聊聊</button>
<button onClick={() => onContactClick?.()}>致電諮詢</button>
<button onClick={() => onContactClick?.()}>預約看屋</button>

// 改為（各自開啟面板）
<button onClick={() => onLineClick?.()}>加 LINE 聊聊</button>
<button onClick={() => onCallClick?.()}>致電諮詢</button>
<button onClick={() => onBookingClick?.()}>預約看屋</button>
```

#### Props 變更

```typescript
interface AgentTrustCardProps {
  agent: Agent;
  isDemo?: boolean;
  // 移除：onContactClick
  // 新增：各按鈕獨立 callback
  onLineClick?: () => void;
  onCallClick?: () => void;
  onBookingClick?: () => void;
}
```

### 11.10 `PropertyDetailPage` 整合

`PropertyDetailPage` 負責管理三個面板的開關狀態，並傳遞所有必要資訊。

```typescript
// 狀態管理
const [linePanelOpen, setLinePanelOpen] = useState(false);
const [callPanelOpen, setCallPanelOpen] = useState(false);
const [bookingOpen, setBookingOpen] = useState(false);

// AgentTrustCard callbacks
<AgentTrustCard
  agent={agent}
  onLineClick={() => setLinePanelOpen(true)}
  onCallClick={() => setCallPanelOpen(true)}
  onBookingClick={() => setBookingOpen(true)}
/>

// 面板渲染
<LineLinkPanel
  isOpen={linePanelOpen}
  onClose={() => setLinePanelOpen(false)}
  agentLineId={agent.lineId}
  agentName={agent.name}
  isLoggedIn={isLoggedIn}
  trustEnabled={property.trustEnabled}
  propertyId={property.id}
  agentId={agent.id}
/>

<CallConfirmPanel
  isOpen={callPanelOpen}
  onClose={() => setCallPanelOpen(false)}
  agentPhone={agent.phone}
  agentName={agent.name}
  isLoggedIn={isLoggedIn}
  trustEnabled={property.trustEnabled}
  propertyId={property.id}
  agentId={agent.id}
/>

<BookingModal
  isOpen={bookingOpen}
  onClose={() => setBookingOpen(false)}
  agentName={agent.name}
  isLoggedIn={isLoggedIn}
  trustEnabled={property.trustEnabled}
  propertyId={property.id}
  agentId={agent.id}
/>
```

### 11.11 `ContactModal` 降級

`ContactModal` 不再作為主要聯絡入口，降級為：
- 其他頁面的通用兜底（例如搜尋結果頁）
- 移除假的「已建立安心留痕」文字

### 11.12 `MobileActionBar` / `MobileCTA` 對齊

手機版底部按鈕行為需與桌面版完全一致：

```typescript
// MobileActionBar.tsx
<button onClick={() => onLineClick?.()}>LINE</button>
<button onClick={() => onCallClick?.()}>致電</button>
<button onClick={() => onBookingClick?.()}>預約</button>

// MobileCTA.tsx（浮動按鈕）
// 主按鈕保留「預約看屋」，長按或展開顯示 LINE / 致電
```

### 11.13 新增檔案清單

| 檔案 | 說明 |
|-----|------|
| `src/components/PropertyDetail/TrustAssureHint.tsx` | 安心留痕提示區塊（四情境通用） |
| `src/components/PropertyDetail/LineLinkPanel.tsx` | LINE 連結面板 Modal |
| `src/components/PropertyDetail/CallConfirmPanel.tsx` | 致電確認面板 Modal |

### 11.14 修改檔案清單

| 檔案 | 修改內容 |
|-----|---------|
| `src/components/PropertyDetail/BookingModal.tsx` | 嵌入 `TrustAssureHint` |
| `src/components/AgentTrustCard.tsx` | 按鈕改為各自 callback（`onLineClick` / `onCallClick` / `onBookingClick`） |
| `src/pages/PropertyDetailPage.tsx` | 管理三面板開關狀態，傳遞安心留痕相關 props |
| `src/components/PropertyDetail/MobileActionBar.tsx` | 對齊桌面版按鈕邏輯 |
| `src/components/PropertyDetail/MobileCTA.tsx` | 對齊桌面版按鈕邏輯 |
| `src/components/ContactModal.tsx` | 降級為通用兜底，移除假「已建立安心留痕」文字 |
| `src/services/propertyService.ts` | 確保 `PropertyData` 包含 `trustEnabled` |

### 11.15 Mock 資料更新

```typescript
// src/services/propertyService.ts
export const DEFAULT_PROPERTY: PropertyData = {
  // ...existing fields
  trustEnabled: true,  // 新增：安心留痕開啟狀態
  agent: {
    // ...existing fields
    lineId: 'maihouses_demo',   // 已有（Phase 9）
    phone: '0912-345-678',       // 已有（Phase 9）
  },
};
```

### 11.16 追蹤事件

| 事件 | 觸發時機 | 參數 |
|-----|---------|------|
| `line_click` | 點擊加 LINE | `{ has_line_id: boolean, source: 'sidebar' \| 'mobile' }` |
| `call_click` | 點擊致電 | `{ has_phone: boolean, source: 'sidebar' \| 'mobile' }` |
| `booking_click` | 點擊預約看屋 | `{ source: 'sidebar' \| 'mobile' }` |
| `trust_assure_checked` | 勾選安心留痕 checkbox | `{ scenario: 'A' \| 'B' \| 'C' \| 'D', panel: 'line' \| 'call' \| 'booking' }` |
| `trust_assure_created` | 安心留痕案件建立成功 | `{ scenario: 'A' \| 'C', property_id: string }` |
| `trust_assure_requested` | 要求房仲開啟安心留痕 | `{ scenario: 'B' \| 'D', property_id: string }` |

### 11.17 驗收標準

#### 三按鈕回歸本職
- [x] 點擊「加 LINE 聊聊」→ 開啟 `LineLinkPanel`（有 lineId 顯示開啟按鈕，無則 fallback 表單）
- [x] 點擊「致電諮詢」→ 開啟 `CallConfirmPanel`（有 phone 顯示撥打按鈕，無則 fallback 表單）
- [x] 點擊「預約看屋」→ 開啟 `BookingModal`（時段選擇器）
- [x] 三個按鈕不再導向同一個 ContactModal
- [x] 手機版行為與桌面版一致

#### 安心留痕嵌入
- [x] 情境 A（登入+已開啟）：藍色提示，勾選後呼叫 `auto-create-case` 帶 userId
- [x] 情境 B（登入+未開啟）：琥珀色提示，勾選後呼叫 `requestEnable()`
- [x] 情境 C（未登入+已開啟）：藍色提示，勾選後呼叫 `auto-create-case` 不帶 userId
- [x] 情境 D（未登入+未開啟）：琥珀色提示，勾選後在 lead 中附帶要求
- [x] 三個面板（LINE / 電話 / 預約）都有 `TrustAssureHint`
- [x] checkbox 預設不勾選，用戶主動勾選才觸發
- [x] ContactModal 不再顯示假的「已建立安心留痕」文字

#### 程式碼品質
- [x] `npm run typecheck` 通過
- [x] `npm run lint` 通過
- [x] 無 `any` 類型
- [x] 追蹤事件正常記錄（含安心留痕相關事件）
- [x] Mock 模式三按鈕功能正常

---

**文件結束**
待確認後開始實作。
