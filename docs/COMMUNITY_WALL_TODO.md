# 🖼️ P8: 圖片上傳與互動功能升級

> **專案狀態**: 🔵 規劃中
> **最後更新**: 2025-12-14
> **審計等級**: Google L7+ (嚴格安全與架構標準)

---

## 📋 專案目標

為 **Consumer (消費者)** 與 **Agent (房仲)** 雙頁面實現完整的圖片上傳與互動功能：

1. **圖片上傳**: 在發文框 (`InlineComposer`) 增加圖片選擇預覽功能
2. **互動完善**: 確保點讚與留言功能即時反映在 UI 上 (Optimistic UI)
3. **雙模式相容**: Mock / API 模式自動切換資料處理方式

---

## 🏗️ 現狀分析 (Google 首席處長評估)

### ✅ 已完成的基礎

| 組件 | 狀態 | 說明 |
|------|------|------|
| `FeedPostCard.tsx` | ✅ | 已支援圖片顯示 (`post.images.map`) |
| `useFeedData.ts` | ⚠️ | 資料結構支援 `images[]`，但 `createPost` 不傳圖片 |
| `CommentList.tsx` | ✅ | 已支援留言列表顯示 |
| `CommentInput.tsx` | ✅ | 已支援留言輸入 |

### ❌ 缺失的功能

| 組件 | 問題 | 優先級 |
|------|------|--------|
| `InlineComposer.tsx` | 無圖片選擇/預覽功能 | 🔴 P0 |
| `uploadService.ts` | **不存在** - 需新建 | 🔴 P0 |
| `useFeedData.createPost` | 不接收 `images` 參數 | 🔴 P0 |
| `useConsumer/useAgentFeed` | 無圖片處理邏輯 | 🟠 P1 |

---

## 🌟 架構師建議 (優化方案)

### 1. 圖片處理策略 - 雙軌制

```
┌─────────────────────────────────────────────────────────┐
│                    InlineComposer                        │
│  ┌─────────────┐   選擇圖片   ┌─────────────┐           │
│  │ File Input  │ ──────────▶ │ File[] 狀態 │           │
│  └─────────────┘              └─────────────┘           │
│                                     │                    │
│                                     ▼                    │
│                        ┌────────────────────┐           │
│                        │ onSubmit(content,  │           │
│                        │   images: File[])  │           │
│                        └────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│              useConsumer / useAgentFeed                  │
│                                                          │
│   if (useMock) {                                        │
│     // Blob URL - 純前端，不需後端                        │
│     imageUrls = files.map(f => URL.createObjectURL(f))  │
│   } else {                                               │
│     // 真實上傳 - 需要 uploadService                     │
│     imageUrls = await uploadService.uploadFiles(files)  │
│   }                                                      │
│                                                          │
│   createPost(content, communityId, imageUrls)           │
└─────────────────────────────────────────────────────────┘
```

**效益**：
- Mock 模式零延遲，開發體驗極佳
- API 模式可漸進式接入，不阻塞前端開發
- 同一套邏輯，切換一個 flag 即可

### 2. 類型安全 - 嚴格 Props 定義

**引導意見**：

```typescript
// ❌ 錯誤：any 或 loose typing
onSubmit: (content: string, images: any) => void;

// ✅ 正確：明確 File[] 型別
onSubmit: (content: string, images: File[]) => Promise<void>;
```

### 3. 記憶體管理 - Blob URL 清理

**引導意見**：

```typescript
// ❌ 錯誤：只創建不清理 → 記憶體洩漏
const urls = files.map(f => URL.createObjectURL(f));

// ✅ 正確：組件卸載時清理
useEffect(() => {
  return () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  };
}, [previewUrls]);
```

### 4. 圖片驗證 - 前置檢查

**引導意見**：

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILES = 4;

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '僅支援 JPG/PNG/WebP 格式' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '圖片大小不得超過 5MB' };
  }
  return { valid: true };
}
```

---

## 📅 P8 執行清單

### 🔴 階段 1: UI 組件升級 (共用組件)

#### P8-1: 升級 InlineComposer.tsx

**目標**：加入圖片選擇與預覽功能

**檔案**：`src/components/Feed/InlineComposer.tsx`

**修改清單**：
- [ ] 新增 `useState<File[]>` 管理選中的圖片
- [ ] 新增 `useRef<HTMLInputElement>` 控制隱藏的 file input
- [ ] 新增圖片預覽區塊 (縮圖 + 刪除按鈕)
- [ ] 修改 `onSubmit` Props 為 `(content: string, images: File[]) => Promise<void>`
- [ ] 新增 `ImageIcon` 按鈕 (使用 lucide-react)
- [ ] 實作 `handleFileSelect` 處理多選圖片
- [ ] 實作 `removeImage(index)` 移除指定圖片
- [ ] 清空狀態時同時清空 `images`
- [ ] 實作 `useEffect` 清理 Blob URL (記憶體管理)

**驗收條件**：
```
✅ 點擊圖片按鈕可選擇多張圖片
✅ 選中後顯示縮圖預覽
✅ 可點擊 X 移除單張圖片
✅ 發布後圖片狀態清空
✅ 組件卸載時 Blob URL 被清理
```

**引導意見**：

```
結構建議：
1. 在 textarea 下方新增「圖片預覽區」
2. 在「發布按鈕」左側新增「圖片選擇按鈕」
3. file input 設為 hidden，透過 ref.click() 觸發

樣式建議：
- 預覽區使用 flex gap-2 overflow-x-auto
- 縮圖 size-16 rounded-lg object-cover
- 刪除按鈕 absolute -right-1 -top-1

Icon 建議：
- import { Image as ImageIcon, X } from 'lucide-react';
```

---

#### P8-2: 確認 FeedPostCard.tsx

**目標**：確保圖片與留言顯示正常

**檔案**：`src/components/Feed/FeedPostCard.tsx`

**檢查清單**：
- [ ] 確認 `post.images` 渲染邏輯正確
- [ ] 確認 `onComment` prop 正確傳遞
- [ ] 確認 `CommentList` 正確顯示 `post.commentList`

**現狀**：✅ 已完成，無需大改

---

### 🟠 階段 2: 核心 Hook 邏輯重構

#### P8-3: 擴充 useFeedData.ts

**目標**：讓 `createPost` 支援圖片 URL

**檔案**：`src/hooks/useFeedData.ts`

**修改清單**：
- [ ] 修改 `createPost` 簽名：`(content, communityId, images?: string[])`
- [ ] Mock 模式：將 `images` 直接存入新貼文物件
- [ ] API 模式：將 `images` 傳給後端 API

**引導意見**：

```
目前 createPost 簽名 (約在 L400+)：
createPost(content: string, communityId?: string)

改為：
createPost(content: string, communityId?: string, images?: string[])

Mock 模式修改 (約在 L410+)：
找到 newPost 物件創建處，加入：
images: images?.map(src => ({ src, alt: '用戶上傳' })) || []

注意：useFeedData 接收的是 URL 字串陣列 (string[])
      而非 File 物件 - 上傳邏輯在上層 Hook 處理
```

---

#### P8-4: 修改 useConsumer.ts

**目標**：處理圖片上傳邏輯

**檔案**：`src/pages/Feed/useConsumer.ts`

**修改清單**：
- [ ] 修改 `handleCreatePost` 接收 `images: File[]`
- [ ] Mock 模式：使用 `URL.createObjectURL` 產生預覽 URL
- [ ] API 模式：呼叫 `uploadService.uploadFiles` 上傳
- [ ] 將 URL 陣列傳給 `createPost`

**引導意見**：

```
找到 handleCreatePost callback (約在 L100+)

現狀：
const handleCreatePost = useCallback(async (content: string) => {
  ...
  await createPost(content, userProfile?.communityId);
}, [...]);

改為：
const handleCreatePost = useCallback(async (content: string, images: File[]) => {
  let imageUrls: string[] = [];
  
  if (images.length > 0) {
    if (useMock) {
      imageUrls = images.map(file => URL.createObjectURL(file));
    } else {
      imageUrls = await uploadService.uploadFiles(images);
    }
  }
  
  await createPost(content, userProfile?.communityId, imageUrls);
}, [createPost, useMock, userProfile?.communityId]);
```

---

#### P8-5: 修改 useAgentFeed.ts (Agent 頁面)

**目標**：與 Consumer 同步，支援圖片上傳

**檔案**：`src/pages/Feed/useAgentFeed.ts` (或類似名稱)

**修改清單**：
- [ ] 同 P8-4 邏輯
- [ ] 確保 Mock/API 模式切換正常

---

### 🟡 階段 3: 服務層實作

#### P8-6: 新建 uploadService.ts

**目標**：封裝圖片上傳邏輯

**檔案**：`src/services/uploadService.ts` (新檔案)

**實作清單**：
- [ ] `uploadFile(file: File): Promise<string>` - 單檔上傳
- [ ] `uploadFiles(files: File[]): Promise<string[]>` - 多檔上傳
- [ ] 整合 Supabase Storage 或其他後端

**引導意見**：

```typescript
// src/services/uploadService.ts

import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'post-images';

export const uploadService = {
  async uploadFile(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  },

  async uploadFiles(files: File[]): Promise<string[]> {
    return Promise.all(files.map(f => this.uploadFile(f)));
  }
};
```

---

#### P8-7: Mock 留言即時更新

**目標**：確保 Mock 模式下留言立即顯示

**檔案**：`src/hooks/useFeedData.ts`

**檢查清單**：
- [ ] 確認 `handleComment` 在 Mock 模式下更新本地 state
- [ ] 確認新增留言會 push 到 `post.commentList`
- [ ] 確認 `post.comments` 數字同步 +1

**引導意見**：

```
找到 handleComment 或 addComment 函數

Mock 模式應該：
1. 找到對應 postId 的 post
2. 將新留言 push 到 commentList
3. comments 數字 +1
4. 使用 setData 更新 state

範例結構：
setData(prev => ({
  ...prev,
  posts: prev.posts.map(post => {
    if (post.id === postId) {
      return {
        ...post,
        comments: (post.comments || 0) + 1,
        commentList: [
          ...(post.commentList || []),
          { id: `c-${Date.now()}`, author: userName, content, time: new Date().toISOString() }
        ]
      };
    }
    return post;
  })
}));
```

---

### 🟢 階段 4: 常數與類型定義

#### P8-8: 新增圖片相關常數

**檔案**：`src/constants/upload.ts` (新檔案)

**內容**：
```typescript
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 4,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

export const UPLOAD_STRINGS = {
  ERROR_FILE_TOO_LARGE: '圖片大小不得超過 5MB',
  ERROR_INVALID_TYPE: '僅支援 JPG/PNG/WebP 格式',
  ERROR_TOO_MANY_FILES: '最多只能上傳 4 張圖片',
  ERROR_UPLOAD_FAILED: '圖片上傳失敗，請稍後再試',
} as const;
```

---

## 🧪 驗收流程

### 測試 1: Consumer 頁面 (Mock 模式)

```
1. 進入 Consumer 頁面
2. 點擊圖片按鈕，選擇 2 張圖片
3. 確認預覽區顯示縮圖
4. 輸入文字，點擊發布

✅ 預期：列表頂部立即出現新貼文，包含文字與 2 張圖片
```

### 測試 2: 互動功能

```
1. 對剛發布的貼文點讚
   ✅ 預期：愛心變紅，數字 +1

2. 點擊留言圖示 → 展開留言區 → 輸入留言 → 送出
   ✅ 預期：留言區下方立即出現新留言
```

### 測試 3: Agent 頁面

```
1. 切換至 Agent 頁面
2. 重複測試 1 & 2 的動作
   ✅ 預期：功能一致
```

### 測試 4: API 模式 (可選)

```
1. 關閉 Mock Toggle
2. 發文並上傳圖片
   ✅ 預期：Network Tab 有 POST 請求發送 FormData
```

---

## 📊 工時估算

| 階段 | 任務 | 預估工時 |
|------|------|----------|
| 階段 1 | P8-1 InlineComposer 升級 | 2h |
| 階段 1 | P8-2 FeedPostCard 確認 | 0.5h |
| 階段 2 | P8-3 useFeedData 擴充 | 1h |
| 階段 2 | P8-4 useConsumer 修改 | 1h |
| 階段 2 | P8-5 useAgentFeed 修改 | 1h |
| 階段 3 | P8-6 uploadService 新建 | 1.5h |
| 階段 3 | P8-7 Mock 留言更新 | 1h |
| 階段 4 | P8-8 常數定義 | 0.5h |
| - | 測試與修 bug | 2h |
| **總計** | | **~10.5h** |

---

## 🔒 安全考量

1. **檔案類型驗證**：前端 + 後端雙重驗證 MIME type
2. **檔案大小限制**：前端阻擋 > 5MB，後端也設 limit
3. **檔名消毒**：後端儲存時使用 UUID，不保留原始檔名
4. **XSS 防護**：圖片 URL 不從用戶輸入直接渲染

---

## 📝 變更紀錄

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2025-12-14 | P8-INIT | 初始化工單，定義圖片上傳與互動功能升級計畫 |
