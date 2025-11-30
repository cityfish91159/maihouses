# 社區鄰居管家 - 社區牆整合文件

> 📅 最後更新：2024/11/30
> ⚠️ 目前狀態：**MOCK 模式**

---

## 📋 功能概述

社區鄰居管家（邁邁）在偵測到用戶需求後，會推薦相關的社區牆讓用戶去研究評價，而不是直接推薦物件。

### 對話流程

```
用戶提需求（噪音/學區/通勤等）
        ↓
AI 同理回應 + 橋接話術
        ↓
AI 輸出社區牆標記：[[社區牆:社區名稱:討論話題]]
        ↓
系統自動渲染社區牆卡片
        ↓
用戶點擊卡片 → 跳轉社區牆頁面研究評價
```

---

## 📁 相關檔案

| 檔案 | 功能 | 狀態 |
|------|------|------|
| `src/features/home/components/CommunityWallCard.tsx` | 社區牆卡片 UI | ⚠️ MOCK |
| `src/features/home/components/ChatMessage.tsx` | 解析社區牆標記 | ✅ 完成 |
| `src/constants/maimai-persona.ts` | AI Prompt 設定 | ✅ 完成 |
| `src/services/ai.ts` | AI 服務層 | ✅ 完成 |

---

## 🔧 技術細節

### 1. AI 標記格式

AI 在回覆中使用以下格式來觸發社區牆卡片：

```
[[社區牆:社區名稱:討論話題]]
```

**範例：**
```
遇到吵的鄰居真的很崩潰... 說到這個，有個社區的住戶在討論這個話題，蠻真實的，你可以先去看看他們怎麼說～
[[社區牆:景安和院:住戶噪音經驗分享]]
```

### 2. 標記解析邏輯

`ChatMessage.tsx` 中的 `parseCommunityWallTags` 函數：

```typescript
function parseCommunityWallTags(content: string) {
    const regex = /\[\[社區牆:([^:]+):([^\]]+)\]\]/g;
    const cards: { name: string; topic: string }[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        cards.push({
            name: match[1].trim(),
            topic: match[2].trim()
        });
    }
    
    const text = content.replace(regex, '').trim();
    return { text, cards };
}
```

### 3. MOCK 資料

`CommunityWallCard.tsx` 中的假資料：

```typescript
const MOCK_COMMUNITY_DATA = {
  '快樂花園': { reviewCount: 28, rating: 4.3 },
  '遠雄二代宅': { reviewCount: 45, rating: 4.1 },
  '美河市': { reviewCount: 67, rating: 3.9 },
  '景安和院': { reviewCount: 19, rating: 4.5 },
  '松濤苑': { reviewCount: 32, rating: 4.2 },
  '華固名邸': { reviewCount: 24, rating: 4.4 },
  'default': { reviewCount: 12, rating: 4.2 }
};
```

---

## 🚀 TODO：接入真實社區牆

### Step 1：建立社區牆 API

```typescript
// api/community-wall/[id].ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase
    .from('communities')
    .select(`
      id,
      name,
      score,
      review_count,
      story_vibe,
      two_good,
      one_fair
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    return res.status(404).json({ error: '找不到此社區' });
  }
  
  return res.status(200).json({ success: true, data });
}
```

### Step 2：修改卡片元件

```typescript
// CommunityWallCard.tsx 改動

type CommunityWallCardProps = {
  communityId: string;  // 改用 ID
  topic?: string;
};

export default function CommunityWallCard({ communityId, topic }: CommunityWallCardProps) {
  const [community, setCommunity] = useState(null);
  
  useEffect(() => {
    fetch(`/api/community-wall/${communityId}`)
      .then(res => res.json())
      .then(data => setCommunity(data.data));
  }, [communityId]);
  
  // 動態連結
  const communityWallUrl = `/maihouses/community-wall.html?id=${communityId}`;
  
  // ... 渲染
}
```

### Step 3：修改 AI 標記格式

```
// 從
[[社區牆:社區名稱:討論話題]]

// 改為
[[社區牆:community_id:討論話題]]
```

### Step 4：更新 Prompt

在 `maimai-persona.ts` 中更新社區牆標記說明，改用 ID。

---

## 📊 資料庫 Schema

社區牆相關資料表（參考 `supabase/migrations/20241130_community_story_schema.sql`）：

```sql
-- communities 表新增欄位
ALTER TABLE communities ADD COLUMN IF NOT EXISTS story_vibe TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS two_good TEXT[];
ALTER TABLE communities ADD COLUMN IF NOT EXISTS one_fair TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS resident_quote TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS best_for TEXT[];
ALTER TABLE communities ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[];
```

---

## 🎯 驗收標準

接入真實社區牆後需達成：

- [ ] 卡片顯示真實的社區名稱
- [ ] 卡片顯示真實的評價數量
- [ ] 卡片顯示真實的平均評分
- [ ] 點擊卡片跳轉到正確的社區牆頁面
- [ ] 社區牆頁面能根據 ID 顯示對應內容

---

## 📞 聯絡

如有問題請聯繫 Mike
