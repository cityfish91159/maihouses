# 專案狀態

> 自動產生區段由 `npm run gen-context` 更新，手動區段由開發者維護

## 當前階段

**Phase 10+ UX 規範修復完成** — 進入穩定維護期

## 優先任務

| 優先級 | 任務 | 狀態 |
|--------|------|------|
| P0 | PropertyUploadPage Timer cleanup + XSS 防護 | 待做 |
| P0 | MediaSection form.images[0] undefined 防護 | 待做 |
| P1 | PropertyDetailPage 拆分（1009 行 → 6 子組件） | 待做 |
| P1 | TrustServiceBanner alert() → Toast 替換 | 待做 |

## 最近完成

<!-- gen-context:recent-commits -->
```
3fb94c37 fix(ux): 修復 33 項 UX/A11y 問題（P0 5項 + P1 18項 + P2 10項）
d7b500d9 fix(UAG): #7 修復 Profile Mock 模式返回 UAG 白屏問題
7178c2e1 docs: 標記 #7 Profile Mock 模式完成
e7ea3724 feat(UAG): #7 實作 Profile 頁 Mock 模式支援
08df67b5 fix(UAG): Mock 模式名字改為游杰倫
73716cae feat(UAG): 實作 #6 Header Mock 模式使用者區塊
fe33e955 fix(api): 修復 public-stats.ts TypeScript 錯誤
4a715a54 refactor(PropertyDetail): #8 社會證明優化 + API 格式統一
47edaa76 feat(PropertyDetail): 實作 #5 DEFAULT_PROPERTY agent 完整 mock 資料
b769a896 feat(PropertyDetail): 實作 #8 社會證明真實數據
```

## 禁區（已穩定，勿碰）

- `api/trust/` — Trust API 已完成 12 Skills 審查，穩定
- `src/components/TrustFlow/` — 已拆分為 8 模組，結構穩定
- `supabase/migrations/` — 已部署的 migration 不可修改

## 已知問題

- PropertyUploadPage L373 `prompt()` 有 XSS 風險（需 DOMPurify）
- 部分舊檔案仍有 `as` 類型斷言（120 處為必要斷言）
- 29 項 FE-1 優化工單待清理（詳見 `.context/archive/` 歸檔）

## 自動統計

> 由 `npm run gen-context` 於 2026-02-09 產生

### 最近 commit
```
3fb94c37 fix(ux): 修復 33 項 UX/A11y 問題（P0 5項 + P1 18項 + P2 10項）
d7b500d9 fix(UAG): #7 修復 Profile Mock 模式返回 UAG 白屏問題
7178c2e1 docs: 標記 #7 Profile Mock 模式完成
e7ea3724 feat(UAG): #7 實作 Profile 頁 Mock 模式支援
08df67b5 fix(UAG): Mock 模式名字改為游杰倫
73716cae feat(UAG): 實作 #6 Header Mock 模式使用者區塊
fe33e955 fix(api): 修復 public-stats.ts TypeScript 錯誤
4a715a54 refactor(PropertyDetail): #8 社會證明優化 + API 格式統一
47edaa76 feat(PropertyDetail): 實作 #5 DEFAULT_PROPERTY agent 完整 mock 資料
b769a896 feat(PropertyDetail): 實作 #8 社會證明真實數據
```

### 檔案數量
| 目錄 | 檔案數 |
|------|--------|
| src/ | 472 |
| api/ | 122 |
| 測試 | 151 |

### 大檔案（>500 行）
```
2153 src/types/api.generated.ts
1952 src/constants/maimai-persona.ts
1703 src/pages/UAG/UAG.module.css
1316 src/pages/UAG/UAG-deai-v2.module.css
1248 api/trust/__tests__/send-notification.test.ts
1167 api/trust/send-notification.ts
1091 api/trust/__tests__/auto-create-case.test.ts
1023 api/trust/__tests__/cases.test.ts
1003 src/types/__tests__/trust-flow.types.test.ts
992 api/community/wall.ts
971 api/trust/__tests__/wake.test.ts
933 src/pages/UAG/components/ReportGenerator/ReportGenerator.module.css
910 src/pages/Community/components/QASection.tsx
899 src/pages/UAG/UAGDeAIDemoV2.tsx
887 src/pages/UAG/demo/UIUXDemo.tsx
```

### 近 7 天修改熱點
```
    12 .claude/tickets/AGENT PROFILE.md
    11 src/pages/PropertyDetailPage.tsx
     8 src/components/PropertyDetail/MobileActionBar.tsx
     7 src/components/PropertyDetail/MobileCTA.tsx
     6 src/components/PropertyDetail/PropertyInfoCard.tsx
     6 src/pages/__tests__/PropertyDetailPage.optimization.test.tsx
     5 src/components/AgentTrustCard.tsx
     5 src/components/PropertyDetail/VipModal.tsx
     5 src/pages/UAG/components/UAGHeader.tsx
     5 src/pages/__tests__/PropertyDetailPage.phase11.test.tsx
```
