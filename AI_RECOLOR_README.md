# 🎨 AI 顏色回填模組

> 整合 OpenAI GPT-4 Vision + Replicate Flux + imgix 的終極圖像顏色回填工具

## 📦 檔案結構

```
maihouses/
├── public/tools/cake-reveal/
│   ├── ai-color-recolor-m.html    # 主要前端頁面
│   └── manifest.json              # PWA 配置
├── api/
│   ├── openai-proxy.js            # OpenAI Vision API
│   ├── replicate-detect.js        # 物體檢測 API
│   ├── replicate-generate.js      # 圖像增強 API
│   └── upload-imgix.js            # imgix 上傳 API
├── AI_COLOR_RECOLOR_API_GUIDE.txt # 完整 API 指南
├── AI_RECOLOR_QUICK_REF.txt       # 快速參考卡
├── AI_RECOLOR_DELIVERY_SUMMARY.txt # 交付總結
└── test-ai-recolor-apis.sh        # 自動測試腳本
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
# 複製環境變數範本
cp .env.example .env.local

# 編輯並填入你的 API 金鑰
nano .env.local
```

需要設定的變數：
- `OPENAI_API_KEY`: OpenAI API 金鑰
- `REPLICATE_API_TOKEN`: Replicate API Token
- `REPLICATE_DEPLOYMENT`: Flux 模型部署路徑
- `REPLICATE_DEPLOYMENT_DETECT`: GroundingDINO 部署路徑
- `IMGIX_DOMAIN`: imgix 網域
- `AWS_S3_BUCKET`: S3 bucket 名稱
- `AWS_S3_REGION`: S3 區域
- `AWS_ACCESS_KEY_ID`: AWS Access Key
- `AWS_SECRET_ACCESS_KEY`: AWS Secret Key

### 3. 啟動開發伺服器

```bash
npm run dev
```

### 4. 測試 API 連接

```bash
chmod +x test-ai-recolor-apis.sh
./test-ai-recolor-apis.sh
```

### 5. 開啟瀏覽器

```
http://localhost:5173/tools/cake-reveal/ai-color-recolor-m.html
```

## 🎯 核心功能

### 5 AI 模型融合
1. **OpenAI GPT-4 Vision** - 圖像內容分析
2. **Replicate GroundingDINO** - 物體檢測定位
3. **Replicate Flux Pro** - AI 圖像增強
4. **imgix Blend API** - 專業顏色混合
5. **LAB 色彩空間** - 精確顏色回填 (deltaE < 0.8)

### 完整處理流程

```
上傳圖片 → OpenAI 分析 → 上傳 imgix → 物體檢測 
    ↓
Flux 增強 → imgix 混合 → LAB 校正 → 最終輸出
```

處理時間: 17-34 秒 (1024x1024 圖片)

## 📚 文件

- **完整 API 指南**: `AI_COLOR_RECOLOR_API_GUIDE.txt`
- **快速參考**: `AI_RECOLOR_QUICK_REF.txt`
- **交付總結**: `AI_RECOLOR_DELIVERY_SUMMARY.txt`

## 🧪 測試

### 測試所有 API

```bash
./test-ai-recolor-apis.sh
```

### 測試單一 API

```bash
# OpenAI
curl -X POST http://localhost:3000/api/openai-proxy \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"test"}]}'

# Replicate Detection
curl -X POST http://localhost:3000/api/replicate-detect \
  -H "Content-Type: application/json" \
  -d '{"image":"https://example.com/test.jpg","labels":["object"]}'
```

## 🚢 部署到 Vercel

```bash
# 登入 Vercel
vercel login

# 連結專案
vercel link

# 設定環境變數
vercel env add OPENAI_API_KEY
vercel env add REPLICATE_API_TOKEN
vercel env add REPLICATE_DEPLOYMENT
vercel env add REPLICATE_DEPLOYMENT_DETECT
vercel env add IMGIX_DOMAIN
vercel env add AWS_S3_BUCKET
vercel env add AWS_S3_REGION
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY

# 部署
vercel --prod
```

## 💰 成本估算

每 1000 次處理：
- OpenAI GPT-4 Vision: $5-10
- Replicate Detection: $0.50
- Replicate Flux: $50
- imgix + S3: $0.16
- **總計**: 約 $55-60

## ✨ 特色功能

- ✅ 5 AI 模型融合處理
- ✅ LAB 色彩空間精確回填
- ✅ 5 種透視模式
- ✅ 實時預覽對比
- ✅ 15 層復原/重做
- ✅ PWA 支援
- ✅ 深色/淺色主題
- ✅ 觸覺回饋
- ✅ AI 智能建議面板
- ✅ 響應式設計

## 🐛 常見問題

### API 返回 401?
檢查 API 金鑰是否正確且有額度

### CORS 錯誤?
在 imgix Dashboard 設定允許的網域

### S3 上傳失敗?
檢查 IAM 權限 (需要 s3:PutObject)

### 處理太慢?
減少圖片尺寸或使用較快的模型

完整問題排除請參考 `AI_COLOR_RECOLOR_API_GUIDE.txt`

## 📞 支援

- GitHub: https://github.com/cityfish91159/maihouses
- Issues: https://github.com/cityfish91159/maihouses/issues

## 📄 授權

請參考專案根目錄的 LICENSE 檔案
