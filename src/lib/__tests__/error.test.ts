import { describe, it, expect } from 'vitest';
import { getErrorMessage, getErrorInfo, safeAsync, safeSync } from '../error';

describe('getErrorMessage', () => {
  it('應該從 Error 物件提取訊息', () => {
    const error = new Error('測試錯誤');
    expect(getErrorMessage(error)).toBe('測試錯誤');
  });

  it('應該處理字串錯誤', () => {
    expect(getErrorMessage('錯誤訊息')).toBe('錯誤訊息');
  });

  it('應該從物件的 message 屬性提取訊息', () => {
    expect(getErrorMessage({ message: '物件錯誤' })).toBe('物件錯誤');
  });

  it('應該從物件的 msg 屬性提取訊息', () => {
    expect(getErrorMessage({ msg: '簡短錯誤' })).toBe('簡短錯誤');
  });

  it('應該從物件的 error 屬性提取訊息', () => {
    expect(getErrorMessage({ error: '嵌套錯誤' })).toBe('嵌套錯誤');
  });

  it('應該序列化無法提取訊息的物件', () => {
    const obj = { code: 500, status: 'error' };
    expect(getErrorMessage(obj)).toBe(JSON.stringify(obj));
  });

  it('應該過濾敏感欄位', () => {
    const obj = {
      password: 'pass-123',
      token: 'token-123',
      secret: 'secret-123',
      apiKey: 'api-key-123',
      profile: {
        safe: 'ok',
        refresh_token: 'nested-token',
      },
    };

    expect(getErrorMessage(obj)).toBe(
      JSON.stringify({
        password: '[REDACTED]',
        token: '[REDACTED]',
        secret: '[REDACTED]',
        apiKey: '[REDACTED]',
        profile: {
          safe: 'ok',
          refresh_token: '[REDACTED]',
        },
      })
    );
  });

  it('應該處理循環引用並保留過濾結果', () => {
    const obj: Record<string, unknown> = { password: 'pass-123' };
    obj.self = obj;

    expect(getErrorMessage(obj)).toBe(
      JSON.stringify({
        password: '[REDACTED]',
        self: '[Circular]',
      })
    );
  });

  it('應該返回 "Unknown error" 對於 null', () => {
    expect(getErrorMessage(null)).toBe('Unknown error');
  });

  it('應該返回 "Unknown error" 對於 undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Unknown error');
  });

  it('應該返回 "Unknown error" 對於數字', () => {
    expect(getErrorMessage(123)).toBe('Unknown error');
  });
});

describe('getErrorInfo', () => {
  it('應該提取完整的錯誤資訊', () => {
    const error = new Error('測試錯誤');
    const info = getErrorInfo(error);

    expect(info.message).toBe('測試錯誤');
    expect(info.stack).toBeDefined();
    expect(info.raw).toBe(error);
  });

  it('應該處理非 Error 物件', () => {
    const info = getErrorInfo('字串錯誤');

    expect(info.message).toBe('字串錯誤');
    expect(info.stack).toBeUndefined();
    expect(info.raw).toBe('字串錯誤');
  });
});

describe('safeAsync', () => {
  it('應該返回成功結果', async () => {
    const result = await safeAsync(async () => 42);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe(42);
    }
  });

  it('應該捕捉並返回錯誤訊息', async () => {
    const result = await safeAsync(async () => {
      throw new Error('非同步錯誤');
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('非同步錯誤');
    }
  });

  it('應該處理 Promise rejection', async () => {
    const result = await safeAsync(() => Promise.reject('拒絕原因'));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('拒絕原因');
    }
  });
});

describe('safeSync', () => {
  it('應該返回成功結果', () => {
    const result = safeSync(() => 42);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe(42);
    }
  });

  it('應該捕捉並返回錯誤訊息', () => {
    const result = safeSync(() => {
      throw new Error('同步錯誤');
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('同步錯誤');
    }
  });

  it('應該處理字串拋出', () => {
    const result = safeSync(() => {
      throw '字串錯誤';
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('字串錯誤');
    }
  });
});
