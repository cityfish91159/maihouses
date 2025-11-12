# Vercel 完整配置指南 - 一次搞定版

## ❌ 當前問題

API 返回 403 Access denied，原因：
1. **REPLICATE_API_TOKEN 未配置** 或無效
2. **x-raymike 模型不存在**（需要部署）

## ✅ 一次性解決方案

### 步驟 1：配置 Vercel 環境變量（必須）

訪問：https://vercel.com/cityfish91159/maihouses/settings/environment-variables

添加以下變量：

```bash
# 必須配置（否則所有 Replicate API 都無法工作）
REPLICATE_API_TOKEN=r8_你的token這裡

# 可選（如果你創建了 Deployments）
REPLICATE_DEPLOYMENT=cityfish91159/你的生圖deployment名稱
REPLICATE_DEPLOYMENT_DETECT=cityfish91159/你的偵測deployment名稱

# X-Ray Mike（模型部署後再配置）
REPLICATE_XRAY_MODEL=cityfish91159/x-raymike
```

> 獲取 Token: https://replicate.com/account/api-tokens

**重要**：添加後必須點擊 "Save" 並重新部署！

---

### 步驟 2：重新部署 Vercel

配置環境變量後：

**方法 A：自動重新部署**
- Vercel 會自動檢測到環境變量變更並重新部署

**方法 B：手動觸發**
1. 訪問：https://vercel.com/cityfish91159/maihouses/deployments
2. 點擊最新部署右側的 "..." 菜單
3. 選擇 "Redeploy"
4. 等待 1-2 分鐘

---

### 步驟 3：驗證 API 可用性

重新部署完成後測試：

```bash
# 測試基礎 API（應該返回 200）
curl https://maihouses.vercel.app/api/hello

# 測試 X-Ray Mike（如果模型已部署）
curl -X POST https://maihouses.vercel.app/api/x-raymike \
  -H "Content-Type: application/json" \
  -d '{"image": "https://example.com/test.jpg"}'
```

---

### 步驟 4：部署 x-raymike 模型（可選）

有 3 個選項：

#### 選項 A：GitHub Actions（最簡單）

1. **設置 GitHub Secret**
   - 訪問：https://github.com/cityfish91159/maihouses/settings/secrets/actions
   - 添加：
     ```
     Name: REPLICATE_API_TOKEN
     Value: 你的 Replicate Token
     ```
   - 獲取 Token: https://replicate.com/account/api-tokens

2. **運行 Workflow**
   - 訪問：https://github.com/cityfish91159/maihouses/actions
   - 選擇 "Deploy X-Ray Mike to Replicate"
   - 點擊 "Run workflow"
   - 選擇分支：`claude/cake-page-route-011CV44tQULcCbkto2PmNJSq`
   - 點擊 "Run workflow"
   - 等待 15-30 分鐘

#### 選項 B：本地部署

```bash
# 在你的電腦上
git clone https://github.com/cityfish91159/maihouses.git
cd maihouses
git checkout claude/cake-page-route-011CV44tQULcCbkto2PmNJSq
cd x-raymike-model

# 安裝 Docker: https://docs.docker.com/get-docker/
# 安裝 Cog
sudo curl -o /usr/local/bin/cog -L https://github.com/replicate/cog/releases/latest/download/cog_$(uname -s)_$(uname -m)
sudo chmod +x /usr/local/bin/cog

# 部署
bash deploy.sh
```

#### 選項 C：暫時跳過（先測試其他功能）

x-raymike 只是一個額外功能，核心的蛋糕頁功能不依賴它。

---

## 🧪 完整測試清單

配置完成後，測試這些 URL：

### 1. 蛋糕頁 v14.0
```
https://maihouses.vercel.app/p/cake.html
```

**功能測試：**
- [ ] 上傳圖片 ✅（不需要 API）
- [ ] 本地透視處理 ✅（不需要 API）
- [ ] 下載圖片 ✅（不需要 API）
- [ ] AI 生圖（需要 REPLICATE_DEPLOYMENT 或 Token）
- [ ] AI 偵測（需要 REPLICATE_DEPLOYMENT_DETECT 或 Token）
- [ ] AI 分析（需要 OpenAI API）
- [ ] 視覺化（依賴偵測結果）
- [ ] 上傳雲端（需要 AWS S3 或返回 base64）

### 2. X-Ray Mike 測試頁
```
https://maihouses.vercel.app/test-xray.html
```

- [ ] 頁面載入 ✅
- [ ] API 調用（需要 x-raymike 模型部署）

### 3. API Endpoints

```bash
# 健康檢查
curl https://maihouses.vercel.app/api/hello

# X-Ray Mike
curl -X POST https://maihouses.vercel.app/api/x-raymike \
  -H "Content-Type: application/json" \
  -d '{"image": "https://example.com/test.jpg"}'

# Replicate Generate（需要 DEPLOYMENT）
curl -X POST https://maihouses.vercel.app/api/replicate-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a cake"}'

# Replicate Detect（需要 DEPLOYMENT）
curl -X POST https://maihouses.vercel.app/api/replicate-detect \
  -H "Content-Type: application/json" \
  -d '{"image": "https://example.com/cake.jpg", "labels": ["cake"]}'
```

---

## 🎯 快速完成路徑（推薦）

如果你想最快看到效果：

### 現在立即可用（不需要額外配置）：
1. ✅ 蛋糕頁 UI
2. ✅ 本地圖片處理（Web Worker）
3. ✅ 上傳、下載功能
4. ✅ 歷史記錄、Undo

### 需要配置 Token（5分鐘）：
1. 配置 `REPLICATE_API_TOKEN` 到 Vercel
2. 重新部署
3. 測試 API 是否可用

### 需要部署模型（30分鐘）：
1. 用 GitHub Actions 部署 x-raymike
2. 或創建 Replicate Deployments

---

## 🚨 故障排除

### 問題：API 仍然返回 403

**原因**：環境變量未生效

**解決**：
1. 確認在 Vercel 正確添加了環境變量
2. 確認環境選擇了 "Production, Preview, Development"
3. 手動觸發重新部署
4. 等待部署完成（查看 Deployments 標籤）

### 問題：模型不存在

**原因**：`cityfish91159/x-raymike` 還未部署

**解決**：
1. 使用 GitHub Actions 部署
2. 或暫時注釋掉 x-raymike 相關功能
3. 或修改 API 使用其他模型

### 問題：Deployment 路徑錯誤

**原因**：Deployment 名稱不匹配

**解決**：
1. 訪問 https://replicate.com/deployments
2. 查看實際的 Deployment 名稱
3. 更新 Vercel 環境變量

---

## 📋 配置檢查表

完成後確認：

- [ ] Vercel 環境變量已添加
  - [ ] REPLICATE_API_TOKEN
  - [ ] 其他需要的變量
- [ ] Vercel 已重新部署
- [ ] 蛋糕頁可以訪問
- [ ] 本地功能正常（上傳、處理、下載）
- [ ] API 不返回 403
- [ ] （可選）x-raymike 模型已部署
- [ ] （可選）Deployments 已創建

---

## 💡 推薦的完成順序

**第一優先級（必須）：**
1. 配置 REPLICATE_API_TOKEN 到 Vercel → **5分鐘**
2. 重新部署 Vercel → **2分鐘**
3. 測試蛋糕頁基礎功能 → **2分鐘**

**第二優先級（可選）：**
4. 部署 x-raymike 模型 → **30分鐘**
5. 創建 Replicate Deployments → **10分鐘**

**第三優先級（進階）：**
6. 配置 OpenAI API
7. 配置 AWS S3 + Imgix

---

## 🎉 完成後

一切配置完成後，你會有：

✅ **功能完整的蛋糕頁 v14.0**
- 現代化 UI/UX
- 本地圖片處理（6種透視模式）
- API 集成（如果配置了）

✅ **可用的 API Endpoints**
- X-Ray Mike
- Replicate Generate/Detect
- OpenAI Proxy
- Visualize

✅ **自動化部署流程**
- GitHub Actions
- 一鍵部署

立即開始：https://vercel.com/cityfish91159/maihouses/settings/environment-variables
