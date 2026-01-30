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
});
