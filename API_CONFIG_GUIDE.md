# 🔧 API 完整配置指南

## 📋 總覽

本專案使用 4 個主要服務商的 API：

| 服務商 | 用途 | 必須性 | 申請網址 |
|--------|------|--------|----------|
| **Replicate** | AI 圖片生成、物件偵測、X-Ray | ✅ 必須 | https://replicate.com/account/api-tokens |
| **OpenAI** | AI 聊天助理 | ✅ 必須 | https://platform.openai.com/api-keys |
| **Imgix + AWS S3** | 圖片 CDN (可降級) | ⚠️ 可選 | https://imgix.com/ + https://aws.amazon.com/s3/ |
| **Vercel** | 部署平台 | ✅ 必須 | https://vercel.com/ |

---

## 1️⃣ Replicate API 配置

### 📍 用途
- **AI 圖片生成** (`/api/replicate-generate.js`)
- **物件偵測** (`/api/replicate-detect.js`)
- **X-Ray 透視** (`/api/x-raymike.js`)

### 🔑 需要的環境變數

```bash
# 主 Token (必須)
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deployments (可選，使用自己部署的模型)
REPLICATE_DEPLOYMENT=cityfish91159/maihouses-flux-dev
REPLICATE_DEPLOYMENT_DETECT=cityfish91159/maihouses-yoloworld
```

### 📝 申請步驟

1. **註冊帳號**
   - 訪問：https://replicate.com/
   - 點擊右上角 "Sign up"
   - 使用 GitHub 帳號登入

2. **獲取 API Token**
   - 登入後訪問：https://replicate.com/account/api-tokens
   - 點擊 "Create token"
   - 複製 token（格式：`r8_...`）

3. **（可選）創建 Deployment**
   - 訪問：https://replicate.com/deployments
   - 選擇模型（例如：`black-forest-labs/flux-dev`）
   - 創建 deployment，獲得路徑（例如：`username/deployment-name`）

### ✅ 驗證 Token

```bash
# 測試 Token 是否有效
curl https://api.replicate.com/v1/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 🎯 Vercel 設定

在 Vercel 專案設定中：
1. 進入 **Settings** → **Environment Variables**
2. 添加變數：
   - Name: `REPLICATE_API_TOKEN`
   - Value: `r8_your_token_here`
   - Environment: `Production`, `Preview`, `Development` 全選
3. 點擊 **Save**
4. **重新部署** 專案以使變數生效

---

## 2️⃣ OpenAI API 配置

### 📍 用途
- **AI 聊天** (`/api/openai-proxy.js`)
- **圖片分析**
- **智能建議**

### 🔑 需要的環境變數

```bash
# API Key (必須)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 模型選擇 (可選，預設 gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

### 📝 申請步驟

1. **註冊 OpenAI 帳號**
   - 訪問：https://platform.openai.com/signup
   - 使用 Email 或 Google 帳號註冊

2. **獲取 API Key**
   - 登入後訪問：https://platform.openai.com/api-keys
   - 點擊 "Create new secret key"
   - 複製 key（格式：`sk-proj-...` 或 `sk-...`）
   - ⚠️ **重要**：key 只顯示一次，請立即保存！

3. **設定使用額度**
   - 訪問：https://platform.openai.com/account/billing
   - 添加付款方式
   - 設定使用限額（建議從 $5 開始）

### 💰 費用參考

| 模型 | 輸入 | 輸出 | 適用場景 |
|------|------|------|----------|
| `gpt-4o-mini` | $0.15/1M tokens | $0.60/1M tokens | 💡 推薦：聊天、分析 |
| `gpt-4o` | $2.50/1M tokens | $10.00/1M tokens | 複雜任務 |
| `gpt-3.5-turbo` | $0.50/1M tokens | $1.50/1M tokens | 簡單對話 |

### ✅ 驗證 Key

```bash
# 測試 API Key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

### 🎯 Vercel 設定

1. **Settings** → **Environment Variables**
2. 添加：
   - Name: `OPENAI_API_KEY`
   - Value: `sk-proj-your_key_here`
3. **Save** 並 **重新部署**

---

## 3️⃣ Imgix + AWS S3 配置（可選）

### 📍 用途
- **圖片上傳** (`/api/upload-imgix.js`)
- **CDN 加速**

### ⚠️ 降級方案
如果不配置，系統會自動使用 **base64 data URL**（適合開發和測試）

### 🔑 需要的環境變數

```bash
# Imgix 設定
IMGIX_DOMAIN=your-domain.imgix.net
IMGIX_API_KEY=your_imgix_key

# AWS S3 設定
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 📝 Imgix 申請步驟

1. **註冊 Imgix**
   - 訪問：https://imgix.com/
   - 點擊 "Start free trial"

2. **創建 Source**
   - Dashboard → Sources → New Source
   - 選擇 "Amazon S3"
   - 輸入 S3 bucket 資訊

3. **獲取 Domain**
   - Source 創建後，會得到一個 domain（例如：`your-project.imgix.net`）

### 📝 AWS S3 申請步驟

1. **註冊 AWS**
   - 訪問：https://aws.amazon.com/
   - 創建帳號（需要信用卡）

2. **創建 S3 Bucket**
   - AWS Console → S3 → Create bucket
   - Bucket name: `maihouses-uploads`（唯一名稱）
   - Region: `us-east-1`
   - Block Public Access: **取消勾選**
   - 點擊 Create

3. **創建 IAM User**
   - AWS Console → IAM → Users → Add user
   - User name: `maihouses-imgix`
   - Attach policy: `AmazonS3FullAccess`
   - 創建後，**下載 CSV** 獲得 Access Key

4. **設定 Bucket Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

### 💰 費用
- **Imgix**: 免費方案（1,000 次圖片處理/月）
- **AWS S3**: ~$0.023/GB/月（儲存）+ $0.09/GB（流量）

---

## 4️⃣ Vercel 配置

### 📍 用途
- **專案部署**
- **無伺服器函數**（API routes）
- **環境變數管理**

### 📝 部署步驟

1. **連接 GitHub**
   - 訪問：https://vercel.com/
   - 點擊 "Import Project"
   - 選擇 GitHub repository: `cityfish91159/maihouses`

2. **配置環境變數**
   - Project Settings → Environment Variables
   - 添加所有必要變數（見上文）
   - 環境選擇：`Production`, `Preview`, `Development`

3. **部署設定**
   - Build Command: `npm run build`
   - Output Directory: `docs`
   - Install Command: `npm install`

4. **域名設定**（可選）
   - Settings → Domains
   - 添加自訂域名

### ⚠️ 重要注意事項

1. **環境變數修改後必須重新部署**
   - Deployments → 最新 deployment → Redeploy

2. **GitHub Pages vs Vercel**
   - 靜態檔案：使用 GitHub Pages（`docs/`）
   - API 路由：必須使用 Vercel

3. **函數限制**
   - 免費版：10 秒執行時間限制
   - Pro 版：60 秒限制
   - 建議：長時間任務使用輪詢機制

---

## 🧪 完整測試腳本

創建測試檔案：`test-all-apis.sh`

```bash
#!/bin/bash
echo "🧪 測試所有 API 接口..."
echo ""

BASE_URL="https://your-project.vercel.app"

# 1. 測試 Replicate Health
echo "1️⃣ 測試 Replicate Health..."
curl -s "$BASE_URL/api/health-replicate" | jq '.'
echo ""

# 2. 測試 OpenAI Proxy
echo "2️⃣ 測試 OpenAI Proxy..."
curl -s -X POST "$BASE_URL/api/openai-proxy" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}' | jq '.choices[0].message.content'
echo ""

# 3. 測試 Replicate Generate (需要真實 image URL)
echo "3️⃣ 測試 Replicate Generate..."
curl -s -X POST "$BASE_URL/api/replicate-generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a beautiful sunset"}' | jq '.output[0]'
echo ""

echo "✅ 測試完成！"
```

---

## 📊 環境變數檢查清單

使用以下指令檢查 Vercel 專案的環境變數：

```bash
vercel env ls
```

### ✅ 必須配置

- [ ] `REPLICATE_API_TOKEN` - Replicate API Token
- [ ] `OPENAI_API_KEY` - OpenAI API Key

### ⚠️ 建議配置

- [ ] `REPLICATE_DEPLOYMENT` - Replicate Flux 模型部署
- [ ] `REPLICATE_DEPLOYMENT_DETECT` - Replicate 偵測模型部署
- [ ] `OPENAI_MODEL` - OpenAI 模型選擇

### 📦 可選配置（CDN）

- [ ] `IMGIX_DOMAIN` - Imgix domain
- [ ] `IMGIX_API_KEY` - Imgix API key
- [ ] `AWS_S3_BUCKET` - S3 bucket 名稱
- [ ] `AWS_S3_REGION` - S3 區域
- [ ] `AWS_ACCESS_KEY_ID` - AWS Access Key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS Secret Key

---

## 🆘 常見問題

### Q1: API 返回 "Missing REPLICATE_API_TOKEN"
**A**: 
1. 確認已在 Vercel 設定環境變數
2. 重新部署專案
3. 檢查 token 格式是否正確（應為 `r8_...`）

### Q2: OpenAI API 超過額度
**A**:
1. 檢查使用限額：https://platform.openai.com/account/usage
2. 添加付款方式
3. 考慮切換到更便宜的模型（`gpt-4o-mini`）

### Q3: 圖片上傳失敗
**A**:
系統會自動降級到 base64，不影響功能。如需正式 CDN：
1. 配置完整的 S3 + Imgix
2. 檢查 S3 bucket policy
3. 確認 IAM user 權限

### Q4: Vercel 函數超時
**A**:
1. 免費版限制 10 秒
2. 升級到 Pro（60 秒）
3. 或使用輪詢機制（已實現）

---

## 🔐 安全建議

1. **永不在前端存放 API Key**
   - 所有 API 呼叫必須通過後端代理

2. **定期輪換 Key**
   - 每 3-6 個月更換一次

3. **監控用量**
   - 設定 alert 防止濫用

4. **使用環境變數**
   - 絕不 commit `.env` 檔案到 Git

5. **限制 CORS**
   - 生產環境應限制允許的 origin

---

## 📞 支援聯絡

- **Replicate**: https://replicate.com/docs
- **OpenAI**: https://platform.openai.com/docs
- **Vercel**: https://vercel.com/docs
- **專案**: https://github.com/cityfish91159/maihouses

---

**✅ 配置完成後，所有 API 應該都能正常運作！**
