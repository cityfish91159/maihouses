# 社區牆開發紀錄

> **最後更新**: 2024/12/01 16:30  
> **狀態**: MVP 完成，待執行 SQL

---

## 📁 檔案清單

| 檔案 | 用途 |
|------|------|
| `public/maihouses/community-wall_mvp.html` | 前端頁面 (796行) |
| `api/community/wall.ts` | API: 讀取資料 |
| `api/community/question.ts` | API: 問答功能 |
| `api/community/like.ts` | API: 按讚功能 |
| `supabase/migrations/20241201_community_wall.sql` | 資料庫 Schema |

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

---

## 🧪 測試網址

```
https://maihouses.vercel.app/maihouses/community-wall_mvp.html
```

右下角 🕶️ 切換身份測試

---

## 📌 待處理

- [ ] 私密牆住戶驗證（需定義 community_members 表）
- [ ] RLS 改進（只有本社區成員可看私密牆）
- [ ] 前端接真實 API（目前是 Mock 資料）

---

## 📝 下次更新時

**每次改動社區牆相關代碼，更新這個檔案！**
