import {
  buildKeyCapsuleTags,
  formatArea,
  formatLayout,
  formatFloor,
} from "../keyCapsules";

describe("formatArea", () => {
  it("應正確格式化坪數", () => {
    expect(formatArea(34.2)).toBe("34.2 坪");
    expect(formatArea(20)).toBe("20.0 坪");
    expect(formatArea(0)).toBe(null);
    expect(formatArea(-1)).toBe(null);
    expect(formatArea(null)).toBe(null);
  });
});

describe("formatLayout", () => {
  it("應正確格式化格局", () => {
    expect(formatLayout(3, 2)).toBe("3 房 2 廳");
    expect(formatLayout(2, 0)).toBe("2 房");
    expect(formatLayout(2, null)).toBe("2 房");
    expect(formatLayout(0, 2)).toBe(null);
    expect(formatLayout(null, null)).toBe(null);
  });
});

describe("formatFloor", () => {
  it("應正確格式化樓層並使用繁中單位", () => {
    expect(formatFloor("12", 15)).toBe("12 樓 / 15 層");
    expect(formatFloor("12F", 15)).toBe("12 樓 / 15 層");
    expect(formatFloor("12 f", 15)).toBe("12 樓 / 15 層");
    expect(formatFloor("頂樓", 20)).toBe("頂樓 / 20 層");
    expect(formatFloor("5", null)).toBe("5 樓");
    expect(formatFloor(null, 10)).toBe(null);
    expect(formatFloor("  ", 10)).toBe(null);
  });
});

describe("buildKeyCapsuleTags", () => {
  it("優先使用 advantage1/2 作為 highlights", () => {
    const tags = buildKeyCapsuleTags({
      advantage1: "近捷運",
      advantage2: "有車位",
      size: 34.2,
      rooms: 3,
      halls: 2,
      features: ["高樓層"],
    });

    expect(tags[0]).toBe("近捷運");
    expect(tags[1]).toBe("有車位");
    expect(tags.length).toBe(2);
  });

  it("advantage 不足時從 features 補 highlights，並去重", () => {
    const tags = buildKeyCapsuleTags({
      advantage1: "近捷運",
      advantage2: " ",
      features: ["近捷運", "高樓層"],
      size: 20,
      rooms: 2,
      halls: 0,
    });

    expect(tags[0]).toBe("近捷運");
    expect(tags[1]).toBe("高樓層");
    expect(tags.length).toBe(2);
  });

  // UP-4: 樓層自動推斷已移除，亮點必須手動輸入
  // 「高樓層」若要顯示，必須由用戶在 advantage1/advantage2/features 中明確填寫
  it("UP-4: 不再自動推斷高/低樓層，僅接受明確輸入", () => {
    // 沒有 advantage，即使樓層數據存在也不會自動生成膠囊
    const tagsNoAdvantage = buildKeyCapsuleTags({
      floorCurrent: "12",
      floorTotal: 15,
      size: 30,
      rooms: 3,
    });
    expect(tagsNoAdvantage.length).toBe(0);

    // 有明確 advantage 才會顯示
    const tagsWithAdvantage = buildKeyCapsuleTags({
      advantage1: "高樓層",
      floorCurrent: "12",
      floorTotal: 15,
      size: 30,
      rooms: 3,
    });
    expect(tagsWithAdvantage[0]).toBe("高樓層");
    expect(tagsWithAdvantage.length).toBe(1);
  });

  it("應嚴格遵守 index 語意與長度限制 (P1 缺失修正)", () => {
    const tags = buildKeyCapsuleTags({
      advantage1: "賣點1",
      advantage2: "賣點2",
      features: ["賣點3", "賣點4"],
      size: 25,
      rooms: 2,
      halls: 1,
    });

    expect(tags.length).toBe(2);
    expect(tags[0]).toBe("賣點1");
    expect(tags[1]).toBe("賣點2");
  });

  it("處理空值與異常輸入 (P1 缺失修正)", () => {
    const tags = buildKeyCapsuleTags({
      advantage1: null,
      advantage2: undefined,
      features: [],
      size: -1,
      rooms: 0,
    });

    expect(tags).toEqual([]);
  });
});
