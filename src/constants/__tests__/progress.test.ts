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

  it('supports edge ratio values', () => {
    expect(calcProgressWidthClass(1, 6)).toBe('w-1/6');
    expect(calcProgressWidthClass(6, 6)).toBe('w-full');
    expect(calcProgressWidthClass(7, 6)).toBe('w-full');
  });

  // 極端值測試
  it('handles Infinity safely', () => {
    expect(calcProgressWidthClass(Infinity)).toBe('w-0');
    expect(calcProgressWidthClass(Number.POSITIVE_INFINITY)).toBe('w-0');
  });

  it('handles negative Infinity safely', () => {
    expect(calcProgressWidthClass(-Infinity)).toBe('w-0');
    expect(calcProgressWidthClass(Number.NEGATIVE_INFINITY)).toBe('w-0');
  });

  it('handles very large numbers', () => {
    expect(calcProgressWidthClass(Number.MAX_SAFE_INTEGER)).toBe('w-full');
    expect(calcProgressWidthClass(999999999)).toBe('w-full');
  });

  it('handles very small negative numbers', () => {
    expect(calcProgressWidthClass(Number.MIN_SAFE_INTEGER)).toBe('w-0');
    expect(calcProgressWidthClass(-999999999)).toBe('w-0');
  });

  // 浮點數測試
  it('handles float numbers by rounding', () => {
    expect(calcProgressWidthClass(1.1)).toBe('w-1/6');
    expect(calcProgressWidthClass(1.9)).toBe('w-1/3');
    expect(calcProgressWidthClass(2.5)).toBe('w-1/2');
    expect(calcProgressWidthClass(5.99)).toBe('w-full');
  });

  it('handles negative float numbers', () => {
    expect(calcProgressWidthClass(-0.5)).toBe('w-0');
    expect(calcProgressWidthClass(-1.5)).toBe('w-0');
  });

  it('handles float numbers exceeding maximum', () => {
    expect(calcProgressWidthClass(6.1)).toBe('w-full');
    expect(calcProgressWidthClass(10.5)).toBe('w-full');
  });

  // 特殊數值測試
  it('handles zero correctly', () => {
    expect(calcProgressWidthClass(0)).toBe('w-0');
    expect(calcProgressWidthClass(-0)).toBe('w-0');
  });

  it('handles boundary values', () => {
    expect(calcProgressWidthClass(0.0001)).toBe('w-0');
    expect(calcProgressWidthClass(5.4)).toBe('w-5/6');
    expect(calcProgressWidthClass(5.5)).toBe('w-full');
  });
});
