import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDemoMode, setDemoMode } from '../../lib/pageMode';
import { track } from '../track';

describe('track demo guard (#1a)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('live/visitor 模式應送出追蹤請求', async () => {
    clearDemoMode();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await track('event.live', { from: 'test' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('demo 模式應靜默跳過追蹤請求', async () => {
    setDemoMode();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await track('event.demo', { from: 'test' });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
