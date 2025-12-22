import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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
