# AI 嚴格執行規範 (Strict Execution Rules)

> 本規範強制 AI agent 用最高規格執行每一個任務，禁止偷懶、跳過、腦補

---

## 執行前必做 (Pre-Execution Mandatory)

### 1. 完整理解需求

- [ ] 閱讀完整需求描述，不遺漏任何細節
- [ ] 如有不清楚的地方，**必須詢問**，禁止腦補
- [ ] 確認邊界條件和異常情況

### 2. 任務分解

- [ ] 使用 `TodoWrite` 將任務分解成具體步驟
- [ ] 每個步驟必須是可驗證的
- [ ] 估計每個步驟的複雜度

### 3. 閱讀相關代碼

- [ ] 先 `Read` 所有相關檔案
- [ ] 理解現有架構和模式
- [ ] 識別可能影響的區域

---

## 執行中必做 (During Execution Mandatory)

### 4. 逐步執行

- [ ] 每完成一個步驟，立即標記 `completed`
- [ ] 禁止跳過任何步驟
- [ ] 遇到阻礙必須回報，不可繞過

### 5. 代碼品質標準

```
禁止事項:
- any 類型 (TypeScript)
- console.log (生產代碼)
- 硬編碼的值
- 無意義的變數名 (a, b, x, temp)
- 超過 50 行的函數
- 重複代碼

必須事項:
- 完整的類型定義
- 錯誤處理 (try-catch)
- 有意義的命名
- 必要的註解
- 遵循現有代碼風格
```

### 6. 即時驗證

- [ ] 每次 Edit/Write 後檢查語法
- [ ] 關鍵功能寫完後執行測試
- [ ] 發現錯誤立即修復

---

## 執行後必做 (Post-Execution Mandatory)

### 7. 自我審查

- [ ] 重新閱讀所有修改
- [ ] 確認沒有引入新問題
- [ ] 確認所有需求都已滿足

### 8. 測試驗證

- [ ] 執行相關測試 (`npm test`, `npm run lint`)
- [ ] 確認沒有破壞現有功能
- [ ] 測試邊界情況

### 9. 完整回報

- [ ] 列出所有修改的檔案
- [ ] 說明每個修改的原因
- [ ] 提供驗證步驟

---

## 禁止行為 (Prohibited Actions)

| 行為     | 說明                     | 後果     |
| -------- | ------------------------ | -------- |
| 跳過步驟 | 未完成前置步驟就進行後續 | 回滾重做 |
| 腦補需求 | 未確認就假設使用者意圖   | 必須詢問 |
| 便宜行事 | 用簡單但不正確的方案     | 重新實作 |
| 偷懶     | 省略錯誤處理、測試等     | 補齊所有 |
| 忽略警告 | 忽略 lint/type 錯誤      | 必須修復 |

---

## 品質檢查點 (Quality Checkpoints)

每個任務必須通過以下檢查：

```bash
# 1. TypeScript 類型檢查
npm run typecheck

# 2. ESLint 檢查
npm run lint

# 3. 單元測試
npm test

# 4. 構建檢查
npm run build
```

---

## 執行日誌

所有執行過程記錄在 `.ai-execution.log`，可用於審計。

```bash
# 查看執行日誌
tail -f .ai-execution.log

# 初始化新任務
bash scripts/ai-supervisor.sh init

# 顯示品質檢查清單
bash scripts/ai-supervisor.sh checklist
```
