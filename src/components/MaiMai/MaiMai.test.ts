/**
 * MaiMai 組件單元測試
 * @description 驗證 MOOD_CONFIGS 完整性與一致性
 */

import { MOOD_CONFIGS, EFFECT_POSITIONS } from './configs';
import { mirrorPath, CANVAS_SIZE } from './types';
import type { EffectItem, MaiMaiMood } from './types';

describe('MaiMai MOOD_CONFIGS', () => {
  const allMoods: (MaiMaiMood | 'default')[] = [
    'default',
    'idle',
    'wave',
    'peek',
    'happy',
    'thinking',
    'excited',
    'confused',
    'celebrate',
    'shy',
    'sleep',
  ];

  it('應該定義所有心情狀態', () => {
    allMoods.forEach((mood) => {
      expect(MOOD_CONFIGS[mood]).toBeDefined();
      expect(MOOD_CONFIGS[mood]).toHaveProperty('eyebrows');
      expect(MOOD_CONFIGS[mood]).toHaveProperty('eyes');
      expect(MOOD_CONFIGS[mood]).toHaveProperty('mouth');
      expect(MOOD_CONFIGS[mood]).toHaveProperty('arms');
    });
  });

  it('眉毛應該有左右兩邊', () => {
    allMoods.forEach((mood) => {
      const config = MOOD_CONFIGS[mood];
      expect(config.eyebrows).toHaveProperty('left');
      expect(config.eyebrows).toHaveProperty('right');
      expect(typeof config.eyebrows.left).toBe('string');
      expect(typeof config.eyebrows.right).toBe('string');
      expect(config.eyebrows.left.length).toBeGreaterThan(0);
      expect(config.eyebrows.right.length).toBeGreaterThan(0);
    });
  });

  it('眼睛應該有左右兩邊且類型正確', () => {
    allMoods.forEach((mood) => {
      const config = MOOD_CONFIGS[mood];
      expect(config.eyes).toHaveProperty('left');
      expect(config.eyes).toHaveProperty('right');
      expect(config.eyes.left.type).toMatch(/^(circle|path|group)$/);
      expect(config.eyes.right.type).toMatch(/^(circle|path|group)$/);
    });
  });

  it('嘴巴應該是非空字串', () => {
    allMoods.forEach((mood) => {
      const config = MOOD_CONFIGS[mood];
      expect(typeof config.mouth).toBe('string');
      expect(config.mouth.length).toBeGreaterThan(0);
    });
  });

  it('手臂應該至少有左手', () => {
    allMoods.forEach((mood) => {
      const config = MOOD_CONFIGS[mood];
      expect(config.arms).toHaveProperty('left');
      expect(typeof config.arms.left).toBe('string');
      expect(config.arms.left.length).toBeGreaterThan(0);
    });
  });

  it('wave 和 peek 應該有 extraType', () => {
    expect(MOOD_CONFIGS.wave.arms.extraType).toBe('wave');
    expect(MOOD_CONFIGS.peek.arms.extraType).toBe('peek');
  });

  it('peek, shy, sleep 應該有 droopy antenna', () => {
    expect(MOOD_CONFIGS.peek.antenna?.droopy).toBe(true);
    expect(MOOD_CONFIGS.shy.antenna?.droopy).toBe(true);
    expect(MOOD_CONFIGS.sleep.antenna?.droopy).toBe(true);
  });

  it('所有心情的配置應該可以序列化', () => {
    allMoods.forEach((mood) => {
      const config = MOOD_CONFIGS[mood];
      expect(() => JSON.stringify(config)).not.toThrow();
    });
  });
});

describe('EFFECT_POSITIONS', () => {
  it('應該為所有心情定義特效位置', () => {
    const allMoods: (MaiMaiMood | 'default')[] = [
      'default',
      'idle',
      'wave',
      'peek',
      'happy',
      'thinking',
      'excited',
      'confused',
      'celebrate',
      'shy',
      'sleep',
    ];

    allMoods.forEach((mood) => {
      expect(EFFECT_POSITIONS[mood]).toBeDefined();
      expect(Array.isArray(EFFECT_POSITIONS[mood])).toBe(true);
    });
  });

  it('celebrate 和 excited 應該有特效', () => {
    expect(EFFECT_POSITIONS.celebrate.length).toBeGreaterThan(0);
    expect(EFFECT_POSITIONS.excited.length).toBeGreaterThan(0);
  });

  it('特效項目應該有正確的結構', () => {
    const effectsWithItems: MaiMaiMood[] = [
      'celebrate',
      'excited',
      'happy',
      'thinking',
      'sleep',
      'shy',
      'wave',
    ];

    effectsWithItems.forEach((mood) => {
      EFFECT_POSITIONS[mood].forEach((effect: EffectItem) => {
        expect(effect).toHaveProperty('kind');
        expect(effect).toHaveProperty('x');
        expect(effect).toHaveProperty('y');
        expect(['text', 'star', 'sparkle', 'confetti', 'circle', 'ellipse']).toContain(effect.kind);
      });
    });
  });

  it('特效座標應該在合理範圍內', () => {
    const effectsWithItems: MaiMaiMood[] = ['celebrate', 'excited', 'happy'];

    effectsWithItems.forEach((mood) => {
      EFFECT_POSITIONS[mood].forEach((effect: EffectItem) => {
        // x 座標應該在 -100 到 100 之間（相對於中心點）
        expect(effect.x).toBeGreaterThanOrEqual(-100);
        expect(effect.x).toBeLessThanOrEqual(100);
        // y 座標應該在 0 到 200 之間
        expect(effect.y).toBeGreaterThanOrEqual(0);
        expect(effect.y).toBeLessThanOrEqual(240);
      });
    });
  });
});

describe('mirrorPath', () => {
  it('應該正確鏡像 SVG 路徑座標', () => {
    const input = 'M 50 100 L 60 120';
    const expected = 'M 150 100 L 140 120';
    expect(mirrorPath(input)).toBe(expected);
  });

  it('應該處理多個座標對', () => {
    const input = 'M 10 20 L 30 40 L 50 60';
    const expected = 'M 190 20 L 170 40 L 150 60';
    expect(mirrorPath(input)).toBe(expected);
  });

  it('應該處理 Q 曲線命令', () => {
    const input = 'M 50 100 Q 100 50 150 100';
    const expected = 'M 150 100 Q 100 50 50 100';
    expect(mirrorPath(input)).toBe(expected);
  });

  it('中心點應該保持在中心', () => {
    const centerX = CANVAS_SIZE / 2; // 100
    const input = `M ${centerX} 100`;
    const expected = `M ${centerX} 100`;
    expect(mirrorPath(input)).toBe(expected);
  });

  it('左右對稱點應該正確交換', () => {
    const leftX = 50;
    const rightX = 150;
    expect(mirrorPath(`M ${leftX} 100`)).toBe(`M ${rightX} 100`);
    expect(mirrorPath(`M ${rightX} 100`)).toBe(`M ${leftX} 100`);
  });
});
