# X-Ray Mike - 學術級透視圖像處理模型

## 📋 模型說明

X-Ray Mike 是一個專業的圖像透視處理模型，集成了多種學術級圖像增強算法。

### 支持的透視模式

1. **CLAHE** - 對比度限制自適應直方圖均衡化
2. **Retinex MSR** - 多尺度 Retinex 算法
3. **Adaptive** - 自適應閾值增強
4. **Wavelet** - 小波變換細節增強
5. **Gradient** - 梯度熱圖可視化
6. **Neutral** - 標準對比度增強

## 🚀 部署到 Replicate

### 前置要求

1. **安裝 Docker**
   ```bash
   # 檢查 Docker 是否安裝
   docker --version

   # 如果沒有安裝，訪問：https://docs.docker.com/get-docker/
   ```

2. **安裝 Cog**
   ```bash
   # macOS/Linux
   sudo curl -o /usr/local/bin/cog -L https://github.com/replicate/cog/releases/latest/download/cog_$(uname -s)_$(uname -m)
   sudo chmod +x /usr/local/bin/cog

   # 驗證安裝
   cog --version
   ```

3. **Replicate API Token**
   - 獲取：https://replicate.com/account/api-tokens
   - 登入 Cog：`cog login`

### 部署步驟

#### 1. 本地測試

```bash
# 進入項目目錄
cd x-raymike-model

# 測試預測（使用本地圖片）
cog predict -i image=@test.jpg -i mode=clahe -i intensity=5.0
```

#### 2. 構建容器

```bash
# 構建 Docker 容器（需要幾分鐘）
cog build
```

#### 3. 推送到 Replicate

```bash
# 推送到你的 Replicate 帳號
# 格式: cog push r8.im/你的用戶名/模型名
cog push r8.im/cityfish91159/x-raymike

# 推送成功後會顯示模型 URL
# 例如: https://replicate.com/cityfish91159/x-raymike
```

#### 4. 驗證部署

訪問你的模型頁面：
```
https://replicate.com/cityfish91159/x-raymike
```

在網頁上測試模型，或使用 API：

```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "模型版本ID",
    "input": {
      "image": "https://example.com/image.jpg",
      "mode": "clahe",
      "intensity": 5.0
    }
  }'
```

## 🧪 本地開發

### 修改模型

編輯 `predict.py` 來調整算法：

```python
# 添加新的透視模式
def _apply_custom(self, img: np.ndarray, intensity: float) -> np.ndarray:
    # 你的自定義算法
    return processed_img
```

### 添加依賴

編輯 `cog.yaml`：

```yaml
python_packages:
  - "your-package==version"
```

### 測試更改

```bash
# 重新構建
cog build

# 測試
cog predict -i image=@test.jpg
```

## 📊 性能指標

- **處理時間**: ~2-5 秒（取決於圖片大小和 GPU）
- **支援解析度**: 最大 4096×4096
- **GPU 記憶體**: ~2GB

## 🔧 故障排除

### 問題 1: Docker 未啟動
```
Error: Cannot connect to the Docker daemon
```
**解決**: 啟動 Docker Desktop

### 問題 2: Cog 構建失敗
```
Error: Failed to build image
```
**解決**: 檢查 cog.yaml 語法，確保所有依賴版本兼容

### 問題 3: 推送失敗
```
Error: authentication required
```
**解決**: 運行 `cog login` 重新登入

## 📚 參考資料

- [Cog 文檔](https://github.com/replicate/cog)
- [Replicate 文檔](https://replicate.com/docs)
- [OpenCV 文檔](https://docs.opencv.org/)

## 📄 授權

MIT License
