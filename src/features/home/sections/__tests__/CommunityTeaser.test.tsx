import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Fix: Import jest-dom for matchers
import CommunityTeaser from "../CommunityTeaser";
import { BACKUP_REVIEWS } from "../../../../constants/data";

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock React Query
const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));

// Mock Service
vi.mock("../../../../services/communityService", () => ({
  getFeaturedHomeReviews: vi.fn(),
}));

// Mock Components to simplify testing
vi.mock("../../components/HomeCard", () => ({
  HomeCard: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="home-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("../../components/ReviewCard", () => ({
  ReviewCard: ({ name, content }: { name: string; content: string }) => (
    <div data-testid="review-card">
      {name}: {content}
    </div>
  ),
}));

describe("CommunityTeaser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.href mock
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("renders loading skeleton when loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<CommunityTeaser />);

    // Check for skeleton elements (using class names or structure)
    // In the component, skeleton has "animate-pulse" class
    const skeletons = document.getElementsByClassName("animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders API data when successful", () => {
    const mockData = [
      {
        id: "uuid-1",
        displayId: "A",
        name: "Test User",
        rating: 5,
        tags: ["#Tag"],
        content: "Great content",
        source: "real",
        communityId: "comm-1",
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    render(<CommunityTeaser />);

    expect(screen.getByText("Test User: Great content")).toBeInTheDocument();
    expect(screen.queryByText("使用備用資料")).not.toBeInTheDocument();
  });

  it("renders backup data and error badge when API fails", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<CommunityTeaser />);

    // Should show backup reviews
    expect(
      screen.getByText(
        `${BACKUP_REVIEWS[0]?.name}: ${BACKUP_REVIEWS[0]?.content}`,
      ),
    ).toBeInTheDocument();

    // Should show error badge
    expect(screen.getByText("使用備用資料")).toBeInTheDocument();
  });

  it("navigates to community wall when clicking real review", () => {
    const mockData = [
      {
        id: "uuid-1",
        displayId: "A",
        name: "Real User",
        rating: 5,
        tags: ["#Tag"],
        content: "Real content",
        source: "real",
        communityId: "comm-123",
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    render(<CommunityTeaser />);

    const card = screen
      .getByText("Real User: Real content")
      .closest('div[role="button"]');
    fireEvent.click(card!);

    expect(mockNavigate).toHaveBeenCalledWith("/community/comm-123/wall");
  });

  it("redirects to static page when clicking seed review", () => {
    const mockData = [
      {
        id: "seed-1",
        displayId: "B",
        name: "Seed User",
        rating: 5,
        tags: ["#Tag"],
        content: "Seed content",
        source: "seed",
        communityId: null,
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    render(<CommunityTeaser />);

    const card = screen
      .getByText("Seed User: Seed content")
      .closest('div[role="button"]');
    fireEvent.click(card!);

    expect(window.location.href).toBe("/maihouses/community-wall_mvp.html");
  });
});
