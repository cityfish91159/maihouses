# 🚀 給新開發者：3 分鐘快速開始

## 第一步：設定環境

```bash
# 1. 安裝依賴
npm install

# 2. 複製環境變數範本
cp .env.example .env

# 3. 編輯 .env，填入你的 OpenAI API Key
nano .env
# 找到這行：OPENAI_API_KEY=sk-proj-your_openai_api_key_here
# 替換成你的真實金鑰

# 4. 啟動開發伺服器
npm run dev
```

## 第二步：測試

開啟瀏覽器：
```
http://localhost:5173/tools/cake-reveal/ai-color-recolor-m.html
```

上傳一張圖片，看看 AI 處理效果！

## 第三步：了解專案

**必讀文件（10 分鐘）：**
1. `DEVELOPER_HANDOFF.txt` ← 完整交接文件
2. `AI_RECOLOR_QUICK_REF.txt` ← 快速參考

**核心檔案：**
- 前端：`public/tools/cake-reveal/ai-color-recolor-m.html`
- 後端：`api/*.js` (4 個 API 端點)

**資料流程：**
```
用戶上傳 → OpenAI分析 → 上傳S3 → 物體檢測 
  → Flux增強 → imgix混合 → LAB校正 → 輸出結果
```

## 常見問題

**Q: 只設定 OPENAI_API_KEY 就能運作嗎？**  
A: 可以！其他都是選配，系統會自動降級。

**Q: 處理要 30 秒正常嗎？**  
A: 正常！Replicate Flux 需要 10-20 秒。

**Q: 如何測試 API？**  
A: 執行 `./test-ai-recolor-apis.sh`

## 需要幫助？

- 完整文件：`AI_COLOR_RECOLOR_API_GUIDE.txt`
- 提出 Issue：https://github.com/cityfish91159/maihouses/issues

---

**✅ 檢查清單：**
- [ ] npm install 完成
- [ ] .env 已設定 OPENAI_API_KEY
- [ ] 可以開啟網頁並上傳圖片
- [ ] 已讀 DEVELOPER_HANDOFF.txt

完成後就可以開始開發了！🎉
