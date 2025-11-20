# GitHub Actions 部署指南

## 🚀 使用 GitHub Actions 部署 X-Ray Mike

這個工作流會自動構建並部署 X-Ray Mike 模型到 Replicate。

### 設置步驟

#### 1. 添加 Secret

在 GitHub 倉庫設置 Secret：

1. 訪問：https://github.com/cityfish91159/maihouses/settings/secrets/actions
2. 點擊 "New repository secret"
3. 添加：
   ```
   Name: REPLICATE_API_TOKEN
   Value: 你的 Replicate API Token (從 https://replicate.com/account/api-tokens 獲取)
   ```
4. 點擊 "Add secret"

#### 2. 觸發部署

**方法 A：手動觸發**

1. 訪問：https://github.com/cityfish91159/maihouses/actions
2. 選擇 "Deploy X-Ray Mike to Replicate"
3. 點擊 "Run workflow"
4. 選擇分支（claude/cake-page-route-011CV44tQULcCbkto2PmNJSq）
5. 點擊 "Run workflow"

**方法 B：自動觸發**

合併到 main 分支後，修改 `x-raymike-model/` 目錄會自動觸發部署。

#### 3. 查看進度

1. 訪問：https://github.com/cityfish91159/maihouses/actions
2. 點擊最新的 workflow run
3. 查看實時日誌

部署通常需要 15-30 分鐘。

#### 4. 驗證部署

完成後訪問：
```
https://replicate.com/cityfish91159/x-raymike
```

### 故障排除

**問題：REPLICATE_API_TOKEN 未設置**
- 確保在 GitHub Secrets 中添加了 token
- Token 名稱必須完全匹配：`REPLICATE_API_TOKEN`

**問題：構建失敗**
- 查看 Actions 日誌獲取詳細錯誤
- 檢查 `x-raymike-model/cog.yaml` 語法
- 確保 `predict.py` 沒有語法錯誤

**問題：推送失敗**
- 檢查 API Token 是否有效
- 確保有創建模型的權限

### 手動運行（如果 Actions 失敗）

在本地機器上：

```bash
git clone https://github.com/cityfish91159/maihouses.git
cd maihouses/x-raymike-model
export REPLICATE_API_TOKEN=your_token
bash deploy.sh
```
