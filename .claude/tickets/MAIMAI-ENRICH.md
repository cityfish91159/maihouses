# MAIMAI-ENRICH: MaiMai 全面擴充計畫

> 建立日期：2026-02-17
> 目標：將 MaiMai 從「靜態吉祥物」升級為「有靈魂的全站 AI 陪伴角色」

---

## 擴充進度總覽

### Phase 1 — 新心情狀態（6 種新增）

- [ ] **#M1a** `love` 心情 — 愛心眼 + 粉紅腮紅 + 心形特效（`constants.ts` + `configs.ts` + `MaiMaiBase.tsx`）
- [ ] **#M1b** `cool` 心情 — 墨鏡 SVG 疊加 + 比讚手勢 + 閃光特效
- [ ] **#M1c** `surprised` 心情 — 大圓眼 + 嘴大開 + 驚嘆號爆炸特效
- [ ] **#M1d** `wink` 心情 — 單眼閉合路徑 + 俏皮嘴角
- [ ] **#M1e** `cry` 心情 — 眼淚 SVG 路徑 + 下垂嘴 + 淚滴下落特效
- [ ] **#M1f** `angry` 心情 — 皺眉 V 型眉 + 紅臉腮紅 + shake 加強動畫
- [ ] **#M1g** 更新 `types.ts` — 擴充 `MaiMaiMood` union type（6 新值）；同步更新 `MaiMaiContext.tsx` 的 `VALID_MOODS` Set（含補上遺漏的 `header`）+ `isValidMood` 守衛
- [ ] **#M1h** 更新 `MaiMai.test.ts` — 補齊 6 種新心情的配置完整性測試

### Phase 2 — 互動深度升級

- [ ] **#M2a** `useMaiMaiMouse.ts` — 瞳孔追隨游標 Hook（idle/wave 狀態限定，mobile 停用）。使用 `requestAnimationFrame` 節流，每幀最多計算一次座標，禁止在 `mousemove` 直接 `setState`
- [ ] **#M2b** 點擊 Combo 機制升級 — 2次 wave → 3次 happy → 5次 celebrate → 10次 cool（隱藏彩蛋）。Combo 在 3 秒無點擊後重置為 0；每次升級心情不重置計數器；10 次觸發後重置。取代現有 `useMaiMaiMood.ts` 的 5 次→celebrate 邏輯
- [ ] **#M2c** Hover 說話觸發 — idle 狀態 hover 自動說出 1 句隨機提示語（含 cooldown 防重複）
- [ ] **#M2d** 拖曳互動（PropertyDetail 限定）— 可拖曳至任意位置，放手後 spring 彈回。使用 CSS `transition` + JS `pointer events`（不引入新動畫庫），彈回用 `transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`

### Phase 3 — 對話氣泡升級

- [ ] **#M3a** `MaiMaiSpeech.tsx` Typing 動畫 — 訊息逐字出現（30ms/字）+ 打字省略號等待效果。逐字出現期間 `aria-live="off"`，完整句子出現後切回 `aria-live="polite"`
- [ ] **#M3b** 訊息 Queue 系統 — 多事件同時觸發時依序顯示，每則最短顯示 1.5 秒
- [ ] **#M3c** 訊息庫擴充 — 每種心情配 3～5 句隨機語句（繁體中文台灣用語）。語句庫定義在 `constants.ts` 的 `MOOD_MESSAGES` 常量（SSOT）
- [ ] **#M3d** 時段感知問候 — 早上（6-12）/ 下午（12-18）/ 晚上（18-6）不同招呼語。時段問候語常量定義在 `constants.ts` 的 `TIME_GREETINGS` 常量（SSOT），元件只引用

### Phase 4 — 新特效

- [ ] **#M4a** 心形漂浮特效 — 配合 `love`，SVG heart path + float 動畫（3 顆錯開時序）。使用 `useMaiMaiA11yProps` 的 `showEffects` 控制顯示；特效 SVG 加 `aria-hidden="true"` + `role="presentation"`
- [ ] **#M4b** 淚滴下落特效 — 配合 `cry`，SVG circle + gravity + fade-out。使用 `useMaiMaiA11yProps` 的 `showEffects` 控制；特效 SVG 加 `aria-hidden="true"` + `role="presentation"`
- [ ] **#M4c** 驚嘆號爆炸特效 — 配合 `surprised`，SVG text「！」+ burst 放射動畫。使用 `useMaiMaiA11yProps` 的 `showEffects` 控制；特效 SVG 加 `aria-hidden="true"` + `role="presentation"`
- [ ] **#M4d** 閃電光芒特效 — 配合 `angry`，SVG polygon + shake 加強。使用 `useMaiMaiA11yProps` 的 `showEffects` 控制；特效 SVG 加 `aria-hidden="true"` + `role="presentation"`
- [ ] **#M4e** 墨鏡遮罩 SVG 疊加 — 配合 `cool`，基於 `constants.ts` 的 `LEFT_EYE_X/RIGHT_EYE_X/EYE_Y` 座標定位，橢圓寬 22px 高 10px，橋接條寬 14px 高 3px，y 偏移 -2。特效 SVG 加 `aria-hidden="true"` + `role="presentation"`
- [ ] **#M4f** 季節彩蛋系統 — 依日期自動觸發（農曆春節紅包雨、聖誕雪花、中秋月亮）。使用 `useMaiMaiA11yProps` 的 `showEffects` 控制；特效 SVG 加 `aria-hidden="true"` + `role="presentation"`

### Phase 5 — 新頁面整合

- [ ] **#M5a** Login 頁 MaiMai — 進入 wave → 帳號輸入 happy → 密碼輸入 peek → 成功 celebrate → 失敗 shy
- [ ] **#M5b** Register 頁 MaiMai — 進入 wave → 逐欄填寫 happy → 送出 celebrate → 失敗 cry
- [ ] **#M5c** Search 結果頁 MaiMai — 搜尋中 thinking → 有結果 excited → 無結果 confused + 引導語
- [ ] **#M5d** Chat 頁 MaiMai — 陪伴 idle → 對方回覆 happy → 等待中 thinking（最小化可折疊）
- [ ] **#M5e** Community 頁 MaiMai — 按讚 love → 發文 excited → 首次進入 wave
- [ ] **#M5f** UAG 頁 MaiMai — 流程中 thinking → 每步完成 happy → 全程完成 celebrate + confetti
- [ ] **#M5g** 404 頁 MaiMai — confused 心情 + 固定說話「找不到這個頁面…要幫你回首頁嗎？」

### Phase 6 — 全站語境感知狀態機

- [ ] **#M6a** React Query 狀態自動推導 — loading→thinking、error→shy/cry、success→happy。使用 `QueryClient` 的 `defaultOptions.queries.onSettled` 全域回調，或新建 `useMaiMaiQuerySync` hook 整合
- [ ] **#M6b** 全站 cooldown 機制 — 同一心情 30 秒內不重複播，防止過於吵鬧
- [ ] **#M6c** 訊息說話頻率控制 — 每次 loading 不一定說話（30% 機率靜默）
- [ ] **#M6d** `MaiMaiContext.tsx` 升級 — 整合 cooldown + queue + 自動推導（需向後相容）。向後相容 API 契約：現有 `useMaiMai()` 回傳的 `{ mood, setMood, messages, addMessage, resetMessages }` 介面不變，新功能以新欄位擴充（`cooldownActive`、`queueMessage` 等）

---

## 施工依賴圖

```
#M1a~f 新心情 ───→ #M1g types.ts ───→ #M1h tests
                                    ↓
#M2a Mouse ─────→ #M2b Combo ──────→ #M2c Hover
                                    ↓
#M3a Typing ────→ #M3b Queue ──────→ #M3c 訊息庫 ─→ #M3d 時段

#M4a~f 特效（各自獨立，依賴 Phase 1 心情完成；#M4e 墨鏡依賴 #M1b cool 眼睛座標）

#M5a~g 頁面整合（依賴 Phase 1 + 部分 Phase 3 完成）

#M6a~c 狀態機（依賴 Phase 1 + Phase 3 全完成）
#M6d Context 升級 ──────────────────────────────── 最後執行
```

---

## 影響檔案清單

### Phase 1（心情擴充）
| 檔案 | 變更性質 |
|------|---------|
| `src/components/MaiMai/types.ts` | 擴充 MaiMaiMood union |
| `src/components/MaiMai/constants.ts` | 新增 6 種心情座標 + ARM 姿勢 |
| `src/components/MaiMai/configs.ts` | 新增 6 種 MOOD_CONFIGS + **6 種** EFFECT_POSITIONS（Record 為 exhaustive，每個新 mood 都需要 entry） |
| `src/components/MaiMai/MaiMaiBase.tsx` | 新增眼淚/墨鏡/愛心眼渲染邏輯 |
| `src/components/MaiMai/MaiMai.test.ts` | 補 6 種心情測試 |
| `src/context/MaiMaiContext.tsx` | 同步更新 `VALID_MOODS` Set（加 6 新值 + 補 `header`） |

### Phase 2（互動）
| 檔案 | 變更性質 |
|------|---------|
| `src/components/MaiMai/useMaiMaiMouse.ts` | **新建** |
| `src/components/MaiMai/useMaiMaiMood.ts` | 升級 Combo 機制 |
| `src/components/MaiMai/MaiMaiBase.tsx` | 整合 Mouse hook + Hover 觸發 |

### Phase 3（氣泡）
| 檔案 | 變更性質 |
|------|---------|
| `src/components/MaiMai/MaiMaiSpeech.tsx` | Typing 動畫 + Queue 系統 |
| `src/context/MaiMaiContext.tsx` | Queue 整合 + 時段感知 |
| `src/components/MaiMai/constants.ts` | 新增訊息庫常量 |

### Phase 4（特效）
| 檔案 | 變更性質 |
|------|---------|
| `src/components/MaiMai/configs.ts` | 新增 5 種特效定義 + 每種新心情完整配色（`cheekColor` + `effectColor`） |
| `src/components/MaiMai/MaiMaiBase.tsx` | 季節彩蛋系統整合 |

### Phase 5（頁面）
| 檔案 | 變更性質 |
|------|---------|
| Login/Register 頁組件 | 整合 MaiMai 狀態機 |
| Search 結果頁 | 新增 MaiMai 區塊 |
| Chat 頁 | 新增可折疊 MaiMai 陪伴 |
| Community 頁 | 按讚/發文事件觸發 |
| UAG 頁 | 各步驟心情串接 |
| `src/pages/NotFound.tsx` | 新建 404 MaiMai |

### Phase 6（狀態機）
| 檔案 | 變更性質 |
|------|---------|
| `src/context/MaiMaiContext.tsx` | 全面升級（向後相容） |
| `src/hooks/useGlobalMaiMai.ts` | **新建** — 全站狀態機 Hook |

---

## 驗收標準

### Phase 1
- [ ] `npm run gate` 通過
- [ ] 所有 11+6=17 種心情在 MOOD_CONFIGS 完整定義
- [ ] 所有 17 種心情在 EFFECT_POSITIONS 完整定義
- [ ] `MaiMaiContext.tsx` 的 `VALID_MOODS` Set 包含全部 17 種 + `header`（共 18 個）
- [ ] 每種新心情有完整配色定義（`cheekColor` + `effectColor`）
- [ ] `MaiMai.test.ts` 全綠

### Phase 2
- [ ] 瞳孔追隨在桌機流暢（60fps），使用 RAF 節流驗證
- [ ] Mobile 不觸發追隨
- [ ] Combo 階段觸發正確：2→wave、3→happy、5→celebrate、10→cool
- [ ] Combo 3 秒無操作後重置
- [ ] 拖曳使用 CSS transition + pointer events（無新動畫庫依賴）

### Phase 3
- [ ] Typing 動畫期間 `aria-live="off"`，完成後切回 `aria-live="polite"`
- [ ] Queue 不會造成訊息堆積超過 3 句
- [ ] 訊息庫 `MOOD_MESSAGES` 定義在 `constants.ts`（SSOT 驗證）
- [ ] 時段問候語 `TIME_GREETINGS` 定義在 `constants.ts`（SSOT 驗證）

### Phase 4
- [ ] 所有特效在 `prefers-reduced-motion: reduce` 時自動停用（經由 `useMaiMaiA11yProps` 的 `showEffects`）
- [ ] 所有特效 SVG 元素有 `aria-hidden="true"` + `role="presentation"`
- [ ] #M4e 墨鏡座標基於 `constants.ts` 眼睛座標計算，非硬編碼

### Phase 5
- [ ] 7 個頁面各自整合測試通過
- [ ] 不與現有 TrustRoom/PropertyDetail MaiMai 衝突

### Phase 6
- [ ] 全站 cooldown 邏輯有單元測試
- [ ] `useMaiMai()` API 向後相容：現有 `{ mood, setMood, messages, addMessage, resetMessages }` 介面不變
- [ ] React Query 整合方案明確（`defaultOptions.queries.onSettled` 或 `useMaiMaiQuerySync` hook）

---

## 注意事項

- **禁止刪除現有 11 種心情**，只能新增
- **SSOT 原則**：所有座標/訊息/問候語必須定義在 `constants.ts`，不可散落在元件內。包含 `MOOD_MESSAGES`（#M3c）和 `TIME_GREETINGS`（#M3d）
- **A11y 優先**：新特效必須支援 `useMaiMaiA11yProps` 的 `showEffects` 控制；所有裝飾性 SVG 必須加 `aria-hidden="true"` + `role="presentation"`；Typing 動畫需切換 `aria-live`
- **Mobile 優先**：所有新互動需測試觸控裝置；#M2a 瞳孔追隨 mobile 停用
- 新心情需同步更新 `MaiMaiContext.tsx` 的 `VALID_MOODS` Set + `isValidMood` 守衛（含補上遺漏的 `header`）
- **效能規範**：#M2a 瞳孔追隨必須使用 `requestAnimationFrame` 節流（禁止 mousemove 直接 setState）
- **零新依賴**：#M2d 拖曳使用 CSS transition + pointer events，不引入新動畫庫
- **Exhaustive Record**：`MOOD_CONFIGS` 和 `EFFECT_POSITIONS` 為 `Record<MaiMaiMood | 'default', ...>`，每個新 mood 都必須有對應 entry
