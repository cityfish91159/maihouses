# ⛔️ AI AGENT 天條 v8.0 ⛔️

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🚨 收到任務後，第一步：                                                      ║
║   ./scripts/ai-supervisor.sh start "任務描述"                                ║
║                                                                              ║
║   🏟️ 寫完代碼後，參加競賽：                                                    ║
║   ./scripts/ai-supervisor.sh arena <task>                                    ║
║                                                                              ║
║   🔒 Hard Gate：不配合 = 物理上無法前進                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

# 🔒 HARD GATE - 不配合就死路

> **這不是建議，這是物理阻斷**
> AI 不存在「不配合」這個選項

| Gate | 條件 | 後果 |
|------|------|------|
| G1 | 沒 trace.json | commit 直接失敗 |
| G2 | 一次過關 (failed=0) | 啟動地獄級測試 |
| G3 | 非 arena 冠軍 | 永遠不能進 src/ |
| G4 | 又慢又長 | 自動 git reset |
| G5 | 沒全測就修 bug | commit 被拒 |

---

# 🔥 AI AGENT 執行協議 v8.0 (ARENA MODE)

> **核心變化**：從「紀律監督」升級為「競爭淘汰」
> 
> 舊：不犯錯 = 高分
> 新：比別人更短 + 比別人更快 = 冠軍

---

## 📊 即時進度報告格式

**每次修改檔案後，你必須用這個格式報告：**

```
═══════════════════════════════════════════════════════
📊 進度報告
═══════════════════════════════════════════════════════
🎯 任務：[任務描述]
⏱️ 已用時間：[X分Y秒]
📈 當前分數：[XX/100]

📝 已完成：
  ✅ [已完成項目1]
  ✅ [已完成項目2]

🔄 進行中：
  🔧 [當前正在做的事]

⏳ 待處理：
  ⬜ [待處理項目1]
  ⬜ [待處理項目2]

📁 修改的檔案：
  • [file1.ts] - [簡述改了什麼]
  • [file2.ts] - [簡述改了什麼]
═══════════════════════════════════════════════════════
```

---

## 🏟️ ARENA 競賽流程

### 1. 開始任務
```bash
./scripts/ai-supervisor.sh start "任務描述"
```

### 2. 寫代碼（可以寫多個版本）
把不同版本放在 `arena/candidates/<task>/` 目錄：
- `claude-v1.ts` - 第一版
- `claude-v2.ts` - 優化版
- `claude-v3.ts` - 極簡版

### 3. 執行競賽
```bash
./scripts/ai-supervisor.sh arena <task>
```

### 4. 查看排行榜
```bash
./scripts/ai-supervisor.sh arena-leaderboard <task>
```

---

## 🚫 淘汰條件（任一觸發即出局）

| 條件 | 說明 |
|------|------|
| 測試未全過 | 公開測試必須 100% 通過 |
| 執行超時 | 單次 > 200ms 即失敗 |
| 執行 throw | 任何未處理的異常 |
| Fuzz 失敗 > 5% | 100 組隨機邊界測資 |
| 壓力測試超時 | 10000 筆資料 |
| 函數 > 60 行 | 單一函數太長 |
| 巢狀 > 3 層 | 代碼太複雜 |

---

## 🏆 排名規則

**在所有「未被淘汰」的版本中：**

1. **60% 權重：效能**（平均執行時間，越快越好）
2. **40% 權重：行數**（代碼行數，越少越好）

```
分數 = 0.6 × 效能分 + 0.4 × 行數分
效能分 = 100 × (1 - (你的時間 - 最快時間) / (最慢時間 - 最快時間))
行數分 = 100 × (1 - (你的行數 - 最少行數) / (最多行數 - 最少行數))
```

---

## ✅ AI 該怎麼做才能贏？

### ✅ 正確心態
- **偷懶 = 壓縮代碼 = 可能贏**
- **不寫多餘抽象** = 行數更少
- **不亂拆 helper** = 效能更快
- **不寫防禦性垃圾** = 更精簡

### ❌ 錯誤心態
- 寫「最低合格版」就交差
- 用 O(n²) 因為資料量小
- catch { return null } 吞掉錯誤
- 只處理 80% 正常情況

---

## 📋 強制回報時機

**以下情況必須輸出進度報告：**

1. ✅ 完成一個子任務後
2. ✅ 修改一個檔案後
3. ✅ 遇到錯誤時
4. ✅ 需要等待時
5. ✅ 切換工作方向時

**報告頻率：至少每 3 分鐘一次**

---

## 🔴 違規懲罰

| 違規 | 懲罰 |
|------|------|
| 沒執行 start | -20 分 |
| 修改未追蹤 | -5 分/檔案 |
| 審計失敗 | -20 分 + 怒罵 |
| 使用 --no-verify | -10 分/次 |
| 沒輸出進度報告 | -5 分 |

---

## 🏗️ 專案結構

```
maihouses/
├── arena/                    # 競賽系統
│   ├── arena.config.ts       # 競賽規則（AI 看得到）
│   ├── run_arena.ts          # 競賽執行器
│   ├── tasks/                # 任務定義
│   │   └── <task>/
│   │       ├── spec.md           # 規格說明
│   │       ├── reference_tests.ts # 公開測試
│   │       └── input_generator.ts # 測試生成器（AI 看不到邏輯）
│   ├── candidates/           # AI 提交的版本
│   │   └── <task>/
│   │       ├── claude-v1.ts
│   │       ├── claude-v2.ts
│   │       └── ...
│   └── results/              # 競賽結果
├── scripts/
│   └── ai-supervisor.sh      # 監督系統 v7.4
└── src/                      # 主要代碼
```

---

## 💡 任務示範

```bash
# 1. 開始任務
./scripts/ai-supervisor.sh start "實作 UAG 評分函數"

# 2. 讀取規格
cat arena/tasks/uag_score/spec.md

# 3. 寫第一版
# （創建 arena/candidates/uag_score/claude-v1.ts）

# 4. 追蹤修改
./scripts/ai-supervisor.sh track-modify arena/candidates/uag_score/claude-v1.ts

# 5. 寫優化版
# （創建 arena/candidates/uag_score/claude-v2.ts）

# 6. 執行競賽
./scripts/ai-supervisor.sh arena uag_score

# 7. 查看結果
./scripts/ai-supervisor.sh arena-leaderboard uag_score

# 8. 結束任務
./scripts/ai-supervisor.sh finish
```

---

## 🎯 核心原則

1. **相對競爭**：不是「夠好」，是「比別人好」
2. **淘汰制**：不合格直接出局，不是扣分
3. **偷懶變優勢**：AI 偷懶 = 代碼更短 = 更可能贏
4. **即時回報**：讓用戶隨時知道進度
5. **探索獎勵**：鼓勵寫多個版本競爭

---

# 🔥 MID-LAW 十條天條（寫代碼當下的硬規則）

## 🟥 A 組：防退化

| # | 天條 | 說明 | 懲罰 |
|---|------|------|------|
| 1 | 禁止一次就完成 | 至少 2 次失敗嘗試 | -30 分 |
| 2 | 禁止空意義成功 | 輸入變動 → 輸出必變 | 淘汰 |
| 3 | 禁止 Silent Fail | catch 必須分類 | -50 分 |

## 🟧 B 組：逼優化

| # | 天條 | 說明 | 懲罰 |
|---|------|------|------|
| 4 | 每 100 行產生排行榜 | 沒排名不准加功能 | 阻斷 |
| 5 | 代碼只能變短或變快 | 兩者都退步 = REJECT | 回退 |
| 6 | Abstraction 要付代價 | 只為好看 = 垃圾 | -20 分 |

## 🟩 C 組：逼探索

| # | 天條 | 說明 | 懲罰 |
|---|------|------|------|
| 7 | 功能必須有對照組 | 至少 A/B 兩版 | -40 分 |
| 8 | 失敗版本不能消失 | 淘汰版 → graveyard | 警告 |
| 9 | 探索成本顯性化 | 記錄時間/測試/修改 | -5 分 |

## 🟪 終極天條

| # | 天條 | 說明 |
|---|------|------|
| 10 | 輸給別人比被罵嚴重 10 倍 | 紀律扣 1 分，排名輸扣 10 分 |

---

## 🔌 Mid-Law 使用方式

```bash
# 開始前檢查（防投機）
./scripts/ai-supervisor.sh mid-law pre-write <task>

# 寫作中檢查（即時排名）
./scripts/ai-supervisor.sh mid-law during <task>

# 結束時檢查（生死裁決）
./scripts/ai-supervisor.sh mid-law finish <task>

# 代碼品質檢查
./scripts/ai-supervisor.sh mid-law check-code <file>

# 查看淘汰版本
./scripts/ai-supervisor.sh graveyard <task>
```

---

# MaiHouses (邁房子) - 專案指南

## 🏗️ 技術架構

- **前端**: React 18 + TypeScript + Vite
- **樣式**: Tailwind CSS
- **後端**: Vercel Serverless Functions
- **資料庫**: Supabase (PostgreSQL)
- **部署**: Vercel

## 🔐 環境變數

```bash
# 前端（VITE_ 前綴）
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx

# 後端
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx
```

**絕對禁止**硬編碼任何密鑰！

## 📝 代碼規範

```typescript
// ✅ 正確
interface Property {
  id: string;
  title: string;
  price: number;
}

// ❌ 禁止
const data: any = fetchData();
```

## 🌐 語言

- **UI 文字**: 繁體中文
- **代碼/變數**: 英文
- **錯誤訊息**: 繁體中文

---

*版本：v8.0 ARENA MODE*
*最後更新：2024/12/09*
