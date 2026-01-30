import { describe, it, expect } from 'vitest';
import { calcProgressWidthClass } from '../progress';

describe('calcProgressWidthClass', () => {
  it('clamps to minimum and maximum', () => {
    expect(calcProgressWidthClass(-1)).toBe('w-0');
    expect(calcProgressWidthClass(0)).toBe('w-0');
    expect(calcProgressWidthClass(6)).toBe('w-full');
    expect(calcProgressWidthClass(10)).toBe('w-full');
  });

  it('maps middle steps correctly', () => {
    expect(calcProgressWidthClass(1)).toBe('w-1/6');
    expect(calcProgressWidthClass(3)).toBe('w-1/2');
    expect(calcProgressWidthClass(5)).toBe('w-5/6');
  });

  it('handles invalid numbers safely', () => {
    expect(calcProgressWidthClass(Number.NaN)).toBe('w-0');
  });

  it('supports completed/total ratio inputs', () => {
    expect(calcProgressWidthClass(3, 6)).toBe('w-1/2');
    expect(calcProgressWidthClass(0, 0)).toBe('w-0');
  });
});
