import { describe, expect, it } from 'vitest';
import { buildKeyCapsuleTags } from '../keyCapsules';

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
    expect(tags).toContain('3房2廳');
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
    expect(tags).toContain('2房');
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
    expect(tags).toContain('1房1廳');
  });
});
