# 🚀 快速開始 - 5 分鐘配置

## 第 1 步：配置 Vercel 環境變量（必須）

1. **訪問 Vercel 設置**
   ```
   https://vercel.com/cityfish91159/maihouses/settings/environment-variables
   ```

2. **添加 Token**
   - 點擊 "Add New"
   - Name: `REPLICATE_API_TOKEN`
   - Value: `你的 Replicate Token`
   - Environment: 全選（Production, Preview, Development）
   - 點擊 "Save"

   > 獲取 Token: https://replicate.com/account/api-tokens

## 第 2 步：重新部署

Vercel 會自動重新部署，或手動觸發：

```
https://vercel.com/cityfish91159/maihouses/deployments
```

點擊最新部署 → "..." → "Redeploy"

## 第 3 步：測試

等待 1-2 分鐘後：

```
https://maihouses.vercel.app/p/cake.html
```

---

## ✅ 完成！

現在你的蛋糕頁應該完全可用了：
- ✅ 上傳圖片
- ✅ 本地透視處理
- ✅ 下載圖片
- ✅ API 功能（如果配置了模型）

---

## 🔧 可選：部署 X-Ray Mike 模型

如果你想要自定義 X-ray 模型：

1. 訪問：https://github.com/cityfish91159/maihouses/actions
2. 運行 "Deploy X-Ray Mike" workflow
3. 等待 30 分鐘

---

有問題？查看 `VERCEL_SETUP_COMPLETE.md` 獲取詳細指南。
