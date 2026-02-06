# React.memo 優化 Code Review Checklist

## 概述

此檢查清單用於確保 React.memo、useMemo 和 useCallback 的正確使用，避免過度優化或錯誤優化導致的效能問題。

---

## 1. React.memo 使用檢查清單

### ✅ 應該使用 memo 的情境

- [ ] **組件會被重複渲染**
  - 父組件頻繁更新狀態
  - 組件在列表中被多次渲染
  - 組件是高成本渲染（複雜計算、大量 DOM 節點）

- [ ] **props 相對穩定**
  - props 不會在每次父組件渲染時改變
  - props 是原始類型（string, number, boolean）
  - props 是穩定的引用（useCallback, useMemo 包裹的對象）

- [ ] **渲染成本高於 memo 比較成本**
  - 組件渲染時間 > 5ms
  - 組件包含複雜邏輯或大量子組件
  - 組件渲染依賴昂貴的計算

### ❌ 不應使用 memo 的情境

- [ ] **組件很少重新渲染**
  - 父組件狀態穩定
  - 組件只渲染一次

- [ ] **props 頻繁變更**
  - 每次父組件渲染時 props 都會改變
  - props 包含不穩定的引用（inline 函數、對象）

- [ ] **渲染成本低於 memo 成本**
  - 組件非常簡單（單一 div、純文字）
  - 沒有複雜計算或邏輯

### 範例

```typescript
// ✅ 正確：高成本組件 + 穩定 props
const ExpensiveChart = React.memo<ChartProps>(({ data, config }) => {
  // 複雜的圖表渲染邏輯
  return <canvas ref={canvasRef} />;
});

// ❌ 錯誤：簡單組件不需要 memo
const SimpleButton = React.memo<ButtonProps>(({ text }) => {
  return <button>{text}</button>;
});

// ❌ 錯誤：props 包含 inline 函數
<ExpensiveChart
  data={chartData}
  onClick={() => console.log('clicked')} // 每次都是新引用
/>

// ✅ 正確：使用 useCallback 穩定引用
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

<ExpensiveChart
  data={chartData}
  onClick={handleClick}
/>
```

---

## 2. useMemo 使用檢查清單

### ✅ 應該使用 useMemo 的情境

- [ ] **計算成本高於 useMemo overhead**
  - 大量數據的過濾、排序、映射
  - 複雜的數學運算
  - 深度對象比較或轉換

- [ ] **依賴陣列正確且穩定**
  - 依賴項明確且不會頻繁改變
  - 避免將對象或陣列直接放入依賴（除非已被 memo）

- [ ] **返回值會被作為 props 傳遞給 memo 組件**
  - 需要保持引用穩定性
  - 子組件使用 React.memo

### ❌ 不應使用 useMemo 的情境

- [ ] **計算成本低**
  - 簡單的字串拼接
  - 基本的數學運算
  - 訪問對象屬性

- [ ] **依賴陣列頻繁變化**
  - 依賴項在每次渲染時都會改變
  - memo 化失去意義

- [ ] **返回值不被其他優化依賴**
  - 值不會傳遞給 memo 組件
  - 沒有其他 useMemo/useCallback 依賴此值

### 範例

```typescript
// ✅ 正確：高成本計算
const sortedUsers = useMemo(() => {
  return users
    .filter(u => u.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// ❌ 錯誤：簡單計算不需要 memo
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`;
}, [firstName, lastName]);

// ✅ 正確：應該直接計算
const fullName = `${firstName} ${lastName}`;

// ❌ 錯誤：依賴陣列包含不穩定的對象
const processed = useMemo(() => {
  return processData(config); // config 是 inline 對象
}, [config]);

// ✅ 正確：先穩定依賴
const stableConfig = useMemo(() => config, [config.id, config.type]);
const processed = useMemo(() => {
  return processData(stableConfig);
}, [stableConfig]);
```

### 依賴陣列最佳實踐

- [ ] **避免將 callbacks 放入依賴**
  ```typescript
  // ❌ 錯誤
  const result = useMemo(() => {
    return calculateValue(data, onComplete);
  }, [data, onComplete]); // onComplete 會頻繁變化

  // ✅ 正確：使用 useCallback 穩定 onComplete
  const stableOnComplete = useCallback(onComplete, []);
  const result = useMemo(() => {
    return calculateValue(data, stableOnComplete);
  }, [data, stableOnComplete]);
  ```

- [ ] **避免直接依賴整個對象**
  ```typescript
  // ❌ 錯誤
  const filtered = useMemo(() => {
    return items.filter(item => item.category === filters.category);
  }, [items, filters]); // filters 對象引用可能頻繁變化

  // ✅ 正確：只依賴需要的屬性
  const filtered = useMemo(() => {
    return items.filter(item => item.category === filters.category);
  }, [items, filters.category]);
  ```

---

## 3. useCallback 使用檢查清單

### ✅ 應該使用 useCallback 的情境

- [ ] **函數會被傳遞給 memo 組件**
  - 子組件使用 React.memo
  - 需要保持引用穩定性

- [ ] **函數會被放入其他 Hook 的依賴陣列**
  - useEffect 依賴此函數
  - useMemo 依賴此函數

- [ ] **函數是 event handler 且子組件是 memo**
  ```typescript
  const handleClick = useCallback(() => {
    doSomething(id);
  }, [id]);

  return <MemoButton onClick={handleClick} />;
  ```

### ❌ 不應使用 useCallback 的情境

- [ ] **函數不會被傳遞給任何組件**
  - 只在組件內部使用
  - 沒有被放入依賴陣列

- [ ] **子組件沒有使用 memo**
  - useCallback 無法阻止重新渲染

### 範例

```typescript
// ✅ 正確：傳遞給 memo 組件
const MemoChild = React.memo(Child);

const Parent = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <MemoChild onClick={handleClick} />;
};

// ❌ 錯誤：子組件沒有 memo
const Parent = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <Child onClick={handleClick} />; // Child 沒有 memo，useCallback 無效
};

// ✅ 正確：用於 useEffect 依賴
const Parent = () => {
  const fetchData = useCallback(async () => {
    const data = await api.fetch();
    setData(data);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // 穩定的引用
};
```

---

## 4. 父子組件配合檢查清單

### ✅ 正確配合模式

- [ ] **父組件使用 useCallback，子組件使用 memo**
  ```typescript
  // 父組件
  const Parent = () => {
    const [count, setCount] = useState(0);

    const handleClick = useCallback(() => {
      console.log('clicked');
    }, []);

    return (
      <>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <MemoChild onClick={handleClick} />
      </>
    );
  };

  // 子組件
  const MemoChild = React.memo<ChildProps>(({ onClick }) => {
    return <button onClick={onClick}>Child Button</button>;
  });
  ```

- [ ] **父組件使用 useMemo 穩定對象 props**
  ```typescript
  const Parent = () => {
    const [count, setCount] = useState(0);

    const config = useMemo(() => ({
      theme: 'dark',
      size: 'large'
    }), []);

    return (
      <>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <MemoChild config={config} />
      </>
    );
  };
  ```

- [ ] **子組件 memo 比較函數正確**
  ```typescript
  // ✅ 正確：自訂比較函數
  const MemoChild = React.memo<ChildProps>(
    ({ data, onClick }) => {
      return <div onClick={onClick}>{data.name}</div>;
    },
    (prevProps, nextProps) => {
      // 只比較關鍵屬性
      return prevProps.data.id === nextProps.data.id;
    }
  );

  // ❌ 錯誤：比較邏輯錯誤
  const MemoChild = React.memo<ChildProps>(
    ({ data, onClick }) => {
      return <div onClick={onClick}>{data.name}</div>;
    },
    (prevProps, nextProps) => {
      // 錯誤：返回 true 表示相同，應該跳過渲染
      return prevProps.data !== nextProps.data; // 應該是 ===
    }
  );
  ```

### ❌ 錯誤配合模式

- [ ] **過度優化：所有組件都使用 memo**
  ```typescript
  // ❌ 錯誤：不必要的 memo
  const SimpleText = React.memo(({ text }: { text: string }) => {
    return <span>{text}</span>;
  });

  const AnotherSimple = React.memo(({ value }: { value: number }) => {
    return <div>{value}</div>;
  });
  ```

- [ ] **重複優化：父子都使用 memo 比較相同邏輯**
  ```typescript
  // ❌ 錯誤：重複比較
  const Parent = React.memo(
    ({ data }) => <Child data={data} />,
    (prev, next) => prev.data.id === next.data.id
  );

  const Child = React.memo(
    ({ data }) => <div>{data.name}</div>,
    (prev, next) => prev.data.id === next.data.id // 重複比較
  );
  ```

- [ ] **不穩定的 props 傳遞給 memo 組件**
  ```typescript
  // ❌ 錯誤
  const Parent = () => {
    return (
      <MemoChild
        config={{ theme: 'dark' }} // 每次都是新對象
        onClick={() => console.log('click')} // 每次都是新函數
      />
    );
  };
  ```

---

## 5. 效能測量檢查清單

### 優化前必須測量

- [ ] **使用 React DevTools Profiler**
  - 記錄組件渲染時間
  - 確認是否有效能瓶頸

- [ ] **使用 console.time 測量計算時間**
  ```typescript
  console.time('calculateValue');
  const result = calculateValue(data);
  console.timeEnd('calculateValue');
  ```

- [ ] **確認優化後的改善**
  - 比較優化前後的 Profiler 數據
  - 確保沒有引入新的問題

### 測量範例

```typescript
// ✅ 正確：先測量再優化
const Parent = () => {
  const [data, setData] = useState([]);

  // 測量計算時間
  console.time('processData');
  const processed = processData(data);
  console.timeEnd('processData');
  // 如果 > 16ms (1 frame)，考慮使用 useMemo

  return <Child data={processed} />;
};
```

---

## 6. 常見錯誤模式

### ❌ 錯誤 1：在 memo 組件中使用 inline 對象

```typescript
// ❌ 錯誤
const Parent = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <MemoChild
      onClick={handleClick}
      style={{ color: 'red' }} // inline 對象，memo 失效
    />
  );
};

// ✅ 正確
const Parent = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  const style = useMemo(() => ({ color: 'red' }), []);

  return (
    <MemoChild
      onClick={handleClick}
      style={style}
    />
  );
};
```

### ❌ 錯誤 2：useMemo 返回函數

```typescript
// ❌ 錯誤：應該使用 useCallback
const handleClick = useMemo(() => {
  return () => console.log('clicked');
}, []);

// ✅ 正確
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### ❌ 錯誤 3：依賴陣列缺失

```typescript
// ❌ 錯誤
const filtered = useMemo(() => {
  return items.filter(item => item.category === category);
}, []); // 缺少 items 和 category

// ✅ 正確
const filtered = useMemo(() => {
  return items.filter(item => item.category === category);
}, [items, category]);
```

### ❌ 錯誤 4：memo 比較函數邏輯錯誤

```typescript
// ❌ 錯誤：返回值邏輯相反
const MemoChild = React.memo(
  Child,
  (prev, next) => {
    // 返回 true 表示 props 相同，跳過渲染
    // 返回 false 表示 props 不同，需要渲染
    return prev.id !== next.id; // 錯誤！應該是 ===
  }
);

// ✅ 正確
const MemoChild = React.memo(
  Child,
  (prev, next) => {
    return prev.id === next.id; // 相同時返回 true
  }
);
```

---

## 7. Code Review 快速檢查

### PR Review 時的快速檢查清單

- [ ] 是否有新增的 `React.memo`？
  - 組件是否真的需要優化？
  - 父組件傳遞的 props 是否穩定？

- [ ] 是否有新增的 `useMemo`？
  - 計算是否真的昂貴？
  - 依賴陣列是否正確？

- [ ] 是否有新增的 `useCallback`？
  - 函數是否傳遞給 memo 組件？
  - 依賴陣列是否完整？

- [ ] 是否有 inline 對象或函數傳遞給 memo 組件？
  - 應該使用 useMemo 或 useCallback 穩定引用

- [ ] 是否有效能測量數據？
  - 優化前後的 Profiler 比較
  - 確認優化有實際效果

---

## 8. 最佳實踐總結

### 優化原則

1. **先測量，再優化** - 不要盲目優化
2. **從上到下優化** - 先優化父組件，再優化子組件
3. **保持一致性** - 如果使用 memo，確保所有 props 都穩定
4. **避免過度優化** - 簡單組件不需要 memo

### 優化順序

1. 使用 React DevTools Profiler 找出效能瓶頸
2. 確認是否為重複渲染問題
3. 為高成本組件添加 `React.memo`
4. 使用 `useCallback` 穩定傳遞給 memo 組件的函數
5. 使用 `useMemo` 穩定傳遞給 memo 組件的對象
6. 再次測量確認優化效果

### 參考資源

- [React.memo 官方文件](https://react.dev/reference/react/memo)
- [useMemo 官方文件](https://react.dev/reference/react/useMemo)
- [useCallback 官方文件](https://react.dev/reference/react/useCallback)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools#profiler)

---

## 附錄：本專案特定規範

### TypeScript 嚴格模式

本專案啟用以下 TypeScript 嚴格設定，影響 memo 使用：

- `exactOptionalPropertyTypes: true` - 可選屬性不等於 `undefined`
- `noUncheckedIndexedAccess: true` - 索引存取返回 `T | undefined`

### 範例

```typescript
// ✅ 正確：考慮 TypeScript 嚴格模式
interface Props {
  title: string;
  onClick?: () => void; // 不等於 undefined
}

const MemoComponent = React.memo<Props>(({ title, onClick }) => {
  // onClick 可能是 undefined，需要檢查
  const handleClick = () => {
    onClick?.(); // 使用可選鏈
  };

  return <button onClick={handleClick}>{title}</button>;
});
```

### 禁止使用的模式

根據 CLAUDE.md，以下模式在本專案中**嚴格禁止**：

- ❌ `any` 類型 - 包括 memo 比較函數
- ❌ `console.log` - 使用 `src/lib/logger.ts`
- ❌ `// @ts-ignore` - 必須修復類型錯誤

```typescript
// ❌ 禁止
const MemoChild = React.memo<any>((props: any) => { // 禁止 any
  console.log(props); // 禁止 console.log
  return <div>{props.text}</div>;
});

// ✅ 正確
import { logger } from '@/lib/logger';

interface ChildProps {
  text: string;
}

const MemoChild = React.memo<ChildProps>(({ text }) => {
  logger.debug('Child rendered', { text });
  return <div>{text}</div>;
});
```

---

## 版本歷史

- 2026-01-29: 初版建立
- 包含 React.memo、useMemo、useCallback 完整檢查清單
- 涵蓋常見錯誤模式和最佳實踐
- 整合本專案 TypeScript 嚴格模式規範
