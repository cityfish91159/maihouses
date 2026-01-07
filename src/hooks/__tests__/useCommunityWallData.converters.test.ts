import {
  convertApiPost,
  convertApiReview,
  convertApiQuestion,
  convertApiData,
  formatTimeAgo,
} from "../communityWallConverters";
import type { CommunityWallData } from "../../services/communityService";

type CommunityPostInput = Parameters<typeof convertApiPost>[0];
type CommunityReviewInput = Parameters<typeof convertApiReview>[0];
type CommunityQuestionInput = Parameters<typeof convertApiQuestion>[0];

const basePost: CommunityPostInput = {
  id: "post-1",
  community_id: "community-1",
  author_id: "author-1",
  content: "這是一段超過二十個字的貼文內容方便測試標題截斷",
  visibility: "public",
  likes_count: 0,
  liked_by: [],
  created_at: new Date().toISOString(),
};

const baseReview: CommunityReviewInput = {
  id: "review-1",
  community_id: "community-1",
  author_id: "agent-1",
  content: {
    pros: ["親子設施完善"],
    cons: "車道較陡",
  },
  created_at: new Date().toISOString(),
};

const baseQuestion: CommunityQuestionInput = {
  id: "question-1",
  community_id: "community-1",
  author_id: "resident-1",
  question: "停車位好停嗎？",
  created_at: new Date().toISOString(),
  answers: [
    {
      id: "answer-1",
      author_id: "agent-1",
      content: "B2 位置比較多，B1 要排隊",
      is_expert: true,
      created_at: new Date().toISOString(),
    },
  ],
};

const baseCommunityData: CommunityWallData = {
  communityInfo: {
    name: "測試社區",
    year: 2020,
    units: 100,
    managementFee: 80,
    builder: "測試建商",
    members: 10,
    avgRating: 4,
    monthlyInteractions: 30,
    forSale: 2,
  },
  posts: {
    public: [{ ...basePost }],
    private: [],
    publicTotal: 1,
    privateTotal: 0,
  },
  reviews: {
    items: [{ ...baseReview }],
    total: 1,
  },
  questions: {
    items: [{ ...baseQuestion }],
    total: 1,
  },
};

describe("convertApiPost", () => {
  it("trims floor information and omits blank values", () => {
    const trimmed = convertApiPost({
      ...basePost,
      author: {
        name: "12F 住戶",
        floor: " 12F ",
        role: "resident",
      },
    });
    expect(trimmed.floor).toBe("12F");

    const emptyFloor = convertApiPost({
      ...basePost,
      id: "post-2",
      author: {
        name: "匿名",
        floor: "   ",
        role: "resident",
      },
    });
    expect(emptyFloor.floor).toBeUndefined();
  });

  it("marks private posts and keeps API counters", () => {
    const converted = convertApiPost({
      ...basePost,
      visibility: "private",
      comments_count: 5,
      is_pinned: true,
      author: {
        name: "管委會",
        role: "member",
      },
    });

    expect(converted.private).toBe(true);
    expect(converted.comments).toBe(5);
    expect(converted.pinned).toBe(true);
  });
});

describe("convertApiReview", () => {
  it("filters default company name and trims result", () => {
    const filtered = convertApiReview({
      ...baseReview,
      agent: {
        name: "房仲一哥",
        company: "房仲公司",
        stats: { visits: 3, deals: 1 },
      },
    });
    expect(filtered.company).toBe("");

    const trimmed = convertApiReview({
      ...baseReview,
      id: "review-2",
      agent: {
        name: "小華",
        company: " 信義房屋 ",
        stats: { visits: 8, deals: 2 },
      },
    });
    expect(trimmed.company).toBe("信義房屋");
    expect(trimmed.visits).toBe(8);
    expect(trimmed.deals).toBe(2);
  });
});

describe("convertApiQuestion", () => {
  it("maps answers with fallback author information", () => {
    const converted = convertApiQuestion({
      ...baseQuestion,
      answers: [
        {
          id: "answer-1",
          author_id: "resident-2",
          content: "晚上還算安靜",
          is_expert: false,
          created_at: new Date().toISOString(),
        },
      ],
    });

    expect(converted.answers[0]?.author).toBe("用戶-reside");
    expect(converted.answers[0]?.type).toBe("resident");
    expect(converted.answersCount).toBe(1);
  });

  it("handles missing answers arrays gracefully", () => {
    const converted = convertApiQuestion({
      ...baseQuestion,
      id: "question-2",
      answers: undefined as unknown as CommunityQuestionInput["answers"],
    });

    expect(converted.answersCount).toBe(0);
    expect(converted.answers).toEqual([]);
  });
});

describe("convertApiData", () => {
  it("falls back to empty arrays when reviews or questions are missing", () => {
    const converted = convertApiData({
      ...baseCommunityData,
      reviews: {
        items: null as unknown as typeof baseCommunityData.reviews.items,
        total: 0,
      },
      questions: {
        items: undefined as unknown as typeof baseCommunityData.questions.items,
        total: 0,
      },
    });

    expect(converted.reviews).toEqual({ items: [], total: 0 });
    expect(converted.questions).toEqual({ items: [], total: 0 });
  });
});

describe("formatTimeAgo", () => {
  it("returns 剛剛 when difference is less than a minute", () => {
    const justNow = new Date().toISOString();
    expect(formatTimeAgo(justNow)).toBe("剛剛");
  });

  it("returns localized date string for future timestamps", () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 1000);
    const future = futureDate.toISOString();
    expect(formatTimeAgo(future)).toBe(futureDate.toLocaleDateString("zh-TW"));
  });

  it("returns 剛剛 for invalid timestamps", () => {
    expect(formatTimeAgo("not-a-date")).toBe("剛剛");
  });
});
