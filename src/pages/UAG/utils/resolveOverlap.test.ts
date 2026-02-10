import { describe, expect, it } from 'vitest';
import { resolveOverlap } from './resolveOverlap';

describe('resolveOverlap', () => {
  it('returns an empty array for empty input', () => {
    expect(resolveOverlap([], 400, 300)).toEqual([]);
  });

  it('keeps a single bubble unchanged when already in bounds', () => {
    const result = resolveOverlap([{ x: 100, y: 120, size: 60 }], 400, 300);

    expect(result).toEqual([{ x: 100, y: 120 }]);
  });

  it('separates two overlapping bubbles', () => {
    const result = resolveOverlap(
      [
        { x: 100, y: 100, size: 60 },
        { x: 110, y: 100, size: 60 },
      ],
      400,
      300,
      4
    );

    const first = result[0];
    const second = result[1];
    if (!first || !second) throw new Error('Expected two bubbles');

    const dx = second.x - first.x;
    const dy = second.y - first.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = 30 + 30 + 4;

    expect(distance).toBeGreaterThanOrEqual(minDistance - 0.1);
  });

  it('clamps bubbles to all four container edges', () => {
    const result = resolveOverlap(
      [
        { x: -10, y: 100, size: 60 },
        { x: 500, y: 100, size: 60 },
        { x: 100, y: -10, size: 60 },
        { x: 100, y: 500, size: 60 },
      ],
      400,
      300
    );

    expect(result[0]?.x).toBeGreaterThanOrEqual(30);
    expect(result[1]?.x).toBeLessThanOrEqual(370);
    expect(result[2]?.y).toBeGreaterThanOrEqual(30);
    expect(result[3]?.y).toBeLessThanOrEqual(270);
  });

  it('handles container width = 0 without NaN', () => {
    const result = resolveOverlap([{ x: 100, y: 100, size: 60 }], 0, 300);

    expect(result).toEqual([{ x: 30, y: 100 }]);
  });

  it('handles container height = 0 without NaN', () => {
    const result = resolveOverlap([{ x: 100, y: 100, size: 60 }], 300, 0);

    expect(result).toEqual([{ x: 100, y: 30 }]);
  });

  it('handles zero-size bubbles', () => {
    const result = resolveOverlap([{ x: 100, y: 100, size: 0 }], 400, 300);

    expect(result[0]).toEqual({ x: 100, y: 100 });
  });

  it('treats negative padding as zero', () => {
    const result = resolveOverlap(
      [
        { x: 100, y: 100, size: 60 },
        { x: 120, y: 100, size: 60 },
      ],
      400,
      300,
      -10
    );

    const first = result[0];
    const second = result[1];
    if (!first || !second) throw new Error('Expected two bubbles');

    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    expect(distance).toBeGreaterThanOrEqual(60 - 0.1);
  });

  it('keeps all bubbles finite and in bounds for dense large input', () => {
    const bubbles = Array.from({ length: 120 }, (_, index) => ({
      x: 200 + (index % 12) * 0.4,
      y: 150 + Math.floor(index / 12) * 0.4,
      size: 48 + (index % 5) * 6,
    }));

    const result = resolveOverlap(bubbles, 420, 320, 4);

    expect(result).toHaveLength(120);
    result.forEach((position, index) => {
      const bubble = bubbles[index];
      if (!bubble) throw new Error('Expected matching bubble');
      const radius = bubble.size / 2;

      expect(Number.isFinite(position.x)).toBe(true);
      expect(Number.isFinite(position.y)).toBe(true);
      expect(position.x).toBeGreaterThanOrEqual(radius);
      expect(position.x).toBeLessThanOrEqual(420 - radius);
      expect(position.y).toBeGreaterThanOrEqual(radius);
      expect(position.y).toBeLessThanOrEqual(320 - radius);
    });
  });
});
