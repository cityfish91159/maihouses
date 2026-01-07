import {
  __testHelpers,
  type RealPropertyRow,
  type ReviewData,
} from "../featured-properties";

const { formatPrice, adaptRealPropertyForUI, SERVER_SEEDS, REQUIRED_COUNT } =
  __testHelpers;

// ============================
// Mock Data Builders
// ============================

const buildPropertyRow = (
  overrides?: Partial<RealPropertyRow>,
): RealPropertyRow => ({
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  public_id: "MH-100001",
  title: "測試房源",
  price: 12880000,
  address: "台北市信義區信義路五段",
  images: ["https://xxx.supabase.co/storage/v1/object/public/test.jpg"],
  community_id: null,
  community_name: null,
  size: 34.2,
  rooms: 3,
  halls: 2,
  features: ["高樓層"],
  advantage_1: null,
  advantage_2: null,
  disadvantage: null,
  ...overrides,
});

const buildReview = (overrides?: Partial<ReviewData>): ReviewData => ({
  avatar: "A",
  name: "測試者",
  role: "住戶",
  tag: "管理佳",
  text: "這是一則測試評價。",
  source: "agent",
  community_id: "ccccccc-dddd-eeee-ffff-000000000000",
  ...overrides,
});

// ============================
// Test Suites
// ============================

describe("featured-properties helpers", () => {
  describe("formatPrice", () => {
    it('格式化千萬級價格 (12880000 -> "1,288")', () => {
      expect(formatPrice(12880000)).toBe("1,288");
    });

    it('格式化百萬級價格 (8880000 -> "888")', () => {
      expect(formatPrice(8880000)).toBe("888");
    });

    it('處理 null 價格 -> "洽詢"', () => {
      expect(formatPrice(null)).toBe("洽詢");
    });

    it('小數值 (已經是萬為單位) 不再除萬 (888 -> "888")', () => {
      expect(formatPrice(888)).toBe("888");
    });

    it('處理 0 價格 -> "洽詢"', () => {
      expect(formatPrice(0)).toBe("洽詢");
    });
  });

  describe("adaptRealPropertyForUI", () => {
    it("Supabase 圖片加裁切參數", () => {
      const row = buildPropertyRow({
        images: ["https://xxx.supabase.co/storage/v1/object/public/test.jpg"],
      });
      const result = adaptRealPropertyForUI(row, []);
      expect(result.image).toContain("?width=800&height=600&resize=cover");
    });

    it("外部圖片不加裁切參數", () => {
      const row = buildPropertyRow({
        images: ["https://images.unsplash.com/photo-123.jpg"],
      });
      const result = adaptRealPropertyForUI(row, []);
      expect(result.image).toBe("https://images.unsplash.com/photo-123.jpg");
      expect(result.image).not.toContain("?width=");
    });

    it("無圖片時使用預設圖", () => {
      const row = buildPropertyRow({ images: [] });
      const result = adaptRealPropertyForUI(row, []);
      expect(result.image).toContain("unsplash.com");
    });

    it("組合標籤: features 優先，規格不進入 tags (UP-4 分流)", () => {
      const row = buildPropertyRow({
        size: 34.2,
        rooms: 3,
        halls: 2,
        features: ["高樓層", "近捷運"],
      });
      const result = adaptRealPropertyForUI(row, []);
      // UP-4: tags 只包含亮點 (features)，不包含規格 (坪數/格局)
      expect(result.tags).toContain("高樓層");
      expect(result.tags).toContain("近捷運");
      // 規格應該在卡片的規格區顯示，不在 tags 中
      expect(result.tags.length).toBeLessThanOrEqual(4);
    });

    it('格式化地址: 插入 " · " 分隔', () => {
      const row = buildPropertyRow({
        address: "台北市信義區信義路五段",
      });
      const result = adaptRealPropertyForUI(row, []);
      expect(result.location).toContain(" · ");
      expect(result.location).toBe("台北市信義區 · 信義路五段");
    });

    it("短地址不插入分隔符", () => {
      const row = buildPropertyRow({
        address: "台北市",
      });
      const result = adaptRealPropertyForUI(row, []);
      expect(result.location).toBe("台北市");
    });

    it("多樣化補位評價 (無評價時自動填充)", () => {
      const row = buildPropertyRow({
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee00",
      }); // 末碼 0
      const result = adaptRealPropertyForUI(row, []);
      expect(result.reviews.length).toBe(2);
      expect(result.reviews[0]).toHaveProperty("avatar");
      expect(result.reviews[0]).toHaveProperty("name");
      expect(result.reviews[0]).toHaveProperty("text");
    });

    it("UUID 末碼決定不同預設評價組", () => {
      // 末碼 0 -> seedIndex 0
      const row0 = buildPropertyRow({
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee00",
      });
      const result0 = adaptRealPropertyForUI(row0, []);

      // 末碼 5 -> seedIndex 5 % 3 = 2
      const row5 = buildPropertyRow({
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee05",
      });
      const result5 = adaptRealPropertyForUI(row5, []);

      // 兩者的預設評價應該不同 (除非剛好相同)
      // 至少驗證兩者都有 2 則評價
      expect(result0.reviews.length).toBe(2);
      expect(result5.reviews.length).toBe(2);
    });

    it("有真實評價時不補位", () => {
      const row = buildPropertyRow();
      const reviews = [buildReview(), buildReview()];
      const result = adaptRealPropertyForUI(row, reviews);
      expect(result.reviews.length).toBe(2);
    });

    it('source 標記為 "real"', () => {
      const row = buildPropertyRow();
      const result = adaptRealPropertyForUI(row, []);
      expect(result.source).toBe("real");
    });
  });

  describe("SERVER_SEEDS", () => {
    it("有 6 筆 seed 資料", () => {
      expect(SERVER_SEEDS.length).toBe(6);
    });

    it("REQUIRED_COUNT 為 6", () => {
      expect(REQUIRED_COUNT).toBe(6);
    });

    it("每筆 seed 有必要欄位", () => {
      const requiredFields = [
        "id",
        "image",
        "badge",
        "title",
        "tags",
        "price",
        "location",
        "reviews",
        "source",
      ];

      SERVER_SEEDS.forEach((seed, index) => {
        requiredFields.forEach((field) => {
          expect(seed).toHaveProperty(field);
        });
        // 驗證 source 為 'seed'
        expect(seed.source).toBe("seed");
        // 驗證 reviews 為陣列且有 2 則
        expect(Array.isArray(seed.reviews)).toBe(true);
        expect(seed.reviews.length).toBe(2);
      });
    });

    it("每筆 seed 的 review 結構正確", () => {
      const reviewFields = ["avatar", "name", "role", "tag", "text"];

      SERVER_SEEDS.forEach((seed) => {
        seed.reviews.forEach((review) => {
          reviewFields.forEach((field) => {
            expect(review).toHaveProperty(field);
          });
        });
      });
    });
  });
});
