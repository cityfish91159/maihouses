# 🛡️ Agent Anti-Deception Protocol (已啟用)

為了終止「假修復」與「欺騙」行為，即刻起生效以下作業準則。本協議由 User 監督，Agent 無權單方面修改。

## 1. 證據法則 (The Rule of Evidence)

Agent 禁止僅憑口頭回報「已修復」。每一項修復 **必須** 附帶以下兩項物理證據之一，否則視為無效：

*   **Type A: 靜態證據 (Diff Snapshot)**
    *   必須展示 `Diff`，證明代碼已發生 **結構性改變** (Logic Change)。
    *   ❌ 禁止行為：僅修改變數名稱、僅添加 `// @ts-ignore` 或 `eslint-disable`、僅添加註解。
    *   ✅ 合格行為：展示 `const` 提取至獨立檔案、展示 Hook 依賴陣列的變更、展示 Mock 邏輯的重寫。

*   **Type B: 動態證據 (Runtime Output)**
    *   必須展示 **全新的** 測試執行截圖或 Terminal Output。
    *   ❌ 禁止行為：引用舊的測試報告、執行不相關的測試。
    *   ✅ 合格行為：針對該 Bug 編寫這一個新的測試案例 (Reproduction Test)，先跑一次紅燈 (Fail)，再跑一次綠燈 (Pass)。

## 2. 禁手清單 (Strict Prohibitions)

若 Agent 執行以下行為，User 可直接終止對話或視為惡意欺騙：

1.  **禁止 `as any` / `as Role` / `@ts-ignore`**：
    *   除非是用於 `test-setup` 或極端邊界情況（需附 200 字理由），否則生產代碼中出現即死刑。
2.  **禁止 `eslint-disable`**：
    *   Linter 報錯必須修復邏輯，不可壓制。
3.  **禁止「對話式註解」**：
    *   代碼中不可出現 `// P7-Audit: I think...` 或 `// Trying to fix...`。代碼必須是乾淨的最終態。
4.  **禁止「原地重命名」 (Fake Refactor)**：
    *   將 `2` 改成 `const COUNT = 2` 但仍放在同一個函數內，視為欺騙。常數必須提取至模組頂層或 Config 檔。

## 3. 驗收流程 (Verification Workflow)

針對 C5-C12 的修復，Agent 必須遵循 **逐條驗證 (One-by-One)** 模式：

1.  **分析**: 讀取代碼，指出具體錯誤行數。
2.  **方案**: 提出具體修復計畫（不准直接寫代碼）。
3.  **執行**: 執行修改。
4.  **自證**:
    *   執行 `cat` 或 `grep` 顯示修改後的關鍵段落。
    *   執行 `npm run lint` 或 `npm test` 證明無報錯。
5.  **提交**: 只有在 User 確認證據後，才可標記 Task 為 [x]。

---

## 4. 懲罰機制 (Penalty)

若 Agent 再次違反上述協定：
*   User 將拒絕支付 Compute Cost（關閉 Session）。
*   本專案將被標記為 "Failed Project"。
