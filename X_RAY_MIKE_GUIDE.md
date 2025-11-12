# X-Ray Mike API 使用指南

## 📋 模型資訊
- **模型名稱**: X-Ray Mike
- **模型路徑**: `cityfish91159/x-raymike`
- **Replicate URL**: https://replicate.com/cityfish91159/x-raymike
- **功能**: 圖片 X-ray 透視處理

## 🔧 配置步驟

### 1. 設置環境變量

在 Vercel 項目中設置以下環境變量：

```bash
REPLICATE_API_TOKEN=r8_your_token_here
```

### 2. API Endpoint

```
POST https://maihouses.vercel.app/api/x-raymike
```

## 📡 API 使用方法

### 請求格式

```javascript
// JavaScript/fetch 示例
const response = await fetch('https://maihouses.vercel.app/api/x-raymike', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image: 'https://example.com/image.jpg',  // 圖片 URL
    // 或使用 base64
    // image: 'data:image/jpeg;base64,/9j/4AAQ...'
  })
});

const result = await response.json();
console.log(result);
```

### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `image` | string | ✅ | 圖片 URL 或 base64 編碼的圖片 |
| `version` | string | ❌ | 指定模型版本（選填，默認使用最新版本）|

### 響應格式

**成功響應 (200)**:
```json
{
  "ok": true,
  "id": "prediction-id-here",
  "output": "https://replicate.delivery/.../output.png",
  "metrics": {
    "predict_time": 2.5
  },
  "logs": "..."
}
```

**錯誤響應 (400/500)**:
```json
{
  "error": "error_type",
  "message": "Error description",
  "detail": { ... }
}
```

## 💻 前端集成示例

### 使用 JavaScript

```javascript
async function processXRay(imageUrl) {
  try {
    const response = await fetch('/api/x-raymike', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageUrl })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.ok) {
      console.log('X-Ray 處理成功!');
      console.log('輸出圖片:', data.output);
      return data.output;
    } else {
      throw new Error('處理失敗');
    }
  } catch (error) {
    console.error('X-Ray 處理錯誤:', error);
    throw error;
  }
}

// 使用示例
const resultUrl = await processXRay('https://example.com/cake.jpg');
document.getElementById('result').src = resultUrl;
```

### 使用 Canvas 上傳圖片

```javascript
async function processCanvasImage(canvas) {
  // 將 Canvas 轉為 base64
  const base64Image = canvas.toDataURL('image/jpeg', 0.85);

  const response = await fetch('/api/x-raymike', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });

  const data = await response.json();
  return data.output;
}
```

### 帶進度顯示

```javascript
async function processWithProgress(imageUrl, onProgress) {
  onProgress('開始處理...', 0);

  const response = await fetch('/api/x-raymike', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageUrl })
  });

  onProgress('處理中...', 50);

  const data = await response.json();

  if (data.ok) {
    onProgress('完成!', 100);
    return data.output;
  } else {
    throw new Error(data.error);
  }
}

// 使用
await processWithProgress(imageUrl, (message, progress) => {
  console.log(message, progress + '%');
  document.getElementById('progress').style.width = progress + '%';
});
```

## 🧪 測試方法

### 使用 cURL

```bash
# 測試 API
curl -X POST https://maihouses.vercel.app/api/x-raymike \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://replicate.delivery/pbxt/example.jpg"
  }'
```

### 使用測試腳本

```bash
# 在項目根目錄運行
bash test-x-raymike.sh
```

## 🔍 常見問題

### Q: 支援哪些圖片格式？
A: 支援 JPEG, PNG, WebP 等常見格式。可以是 URL 或 base64 編碼。

### Q: 圖片大小限制？
A: 建議不超過 10MB，推薦 2048x2048 以內的解析度。

### Q: 處理時間多長？
A: 通常 2-10 秒，取決於圖片大小和複雜度。API 有 120 秒超時限制。

### Q: 如何處理大圖片？
A: 建議先在前端使用 Canvas 縮放到合適大小（如 1024x1024）。

### Q: 可以批量處理嗎？
A: 目前 API 只支援單張處理。批量處理請循環調用，建議加入延遲避免超過 rate limit。

## 📊 性能優化建議

1. **圖片預處理**：在上傳前壓縮圖片
2. **緩存結果**：相同圖片可以緩存處理結果
3. **並發控制**：批量處理時限制併發數（建議 ≤ 3）
4. **錯誤重試**：網絡錯誤時自動重試（最多 3 次）
5. **使用 AbortController**：支援取消請求

## 🔗 相關資源

- [Replicate API 文檔](https://replicate.com/docs)
- [X-Ray Mike 模型頁面](https://replicate.com/cityfish91159/x-raymike)
- [蛋糕頁示例](https://maihouses.vercel.app/p/cake.html)

## 📝 更新日誌

### v1.0.0 (2025-11-12)
- ✅ 初始版本
- ✅ 支援 URL 和 base64 輸入
- ✅ 120 秒超時保護
- ✅ 完整錯誤處理
- ✅ CORS 支援
