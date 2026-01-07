import { renderHook, act, waitFor } from '@testing-library/react';
import { usePropertyDraft, DraftFormData } from '../usePropertyDraft';

const baseForm: DraftFormData = {
  title: 't', price: '1', address: 'a', communityName: 'c', size: '10', age: '1',
  floorCurrent: '1', floorTotal: '2', rooms: '3', halls: '2', bathrooms: '2',
  type: '電梯大樓', description: 'desc', advantage1: 'good1', advantage2: 'good2',
  disadvantage: 'bad', highlights: [], sourceExternalId: 'src'
};

describe('usePropertyDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-22T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects draft with userId key', () => {
    const draft = { ...baseForm, _version: 1, _savedAt: Date.now(), _tabId: 'x' };
    localStorage.setItem('mh_draft_upload_u1', JSON.stringify(draft));
    const { result } = renderHook(() => usePropertyDraft(baseForm, 'u1'));
    expect(result.current.hasDraft()).toBe(true);
  });

  it('restores draft data', () => {
    const draft = { ...baseForm, _version: 1, _savedAt: Date.now(), _tabId: 'x' };
    localStorage.setItem('mh_draft_upload_u2', JSON.stringify(draft));
    const { result } = renderHook(() => usePropertyDraft(baseForm, 'u2'));
    const restored = result.current.restoreDraft();
    expect(restored?.title).toBe('t');
  });

  it('returns false when draft JSON is corrupted', () => {
    localStorage.setItem('mh_draft_upload_anonymous', '{bad json');
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    expect(result.current.hasDraft()).toBe(false);
  });

  it('gracefully handles corrupted JSON on restore', () => {
    localStorage.setItem('mh_draft_upload_anonymous', '{bad json');
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    expect(result.current.restoreDraft()).toBeNull();
  });

  it('debounces autosave and writes latest content once', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { rerender } = renderHook(({ form }) => usePropertyDraft(form, 'u3'), {
      initialProps: { form: baseForm }
    });

    // 快速變更表單，再等 1000ms，僅應寫入一次且為最新內容
    rerender({ form: { ...baseForm, title: 'new title' } });
    act(() => vi.advanceTimersByTime(1000));

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(localStorage.getItem('mh_draft_upload_u3') || '{}');
    expect(saved.title).toBe('new title');
    setItemSpy.mockRestore();
  });

  it('getDraftPreview returns relative time string', () => {
    const oneMinuteAgo = Date.now() - 60_000;
    const draft = { ...baseForm, _version: 1, _savedAt: oneMinuteAgo, _tabId: 'x' };
    localStorage.setItem('mh_draft_upload_u4', JSON.stringify(draft));
    const { result } = renderHook(() => usePropertyDraft(baseForm, 'u4'));
    expect(result.current.getDraftPreview()?.savedAt).toBe('1 分鐘前');
  });

  it('clears draft', () => {
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.clearDraft());
    expect(localStorage.getItem('mh_draft_upload_anonymous')).toBeNull();
  });

  it('rejects expired draft', () => {
    const stored = { ...baseForm, _version: 1, _savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, _tabId: 'x' };
    localStorage.setItem('mh_draft_upload_anonymous', JSON.stringify(stored));
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    const restored = result.current.restoreDraft();
    expect(restored).toBeNull();
  });

  it('migrates draft from anonymous to user', () => {
    const stored = { ...baseForm, _version: 1, _savedAt: Date.now(), _tabId: 'x' };
    localStorage.setItem('mh_draft_upload_anonymous', JSON.stringify(stored));
    const { result, rerender } = renderHook(({ uid }) => usePropertyDraft(baseForm, uid), { initialProps: { uid: undefined as string | undefined } });
    act(() => result.current.migrateDraft(undefined, 'user99'));
    rerender({ uid: 'user99' });
    const restored = result.current.restoreDraft();
    expect(restored?.title).toBe('t');
  });
});
