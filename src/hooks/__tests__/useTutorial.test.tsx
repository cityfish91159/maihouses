import { renderHook, act } from "@testing-library/react";
import { useTutorial } from "../useTutorial";
import { MaiMaiProvider } from "../../context/MaiMaiContext";
import { safeLocalStorage } from "../../lib/safeStorage";
import { TUTORIAL_CONFIG } from "../../constants/tutorial";

// Mock MaiMaiContext
const mockSetMood = vi.fn();
const mockAddMessage = vi.fn();

vi.mock("../../context/MaiMaiContext", async () => {
  const actual = await vi.importActual("../../context/MaiMaiContext");
  return {
    ...actual,
    useMaiMai: () => ({
      setMood: mockSetMood,
      addMessage: mockAddMessage,
    }),
  };
});

describe("useTutorial Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSetMood.mockClear();
    mockAddMessage.mockClear();
    safeLocalStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("First visit: Should show welcome message after delay", () => {
    renderHook(() => useTutorial());

    // Not shown immediately
    expect(mockSetMood).not.toHaveBeenCalled();

    // Fast forward delay
    act(() => {
      vi.advanceTimersByTime(TUTORIAL_CONFIG.WELCOME_DELAY_MS);
    });

    expect(mockSetMood).toHaveBeenCalledWith("wave");
    expect(mockAddMessage).toHaveBeenCalledWith(
      TUTORIAL_CONFIG.MESSAGES.WELCOME,
    );
    expect(safeLocalStorage.getItem("maimai-visited")).toBe("true");
  });

  it("Second visit: Should NOT show welcome message", () => {
    safeLocalStorage.setItem("maimai-visited", "true");
    renderHook(() => useTutorial());

    act(() => {
      vi.advanceTimersByTime(TUTORIAL_CONFIG.WELCOME_DELAY_MS + 1000);
    });

    expect(mockSetMood).not.toHaveBeenCalled();
  });

  it("Idle Timer: Should trigger sleep mode after 5 minutes", () => {
    renderHook(() => useTutorial());

    act(() => {
      vi.advanceTimersByTime(TUTORIAL_CONFIG.IDLE_TIMEOUT_MS);
    });

    expect(mockSetMood).toHaveBeenCalledWith("sleep");
    expect(mockAddMessage).toHaveBeenCalledWith(
      TUTORIAL_CONFIG.MESSAGES.IDLE_WAKEUP,
    );
  });

  it("Activity: Should reset idle timer", () => {
    renderHook(() => useTutorial());

    // Advance 4 minutes (not yet idle)
    act(() => {
      vi.advanceTimersByTime(TUTORIAL_CONFIG.IDLE_TIMEOUT_MS - 60000);
    });
    expect(mockSetMood).not.toHaveBeenCalledWith("sleep");

    // Trigger activity (simulate user click)
    act(() => {
      document.dispatchEvent(new Event("mousedown"));
    });

    // Advance another 2 minutes (total 6 mins if not reset, but should be 2 mins after reset)
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });

    // Should NOT be sleeping yet because timer reset
    expect(mockSetMood).not.toHaveBeenCalledWith("sleep");

    // Advance remaining 3 mins
    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000 + 100);
    });

    // Now it should trigger
    expect(mockSetMood).toHaveBeenCalledWith("sleep");
  });

  it("showTutorial: Should manually trigger tutorial steps", () => {
    const { result } = renderHook(() => useTutorial());

    act(() => {
      result.current.showTutorial("search");
    });

    expect(mockSetMood).toHaveBeenCalledWith("thinking");
    expect(mockAddMessage).toHaveBeenCalledWith(
      TUTORIAL_CONFIG.MESSAGES.SEARCH_HINT,
    );
  });
});
