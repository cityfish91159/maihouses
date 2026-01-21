---
description: 生產級代碼審查 - 深度思考流程
---

# /code-review

執行生產級代碼審查。

## 使用方式

```
/code-review [檔案路徑]
```

## 步驟

1. 讀取 `.agent/skills/code-review/SKILL.md` 取得完整審查流程

2. 讀取目標檔案

3. 讀取相關上下文：
   - 對應的需求文件/工單
   - 資料庫 schema（`src/types/supabase-schema.ts`）
   - 上下游代碼（誰呼叫它？它呼叫誰？）

4. 執行六步驟審查：
   - Step 1：理解意圖
   - Step 2：追蹤資料流
   - Step 3：質疑假設
   - Step 4：模擬極端
   - Step 5：名稱 vs 實作對照
   - Step 6：檢查可維護性

5. 輸出審查報告（格式見 SKILL.md）
