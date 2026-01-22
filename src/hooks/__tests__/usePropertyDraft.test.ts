import { renderHook, act, waitFor } from "@testing-library/react";
import { usePropertyDraft, DraftFormData } from "../usePropertyDraft";

const baseForm: DraftFormData = {
  title: "t",
  price: "1",
  address: "a",
  communityName: "c",
  size: "10",
  age: "1",
  floorCurrent: "1",
  floorTotal: "2",
  rooms: "3",
  halls: "2",
  bathrooms: "2",
  type: "電梯大樓",
  description: "desc",
  advantage1: "good1",
  advantage2: "good2",
  disadvantage: "bad",
  highlights: [],
  sourceExternalId: "src",
  // FE-1: 安心留痕開關狀態
  trustEnabled: false,
};

describe("usePropertyDraft", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-22T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects draft with userId key", () => {
    const draft = {
      ...baseForm,
      _version: 1,
      _savedAt: Date.now(),
      _tabId: "x",
    };
    localStorage.setItem("mh_draft_upload_u1", JSON.stringify(draft));
    const { result } = renderHook(() => usePropertyDraft(baseForm, "u1"));
    expect(result.current.hasDraft()).toBe(true);
  });

  it("restores draft data", () => {
    const draft = {
      ...baseForm,
      _version: 1,
      _savedAt: Date.now(),
      _tabId: "x",
    };
    localStorage.setItem("mh_draft_upload_u2", JSON.stringify(draft));
    const { result } = renderHook(() => usePropertyDraft(baseForm, "u2"));
    const restored = result.current.restoreDraft();
    expect(restored?.title).toBe("t");
  });

  it("returns false when draft JSON is corrupted", () => {
    localStorage.setItem("mh_draft_upload_anonymous", "{bad json");
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    expect(result.current.hasDraft()).toBe(false);
  });

  it("gracefully handles corrupted JSON on restore", () => {
    localStorage.setItem("mh_draft_upload_anonymous", "{bad json");
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    expect(result.current.restoreDraft()).toBeNull();
  });

  it("debounces autosave and writes latest content once", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { rerender } = renderHook(
      ({ form }) => usePropertyDraft(form, "u3"),
      {
        initialProps: { form: baseForm },
      },
    );

    // 快速變更表單，再等 1000ms，僅應寫入一次且為最新內容
    rerender({ form: { ...baseForm, title: "new title" } });
    act(() => vi.advanceTimersByTime(1000));

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(
      localStorage.getItem("mh_draft_upload_u3") || "{}",
    );
    expect(saved.title).toBe("new title");
    setItemSpy.mockRestore();
  });

  it("getDraftPreview returns relative time string", () => {
    const oneMinuteAgo = Date.now() - 60_000;
    const draft = {
      ...baseForm,
      _version: 1,
      _savedAt: oneMinuteAgo,
      _tabId: "x",
    };
    localStorage.setItem("mh_draft_upload_u4", JSON.stringify(draft));
    const { result } = renderHook(() => usePropertyDraft(baseForm, "u4"));
    expect(result.current.getDraftPreview()?.savedAt).toBe("1 分鐘前");
  });

  it("clears draft", () => {
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.clearDraft());
    expect(localStorage.getItem("mh_draft_upload_anonymous")).toBeNull();
  });

  it("rejects expired draft", () => {
    const stored = {
      ...baseForm,
      _version: 1,
      _savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
      _tabId: "x",
    };
    localStorage.setItem("mh_draft_upload_anonymous", JSON.stringify(stored));
    const { result } = renderHook(() => usePropertyDraft(baseForm));
    const restored = result.current.restoreDraft();
    expect(restored).toBeNull();
  });

  it("migrates draft from anonymous to user", () => {
    const stored = {
      ...baseForm,
      _version: 1,
      _savedAt: Date.now(),
      _tabId: "x",
    };
    localStorage.setItem("mh_draft_upload_anonymous", JSON.stringify(stored));
    const { result, rerender } = renderHook(
      ({ uid }) => usePropertyDraft(baseForm, uid),
      { initialProps: { uid: undefined as string | undefined } },
    );
    act(() => result.current.migrateDraft(undefined, "user99"));
    rerender({ uid: "user99" });
    const restored = result.current.restoreDraft();
    expect(restored?.title).toBe("t");
  });

  // FE-1: trustEnabled 草稿儲存/還原測試
  it("saves and restores trustEnabled state", () => {
    const formWithTrust: DraftFormData = {
      ...baseForm,
      trustEnabled: true,
    };
    const { result } = renderHook(() =>
      usePropertyDraft(formWithTrust, "trust-test"),
    );

    // 等待自動存檔
    act(() => vi.advanceTimersByTime(1000));

    // 驗證 localStorage 有儲存 trustEnabled
    const saved = JSON.parse(
      localStorage.getItem("mh_draft_upload_trust-test") || "{}",
    );
    expect(saved.trustEnabled).toBe(true);

    // 驗證還原時 trustEnabled 正確
    const restored = result.current.restoreDraft();
    expect(restored?.trustEnabled).toBe(true);
  });

  it("restores trustEnabled=false for old drafts missing the field", () => {
    // 模擬舊版草稿（沒有 trustEnabled 欄位）
    const oldDraft = {
      title: "old",
      price: "100",
      address: "addr",
      communityName: "comm",
      size: "20",
      age: "5",
      floorCurrent: "3",
      floorTotal: "10",
      rooms: "2",
      halls: "1",
      bathrooms: "1",
      type: "公寓",
      description: "old desc",
      advantage1: "adv1",
      advantage2: "adv2",
      disadvantage: "dis",
      highlights: [],
      sourceExternalId: "",
      // 注意：沒有 trustEnabled - 模擬舊草稿
      _version: 1,
      _savedAt: Date.now(),
      _tabId: "old",
    };
    localStorage.setItem("mh_draft_upload_old-test", JSON.stringify(oldDraft));

    const { result } = renderHook(() => usePropertyDraft(baseForm, "old-test"));
    const restored = result.current.restoreDraft();

    // Zod schema 會給 default false
    expect(restored?.trustEnabled).toBe(false);
  });

  // FE-1: 完整流程整合測試
  describe("trustEnabled integration", () => {
    it("preserves trustEnabled=true through save-restore cycle", () => {
      // 1. 建立開啟 trustEnabled 的表單
      const formWithTrustOn: DraftFormData = {
        ...baseForm,
        title: "Trust Test Property",
        trustEnabled: true,
      };

      // 2. 初始化 hook 並等待自動存檔
      const { result } = renderHook(() =>
        usePropertyDraft(formWithTrustOn, "integration-test"),
      );
      act(() => vi.advanceTimersByTime(1000));

      // 3. 驗證 localStorage 正確儲存
      const rawSaved = localStorage.getItem("mh_draft_upload_integration-test");
      expect(rawSaved).not.toBeNull();
      const saved = JSON.parse(rawSaved!);
      expect(saved.trustEnabled).toBe(true);
      expect(saved.title).toBe("Trust Test Property");

      // 4. 模擬頁面重載：清除 hook 狀態，重新還原
      const restored = result.current.restoreDraft();
      expect(restored).not.toBeNull();
      expect(restored!.trustEnabled).toBe(true);
      expect(restored!.title).toBe("Trust Test Property");
    });

    it("preserves trustEnabled=false through save-restore cycle", () => {
      const formWithTrustOff: DraftFormData = {
        ...baseForm,
        title: "No Trust Property",
        trustEnabled: false,
      };

      const { result } = renderHook(() =>
        usePropertyDraft(formWithTrustOff, "integration-off-test"),
      );
      act(() => vi.advanceTimersByTime(1000));

      const restored = result.current.restoreDraft();
      expect(restored).not.toBeNull();
      expect(restored!.trustEnabled).toBe(false);
    });

    it("updates trustEnabled when form changes", () => {
      // 1. 開始時 trustEnabled = false
      const initialForm: DraftFormData = {
        ...baseForm,
        trustEnabled: false,
      };

      const { result, rerender } = renderHook(
        ({ form }) => usePropertyDraft(form, "toggle-test"),
        { initialProps: { form: initialForm } },
      );
      act(() => vi.advanceTimersByTime(1000));

      // 2. 用戶切換 Toggle → trustEnabled = true
      const updatedForm: DraftFormData = {
        ...baseForm,
        trustEnabled: true,
      };
      rerender({ form: updatedForm });
      act(() => vi.advanceTimersByTime(1000));

      // 3. 驗證新值已存檔
      const saved = JSON.parse(
        localStorage.getItem("mh_draft_upload_toggle-test") || "{}",
      );
      expect(saved.trustEnabled).toBe(true);

      // 4. 還原應該得到最新值
      const restored = result.current.restoreDraft();
      expect(restored!.trustEnabled).toBe(true);
    });
  });
});
