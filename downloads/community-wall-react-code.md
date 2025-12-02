# 社區牆 React 版 - 完整代碼

> 下載後可刪除此檔案

---

## 1. 前端組件 `src/pages/Community/Wall.tsx`

請直接從 repo 複製：
```
/workspaces/maihouses/src/pages/Community/Wall.tsx
```

---

## 2. Hook `src/hooks/useCommunityWall.ts`

請直接從 repo 複製：
```
/workspaces/maihouses/src/hooks/useCommunityWall.ts
```

---

## 3. Service `src/services/communityService.ts`

請直接從 repo 複製：
```
/workspaces/maihouses/src/services/communityService.ts
```

---

## 4. CSS 變數 (加入 src/index.css)

```css
:root {
  --brand: #00385a;
  --brand-light: #009FE8;
  --brand-600: #004E7C;
  --primary: #00385a;
  --primary-dark: #002a44;
  --primary-light: #005282;
  --text-primary: #0a2246;
  --text-secondary: #526070;
  --text-muted: #6C7B91;
  --bg-base: #f6f9ff;
  --bg-alt: #eef3ff;
  --bg-elevated: #ffffff;
  --success: #0f6a23;
  --border: #E6EDF7;
  --border-light: #e8f0f8;
  --line: #e6edf7;
}
```

---

## 5. 路由設定 (App.tsx)

```tsx
import Wall from './pages/Community/Wall'

// 在 Routes 內加入：
<Route
  path="/community/:id/wall"
  element={
    <ErrorBoundary>
      <Wall />
    </ErrorBoundary>
  }
/>
```

---

## 6. 網址

| 類型 | 網址 |
|------|------|
| 首頁 | `https://maihouses.vercel.app/maihouses/` |
| React 社區牆 | `https://maihouses.vercel.app/maihouses/community/{uuid}/wall` |

---

## 7. 設計概念

### 權限系統
- 訪客：看 2 則 + blur 遮罩 + 註冊 CTA
- 會員：看全部 + 可發問 + 驗證 CTA
- 住戶：全功能 + 私密牆
- 房仲：全功能 + 專家標章

### Mock 切換
- 左下角按鈕切換 Mock / API 資料
- 右下角按鈕切換身份

### 組件結構
```
Wall.tsx
├── Topbar          頂部導航
├── ReviewsSection  評價區
├── PostsSection    貼文區（公開/私密 Tab）
├── QASection       問答區
├── Sidebar         側邊欄
├── BottomCTA       底部 CTA
├── MockToggle      Mock 切換
└── RoleSwitcher    身份切換
```
