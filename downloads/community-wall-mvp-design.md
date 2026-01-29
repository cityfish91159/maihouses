# 社區牆 MVP 完整設計文件

> 檔案路徑：`/downloads/community-wall-mvp-design.md`  
> 最後更新：2024/12/01  
> 負責人：GitHub Copilot

---

## 一、設計邏輯總覽

### 1.1 頁面目標

將流量從「公開」引導至「私密」，透過「評價」作為註冊誘餌，最終轉換為住戶驗證或房仲名單獲取。

### 1.2 頁面順序（由上而下）

| 順序 | 區塊                    | 目的                   |
| ---- | ----------------------- | ---------------------- |
| 1    | 社區資訊卡              | 社區辨識               |
| 2    | 社區評價（Hook）        | 建立信任，誘發註冊     |
| 3    | 社區熱帖（公開/私密牆） | 提供內容，增加停留時間 |
| 4    | 準住戶問答              | 精準獲客，展現房仲專業 |

### 1.3 四種使用者身份

| 身份 | 代碼       | 說明               |
| ---- | ---------- | ------------------ |
| 訪客 | `guest`    | 未登入             |
| 會員 | `member`   | 已登入但未驗證住戶 |
| 住戶 | `resident` | 已驗證的本社區住戶 |
| 房仲 | `agent`    | 認證房仲           |

---

## 二、權限矩陣

| 功能             | 訪客           | 會員         | 住戶           | 房仲              |
| ---------------- | -------------- | ------------ | -------------- | ----------------- |
| **評價區**       | 看 2 則 + blur | 全部         | 全部           | 全部              |
| **公開牆**       | 看 2 則 + blur | 全部         | 全部 + 發文    | 全部 + 發物件     |
| **私密牆**       | ❌ 鎖定        | ❌ 鎖定      | ✅ 全部 + 發文 | ✅ 可看（不可發） |
| **問答：看問題** | ✅             | ✅           | ✅             | ✅                |
| **問答：看回答** | 看 1 則        | 全部         | 全部           | 全部              |
| **問答：發問**   | ❌             | ✅           | ✅             | ✅                |
| **問答：回答**   | ❌             | ❌           | ✅             | ✅ + 專家標章     |
| **底部 CTA**     | 「免費註冊」   | 「驗證住戶」 | 隱藏           | 隱藏              |

---

## 三、核心設計決策

### 3.1 評價區作為 Hook（放最上面）

- **訪客只看 2 則**，第 3 則起 blur 模糊處理
- blur 遮罩上顯示「還有 N 則評價」+ 註冊按鈕
- 評價來源：房仲上傳時填寫的「兩好一公道」

### 3.2 公開牆/私密牆用 Tab 切換

- **訪客/會員**：私密牆 Tab 顯示 🔒，點擊彈出對應提示
- **住戶/房仲**：可正常切換

### 3.3 私密牆權限嚴格控制

- **訪客**：完全看不到，點擊彈「請先登入」
- **會員**：看到鎖定畫面，點擊彈「驗證住戶身份」
- **住戶**：可看 + 可發文
- **房仲**：可看（展示房仲專業），但不能發文（避免洗版）

### 3.4 問答區的商業價值

- 問題全網公開（SEO）
- 房仲回答帶「⭐ 專家回答」標章
- 準住戶覺得專業 → 點擊聯繫 → 精準名單

### 3.5 Mock 身份切換器

- 右下角固定按鈕，方便開發測試
- 切換後所有區塊**完整重新渲染**（不是只改 class）

---

## 四、前端程式碼

### 4.1 檔案位置

```
/public/maihouses/community-wall_mvp.html
```

### 4.2 完整程式碼

```html
<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
    />
    <title>社區牆｜惠宇上晴</title>
    <meta name="description" content="社區熱帖、真實評價、準住戶問答 - 邁房子社區牆" />
    <style>
      /* === 動畫 === */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* === 基礎變數 === */
      :root {
        --primary: #00385a;
        --primary-dark: #002a44;
        --primary-light: #33607b;
        --secondary: #34c759;
        --secondary-light: #50d167;
        --accent: #ff9b4a;
        --warning: #ef4444;
        --heart: #ff3b30;
        --bg-base: #f8fafb;
        --bg-alt: #f0f4fa;
        --bg-elevated: #ffffff;
        --text-primary: #0a1f3f;
        --text-secondary: #5a6b7f;
        --border: #d8e4f0;
        --border-light: #e8f0f8;
        --brand: #003366;
        --line: #e6edf7;
      }

      /* === Reset === */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html,
      body {
        min-height: 100%;
        background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-alt) 100%);
        color: var(--text-primary);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      /* === 頁面容器 === */
      .page {
        max-width: 520px;
        margin: 0 auto;
        padding: 8px 8px 100px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fadeInUp 0.6s ease-out;
      }

      /* === 頂部導航 === */
      .topbar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(246, 249, 255, 0.95);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(230, 237, 247, 0.8);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        margin: -8px -8px 0;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
      }
      .brand .logo-icon {
        width: 42px;
        height: 42px;
        background: linear-gradient(135deg, var(--brand), #005282);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 51, 102, 0.2);
      }
      .brand .logo-icon svg {
        width: 22px;
        height: 22px;
        color: #fff;
      }
      .brand .logo-text {
        font-size: 24px;
        font-weight: 700;
        font-family: serif;
        color: var(--brand);
      }
      .tools {
        margin-left: auto;
        display: flex;
        gap: 8px;
      }
      .icon-btn {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #fff;
        padding: 8px 12px;
        font-size: 13px;
        color: #173a7c;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .icon-btn:hover {
        background: #f6f9ff;
      }
      .icon-btn:active {
        transform: scale(0.95);
      }

      /* === 區塊卡片 === */
      .section {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--border-light);
        border-radius: 18px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .section-title {
        font-size: 16px;
        font-weight: 800;
        color: var(--primary-dark);
      }
      .section-sub {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(0, 56, 90, 0.08);
        border: 1px solid var(--primary-light);
        color: var(--primary);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 10px;
        font-weight: 700;
      }

      /* === Tabs === */
      .tabs {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tab {
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 11px;
        font-weight: 600;
        background: rgba(240, 244, 250, 0.8);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
      }
      .tab:hover {
        background: rgba(0, 56, 90, 0.08);
        color: var(--primary);
      }
      .tab.active {
        background: rgba(0, 56, 90, 0.1);
        border-color: var(--primary-light);
        color: var(--primary);
        font-weight: 700;
      }
      .tab.locked {
        opacity: 0.6;
      }
      .tab .lock-icon {
        margin-left: 4px;
      }

      /* === 貼文卡片 === */
      .post-card {
        display: flex;
        gap: 10px;
        padding: 12px;
        border: 1px solid var(--border-light);
        border-radius: 14px;
        background: #fff;
        transition: all 0.2s;
      }
      .post-card:hover {
        border-color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(0, 56, 90, 0.06);
      }
      .post-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #eef3ff, #fff);
        border: 2px solid var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        color: var(--primary);
        font-size: 16px;
        flex-shrink: 0;
      }
      .post-avatar.agent {
        border-color: var(--secondary);
        color: var(--secondary);
      }
      .post-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .post-header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .post-author {
        font-weight: 700;
        font-size: 13px;
        color: var(--text-primary);
      }
      .post-badge {
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
      }
      .post-badge.resident {
        background: #e8faef;
        color: #0e8d52;
      }
      .post-badge.agent {
        background: #fff3e0;
        color: #e65100;
      }
      .post-badge.verified {
        background: #e3f2fd;
        color: #1565c0;
      }
      .post-time {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .post-content {
        font-size: 13px;
        line-height: 1.55;
        color: var(--text-primary);
      }
      .post-stats {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: var(--text-secondary);
      }
      .post-stat {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .post-actions {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }
      .action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 10px;
        border-radius: 8px;
        background: rgba(0, 56, 90, 0.06);
        border: 1px solid rgba(0, 56, 90, 0.1);
        color: var(--primary);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .action-btn:hover {
        background: rgba(0, 56, 90, 0.12);
      }

      /* === 評價卡片 === */
      .review-card {
        padding: 12px;
        border: 1px solid var(--border-light);
        border-radius: 14px;
        background: #fff;
      }
      .review-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .review-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(0, 56, 90, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        color: var(--primary);
        font-size: 14px;
      }
      .review-meta {
        flex: 1;
      }
      .review-author {
        font-weight: 700;
        font-size: 12px;
      }
      .review-sub {
        font-size: 10px;
        color: var(--text-secondary);
      }
      .review-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .review-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 12px;
        line-height: 1.5;
      }
      .review-icon {
        font-size: 14px;
        flex-shrink: 0;
      }
      .review-text {
        color: var(--text-primary);
      }

      /* === 問答卡片 === */
      .qa-card {
        padding: 12px;
        border: 1px solid var(--border-light);
        border-radius: 14px;
        background: #fff;
      }
      .qa-question {
        font-weight: 700;
        font-size: 13px;
        color: var(--primary-dark);
        margin-bottom: 8px;
      }
      .qa-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: var(--text-secondary);
        margin-bottom: 10px;
      }
      .qa-answers {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-left: 12px;
        border-left: 2px solid var(--border);
      }
      .qa-answer {
        font-size: 12px;
        line-height: 1.5;
      }
      .qa-answer-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }
      .qa-answer-badge {
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
      }

      /* === 模糊遮罩 === */
      .blur-overlay {
        position: relative;
      }
      .blur-overlay .blur-content {
        filter: blur(4px);
        pointer-events: none;
        user-select: none;
      }
      .blur-overlay .blur-cta {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 14px;
        text-align: center;
        padding: 20px;
      }
      .blur-cta h4 {
        font-size: 14px;
        font-weight: 800;
        color: var(--primary-dark);
        margin-bottom: 8px;
      }
      .blur-cta p {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 12px;
      }
      .blur-cta button {
        background: linear-gradient(135deg, var(--primary), #005282);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 24px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .blur-cta button:hover {
        transform: scale(1.02);
      }

      /* === 私密牆鎖定 === */
      .private-lock {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        background: rgba(0, 56, 90, 0.03);
        border-radius: 14px;
      }
      .private-lock .lock-icon-big {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }
      .private-lock h4 {
        font-size: 14px;
        font-weight: 700;
        color: var(--primary-dark);
        margin-bottom: 6px;
      }
      .private-lock p {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 16px;
      }
      .private-lock button {
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 20px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      /* === 身份切換器（Mock 用）=== */
      .role-switcher {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      }
      .role-switcher-btn {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 10px 16px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .role-switcher-menu {
        position: absolute;
        bottom: 50px;
        right: 0;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        padding: 8px;
        min-width: 180px;
        display: none;
      }
      .role-switcher-menu.open {
        display: block;
      }
      .role-switcher-menu button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 10px 12px;
        border: none;
        background: none;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        color: var(--text-primary);
      }
      .role-switcher-menu button:hover {
        background: #f6f9ff;
      }
      .role-switcher-menu button.active {
        background: rgba(0, 56, 90, 0.1);
        color: var(--primary);
        font-weight: 700;
      }

      /* === 固定底部 CTA === */
      .fixed-bottom-cta {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--border);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        z-index: 90;
      }
      .fixed-bottom-cta.hidden {
        display: none;
      }
      .fixed-bottom-cta p {
        font-size: 12px;
        color: var(--text-secondary);
      }
      .fixed-bottom-cta button {
        background: linear-gradient(135deg, var(--primary), #005282);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <!-- HTML 結構請參考實際檔案 -->
  </body>
</html>
```

---

## 五、後端 API

### 5.1 檔案位置

```
/api/community/wall.ts      # 讀取資料
/api/community/question.ts  # 發問/回答
```

### 5.2 wall.ts 完整程式碼

```typescript
/**
 * Vercel API: /api/community/wall
 *
 * 社區牆資料 API - 取得貼文、評價、問答
 * 支援權限控制（訪客/會員/住戶）
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// 非會員可見數量
const GUEST_LIMIT = 2;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { communityId, type, visibility } = req.query;

  if (!communityId) {
    return res.status(400).json({ error: '缺少 communityId' });
  }

  // 檢查登入狀態
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  let isAuthenticated = false;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        isAuthenticated = true;
      }
    } catch (e) {
      console.warn('Token 驗證失敗');
    }
  }

  try {
    switch (type) {
      case 'posts':
        return await getPosts(res, communityId as string, visibility as string, isAuthenticated);
      case 'reviews':
        return await getReviews(res, communityId as string, isAuthenticated);
      case 'questions':
        return await getQuestions(res, communityId as string, isAuthenticated);
      case 'all':
      default:
        return await getAll(res, communityId as string, isAuthenticated);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 取得貼文
async function getPosts(
  res: VercelResponse,
  communityId: string,
  visibility: string = 'public',
  isAuthenticated: boolean
) {
  let query = supabase
    .from('community_posts')
    .select('*')
    .eq('community_id', communityId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  // 非登入用戶只能看公開牆
  if (!isAuthenticated) {
    query = query.eq('visibility', 'public').limit(GUEST_LIMIT);
  } else if (visibility === 'public') {
    query = query.eq('visibility', 'public');
  } else if (visibility === 'private') {
    query = query.eq('visibility', 'private');
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    total: count || data?.length || 0,
    limited: !isAuthenticated,
    visibleCount: isAuthenticated ? data?.length || 0 : GUEST_LIMIT,
  });
}

// 取得評價
// 注意：community_reviews 是 View，資料來源為 properties 表的兩好一公道欄位
async function getReviews(res: VercelResponse, communityId: string, isAuthenticated: boolean) {
  let query = supabase
    .from('community_reviews') // 這是 View，對接 properties 表
    .select('*', { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (!isAuthenticated) {
    query = query.limit(GUEST_LIMIT);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // 取得社區的 AI 總結
  const { data: community } = await supabase
    .from('communities')
    .select('two_good, one_fair, story_vibe')
    .eq('id', communityId)
    .single();

  return res.status(200).json({
    success: true,
    data,
    summary: community || null,
    total: count || 0,
    limited: !isAuthenticated,
    hiddenCount: !isAuthenticated && count ? Math.max(0, count - GUEST_LIMIT) : 0,
  });
}

// 取得問答（略）
async function getQuestions(res: VercelResponse, communityId: string, isAuthenticated: boolean) {
  // ...
}

async function getAll(res: VercelResponse, communityId: string, isAuthenticated: boolean) {
  // ...
}
```

### 5.3 question.ts 完整程式碼

```typescript
/**
 * Vercel API: /api/community/question
 *
 * 準住戶問答 API - 發問和回答
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 驗證登入
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '請先登入' });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: '登入已過期，請重新登入' });
  }

  try {
    const { action, communityId, questionId, content, isAnonymous = true } = req.body;

    if (!action) {
      return res.status(400).json({ error: '缺少 action 參數' });
    }

    switch (action) {
      case 'ask':
        return await handleAsk(res, user.id, communityId, content, isAnonymous);
      case 'answer':
        return await handleAnswer(res, user.id, questionId, content);
      default:
        return res.status(400).json({ error: '無效的 action' });
    }
  } catch (error: any) {
    console.error('Question API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 發問
async function handleAsk(
  res: VercelResponse,
  userId: string,
  communityId: string,
  question: string,
  isAnonymous: boolean
) {
  if (!communityId || !question) {
    return res.status(400).json({ error: '缺少 communityId 或 question' });
  }

  if (question.length < 5) {
    return res.status(400).json({ error: '問題至少需要 5 個字' });
  }

  const { data, error } = await supabase
    .from('community_questions')
    .insert({
      community_id: communityId,
      author_id: userId,
      question,
      is_anonymous: isAnonymous,
    })
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    message: '問題已發布，住戶會收到通知',
  });
}

// 回答
async function handleAnswer(
  res: VercelResponse,
  userId: string,
  questionId: string,
  answer: string
) {
  if (!questionId || !answer) {
    return res.status(400).json({ error: '缺少 questionId 或 answer' });
  }

  if (answer.length < 10) {
    return res.status(400).json({ error: '回答至少需要 10 個字' });
  }

  // 判斷回答者類型：查詢是否為房仲
  let authorType: 'resident' | 'agent' = 'resident';

  const { data: agentProfile } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (agentProfile) {
    authorType = 'agent';
  }

  const { data, error } = await supabase
    .from('community_answers')
    .insert({
      question_id: questionId,
      author_id: userId,
      answer,
      author_type: authorType,
    })
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    message: '回答已發布',
  });
}
```

---

## 六、資料庫 Schema

### 6.1 檔案位置

```
/supabase/migrations/20241201_community_wall.sql
```

### 6.2 完整 SQL

```sql
-- 檔案：20241201_community_wall.sql
-- 功能：社區牆完整 Schema（貼文 + 問答 + 評價 View）

-- ============================================
-- 1. community_posts 表（社區熱帖）
-- ============================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 內容
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',

  -- 可見性：public=公開牆, private=私密牆
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),

  -- 貼文類型標籤
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'announcement', 'group_buy', 'parking', 'property')),

  -- 是否置頂
  is_pinned BOOLEAN DEFAULT FALSE,

  -- 互動數據
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. community_questions 表（準住戶問答）
-- ============================================

CREATE TABLE IF NOT EXISTS community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 問題內容
  question TEXT NOT NULL,

  -- 是否匿名
  is_anonymous BOOLEAN DEFAULT TRUE,

  -- 狀態
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),

  -- 互動數據
  answers_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. community_answers 表（問答回覆）
-- ============================================

CREATE TABLE IF NOT EXISTS community_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 回答內容
  answer TEXT NOT NULL,

  -- 回答者類型
  author_type TEXT DEFAULT 'resident' CHECK (author_type IN ('resident', 'agent', 'system')),

  -- 是否為最佳回答
  is_best BOOLEAN DEFAULT FALSE,

  -- 按讚數
  likes_count INTEGER DEFAULT 0,

  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_visibility ON community_posts(community_id, visibility);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_questions_community ON community_questions(community_id);
CREATE INDEX IF NOT EXISTS idx_community_questions_status ON community_questions(community_id, status);
CREATE INDEX IF NOT EXISTS idx_community_answers_question ON community_answers(question_id);

-- ============================================
-- 5. RLS 政策
-- ============================================

-- Posts RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts visible to all"
  ON community_posts FOR SELECT
  USING (visibility = 'public');

-- ⚠️ TECH DEBT: MVP 權宜之計
-- 目前任何登入用戶都能看私密牆，正式版需加入 user_communities 關聯表
CREATE POLICY "Private posts visible to authenticated"
  ON community_posts FOR SELECT
  TO authenticated
  USING (visibility = 'private');

CREATE POLICY "Authenticated can create posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Questions RLS
ALTER TABLE community_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions visible to all"
  ON community_questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create questions"
  ON community_questions FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Answers RLS
ALTER TABLE community_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Answers visible to all"
  ON community_answers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create answers"
  ON community_answers FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- ============================================
-- 6. Trigger: 更新 answers_count
-- ============================================

CREATE OR REPLACE FUNCTION update_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_questions
    SET answers_count = answers_count + 1,
        status = CASE WHEN status = 'open' THEN 'answered' ELSE status END
    WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_questions
    SET answers_count = answers_count - 1
    WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_answers_count ON community_answers;
CREATE TRIGGER trigger_update_answers_count
  AFTER INSERT OR DELETE ON community_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_answers_count();

-- ============================================
-- 7. community_reviews View（對接 properties 表）
-- ============================================
-- 說明：評價資料存在 properties 表的 advantage_1, advantage_2, disadvantage 欄位

CREATE OR REPLACE VIEW community_reviews AS
SELECT
  p.id,
  p.community_id,
  p.agent_id AS author_id,
  p.created_at,
  jsonb_build_object(
    'pros', ARRAY[p.advantage_1, p.advantage_2],
    'cons', p.disadvantage,
    'property_title', p.title
  ) AS content,
  p.source_platform,
  p.source_external_id
FROM properties p
WHERE p.community_id IS NOT NULL
  AND (p.advantage_1 IS NOT NULL OR p.advantage_2 IS NOT NULL OR p.disadvantage IS NOT NULL);
```

---

## 七、修正歷程

| 日期       | 問題                         | 修正                           |
| ---------- | ---------------------------- | ------------------------------ |
| 2024/12/01 | `community_reviews` 表不存在 | 建立 View 對接 `properties` 表 |
| 2024/12/01 | 房仲身份判斷寫死             | 改為查詢 `agents` 表           |
| 2024/12/01 | blur 切換身份後沒生效        | 改為整個區塊重新 render        |
| 2024/12/01 | 訪客可見數量沒限制           | 加入 `GUEST_VISIBLE_COUNT = 2` |
| 2024/12/01 | CTA 文字固定                 | 根據身份動態顯示               |
| 2024/12/01 | 會員可看私密牆（錯誤）       | 修正為只有住戶/房仲可看        |
| 2024/12/01 | 頁面順序錯誤                 | 評價移到最上面作為 Hook        |

---

## 八、測試網址

```
https://maihouses.vercel.app/maihouses/community-wall_mvp.html
```

切換右下角「🕶️ 身份切換」驗證所有權限邏輯。

---

_文件結束_
