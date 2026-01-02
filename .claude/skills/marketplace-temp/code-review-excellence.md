---
name: code-review-excellence
description: Master effective code review practices to provide constructive feedback, catch bugs early, and foster knowledge sharing while maintaining team morale.
allowed-tools: [Read, Grep, Bash]
---

# Code Review Excellence

## 核心框架

有效的代碼審查優先考慮：
1. **Bug 檢測** - 找出邏輯錯誤、邊界情況、效能問題
2. **可維護性** - 代碼清晰度、文檔、測試覆蓋率
3. **知識分享** - 教育團隊成員最佳實踐
4. **設計改進** - 架構、可擴展性、安全性

## 反饋原則

好的反饋必須：
- **具體且可行** - 不只說「這不好」，要說「如何改進」
- **教育性而非評判性** - 解釋為什麼，不是指責
- **專注於代碼而非人** - 討論技術問題
- **平衡讚美與批評** - 指出做得好的地方
- **按嚴重性排序** - blocking > important > nit > suggestion

## 審查流程

### Phase 1: 收集上下文
1. 閱讀 PR 描述和相關 issue
2. 理解要解決的問題
3. 檢查相關的設計文檔

### Phase 2: 高層次架構評估
1. 整體設計是否合理？
2. 是否有更簡單的解決方案？
3. 是否符合專案架構模式？

### Phase 3: 詳細逐行檢查
1. 邏輯正確性
2. 錯誤處理
3. 效能考量
4. 安全性問題
5. 測試覆蓋率

### Phase 4: 決策與文檔
1. 標註嚴重性等級
2. 提供具體改進建議
3. 記錄審查決定

## 實用技術

### 嚴重性標籤
- 🔴 **BLOCKING** - 必須修復才能合併
- 🟠 **IMPORTANT** - 應該修復，影響品質
- 🟡 **NIT** - 小問題，可選修復
- 🟢 **SUGGESTION** - 改進建議，不強制

### 檢查清單

#### TypeScript/React 專案
- [ ] 無 `any` 類型
- [ ] 無 `console.log`
- [ ] Props 有 interface 定義
- [ ] Event handlers 類型正確
- [ ] useEffect 依賴正確
- [ ] 錯誤處理完整
- [ ] 無重複代碼
- [ ] 函數不超過 50 行

#### 效能
- [ ] 無 N+1 查詢
- [ ] 適當使用 memo/useMemo
- [ ] 避免不必要的重新渲染
- [ ] 資料庫查詢有 limit

#### 安全性
- [ ] 輸入驗證
- [ ] SQL Injection 防護
- [ ] XSS 防護
- [ ] 敏感資料加密

## 最佳實踐

1. **快速回應** - 24 小時內完成審查
2. **限制 PR 大小** - <400 行最佳
3. **自動化檢查** - 使用 linter, type checker
4. **建立信任** - 尊重、同理心

## 常見陷阱

❌ 完美主義 - 不要過度吹毛求疵
❌ 橡皮圖章 - 不能只說 LGTM
❌ 個人偏好 - 區分標準與偏好
❌ 拖延審查 - 及時回應
