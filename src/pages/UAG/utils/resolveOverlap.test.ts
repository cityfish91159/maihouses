import { describe, it, expect } from 'vitest';
import { resolveOverlap } from './resolveOverlap';

describe('resolveOverlap', () => {
  it('應該回傳空陣列當輸入為空', () => {
    const result = resolveOverlap([], 400, 300);
    expect(result).toEqual([]);
  });

  it('應該保持單一泡泡位置不變（無碰撞）', () => {
    const bubbles = [{ x: 100, y: 100, size: 60 }];
    const result = resolveOverlap(bubbles, 400, 300);

    expect(result).toHaveLength(1);
    expect(result[0]?.x).toBe(100);
    expect(result[0]?.y).toBe(100);
  });

  it('應該推開重疊的兩個泡泡', () => {
    // 兩個泡泡中心點距離 10px，但半徑和為 60px + 60px = 120px
    // 重疊 120 - 10 = 110px，加上 padding 4px 應該至少分開 124px
    const bubbles = [
      { x: 100, y: 100, size: 60 },
      { x: 110, y: 100, size: 60 }
    ];
    const result = resolveOverlap(bubbles, 400, 300, 4);

    const pos0 = result[0];
    const pos1 = result[1];
    if (!pos0 || !pos1) throw new Error('Missing positions');

    const dx = pos1.x - pos0.x;
    const dy = pos1.y - pos0.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 距離應該至少等於兩個半徑 + padding
    expect(distance).toBeGreaterThanOrEqual(60 + 4 - 0.1); // 容許浮點誤差
  });

  it('應該將超出左邊界的泡泡拉回範圍內', () => {
    const bubbles = [{ x: -10, y: 100, size: 60 }];
    const result = resolveOverlap(bubbles, 400, 300);

    // 泡泡半徑 30，最小 x 應為 30
    expect(result[0]?.x).toBeGreaterThanOrEqual(30);
  });

  it('應該將超出右邊界的泡泡拉回範圍內', () => {
    const bubbles = [{ x: 500, y: 100, size: 60 }];
    const result = resolveOverlap(bubbles, 400, 300);

    // 容器寬 400，泡泡半徑 30，最大 x 應為 370
    expect(result[0]?.x).toBeLessThanOrEqual(370);
  });

  it('應該將超出上邊界的泡泡拉回範圍內', () => {
    const bubbles = [{ x: 100, y: -10, size: 60 }];
    const result = resolveOverlap(bubbles, 400, 300);

    expect(result[0]?.y).toBeGreaterThanOrEqual(30);
  });

  it('應該將超出下邊界的泡泡拉回範圍內', () => {
    const bubbles = [{ x: 100, y: 400, size: 60 }];
    const result = resolveOverlap(bubbles, 400, 300);

    // 容器高 300，泡泡半徑 30，最大 y 應為 270
    expect(result[0]?.y).toBeLessThanOrEqual(270);
  });

  it('應該處理多個泡泡的複雜重疊', () => {
    // 三個泡泡擠在中心點附近
    const bubbles = [
      { x: 100, y: 100, size: 60 },
      { x: 105, y: 105, size: 60 },
      { x: 110, y: 100, size: 60 }
    ];
    const result = resolveOverlap(bubbles, 400, 300, 4);

    // 驗證每對泡泡之間的距離
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const posI = result[i];
        const posJ = result[j];
        if (!posI || !posJ) throw new Error('Missing position');

        const dx = posJ.x - posI.x;
        const dy = posJ.y - posI.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 每對泡泡的距離應該 >= 兩個半徑 + padding（容許些微誤差）
        expect(distance).toBeGreaterThanOrEqual(60 + 4 - 1);
      }
    }
  });

  it('應該處理不同尺寸的泡泡', () => {
    // S 級泡泡 (120px) 和 F 級泡泡 (60px)
    const bubbles = [
      { x: 100, y: 100, size: 120 },
      { x: 150, y: 100, size: 60 }
    ];
    const result = resolveOverlap(bubbles, 500, 400, 4);

    const pos0 = result[0];
    const pos1 = result[1];
    if (!pos0 || !pos1) throw new Error('Missing positions');

    const dx = pos1.x - pos0.x;
    const dy = pos1.y - pos0.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 距離應該 >= 60 (S半徑) + 30 (F半徑) + 4 (padding)
    expect(distance).toBeGreaterThanOrEqual(94 - 0.1);
  });

  it('應該在手機尺寸容器正確運作（320x568）', () => {
    // 模擬 iPhone SE 尺寸
    const bubbles = [
      { x: 80, y: 100, size: 72 }, // S 級手機尺寸
      { x: 120, y: 100, size: 60 }, // A 級手機尺寸
      { x: 160, y: 100, size: 54 }  // B 級手機尺寸
    ];
    const result = resolveOverlap(bubbles, 320, 568, 4);

    // 所有泡泡應該在容器範圍內
    result.forEach((pos, i) => {
      const bubble = bubbles[i];
      if (!pos || !bubble) throw new Error('Missing data');
      const radius = bubble.size / 2;
      expect(pos.x).toBeGreaterThanOrEqual(radius);
      expect(pos.x).toBeLessThanOrEqual(320 - radius);
      expect(pos.y).toBeGreaterThanOrEqual(radius);
      expect(pos.y).toBeLessThanOrEqual(568 - radius);
    });
  });

  it('應該在多次迭代後收斂到穩定狀態', () => {
    const bubbles = [
      { x: 100, y: 100, size: 60 },
      { x: 100, y: 100, size: 60 }, // 完全重疊
      { x: 100, y: 100, size: 60 }
    ];
    const result1 = resolveOverlap(bubbles, 400, 300, 4);
    const result2 = resolveOverlap(
      result1.map((pos, i) => {
        const bubble = bubbles[i];
        if (!bubble) throw new Error('Missing bubble');
        return { ...pos, size: bubble.size };
      }),
      400,
      300,
      4
    );

    // 第二次執行應該幾乎沒有變化（已收斂）
    result1.forEach((pos, i) => {
      const pos2 = result2[i];
      if (!pos2) throw new Error('Missing position');
      expect(Math.abs(pos.x - pos2.x)).toBeLessThan(1);
      expect(Math.abs(pos.y - pos2.y)).toBeLessThan(1);
    });
  });
});
