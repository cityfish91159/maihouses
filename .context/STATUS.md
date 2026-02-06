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
d276f06b fix(ux): Phase 1-10 完整 UX 規範修復 + BOM 問題解決
dd3f9957 feat: phase8 assure refactor
63ca415c chore: phase7 ux and test fixes
73e57410 feat: trust room phase6 mascot
dd111ce9 fix: trust room review improvements
```

## 禁區（已穩定，勿碰）

- `api/trust/` — Trust API 已完成 12 Skills 審查，穩定
- `src/components/TrustFlow/` — 已拆分為 8 模組，結構穩定
- `supabase/migrations/` — 已部署的 migration 不可修改

## 已知問題

- PropertyUploadPage L373 `prompt()` 有 XSS 風險（需 DOMPurify）
- 部分舊檔案仍有 `as` 類型斷言（120 處為必要斷言）
- 29 項 FE-1 優化工單待清理（詳見 `.context/archive/` 歸檔）
