# 社區牆開發紀錄

> **最後更新**: 2024/12/01  
> **狀態**: MVP 完成，待執行 SQL

---

## 📁 檔案清單

| 檔案 | 用途 |
|------|------|
| `public/maihouses/community-wall_mvp.html` | 前端頁面 (761行) |
| `api/community/wall.ts` | API: 讀取資料 |
| `api/community/question.ts` | API: 問答功能 |
| `supabase/migrations/20241201_community_wall.sql` | 資料庫 Schema |

---

## 🔐 權限矩陣

| 功能 | 訪客 | 會員 | 住戶 | 房仿 |
|------|------|------|------|------|
| 評價 | 2則+blur | 全部 | 全部 | 全部 |
| 公開牆 | 2則+blur | 全部 | +發文 | +發物件 |
| 私密牆 | ❌鎖 | ❌鎖 | ✅+發文 | ✅唯讀 |
| 問答 | 看1答 | 可問 | 可答 | 專家答 |
| CTA | 註冊 | 驗證 | 隱藏 | 隱藏 |

---

## 🗄️ SQL (待執行)

```sql
-- 在 Supabase Dashboard 執行：

-- 1. 刪除舊的 community_reviews（如果是 Table）
DROP TABLE IF EXISTS community_reviews CASCADE;
DROP VIEW IF EXISTS community_reviews CASCADE;

-- 2. 建立 View
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

完整 SQL 在: `supabase/migrations/20241201_community_wall.sql`

---

## 🔧 修正紀錄

| 時間 | 問題 | 修正 |
|------|------|------|
| 12/01 | 建錯檔 `community-wall-v2.html` | 刪除，改用 `community-wall_mvp.html` |
| 12/01 | Mock切換沒效果 | 改為 `renderAll()` 完整重繪 |
| 12/01 | `community_reviews` 表不存在 | 建立 View 對接 properties |
| 12/01 | 房仿身份寫死 | 改查 `agents` 表 |
| 12/01 | 訪客可看私密牆 | 加入權限檢查 |
| 12/01 | View建立失敗(已存在Table) | 先 DROP TABLE 再建 View |
| 12/01 | 評價計數錯誤(2張卡=6則) | 改為每個✅/⚖️=1則，訪客只看2則 |
| 12/01 | blur切換身份後壞掉 | 改用 body.role-xxx class，CSS統一控制 |
| 12/01 | API getPosts缺count | 加上 { count: 'exact' } |
| 12/01 | QA區blur沒控制到 | 改用 blur-overlay + blur-target 統一 |

---

## 🧪 測試網址

```
https://maihouses.vercel.app/maihouses/community-wall_mvp.html
```

右下角 🕶️ 切換身份測試

---

## 📝 下次更新時

**每次改動社區牆相關代碼，更新這個檔案！**
