# 社區牆開發紀錄

> **最後更新**: 2025/12/02 13:22 (台北時間)  
> **狀態**: MVP 完成 + Layout 重構 + 配色修正 + 問答區邏輯修正

---

## 📁 檔案清單

| 檔案 | 用途 |
|------|------|
| `public/maihouses/community-wall_mvp.html` | 前端頁面 (796行) |
| `api/community/wall.ts` | API: 讀取資料 |
| `api/community/question.ts` | API: 問答功能 |
| `api/community/like.ts` | API: 按讚功能 |
| `supabase/migrations/20241201_community_wall.sql` | 資料庫 Schema |
| `src/hooks/usePropertyFormValidation.ts` | 表單驗證 Hook (新增+敏感詞) |
| `src/components/ui/Toast.tsx` | Toast 通知組件 (新增) |
| `src/components/ui/CommunityPicker.tsx` | 社區選擇器 (優化+AbortController) |
| `src/utils/contentCheck.ts` | 內容審核工具 (新增) |
| `src/services/communityService.ts` | 社區牆 API 封裝 (新增) |
| `src/hooks/useCommunityWall.ts` | 社區牆資料 Hook (新增) |

---

## 🔐 權限矩陣

| 功能 | 訪客 | 會員 | 住戶 | 房仲 |
|------|------|------|------|------|
| 評價 | 2則+blur | 全部 | 全部 | 全部 |
| 公開牆 | 2則+blur | 全部 | +發文 | +發物件 |
| 私密牆 | ❌鎖 | ❌鎖 | ✅+發文 | ✅唯讀 |
| 問答 | 看1答 | 可問 | 可答 | 專家答 |
| 按讚 | ❌ | ✅ | ✅ | ✅ |
| CTA | 註冊 | 驗證 | 隱藏 | 隱藏 |

---

## ✅ 已完成功能

1. **四角色權限系統**：訪客/會員/住戶/房仲，完整權限控制
2. **blur 遮罩**：用 body.role-xxx class 控制，切換身份不會壞
3. **評價區**：每個✅/⚖️=1則，訪客只看2則
4. **公開牆/私密牆**：Tab 切換，會員點私密牆彈驗證提示
5. **問答區**：訪客看1則回答，房仲回答顯示專家標章
6. **按讚功能**：liked_by[] + /api/community/like
7. **Mock 身份切換器**：右下角即時切換測試

---

## 🗄️ SQL (待執行)

```sql
-- 在 Supabase Dashboard 執行完整檔案：
-- supabase/migrations/20241201_community_wall.sql

-- 或單獨執行新增的部分：

-- 1. liked_by 欄位
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS liked_by UUID[] DEFAULT '{}';

-- 2. toggle_like 函數
CREATE OR REPLACE FUNCTION toggle_like(post_id UUID)
RETURNS JSON AS $$
DECLARE
  current_liked_by UUID[];
  new_liked_by UUID[];
  is_liked BOOLEAN;
BEGIN
  SELECT liked_by INTO current_liked_by FROM community_posts WHERE id = post_id;
  is_liked := auth.uid() = ANY(current_liked_by);
  IF is_liked THEN
    new_liked_by := array_remove(current_liked_by, auth.uid());
  ELSE
    new_liked_by := array_append(current_liked_by, auth.uid());
  END IF;
  UPDATE community_posts 
  SET liked_by = new_liked_by, likes_count = cardinality(new_liked_by)
  WHERE id = post_id;
  RETURN json_build_object('liked', NOT is_liked, 'likes_count', cardinality(new_liked_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. community_reviews View
DROP TABLE IF EXISTS community_reviews CASCADE;
DROP VIEW IF EXISTS community_reviews CASCADE;
CREATE VIEW community_reviews AS
SELECT 
  p.id, p.community_id, p.agent_id AS author_id, p.created_at,
  jsonb_build_object(
    'pros', ARRAY[p.advantage_1, p.advantage_2],
    'cons', p.disadvantage,
    'property_title', p.title
  ) AS content
FROM properties p
WHERE p.community_id IS NOT NULL
  AND (p.advantage_1 IS NOT NULL OR p.advantage_2 IS NOT NULL OR p.disadvantage IS NOT NULL);
```

---

## 🔧 修正紀錄

| 時間 | 問題 | 修正 |
|------|------|------|
| 12/01 | 建錯檔 `community-wall-v2.html` | 刪除，改用 `community-wall_mvp.html` |
| 12/01 | Mock切換沒效果 | 改為 `renderAll()` 完整重繪 |
| 12/01 | `community_reviews` 表不存在 | 建立 View 對接 properties |
| 12/01 | 房仲身份寫死 | 改查 `agents` 表 |
| 12/01 | 訪客可看私密牆 | 加入權限檢查 `canAccessPrivate` |
| 12/01 | View建立失敗(已存在Table) | 先 DROP TABLE 再建 View |
| 12/01 | 評價計數錯誤(2張卡=6則) | 改為每個✅/⚖️=1則 |
| 12/01 | blur切換身份後壞掉 | 改用 body.role-xxx class |
| 12/01 | API getPosts缺count | 加上 { count: 'exact' } |
| 12/01 | QA區blur沒控制到 | 改用 blur-overlay + blur-target |
| 12/01 | likes功能缺失 | 新增 liked_by[] + API |
| 12/01 | 錯別字（房仿→房仲） | 全站統一用詞 |
| 12/01 | 無載入動畫 | 新增 skeleton loading CSS |
| 12/01 | API 無快取 | 加入 Cache-Control header |
| 12/01 | SonarLint: feed-consumer.html | 多項修正（見下方） |

---

## 🔍 feed-consumer.html SonarLint 修正 (12/01)

| 警告 | 行號 | 修正方式 |
|------|------|----------|
| `maximum-scale=1` 限制縮放 | L5 | 移除 maximum-scale 限制 |
| 文字對比度不足 | L85 | `--muted` 從 #6c7b91 改為 #526070 |
| onclick 無鍵盤支援 | L218,289,417,418 | 添加 `onkeydown` + `tabindex`/`role` |
| forEach 不如 for...of | L428,436,534 | 改為 for...of 語法 |
| 認知複雜度過高 | L480 | 拆分 handler 為獨立函數 |
| 否定條件 if(!isPressed) | L488 | 改為正向判斷 if(isPressed)...else |

---

## 🧪 測試網址

```
https://maihouses.vercel.app/maihouses/community-wall_mvp.html
```

右下角 🕶️ 切換身份測試

---

## 📌 待處理

### 🎯 體驗與易用性
- [x] **問答區會員轉換漏斗**：遮罩加入「加入會員後可收到新回答通知」等利益點，A/B 測試 CTA 文案與色彩（品牌藍系）
- [x] **無回答問題誘因**：列表頂部加「待回答數量」摘要 ~~「搶先回答」增加徽章/積分回饋~~ (徽章系統暫緩)
- [ ] **雙欄布局資訊密度**：側欄加入「最新問答摘要」與「最高評價貼文」卡片
- [ ] **品牌一致性**：Toast、按鈕、骨架屏背景全面套用同一組 token

### 🛠️ 前端工程
- [ ] **資料快取策略**：改為 stale-while-revalidate，Hook 中顯示「更新中」狀態
- [ ] **樂觀更新回滾**：按讚/發文/回答失敗時恢復原狀、顯示錯誤 Toast、記錄錯誤碼
- [ ] **內容審核 UX**：顯示「被觸發的詞彙」，提供「申訴/檢舉」入口
- [ ] **圖片上傳併發調優**：依網速自適應（計算 RTT），加入指數退避重試策略
- [ ] **CommunityPicker 優化**：加 250-300ms 防抖、ARIA 狀態、無結果時提供「新增社區」動線

### 🔐 後端與資料安全
- [ ] **RLS 改進**：僅同社區成員可讀私密牆
- [ ] **移除 agentId 預設值**：由 API 以 session 驗證補全，避免偽造身份
- [ ] **私密牆驗證流程**：建立「驗證請求 → 住戶審核 → 系統授權」審批表 + community_members 表
- [ ] **toggle_like 強化**：加入 FOR UPDATE 鎖定防競態，返回值附帶 updated_at
- [ ] **日誌與稽核**：私密牆讀取/問答寫入加審計欄位（IP、UA hash、actor role），建立異常告警

### 📋 維運與開發流程
- [ ] **Dev Log 作業規範**：建立 lint/husky 檢查（相關檔案改動時必須更新 log）
- [ ] **權限矩陣追蹤**：加入版本號與測試用例連結，CI 中加入角色切換 E2E 驗證
- [ ] **性能監測**：Web Vitals、TTI/TTFB 監測，快取命中率低時自動降頻或加長 TTL

### 🗄️ 原有待處理
- [ ] 前端接真實 API（目前是 Mock 資料）
- [ ] 統一社區牆路由（成功頁→/community/{id}，詳情頁→/maihouses/...）
- [ ] 地址指紋計算移到後端 API（防止客端操控）

---

## 🚀 2025/12/02 前後端優化

### 1. 表單驗證 Hook (`usePropertyFormValidation`)
- 抽取驗證邏輯為獨立 Hook，便於單元測試與重用
- 即時顯示字數計算與錯誤訊息（取代 alert）
- 驗證規則：
  - 優點：至少 5 字
  - 公道話：至少 10 字
  - 圖片：至少 1 張，最大 10MB，僅 JPG/PNG/WebP
- **敏感詞檢測整合**：
  - 整合 `contentCheck.ts` 內容審核
  - 即時顯示內容警告（黃色：需注意；紅色：禁止送出）
  - 敏感詞會阻擋送出（`canSubmit = false`）
  - 廣告詞僅警告不阻擋

### 2. Toast 通知組件
- 替代所有 `alert()` 呼叫
- 支援 4 種類型：success / error / warning / info
- 錯誤訊息加入「重試」與「聯絡客服」按鈕
- 自動消失（success 3 秒，error 不消失需手動關閉）

### 3. 圖片上傳優化 (`propertyService.uploadImages`)
- 前端驗證：檔案類型 (MIME whitelist) + 大小限制 (10MB)
- 並發控制：預設 3 張同時上傳（可調整）
- 進度回報：`onProgress` callback
- 詳細錯誤：回傳失敗檔案列表，告知使用者哪些未上傳

### 4. CommunityPicker 優化
- 新增搜尋失敗提示（圖示 + 文字引導）
- Loading skeleton 動畫
- 「無社區」選項更清楚（透天/店面用）
- **AbortController 防止 Race Condition**：
  - 快速輸入時取消前次請求
  - 避免舊結果覆蓋新結果

### 5. 內容審核工具 (`contentCheck.ts`)
- 前端初步過濾敏感內容，後端仍需複審
- 敏感詞列表：辱罵類、詐騙類、不當內容
- 廣告詞列表：加LINE、限時優惠、折扣碼等
- 社區名稱黑名單：透天、店面、急售等非正式名稱
- 格式檢查：純地址、純數字等

### 6. PropertyUploadPage 整合
- 使用驗證 Hook + Toast 替代 alert
- 敏感詞警告區塊（紅色/黃色區塊）
- 各欄位獨立顯示內容警告

### 7. Community Wall API 封裝 (`communityService.ts`)
- 統一所有社區牆 API 請求
- 內建記憶體快取（posts 5分鐘、reviews 10分鐘）
- Auth token 自動附加
- 錯誤處理標準化
- 支援功能：
  - `getCommunityWall()` - 取得完整資料
  - `getPublicPosts()` / `getPrivatePosts()` - 分頁取得貼文
  - `createPost()` - 發布貼文
  - `toggleLike()` - 按讚
  - `askQuestion()` / `answerQuestion()` - 問答

### 8. Community Wall Hook (`useCommunityWall.ts`)
- SWR 風格的資料獲取
- 樂觀更新（按讚即時反映）
- 自動刷新（可設定間隔）
- 視窗聚焦時刷新
- 分頁載入 Hook (`useCommunityPosts`)

### 9. 安全性改進
- 待處理：agentId 預設值移除，改由後端判斷登入態

---

## 2025/12/02 - Layout 重構 + 配色修正

### 🎨 配色修正（重要）

**問題**：之前用了不屬於品牌的顏色（淺綠、橘色等）

**已移除**：
- `--secondary: #34c759` (綠)
- `#e8faef` / `#0e8d52` (淺綠/深綠)
- `#fff3e0` / `#e65100` (橘)
- `#fce4ec` / `#c2185b` (粉紅)

**統一配色（與 tailwind.config.cjs 一致）**：
```css
--brand: #00385a;        /* 深藍主色 */
--brand-light: #009FE8;  /* 亮藍 */
--brand-600: #004E7C;
--success: #0f6a23;      /* 只用於成功狀態 */
--bg-base: #f6f9ff;
--bg-alt: #eef3ff;
--border: #E6EDF7;
--text-primary: #0a2246;
```

### 🏗️ Header 重構
- 左：`← 返回` 按鈕
- 中：社區名稱 + 「社區牆」副標題
- 右：🔔通知 + 👤我的 下拉選單
- 與 Feed 頁面風格一致

### 🖥️ 桌機版雙欄 Layout
- 主內容 `max-width: 600px`
- 側邊欄 `width: 280px`（860px+ 顯示）
- 側邊欄卡片：
  - 📍 社區資訊
  - 📊 社區數據
  - 🔗 快速連結

### Badge 顏色
- 全部改藍色調：`#e6edf7`、`#e0f4ff`、`#f6f9ff`
- 文字：`#00385a`、`#004E7C`

---

## 📝 下次更新時

**每次改動社區牆相關代碼，更新這個檔案！**

---

## 2025/12/02 晚間 - Header 導航 + 問答區邏輯修正

### 🧭 Header 導航更新

**左側按鈕**：
- 原：`← 返回`
- 改：`← 我的動態` → 連結到 `/maihouses/feed.html`

**下拉選單項目**：
- 原：`回到動態`
- 改：`回到首頁` → 連結到 `/maihouses/`

### ❓ 問答區（準住戶問答）重大修正

**問題**：
1. 原本 blur 邏輯是在「回答層級」(每則回答分開 blur)
2. 用戶要求改成「問題層級」blur（前 2 題可見，其餘整題 blur）
3. 無回答的問題需要單獨顯示，鼓勵用戶回答

**修正後邏輯**：
```
┌─────────────────────────────────────┐
│  有回答的問題（前 2 題可見）          │
│  ├── 第 1 題：可見                   │
│  ├── 第 2 題：可見                   │
│  └── 第 3+ 題：blur + 遮罩           │
├─────────────────────────────────────┤
│  blur 遮罩（訪客專用）               │
│  「成為會員看更多問答」CTA            │
├─────────────────────────────────────┤
│  無回答的問題（不 blur，鼓勵回答）    │
│  ├── 特殊樣式：虛線邊框              │
│  ├── 背景：淺藍 #f6f9ff              │
│  └── CTA：「搶先回答」按鈕           │
└─────────────────────────────────────┘
```

**MOCK 資料更新**：
- 4 題問答（原 3 題）
- 第 1 題：2 則回答
- 第 2 題：1 則回答  
- 第 3 題：2 則回答
- 第 4 題：0 則回答（新增，測試無回答邏輯）

**`renderQuestions()` 函數重寫**：
- 分離「有回答」和「無回答」的問題
- 有回答問題套用 `GUEST_VISIBLE_COUNT = 2` 的 blur 邏輯
- 無回答問題獨立區塊渲染，永不 blur
- 無回答問題加入特殊樣式標識

### 🔧 修正紀錄（本次新增）

| 時間 | 問題 | 修正 |
|------|------|------|
| 12/02 | Header 左鍵「返回」不明確 | 改為「我的動態」連結到 feed |
| 12/02 | 下拉選單「回到動態」語意重複 | 改為「回到首頁」連結到 /maihouses/ |
| 12/02 | 問答 blur 在回答層級 | 改為問題層級 blur |
| 12/02 | 無回答問題也被 blur | 分離邏輯，無回答問題永不 blur |
| 12/02 | 無回答問題無 CTA | 新增「搶先回答」按鈕 |

### 📦 Commit 紀錄

```
8aeface - fix(社區牆): 問答區邏輯調整 - 有回答問題blur、無回答問題單獨顯示
```
