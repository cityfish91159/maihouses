# X-Ray Mike 完整部署指南

## 🎯 目標

將 X-Ray Mike 模型部署到 Replicate，讓它可以通過 API 調用。

## 📋 前置要求檢查清單

- [ ] Docker 已安裝並運行
- [ ] Cog 已安裝
- [ ] Replicate 帳號已創建
- [ ] API Token 已獲取

## 🚀 快速部署（3 步驟）

### 方法 A：使用自動化腳本（推薦）

```bash
cd x-raymike-model
bash deploy.sh
```

腳本會自動：

1. 檢查環境（Docker、Cog）
2. 本地測試（如果有測試圖片）
3. 構建容器
4. 推送到 Replicate

### 方法 B：手動部署

#### 1. 安裝依賴

**安裝 Docker**

```bash
# 檢查是否已安裝
docker --version

# 如果沒有，訪問: https://docs.docker.com/get-docker/
# 安裝後啟動 Docker Desktop
```

**安裝 Cog**

```bash
# macOS/Linux
sudo curl -o /usr/local/bin/cog -L https://github.com/replicate/cog/releases/latest/download/cog_$(uname -s)_$(uname -m)
sudo chmod +x /usr/local/bin/cog

# 驗證
cog --version
```

#### 2. 登入 Replicate

```bash
cog login

# 會打開瀏覽器，登入後返回終端
# 驗證: cog whoami
```

#### 3. 本地測試（可選但推薦）

```bash
# 準備測試圖片（隨便一張）
# 命名為 test.jpg 放在項目根目錄

# 運行預測
cog predict -i image=@test.jpg -i mode=clahe -i intensity=5.0

# 應該在 output/ 看到處理後的圖片
```

#### 4. 構建容器

```bash
cog build

# 首次構建需要 5-10 分鐘
# 下載依賴：PyTorch, OpenCV 等
```

#### 5. 推送到 Replicate

```bash
# 格式: cog push r8.im/你的用戶名/模型名
cog push r8.im/cityfish91159/x-raymike

# 推送需要 10-20 分鐘（上傳容器鏡像）
# 完成後會顯示模型 URL
```

#### 6. 驗證部署

訪問模型頁面：

```
https://replicate.com/cityfish91159/x-raymike
```

在網頁測試或使用 API：

```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "獲取最新版本ID",
    "input": {
      "image": "https://example.com/image.jpg",
      "mode": "clahe",
      "intensity": 5.0
    }
  }'
```

## 🔧 開發流程

### 修改模型算法

編輯 `predict.py`：

```python
# 添加新功能
def _apply_custom(self, img: np.ndarray, intensity: float) -> np.ndarray:
    # 你的算法
    processed = ...
    return processed
```

### 添加新依賴

編輯 `cog.yaml`：

```yaml
python_packages:
  - "scikit-learn==1.3.0" # 新增依賴
```

### 測試更改

```bash
# 重新構建
cog build

# 測試
cog predict -i image=@test.jpg

# 如果 OK，推送新版本
cog push r8.im/cityfish91159/x-raymike
```

## 🐛 故障排除

### 問題 1: Docker 未啟動

**錯誤**:

```
Cannot connect to the Docker daemon
```

**解決**:

```bash
# macOS: 打開 Docker Desktop
# Linux: sudo systemctl start docker
# Windows: 啟動 Docker Desktop
```

### 問題 2: Cog 構建失敗

**錯誤**:

```
Error building image
```

**解決**:

1. 檢查 `cog.yaml` 語法
2. 確保 Python 版本兼容（3.8-3.11）
3. 檢查依賴版本衝突
4. 查看詳細日誌：`cog build --debug`

### 問題 3: 推送超時

**錯誤**:

```
Error: push timeout
```

**解決**:

1. 檢查網絡連接
2. 重試推送（會斷點續傳）
3. 如果反覆失敗，檢查防火牆設置

### 問題 4: 未登入

**錯誤**:

```
authentication required
```

**解決**:

```bash
# 重新登入
cog login

# 驗證
cog whoami
```

### 問題 5: 本地測試失敗

**錯誤**:

```
Error in predict.py
```

**解決**:

1. 檢查 Python 語法
2. 確保所有 import 都在 cog.yaml 中
3. 測試依賴：`cog run python -c "import torch; print(torch.__version__)"`
4. 查看詳細錯誤：`cog predict --debug -i image=@test.jpg`

## 📊 性能優化

### 減少構建時間

1. **使用 Cog 緩存**

   ```bash
   # 不清除緩存
   cog build  # 後續構建會更快
   ```

2. **選擇適當的基礎鏡像**
   ```yaml
   # cog.yaml
   build:
     gpu: true # 只有需要 GPU 時才開啟
   ```

### 減少模型大小

1. **移除不需要的依賴**
2. **使用較小的依賴版本**
3. **避免安裝完整的 CUDA 工具鏈**

## 🔗 集成到網站

部署成功後，更新 Vercel 環境變量：

```bash
REPLICATE_XRAY_MODEL=cityfish91159/x-raymike
REPLICATE_API_TOKEN=r8_你的token
```

API 會自動使用新模型。

## 📚 相關資源

- [Cog 官方文檔](https://github.com/replicate/cog)
- [Replicate 文檔](https://replicate.com/docs)
- [Cog YAML 參考](https://github.com/replicate/cog/blob/main/docs/yaml.md)
- [Python API 參考](https://github.com/replicate/cog/blob/main/docs/python.md)

## 💡 提示

1. **首次部署很慢** - 需要下載和上傳大量數據，耐心等待
2. **使用版本控制** - 推送後 Replicate 會自動創建新版本
3. **測試再推送** - 本地測試通過再推送，節省時間
4. **查看日誌** - 如果線上運行失敗，查看 Replicate 的日誌
5. **控制成本** - 模型會按使用量計費，測試時注意

## ✅ 部署檢查清單

完成後確認：

- [ ] 模型頁面可訪問
- [ ] 網頁測試功能正常
- [ ] API 調用成功
- [ ] 處理速度可接受（2-5秒）
- [ ] 輸出圖片質量符合預期
- [ ] 已更新網站環境變量
- [ ] 舊的 API 調用已更新

完成！🎉
