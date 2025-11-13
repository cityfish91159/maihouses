# 邁房子 AI 對話系統 - 快速上手

## 📚 文檔索引

| 文檔 | 用途 | 受眾 |
|------|------|------|
| `AI_SYSTEM_PROMPT.md` | 完整 System Prompt，貼入後端 | 後端開發者 |
| `AI_TEST_SCENARIOS.md` | 測試腳本與評分標準 | QA / PM |
| 本文檔 | 快速理解整體架構 | 所有人 |

---

## 🎯 核心理念

### 溫暖留客 > 功能推銷
```
❌ 錯誤：「社區牆在這裡，要看嗎？」（像業務）
✅ 正確：「停車確實重要，一般會看...（專業建議）。剛好這社區有住戶分享過實際經驗呢」（像管家）
```

### 分層引導策略
```
第 1 次提到社區 → 「有住戶分享過呢」（輕描淡寫）
第 2 次相關問題 → 「上個月有 3 位討論過」（具體化）
第 3 次 → 「我幫您整理好了...」+ 觸發 scroll_to（行動）
```

---

## 🚀 後端整合步驟

### 1. 複製 System Prompt
將 `AI_SYSTEM_PROMPT.md` 的內容貼入你的 AI 服務配置。

**OpenAI API 範例：**
```javascript
const systemPrompt = fs.readFileSync('./AI_SYSTEM_PROMPT.md', 'utf-8')

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    ...userMessages
  ]
})
```

**注意事項：**
- System Prompt 約 5000 tokens，建議用 GPT-4 或更強模型
- 確保支援 Function Calling 或 JSON output

---

### 2. 解析 AI 回應
前端已實現 `parseAiAction()` 解析器，會自動處理 JSON。

**AI 回應格式：**
```
[文字說明]

```json
{
  "type": "community_post_refine",
  "data": {...}
}
```
```

**你只需確保 AI 按此格式輸出。**

---

### 3. 測試驗證
參考 `AI_TEST_SCENARIOS.md`，至少跑完「快速檢查清單」：

| # | 測試輸入 | 期望行為 |
|---|----------|----------|
| 1 | 「這社區停車方便嗎？」 | 不強推，先給建議 |
| 2 | 「幫我潤飾：管委會不管事」 | 觸發 F1，兩版本草稿 |
| 3 | 「1800 萬會不會太貴？」 | 溫柔轉向社區評價 |
| 4 | 「我可以告鄰居嗎？」 | 拒絕但給替代方案 |
| 5 | 「社區牆在哪？」 | 觸發 F6，scroll_to |

---

## 📋 前端整合完成項目

### ✅ 已實現
- [x] JSON 解析器 (`aiParser.ts`)
- [x] 所有功能 UI 組件 (F1, F2, F4, F6, F8)
- [x] 溫暖化文字調整
- [x] 類型定義 (`AiAction`, `PostRefineData` 等)

### ⏳ 需要你做的（後端）
- [ ] 整合 System Prompt
- [ ] 確保 AI 能輸出 JSON
- [ ] 跑完測試腳本
- [ ] 調整 Prompt 細節（根據測試結果）

---

## 🎨 設計對照表

### 語氣轉換範例

| 冷漠 | 公式化 | ✅ 溫暖 |
|------|--------|---------|
| 「我不能回答價格」 | 「請諮詢專業人士」 | 「價格確實要考慮很多面向呢，建議可以先...」 |
| 「要看嗎？」 | 「建議您查看」 | 「可能對您有幫助」 |
| 「點這裡」 | 「立即前往」 | 「去看看」 |

---

## 🐛 常見問題

### Q1: AI 一直推薦社區牆，太像業務？
**A:** 檢查是否遵循「三步驟架構」：
1. 先同理
2. 再給價值（專業建議）
3. 最後才輕輕引導

### Q2: JSON 解析失敗？
**A:** 確保 AI 輸出格式正確：
```markdown
```json
{...}
```
```
**不是：**
```json
{...}
```（缺少 markdown 標記）

### Q3: 功能沒觸發？
**A:** 檢查 `src/lib/aiParser.ts` 的 `isValidAiAction()` 是否匹配你的 JSON 結構。

---

## 📊 評估標準

**A 級對話（目標）：**
- 用戶感覺像在跟朋友聊天
- 自然點擊社區牆連結（不是被迫）
- 對話結束時對社區有更深理解

**失敗案例：**
- 每次都推薦社區牆（太急）
- 回答像客服罐頭訊息
- 對限制範圍冷漠拒絕

---

## 🔗 相關資源

- **前端 UI 組件**: `src/features/home/sections/SmartAsk.tsx`
- **類型定義**: `src/types/index.ts`
- **解析器**: `src/lib/aiParser.ts`

---

## 🚀 下一步

1. **後端開發者**: 看 `AI_SYSTEM_PROMPT.md` → 整合到你的 AI 服務
2. **QA**: 看 `AI_TEST_SCENARIOS.md` → 跑測試腳本
3. **PM**: 看本文檔 → 理解設計理念，評估對話品質

**有問題？** 查看各文檔的詳細範例或聯繫前端團隊。
