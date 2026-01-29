# PropertyDetailPage 優化架構圖

## 🏗️ 整體架構

```
┌─────────────────────────────────────────────────────────────┐
│                   PropertyDetailPage                        │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Optimization Layer 1: useCallback          │   │
│  │                                                     │   │
│  │  • handleAgentLineClick     (stable)               │   │
│  │  • handleAgentCallClick     (stable)               │   │
│  │  • handleAgentBookingClick  (stable)               │   │
│  │  • handleFavoriteToggle     (stable)               │   │
│  │  • handleLineShare          (stable)               │   │
│  │  • handleMapClick           (stable)               │   │
│  │  • handlePhotoClick         (stable)               │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Optimization Layer 2: useMemo              │   │
│  │                                                     │   │
│  │  • agentId          (cached from localStorage)     │   │
│  │  • extractDistrict  (cached regex computation)     │   │
│  │  • capsuleTags      (cached buildKeyCapsuleTags)   │   │
│  │  • socialProof      (cached deterministic calc)    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Optimization Layer 3: React.memo           │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │         AgentTrustCard (memo)                │ │   │
│  │  │                                              │ │   │
│  │  │  Props:                                      │ │   │
│  │  │  • agent (object)                            │ │   │
│  │  │  • onLineClick (stable callback)             │ │   │
│  │  │  • onCallClick (stable callback)             │ │   │
│  │  │  • onBookingClick (stable callback)          │ │   │
│  │  │                                              │ │   │
│  │  │  Internal Optimization:                      │ │   │
│  │  │  • isOnline (useMemo)                        │ │   │
│  │  │  • agentMetrics (useMemo)                    │ │   │
│  │  │  • trustBreakdown (computed)                 │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │         PropertyInfoCard (memo)              │ │   │
│  │  │                                              │ │   │
│  │  │  Props:                                      │ │   │
│  │  │  • property (object)                         │ │   │
│  │  │  • isFavorite (boolean)                      │ │   │
│  │  │  • onFavoriteToggle (stable callback)        │ │   │
│  │  │  • onLineShare (stable callback)             │ │   │
│  │  │  • onMapClick (stable callback)              │ │   │
│  │  │  • capsuleTags (cached array)                │ │   │
│  │  │  • socialProof (cached object)               │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │         PropertyGallery (memo)               │ │   │
│  │  │                                              │ │   │
│  │  │  Props:                                      │ │   │
│  │  │  • images (array)                            │ │   │
│  │  │  • title (string)                            │ │   │
│  │  │  • onPhotoClick (stable callback)            │ │   │
│  │  │  • fallbackImage (string)                    │ │   │
│  │  │                                              │ │   │
│  │  │  Internal Optimization:                      │ │   │
│  │  │  • handleThumbnailClick (useCallback)        │ │   │
│  │  │  • handleImageError (useCallback)            │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │         MobileActionBar (memo)               │ │   │
│  │  │                                              │ │   │
│  │  │  Props:                                      │ │   │
│  │  │  • onLineClick (stable callback)             │ │   │
│  │  │  • onBookingClick (stable callback)          │ │   │
│  │  │  • socialProof (cached object)               │ │   │
│  │  │                                              │ │   │
│  │  │  No internal state - Pure component          │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 數據流向圖

### 1. AgentTrustCard 數據流

```
PropertyDetailPage
  │
  ├─ useMemo(() => agentId, [searchParams])
  │     └─> Cached: localStorage read only once
  │
  ├─ usePropertyTracker(id, agentId, district, handleGradeUpgrade)
  │     └─> Tracker instance (stable)
  │
  ├─ useCallback(() => handleAgentLineClick, [openContactModal])
  │     └─> Stable function reference
  │
  ├─ useCallback(() => handleAgentCallClick, [openContactModal])
  │     └─> Stable function reference
  │
  └─ useCallback(() => handleAgentBookingClick, [openContactModal])
        └─> Stable function reference
              │
              ↓
      ┌───────────────────────────────┐
      │   AgentTrustCard (memo)       │
      │                               │
      │   Re-renders only when:       │
      │   • agent object changes      │
      │   • callbacks change (never)  │
      └───────────────────────────────┘
```

---

### 2. PropertyInfoCard 數據流

```
PropertyDetailPage
  │
  ├─ useMemo(() => capsuleTags, [property.advantage1, ...])
  │     └─> Cached: buildKeyCapsuleTags computation
  │
  ├─ useMemo(() => socialProof, [property.publicId])
  │     └─> Cached: deterministic calculation
  │
  ├─ useCallback(() => handleFavoriteToggle, [])
  │     └─> Stable function reference
  │
  ├─ useCallback(() => handleLineShare, [propertyTracker])
  │     └─> Stable function reference
  │
  └─ useCallback(() => handleMapClick, [propertyTracker])
        └─> Stable function reference
              │
              ↓
      ┌───────────────────────────────┐
      │  PropertyInfoCard (memo)      │
      │                               │
      │   Re-renders only when:       │
      │   • property object changes   │
      │   • isFavorite changes        │
      │   • capsuleTags changes       │
      │   • socialProof changes       │
      └───────────────────────────────┘
```

---

### 3. PropertyGallery 數據流

```
PropertyDetailPage
  │
  └─ useCallback(() => handlePhotoClick, [propertyTracker])
        └─> Stable function reference
              │
              ↓
      ┌───────────────────────────────┐
      │   PropertyGallery (memo)      │
      │                               │
      │   Internal state:             │
      │   • currentImageIndex         │
      │                               │
      │   Internal optimization:      │
      │   • handleThumbnailClick      │
      │     (useCallback)             │
      │   • handleImageError          │
      │     (useCallback)             │
      │                               │
      │   Re-renders only when:       │
      │   • images array changes      │
      │   • title changes             │
      │   • fallbackImage changes     │
      │   • internal state changes    │
      └───────────────────────────────┘
```

---

## 🎯 useTrustActions Hook 架構

```
┌─────────────────────────────────────────────┐
│         useTrustActions Hook                │
│                                             │
│  Input:                                     │
│  • propertyId: string                       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Layer 1: useCallback                │   │
│  │                                      │   │
│  │  const learnMore = useCallback(     │   │
│  │    () => {                           │   │
│  │      logger.info(...)                │   │
│  │      window.open(...)                │   │
│  │    },                                │   │
│  │    [propertyId]                      │   │
│  │  );                                  │   │
│  │                                      │   │
│  │  const requestEnable = useCallback( │   │
│  │    () => {                           │   │
│  │      logger.info(...)                │   │
│  │      toast.success(...)              │   │
│  │    },                                │   │
│  │    [propertyId]                      │   │
│  │  );                                  │   │
│  └─────────────────────────────────────┘   │
│                 ↓                           │
│  ┌─────────────────────────────────────┐   │
│  │  Layer 2: useMemo                    │   │
│  │                                      │   │
│  │  return useMemo(                     │   │
│  │    () => ({                          │   │
│  │      learnMore,                      │   │
│  │      requestEnable                   │   │
│  │    }),                               │   │
│  │    [learnMore, requestEnable]        │   │
│  │  );                                  │   │
│  └─────────────────────────────────────┘   │
│                 ↓                           │
│  Output:                                    │
│  • { learnMore, requestEnable }             │
│    (Stable object reference)                │
└─────────────────────────────────────────────┘
```

**為什麼需要兩層優化？**

1. **Layer 1 (useCallback)**: 穩定函數引用
   - `learnMore` 函數引用穩定
   - `requestEnable` 函數引用穩定

2. **Layer 2 (useMemo)**: 穩定返回物件引用
   - 即使 `learnMore` 和 `requestEnable` 引用未變
   - 每次返回 `{ learnMore, requestEnable }` 都是新物件
   - 使用 `useMemo` 確保物件引用穩定

**效果**:
```typescript
// ❌ Without useMemo
const actions1 = useTrustActions('MH-100001');
const actions2 = useTrustActions('MH-100001');
actions1 !== actions2  // true (不同物件引用)

// ✅ With useMemo
const actions1 = useTrustActions('MH-100001');
const actions2 = useTrustActions('MH-100001');
actions1 === actions2  // true (相同物件引用)
```

---

## 📊 重新渲染決策樹

### AgentTrustCard 重新渲染決策

```
Parent Component Re-renders
         ↓
   Check Props Changes
         ↓
    ┌────┴────┐
    │         │
agent changed?  callbacks changed?
    │         │
   Yes       No (useCallback)
    │         │
    ↓         ↓
Re-render   Skip Re-render ✅
```

### PropertyInfoCard 重新渲染決策

```
Parent Component Re-renders
         ↓
   Check Props Changes
         ↓
    ┌────┴────┬────────┬────────┐
    │         │        │        │
property  isFavorite capsuleTags socialProof
changed?  changed?   changed?    changed?
    │         │        │          │
   Yes       Yes      No (useMemo) No (useMemo)
    │         │        │          │
    ↓         ↓        ↓          ↓
Re-render Re-render Skip Re-render ✅
```

### PropertyGallery 重新渲染決策

```
Parent Component Re-renders
         ↓
   Check Props Changes
         ↓
    ┌────┴────┬────────┬────────┐
    │         │        │        │
images    title   onPhotoClick fallbackImage
changed?  changed?  changed?    changed?
    │         │        │          │
   Yes       No      No (useCallback) No
    │         │        │          │
    ↓         ↓        ↓          ↓
Re-render  Skip Re-render ✅
```

---

## 🔍 優化效果比較

### 場景 1: 用戶點擊「收藏」按鈕

#### 未優化版本
```
User clicks Favorite
    ↓
PropertyDetailPage re-renders
    ↓
isFavorite state changes
    ↓
All callbacks re-created (new references)
    ↓
All child components re-render ❌
    • AgentTrustCard re-renders (unnecessary)
    • PropertyInfoCard re-renders (necessary)
    • PropertyGallery re-renders (unnecessary)
    • MobileActionBar re-renders (unnecessary)
    • PropertySpecs re-renders (unnecessary)
```

#### 優化後版本
```
User clicks Favorite
    ↓
PropertyDetailPage re-renders
    ↓
isFavorite state changes
    ↓
Callbacks remain stable (useCallback)
    ↓
Only PropertyInfoCard re-renders ✅
    • AgentTrustCard skips (memo + stable props)
    • PropertyInfoCard re-renders (isFavorite changed)
    • PropertyGallery skips (memo + stable props)
    • MobileActionBar skips (memo + stable props)
    • PropertySpecs skips (memo + stable props)
```

**節省渲染次數**: 4 個組件（80% 減少）

---

### 場景 2: 用戶切換圖片

#### 未優化版本
```
User clicks Thumbnail
    ↓
PropertyGallery internal state changes
    ↓
PropertyGallery re-renders
    ↓
Parent callbacks unchanged
    ↓
No unnecessary re-renders ✅
```

#### 優化後版本（內部優化）
```
User clicks Thumbnail
    ↓
handleThumbnailClick (useCallback) executes
    ↓
currentImageIndex state changes
    ↓
PropertyGallery re-renders
    ↓
handleThumbnailClick reference remains stable
    ↓
No child components inside Gallery re-render ✅
```

**額外優化**: 內部事件處理函數穩定

---

### 場景 3: property 資料更新

#### 未優化版本
```
property data fetched
    ↓
PropertyDetailPage re-renders
    ↓
capsuleTags re-calculated (expensive)
    ↓
socialProof re-calculated
    ↓
All callbacks re-created
    ↓
All child components re-render
```

#### 優化後版本
```
property data fetched
    ↓
PropertyDetailPage re-renders
    ↓
capsuleTags cached (useMemo checks dependencies)
    ↓
socialProof cached (useMemo checks dependencies)
    ↓
Callbacks remain stable (useCallback)
    ↓
Only components with changed props re-render ✅
```

**節省計算**: capsuleTags + socialProof 重複計算避免

---

## 📈 性能指標

### 渲染次數比較（典型用戶行為）

```
操作: 瀏覽頁面 → 點擊收藏 → 切換圖片 → 點擊聯絡

未優化版本:
PropertyDetailPage:    [█] [█] [█] [█]  (4 renders)
AgentTrustCard:        [█] [█] [█] [█]  (4 renders)
PropertyInfoCard:      [█] [█] [█] [█]  (4 renders)
PropertyGallery:       [█] [█] [█] [█]  (4 renders)
MobileActionBar:       [█] [█] [█] [█]  (4 renders)
Total:                 20 renders

優化後版本:
PropertyDetailPage:    [█] [█] [█] [█]  (4 renders)
AgentTrustCard:        [█] [ ] [ ] [ ]  (1 render) ⬇️ 75%
PropertyInfoCard:      [█] [█] [ ] [ ]  (2 renders) ⬇️ 50%
PropertyGallery:       [█] [ ] [█] [ ]  (2 renders) ⬇️ 50%
MobileActionBar:       [█] [ ] [ ] [ ]  (1 render) ⬇️ 75%
Total:                 10 renders ⬇️ 50%
```

---

## 🎓 最佳實踐總結

### 1. 何時使用 useCallback

```typescript
// ✅ 正確：傳遞給子組件的 callback
const handleClick = useCallback(() => {
  doSomething();
}, [deps]);

<ChildComponent onClick={handleClick} />

// ❌ 錯誤：不傳遞給子組件的 callback
const handleClick = useCallback(() => {
  doSomething();
}, [deps]);
// ... 沒有傳遞給任何子組件

// ❌ 錯誤：依賴陣列遺漏依賴
const handleClick = useCallback(() => {
  doSomething(value); // value 未在依賴陣列中
}, []);
```

---

### 2. 何時使用 useMemo

```typescript
// ✅ 正確：複雜計算
const expensiveResult = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ 正確：返回物件/陣列（避免引用改變）
const config = useMemo(() => ({
  key1: value1,
  key2: value2,
}), [value1, value2]);

// ❌ 錯誤：簡單計算
const sum = useMemo(() => a + b, [a, b]);
// 直接計算即可: const sum = a + b;

// ❌ 錯誤：過度優化
const name = useMemo(() => firstName + ' ' + lastName, [firstName, lastName]);
// 字串拼接很快，不需要 useMemo
```

---

### 3. 何時使用 React.memo

```typescript
// ✅ 正確：純函數組件 + 穩定 props
const PureComponent = memo(({ data, onClick }) => {
  return <div onClick={onClick}>{data}</div>;
});

// ✅ 正確：接收複雜 props 的組件
const ComplexComponent = memo(({ config, callbacks }) => {
  // ... complex rendering logic
});

// ❌ 錯誤：組件內部有不穩定 props
const UnstableComponent = memo(({ data }) => {
  const callback = () => {}; // 每次渲染都創建新函數
  return <Child onClick={callback} />;
});
// 應該使用 useCallback 穩定 callback

// ❌ 錯誤：父組件傳遞不穩定 props
<ChildComponent config={{ key: 'value' }} />
// 每次都是新物件引用，memo 失效
```

---

## ✅ 檢查清單

### PropertyDetailPage 父組件
- [x] 所有傳遞給子組件的 callbacks 使用 `useCallback`
- [x] 複雜計算（capsuleTags）使用 `useMemo`
- [x] I/O 操作（localStorage）使用 `useMemo` 快取
- [x] 確定性計算（socialProof）使用 `useMemo`
- [x] 依賴陣列精確定義

### AgentTrustCard 子組件
- [x] 使用 `React.memo` 包裝
- [x] 使用具名函數（便於 DevTools 除錯）
- [x] 內部計算（isOnline, agentMetrics）使用 `useMemo`
- [x] Props 接收穩定的 callbacks

### PropertyDetail 其他子組件
- [x] 所有子組件使用 `React.memo`
- [x] PropertyGallery 內部事件處理使用 `useCallback`
- [x] 組件職責單一，易於優化

### useTrustActions Hook
- [x] 內部函數使用 `useCallback`
- [x] 返回物件使用 `useMemo` 穩定引用
- [x] 依賴陣列正確

### 測試覆蓋
- [x] useCallback 穩定性測試
- [x] useMemo 快取效果測試
- [x] React.memo 組件測試
- [x] 父子組件協作測試
- [x] 多次渲染性能測試

---

**架構設計**: Claude Code
**最後更新**: 2026-01-29
