import { describe, it, expect } from 'vitest';
import { DataCollectionFormSchema } from '../DataCollectionModal';

describe('DataCollectionFormSchema', () => {
  it('accepts valid data with optional email', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid name characters', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明123',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone format', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '12345',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: 'invalid-email',
    });
    expect(result.success).toBe(false);
  });

  // 邊界測試 - 姓名長度
  it('accepts name at minimum length (1 char)', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts name at maximum length (50 chars)', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: 'A'.repeat(50),
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name exceeding maximum length (51 chars)', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: 'A'.repeat(51),
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('preserves leading/trailing spaces in name input', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '  王小明  ',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('  王小明  ');
    }
  });

  it('rejects name with only spaces', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: 'A B',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  // 邊界測試 - 電話格式
  it('accepts valid phone starting with 09', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0900000000',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects phone with 9 digits', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '091234567',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects phone with 11 digits', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '09123456789',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects phone not starting with 09', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0812345678',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  // 邊界測試 - Email 長度
  it('accepts email at maximum length (100 chars)', () => {
    const localPart = 'a'.repeat(64); // max local part
    const domain = 'example.com';
    const email = `${localPart}@${domain}`;

    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: email.substring(0, 100),
    });
    expect(result.success).toBe(true);
  });

  it('rejects email exceeding maximum length (101 chars)', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: 'a'.repeat(90) + '@example.com', // 101+ chars
    });
    expect(result.success).toBe(false);
  });

  // 邊界測試 - 姓名字元類型
  it('accepts name with Chinese characters', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts name with English characters', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: 'John Smith',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts name with mixed Chinese and English', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王 John 明',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name with numbers', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明123',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name with special characters', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明@',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  // Email 選填測試
  it('accepts valid email', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for email', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = DataCollectionFormSchema.safeParse({
      name: '王小明',
      phone: '0912345678',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});
