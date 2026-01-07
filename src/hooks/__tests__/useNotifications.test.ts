/**
 * useNotifications Hook 單元測試
 * MSG-2: 鈴鐺通知功能測試
 */

import { renderHook, waitFor, act } from "@testing-library/react";

// Mock dependencies BEFORE importing the hook
const mockUseAuth = vi.fn();
vi.mock("../useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Supabase with proper chain (including abortSignal)
const mockSelectReturn = vi.fn();
const mockSupabaseFrom = vi.fn((table: string) => ({
  select: () => ({
    eq: () => ({
      gt: () => ({
        order: () => ({
          limit: () => ({
            abortSignal: mockSelectReturn,
          }),
        }),
      }),
    }),
  }),
}));

const mockChannelOn = vi.fn();
const mockSubscribe =
  vi.fn<(cb?: (status: string) => void) => { on: typeof mockChannelOn }>();
const mockRemoveChannel = vi.fn();

const createChannelMock = () => ({
  on: mockChannelOn.mockReturnThis(),
  subscribe: mockSubscribe.mockImplementation((cb) => {
    if (cb) cb("SUBSCRIBED");
    return { on: mockChannelOn };
  }),
});

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    channel: createChannelMock,
    removeChannel: mockRemoveChannel,
  },
}));

// Mock logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Import AFTER mocks are set up
import { useNotifications } from "../useNotifications";

// Test data fixtures
const createMockConversation = (overrides = {}) => ({
  id: "conv-123",
  status: "active",
  unread_agent: 3,
  unread_consumer: 2,
  agent_id: "agent-001",
  consumer_session_id: "session-abc",
  consumer_profile_id: "consumer-001",
  property_id: "prop-001",
  updated_at: "2024-01-15T10:00:00Z",
  consumer_profile: [{ name: "John Doe", email: "john@example.com" }],
  agent_profile: [{ name: "Agent Smith", email: "agent@example.com" }],
  property: [
    { public_id: "MH-001", title: "Luxury Apartment", images: ["img1.jpg"] },
  ],
  messages: [
    {
      content: "Hello there",
      created_at: "2024-01-15T10:00:00Z",
      sender_type: "consumer",
    },
  ],
  ...overrides,
});

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectReturn.mockResolvedValue({ data: [], error: null });
  });

  describe("unauthenticated user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        role: "guest",
      });
    });

    it("should return zero count and empty notifications when not authenticated", () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.count).toBe(0);
      expect(result.current.notifications).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should not call supabase when not authenticated", () => {
      renderHook(() => useNotifications());

      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });
  });

  describe("agent user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "agent-001" },
        role: "agent",
      });
    });

    it("should fetch notifications for agent", async () => {
      const mockData = [createMockConversation()];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith("conversations");
    });

    it("should calculate total unread count correctly", async () => {
      const mockData = [
        createMockConversation({ id: "conv-1", unread_agent: 3 }),
        createMockConversation({ id: "conv-2", unread_agent: 5 }),
        createMockConversation({ id: "conv-3", unread_agent: 2 }),
      ];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.count).toBe(10); // 3 + 5 + 2
      });
    });

    it("should transform conversation data correctly for agent", async () => {
      const mockData = [createMockConversation()];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      const notification = result.current.notifications[0];
      expect(notification?.id).toBe("conv-123");
      expect(notification?.counterpart.name).toBe("John Doe");
      expect(notification?.unread_count).toBe(3); // unread_agent
      expect(notification?.property?.title).toBe("Luxury Apartment");
    });

    it("should handle guest visitor naming for agent", async () => {
      const mockData = [
        createMockConversation({
          consumer_profile: null,
          consumer_session_id: "session-1234",
        }),
      ];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications[0]?.counterpart.name).toBe(
          "訪客-1234",
        );
      });
    });
  });

  describe("consumer user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "consumer-001" },
        role: "resident",
      });
    });

    it("should fetch notifications for consumer", async () => {
      const mockData = [createMockConversation()];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith("conversations");
    });

    it("should use unread_consumer count for consumer", async () => {
      const mockData = [createMockConversation({ unread_consumer: 7 })];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications[0]?.unread_count).toBe(7);
      });
    });

    it("should show agent name as counterpart for consumer", async () => {
      const mockData = [createMockConversation()];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications[0]?.counterpart.name).toBe(
          "Agent Smith",
        );
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "user-001" },
        role: "agent",
      });
    });

    it("should set error state when fetch fails", async () => {
      // Supabase returns error in response object, not as rejection
      mockSelectReturn.mockResolvedValue({
        data: null,
        error: new Error("Network error"),
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(
        () => {
          expect(result.current.error).toBeInstanceOf(Error);
        },
        { timeout: 10000 },
      );
    });
  });

  describe("refresh function", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "user-001" },
        role: "agent",
      });
    });

    it("should provide refresh function", async () => {
      mockSelectReturn.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refresh).toBe("function");
    });
  });

  describe("message transformation", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: "agent-001" },
        role: "agent",
      });
    });

    it("should sort messages and take the latest", async () => {
      const mockData = [
        createMockConversation({
          messages: [
            {
              content: "Old message",
              created_at: "2024-01-14T10:00:00Z",
              sender_type: "consumer",
            },
            {
              content: "Latest message",
              created_at: "2024-01-15T12:00:00Z",
              sender_type: "agent",
            },
            {
              content: "Middle message",
              created_at: "2024-01-15T08:00:00Z",
              sender_type: "consumer",
            },
          ],
        }),
      ];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications[0]?.last_message?.content).toBe(
          "Latest message",
        );
      });
    });

    it("should handle empty messages array", async () => {
      const mockData = [createMockConversation({ messages: [] })];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications[0]?.last_message).toBeUndefined();
      });
    });

    it("should handle missing property data", async () => {
      const mockData = [createMockConversation({ property: null })];
      mockSelectReturn.mockResolvedValue({ data: mockData, error: null });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications[0]?.property).toBeUndefined();
      });
    });
  });
});
