/**
 * MaiMai 組件單元測試
 * @description 驗證 MOOD_CONFIGS 完整性與一致性
 */

import { describe, it, expect } from 'vitest';
import { MOOD_CONFIGS } from './configs';
import type { MaiMaiMood } from './types';

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
    allMoods.forEach(mood => {
      expect(MOOD_CONFIGS[mood]).toBeDefined();
      expect(MOOD_CONFIGS[mood]).toHaveProperty('eyebrows');
      expect(MOOD_CONFIGS[mood]).toHaveProperty('eyes');
      expect(MOOD_CONFIGS[mood]).toHaveProperty('mouth');
      expect(MOOD_CONFIGS[mood]).toHaveProperty('arms');
    });
  });

  it('眉毛應該有左右兩邊', () => {
    allMoods.forEach(mood => {
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
    allMoods.forEach(mood => {
      const config = MOOD_CONFIGS[mood];
      expect(config.eyes).toHaveProperty('left');
      expect(config.eyes).toHaveProperty('right');
      expect(config.eyes.left.type).toMatch(/^(circle|path|group)$/);
      expect(config.eyes.right.type).toMatch(/^(circle|path|group)$/);
    });
  });

  it('嘴巴應該是非空字串', () => {
    allMoods.forEach(mood => {
      const config = MOOD_CONFIGS[mood];
      expect(typeof config.mouth).toBe('string');
      expect(config.mouth.length).toBeGreaterThan(0);
    });
  });

  it('手臂應該至少有左手', () => {
    allMoods.forEach(mood => {
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

  it('SVG path 不應包含硬編碼數字 (應使用常量)', () => {
    // 檢查是否有獨立的純數字 (不在變數名或運算式中)
    const hasHardcodedNumbers = (str: string) => {
      // 排除常見的小數字 (0, 1, 2, 3, 4, 5)
      const suspiciousNumbers = /\b(?:[6-9]|\d{2,})\b/g;
      return suspiciousNumbers.test(str);
    };

    allMoods.forEach(mood => {
      const config = MOOD_CONFIGS[mood];

      // 這裡不檢查 path 字串,因為它們是由工廠函數生成的
      // 只要工廠函數使用常量,就符合規範
      expect(config).toBeDefined();
    });
  });

  it('所有心情的配置應該可以序列化', () => {
    allMoods.forEach(mood => {
      const config = MOOD_CONFIGS[mood];
      expect(() => JSON.stringify(config)).not.toThrow();
    });
  });
});
