import { describe, expect, it } from 'vitest';
import { buildKeyCapsuleTags, formatArea, formatLayout, formatFloor } from '../keyCapsules';

describe('formatArea', () => {
  it('應正確格式化坪數', () => {
    expect(formatArea(34.2)).toBe('34.2 坪');
    expect(formatArea(20)).toBe('20.0 坪');
    expect(formatArea(0)).toBe(null);
    expect(formatArea(-1)).toBe(null);
    expect(formatArea(null)).toBe(null);
  });
});

describe('formatLayout', () => {
  it('應正確格式化格局', () => {
    expect(formatLayout(3, 2)).toBe('3 房 2 廳');
    expect(formatLayout(2, 0)).toBe('2 房');
    expect(formatLayout(2, null)).toBe('2 房');
    expect(formatLayout(0, 2)).toBe(null);
    expect(formatLayout(null, null)).toBe(null);
  });
});

describe('formatFloor', () => {
  it('應正確格式化樓層並使用繁中單位', () => {
    expect(formatFloor('12', 15)).toBe('12 樓 / 15 層');
    expect(formatFloor('頂樓', 20)).toBe('頂樓 / 20 層');
    expect(formatFloor('5', null)).toBe('5 樓');
    expect(formatFloor(null, 10)).toBe(null);
    expect(formatFloor('  ', 10)).toBe(null);
  });
});

describe('buildKeyCapsuleTags', () => {
  it('優先使用 advantage1/2 作為 highlights', () => {
    const tags = buildKeyCapsuleTags({
      advantage1: '近捷運',
      advantage2: '有車位',
      size: 34.2,
      rooms: 3,
      halls: 2,
      features: ['高樓層'],
    });

    expect(tags[0]).toBe('近捷運');
    expect(tags[1]).toBe('有車位');
    expect(tags).toContain('34.2 坪');
    expect(tags).toContain('3 房 2 廳');
  });

  it('advantage 不足時從 features 補 highlights，並去重', () => {
    const tags = buildKeyCapsuleTags({
      advantage1: '近捷運',
      advantage2: ' ',
      features: ['近捷運', '高樓層'],
      size: 20,
      rooms: 2,
      halls: 0,
    });

    expect(tags[0]).toBe('近捷運');
    expect(tags[1]).toBe('高樓層');
    expect(tags).toContain('20.0 坪');
    expect(tags).toContain('2 房');
  });

  it('可從 floorCurrent 推導高/低樓層', () => {
    const tags = buildKeyCapsuleTags({
      floorCurrent: '高樓層',
      features: [],
      size: 10.5,
      rooms: 1,
      halls: 1,
    });

    expect(tags[0]).toBe('高樓層');
    expect(tags).toContain('10.5 坪');
    expect(tags).toContain('1 房 1 廳');
  });

  it('應能根據樓層比例推斷高/低樓層 (P2 缺失修正)', () => {
    // 高樓層: 12/15 = 0.8 >= 0.7
    const tagsHigh = buildKeyCapsuleTags({
      floorCurrent: '12',
      floorTotal: 15,
      size: 30,
      rooms: 3,
    });
    expect(tagsHigh[0]).toBe('高樓層');

    // 低樓層: 2/10 = 0.2 <= 0.3
    const tagsLow = buildKeyCapsuleTags({
      floorCurrent: '2',
      floorTotal: 10,
      size: 30,
      rooms: 3,
    });
    expect(tagsLow[0]).toBe('低樓層');

    // 中間樓層: 5/10 = 0.5 (不應推斷)
    const tagsMid = buildKeyCapsuleTags({
      floorCurrent: '5',
      floorTotal: 10,
      size: 30,
      rooms: 3,
    });
    expect(tagsMid[0]).toBe('30.0 坪'); // 直接跳到 Specs
  });

  it('應嚴格遵守 index 語意與長度限制 (P1 缺失修正)', () => {
    const tags = buildKeyCapsuleTags({
      advantage1: '賣點1',
      advantage2: '賣點2',
      features: ['賣點3', '賣點4'],
      size: 25,
      rooms: 2,
      halls: 1
    });

    expect(tags.length).toBe(4);
    expect(tags[0]).toBe('賣點1');
    expect(tags[1]).toBe('賣點2');
    expect(tags[2]).toBe('25.0 坪');
    expect(tags[3]).toBe('2 房 1 廳');
  });

  it('處理空值與異常輸入 (P1 缺失修正)', () => {
    const tags = buildKeyCapsuleTags({
      advantage1: null,
      advantage2: undefined,
      features: [],
      size: -1,
      rooms: 0,
    });

    expect(tags).toEqual([]);
  });
});
