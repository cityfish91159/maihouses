# Supabase 設定指南 (解決 Google 登入與 Email 驗證問題)

## 1. 解決 Google 登入跳轉錯誤 (localhost refused to connect)

您的 Google 登入會跳轉回 `localhost:3000`，是因為 Supabase 預設將 Site URL 設為 localhost，且正式站網址未被加入白名單。

請依照以下步驟設定 Supabase 後台：

1.  進入 **Supabase Dashboard** > **Authentication** > **URL Configuration**。
2.  **Site URL**: 建議設為您的正式站網址 `https://maihouses.vercel.app`。
3.  **Redirect URLs**: 務必將以下網址加入白名單 (Add URL)：
    *   `https://maihouses.vercel.app/maihouses/auth.html`
    *   `http://localhost:3000/maihouses/auth.html` (若您需要在本地測試)
    *   `http://localhost:5173/maihouses/auth.html` (若您使用 Vite 本地開發)

**為什麼要這樣做？**
程式碼中已強制指定 `redirectTo` 為 `https://maihouses.vercel.app/maihouses/auth.html` (當不在本地時)。若此網址不在 Supabase 的白名單內，Supabase 會忽略它並強制跳轉回預設的 Site URL (通常是 localhost)，導致您在手機或別台電腦上看到連線錯誤。

## 2. 解決 Email not confirmed (註冊失敗)

Supabase 預設開啟「Email 確認」功能。使用者註冊後，必須去信箱點擊連結才能登入。

**解決方案 A：保留驗證 (推薦，較安全)**
*   程式碼已更新，當出現 "Email not confirmed" 錯誤時，會提示使用者「請先至信箱收取驗證信啟用帳號」。
*   請確保您的 Supabase SMTP 設定正確，否則使用者收不到信。

**解決方案 B：關閉驗證 (測試用，方便)**
若您希望註冊後直接登入，不需收信：
1.  進入 **Supabase Dashboard** > **Authentication** > **Providers** > **Email**。
2.  取消勾選 **Confirm email**。
3.  儲存設定。

---

## 3. 程式碼更新說明

我已更新 `public/auth.html`：
1.  **Google 登入**：強制在非本地環境使用 `https://maihouses.vercel.app` 作為跳轉目標，避免跳回 localhost。
2.  **錯誤提示**：新增對 `Email not confirmed` 的錯誤偵測，顯示更友善的中文提示。
