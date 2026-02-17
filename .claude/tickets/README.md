# MaiHouses 工單總索引

> 所有進行中、待辦、計畫中的工單集中於此目錄。
> 已完成工單歸入 `.context/archive/`。
> 最後更新：2026-02-17

---

## 工單目錄

### 主線任務

| 工單 | 檔案 | 狀態 | 說明 |
|------|------|------|------|
| MOCK-SYSTEM-UNIFY | [MOCK-SYSTEM.md](./MOCK-SYSTEM.md) | 🔄 進行中 | 全站三模式架構（visitor/demo/live）統一 |
| MAIMAI-ENRICH | [MAIMAI-ENRICH.md](./MAIMAI-ENRICH.md) | 🆕 新建 | MaiMai 吉祥物全面擴充（6 Phase） |

### 安全 / 維運

| 工單 | 檔案 | 狀態 | 說明 |
|------|------|------|------|
| VERCEL-KEY-SECURITY | [VERCEL-KEY-SECURITY.md](./VERCEL-KEY-SECURITY.md) | ⚠️ 待辦 | Vercel 金鑰安全 Runbook |
| AUDIT-LOGS-RLS-FIX | [AUDIT-LOGS-RLS-FIX.md](./AUDIT-LOGS-RLS-FIX.md) | ⚠️ 待辦 | Audit Logs RLS 修復計畫 |
| RLS-CICD-IMPLEMENTATION | [RLS-CICD-IMPLEMENTATION.md](./RLS-CICD-IMPLEMENTATION.md) | ⚠️ 待辦 | RLS CI/CD 實作 |

### 功能工單

| 工單 | 檔案 | 狀態 | 說明 |
|------|------|------|------|
| TOAST-MIGRATION | [TOAST-MIGRATION.md](./TOAST-MIGRATION.md) | ⚠️ 待辦 | TrustServiceBanner alert() → Toast 替換 |
| TRUST-ROOM-UX-REDESIGN | [TRUST-ROOM-UX-REDESIGN.md](./TRUST-ROOM-UX-REDESIGN.md) | ⚠️ 待辦 | Trust Room UX 重設計 |
| TOKEN-UPGRADE-WORKFLOW | [TOKEN-UPGRADE-WORKFLOW.md](./TOKEN-UPGRADE-WORKFLOW.md) | ⚠️ 待辦 | Token 升級工作流程 |

---

## 狀態說明

| 符號 | 意義 |
|------|------|
| 🆕 | 新建，尚未開始 |
| 🔄 | 進行中 |
| ⚠️ | 待辦（有具體任務但尚未排程） |
| ✅ | 已完成（應移至 `.context/archive/`） |
| ❄️ | 凍結（待決策後再推進） |

---

## MOCK-SYSTEM 快速概覽

**進度**：P0 全完成 ✅ · P1 部分完成 · P2 未開始

**待辦清單（未完成）**：
- `#14b` useRegisterGuide hook（8 場景訪客引導）
- `#7` 登入後重定向（agent→UAG / consumer→首頁）
- `#12` Header 三模式 UI
- `#13` PropertyListPage Header 統一
- `#28` Zod 收緊 + as 斷言消除（5 檔）
- `#29` 跨裝置三模式驗證（iOS Safari / 手機 / 私隱模式）
- `#8b` 社區牆發文/留言本地化
- `#8c` 社區列表 API
- `#8d` 社區探索頁
- `#12b` Header 社區導航分層
- `#9` 移除靜態 HTML mock 頁
- `#10a` DemoBadge.tsx 浮動標籤
- `#10b` exitDemoMode 退出清理
- `#11` Feed 產品定位（待決策 ❄️）
- `#16` 全站文案健康檢查
- `#21` console.log → logger
- `#22` Tailwind classnames 排序
- `#23` React Hook 依賴陣列優化
- `#24` Chat 三模式
- `#25` Assure 三模式
- `#26` 登出清理
- `#27` UAG 新房仲空狀態 + MaiMai
- `#30a~c` PropertyListPage 三模式重構

---

## MAIMAI-ENRICH 快速概覽

**進度**：Phase 1-6 全未開始

**6 大 Phase**：
1. **Phase 1** — 新增 6 種心情（love / cool / surprised / wink / cry / angry）
2. **Phase 2** — 互動深度（瞳孔追隨 / Combo 升級 / Hover 說話 / 拖曳）
3. **Phase 3** — 對話氣泡（Typing 動畫 / Queue / 訊息庫 / 時段感知）
4. **Phase 4** — 新特效（心形 / 淚滴 / 驚嘆號 / 閃電 / 墨鏡 / 季節彩蛋）
5. **Phase 5** — 新頁面整合（Login / Register / Search / Chat / Community / UAG / 404）
6. **Phase 6** — 全站語境感知狀態機（自動推導 / cooldown / 頻率控制）

---

## 優先級總排序（跨工單）

| 優先級 | 工單 | 任務 |
|--------|------|------|
| P0 🔥 | MOCK-SYSTEM | `#14b` useRegisterGuide |
| P0 🔥 | MOCK-SYSTEM | `#7` 登入後重定向 |
| P0 🔥 | VERCEL-KEY-SECURITY | Vercel 金鑰安全 |
| P1 | MOCK-SYSTEM | `#12` Header 三模式 UI |
| P1 | TOAST-MIGRATION | alert() → Toast |
| P1 | MAIMAI-ENRICH | Phase 1（新心情） |
| P1 | MAIMAI-ENRICH | Phase 2（瞳孔追隨） |
| P2 | MOCK-SYSTEM | `#8b~d` 社區牆 |
| P2 | MAIMAI-ENRICH | Phase 3（氣泡升級） |
| P2 | MAIMAI-ENRICH | Phase 4（新特效） |
| P2 | TRUST-ROOM-UX-REDESIGN | UX 重設計 |
| P3 | MAIMAI-ENRICH | Phase 5（新頁面） |
| P3 | MAIMAI-ENRICH | Phase 6（狀態機） |
| P3 | MOCK-SYSTEM | `#30a~c` PropertyListPage |
