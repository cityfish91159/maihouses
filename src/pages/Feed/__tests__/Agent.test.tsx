import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AgentPage from "../Agent";
import { STRINGS } from "../../../constants/strings";

// Mock env to prevent runtime errors from GlobalHeader dependencies
vi.mock("../../../config/env", () => ({
  env: {
    VITE_SUPABASE_URL: "https://mock.supabase.co",
    VITE_SUPABASE_ANON_KEY: "mock-key",
    VITE_API_URL: "http://localhost:3000",
    MODE: "development",
  },
}));

// Mock child components to verify structure without deep rendering
vi.mock("../../../components/Feed/AgentProfileCard", () => ({
  AgentProfileCard: () => (
    <div data-testid="agent-profile-card">ProfileCard</div>
  ),
}));

vi.mock("../../../components/Feed/InlineComposer", () => ({
  InlineComposer: () => <div data-testid="inline-composer">Composer</div>,
}));

vi.mock("../../../components/Feed/UagSummaryCard", () => ({
  UagSummaryCard: () => <div data-testid="uag-summary-card">UAGCard</div>,
}));

vi.mock("../../../components/Feed/AgentSidebar", () => ({
  AgentSidebar: () => <div data-testid="agent-sidebar">Sidebar</div>,
}));

vi.mock("../../../components/Feed/FeedPostCard", () => ({
  FeedPostCard: () => <div data-testid="feed-post-card">PostCard</div>,
}));

// Mock hooks
vi.mock("../useAgentFeed", () => ({
  useAgentFeed: () => ({
    data: { posts: [{ id: "1" }, { id: "2" }] },
    uagSummary: {},
    performanceStats: {},
    todoList: [],
    viewerRole: "agent",
    createPost: vi.fn(),
    toggleLike: vi.fn(),
    isLiked: vi.fn(),
    handleComment: vi.fn(),
  }),
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", user_metadata: { name: "Test User" } },
  }),
}));

describe("Agent Page", () => {
  it("renders all main sections", () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AgentPage userId="u1" />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("agent-profile-card")).toBeInTheDocument();
    expect(screen.getByTestId("inline-composer")).toBeInTheDocument();
    expect(screen.getByTestId("uag-summary-card")).toBeInTheDocument();
    expect(screen.getByTestId("agent-sidebar")).toBeInTheDocument();

    // Check Feed Posts
    expect(screen.getAllByTestId("feed-post-card")).toHaveLength(2);

    // Check Trust Card (Static for now)
    expect(screen.getByText(STRINGS.AGENT.TRUST.TITLE)).toBeInTheDocument();
  });
});
