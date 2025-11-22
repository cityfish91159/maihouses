# Supabase Google Login 設定指南

要解決 `Unsupported provider: provider is not enabled` 錯誤，您需要在 Supabase 後台啟用 Google 登入並完成設定。

## 第一步：準備 Google Cloud Credentials

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 建立一個新專案 (或選擇現有專案)。
3. 在左側選單選擇 **APIs & Services** > **OAuth consent screen** (OAuth 同意畫面)。
   - User Type 選擇 **External** (外部)。
   - 填寫 App name (例如: MaiHouses), User support email, Developer contact information。
   - 點擊 Save and Continue。
4. 在左側選單選擇 **Credentials** (憑證)。
5. 點擊 **Create Credentials** > **OAuth client ID**。
6. Application type 選擇 **Web application**。
7. Name 填寫 "Supabase Auth"。
8. **重要：設定 Authorized redirect URIs**
   - 點擊 **Add URI**。
   - 填入您的 Supabase Callback URL：
     ```
     https://mtqnjmoisrvjofdxhwhi.supabase.co/auth/v1/callback
     ```
   - *注意：這是從您的程式碼中提取的專案網址。*
9. 點擊 **Create**。
10. 複製顯示的 **Client ID** 和 **Client Secret**。

## 第二步：在 Supabase 啟用 Google Provider

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 進入您的專案 (`mtqnjmoisrvjofdxhwhi`)。
3. 在左側選單點擊 **Authentication** > **Providers**。
4. 找到 **Google** 並點擊展開。
5. 將 **Enable Google** 開關打開。
6. 填入剛剛複製的資訊：
   - **Client ID**
   - **Client Secret**
7. 點擊 **Save**。

## 第三步：檢查 URL Configuration (Redirect URLs)

為了確保登入後能正確跳轉回您的網站，還需要在 Supabase 設定允許的重定向網址。

1. 在 Supabase Dashboard，前往 **Authentication** > **URL Configuration**。
2. 在 **Site URL** 填入您的正式網址，例如：
   ```
   https://maihouses.vercel.app
   ```
3. 在 **Redirect URLs** 區域，點擊 **Add URL** 並加入以下網址 (包含本地開發與正式環境)：
   - `http://localhost:5173/*`
   - `https://maihouses.vercel.app/*`
   - `https://maihouses.vercel.app/maihouses/個人信息流_consumer.html`
   - `https://maihouses.vercel.app/maihouses/個人信息流_agent.html`
4. 點擊 **Save**。

完成以上步驟後，Google 登入功能即可正常運作。
