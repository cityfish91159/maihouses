/**
 * 591 物件資訊解析器 (IM-2 Production Grade v2.4)
 * @description 用於解析從 591 網站複製的物件內容，帶多重 fallback 策略
 * @version 2.4.0 - 2025-12-30
 *
 * 修正項目 (Audit Fixes):
 * - 2.1: 價格正規化 (統一轉為「萬」單位，支援億、元/月轉換)
 * - 2.2: fieldsFound 修正 (格局、ID 不重複計分)
 * - 2.3: 格局容錯 (1.5衛、0廳、開放式)
 * - 2.4: 坪數模糊 fallback (移除括號、含車位等廢字)
 * - 2.5: 標題評分優化 (過濾無效行，支援低數字率放行)
 * - 2.6: 地址正規化 (台/臺、跨行)
 * - 2.7: Detect591 增強 (租金+地名覆蓋)
 */

export interface Parse591Result {
  /** 物件標題 */
  title?: string;
  /** 價格數值（統一為「萬」單位） */
  price?: string;
  /** 價格單位：'萬' | '萬/月' | '元/月' | '元' */
  priceUnit?: string;
  /** 原始價格字串（供 UI 顯示） */
  priceRaw?: string;
  /** 地址 */
  address?: string;
  /** 坪數 */
  size?: string;
  /** 房數 */
  rooms?: string;
  /** 廳數 */
  halls?: string;
  /** 衛浴數（支援小數如 1.5） */
  bathrooms?: string;
  /** 591 物件 ID */
  listingId?: string;
  /** 信心分數 (0-100) */
  confidence: number;
  /** 已解析的欄位數量（價格/坪數/格局/地址/標題，各算一欄） */
  fieldsFound: number;
  /** 缺失的欄位列表 */
  missingFields: string[];
}

// ============ 信心分數配置 (SSOT) ============

const CONFIDENCE = {
  PRICE: 25,
  SIZE: 25,
  LAYOUT_FULL: 20,
  LAYOUT_STUDIO: 15,
  ADDRESS: 20,
  TITLE: 10,
} as const;

// ============ 正規化函數 ============

/** 台/臺 正規化 */
function normalizeCity(text: string): string {
  return text.replace(/臺/g, "台");
}

/** 合併跨行文字 */
function mergeLines(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** 清理坪數字串（移除「約」「含車位」「含公設」等） */
function cleanSize(str: string): string {
  return str
    .replace(/約/g, "")
    .replace(/含車位/g, "")
    .replace(/含公設/g, "") // 2.4 模糊 fallback
    .replace(/\([^)]*\)/g, "")
    .replace(/（[^）]*）/g, "")
    .trim();
}

/** 數值轉換：統一轉為「萬」與「萬/月」 */
function normalizePriceValue(
  valStr: string,
  originalUnit: "億" | "萬" | "元",
): string {
  let val = parseFloat(valStr.replace(/,/g, ""));
  if (isNaN(val)) return valStr;

  if (originalUnit === "億") {
    val = val * 10000;
  } else if (originalUnit === "元") {
    val = val / 10000;
  }
  // 萬則不變

  // 移除多餘小數 (最多小數點後 4 位, e.g. 0.25 萬)
  return parseFloat(val.toFixed(4)).toString();
}

// ============ 價格解析模式 (支援租/售區分 & 單位正規化) ============

interface PriceMatch {
  value: string;
  unit: string;
  raw: string;
}

/** 解析價格，回傳數值(萬)、單位、原始字串 */
function parsePrice(text: string): PriceMatch | null {
  // 售價/總價：億元 (2.1 億 -> 21000 萬)
  const billionMatch = text.match(/(?:售價|總價)[：:]\s*([\d.]+)\s*億/);
  if (billionMatch && billionMatch[1]) {
    return {
      value: normalizePriceValue(billionMatch[1], "億"),
      unit: "萬",
      raw: billionMatch[0],
    };
  }

  // 售價/總價：萬元
  const saleMatch = text.match(/(?:售價|總價)[：:]\s*([\d,.]+)\s*萬/);
  if (saleMatch && saleMatch[1]) {
    return {
      value: normalizePriceValue(saleMatch[1], "萬"),
      unit: "萬",
      raw: saleMatch[0],
    };
  }

  // 月租金/租金：XX 元/月 -> 轉為 萬/月
  const rentMonthMatch = text.match(
    /(?:月租金?|租金)[：:]\s*([\d,]+)\s*(?:元)?(?:\/月)?/,
  );
  if (rentMonthMatch && rentMonthMatch[1]) {
    return {
      value: normalizePriceValue(rentMonthMatch[1], "元"),
      unit: "萬/月", // 審查要求保持月租標識，並以萬為主(推測)；或回傳 '元/月' 但數值已轉萬？
      // 根據審查: "統一萬為主，月租保持『萬/月』"
      raw: rentMonthMatch[0],
    };
  }

  // 簡單格式：XXXX 萬
  const simpleWanMatch = text.match(/([\d,.]+)\s*萬(?:元)?/);
  if (simpleWanMatch && simpleWanMatch[1]) {
    return {
      value: normalizePriceValue(simpleWanMatch[1], "萬"),
      unit: "萬",
      raw: simpleWanMatch[0],
    };
  }

  // 簡單元/月格式
  const simpleRentMatch = text.match(/([\d,]+)\s*元\s*\/\s*月/);
  if (simpleRentMatch && simpleRentMatch[1]) {
    return {
      value: normalizePriceValue(simpleRentMatch[1], "元"),
      unit: "萬/月", // P0: 統一為萬/月
      raw: simpleRentMatch[0],
    };
  }

  return null;
}

// ============ 坪數解析模式 (含模糊 fallback) ============

const SIZE_PATTERNS = [
  // 精準格式
  /(?:權狀|建坪|室內|主建物|坪數|使用)[：:]\s*([\d.]+)\s*坪/,
  // 模糊格式 (2.4)
  /(?:約)?\s*([\d.]+)\s*坪/,
  // P1: 坪(含車位)
  /([\d.]+)\s*坪(?:\(含車位\))?/,
] as const;

// ============ 格局解析模式 (支援半衛/0廳/開放式) ============

const LAYOUT_PATTERNS = [
  // 0: 標準+擴充 (支援 1+1房 / 2.5房 / 3房 / 1.5衛)
  // 策略: 數值保留 String, 但若含 "+", normalizeRooms 會進行加總 (如 1+1->2)
  /((?:\d+(?:\.\d+)?)(?:\+\d)?)\s*房\s*(\d+)\s*廳\s*([\d.]+)\s*衛/,
  // 1: 無廳格式：3房2衛 -> 0廳
  /((?:\d+(?:\.\d+)?)(?:\+\d)?)\s*房\s*([\d.]+)\s*衛/,
  // 2: 開放式格局
  /開放式/,
] as const;

// ============ 地址解析模式 (台/臺正規化，跨行) ============

const ADDRESS_PATTERNS = [
  // Pattern 0: 完整地址 (有號/樓)
  /[台臺新]?(?:北|中|南|東|竹)?(?:市|縣)?[^，,\n：:]{2,5}[區鄉鎮市][^，,\n：:]{2,40}[號樓](?:之\d+)?(?:樓)?/,
  // Pattern 1: 寬鬆地址 (無門牌，只到段/巷/弄)
  /[台臺新]?(?:北|中|南|東|竹)?(?:市|縣)?[^，,\n：:]{2,5}[區鄉鎮市][^，,\n：:]{2,40}[路街道段巷弄]/,
  // Pattern 2: 寬鬆地址 (至少到路/街)
  /(?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|新竹|基隆|嘉義)[市縣]?[^，,\n：:]{2,30}[路街道]/,
] as const;

/** 591 物件 ID 解析模式 */
const ID_PATTERNS = [
  /detail\/(\d+)/,
  /id=(\d+)/,
  /591\.com\.tw\/\w+\/(\d+)/,
] as const;

// ============ 標題評分函數 ============

/**
 * 標題評分邏輯：扣掉價格/地址/ID 行，選最高分
 */
function scoreTitleLine(line: string, allText: string): number {
  const trimmed = line.trim();
  let score = 0;

  // 2.5: 長度 8-40
  if (trimmed.length < 5 || trimmed.length > 60) return -100;
  if (trimmed.length >= 8 && trimmed.length <= 40) score += 10;
  else score += 5;

  // 數字過多扣分
  const digitCount = (trimmed.match(/\d/g) || []).length;
  const ratio = digitCount / trimmed.length;
  if (ratio > 0.4) return -100;

  // 排除清單 (2.5)
  if (
    /^(售價|總價|租金|單價|坪數|格局|地址|樓層|屋齡|型態|用途|https?|591)/.test(
      trimmed,
    )
  )
    return -100;
  if (trimmed.includes("元/月") || trimmed.includes("萬元")) return -100;
  // 必須包含至少一個中文字 (避免純英文/數字雜訊)
  if (!/[\u4e00-\u9fa5]/.test(trimmed)) return -100;

  // 加分詞
  const positiveKeywords = [
    "景觀",
    "視野",
    "採光",
    "方正",
    "捷運",
    "學區",
    "裝潢",
    "全新",
    "電梯",
    "車位",
  ];
  let positiveHits = 0;
  for (const kw of positiveKeywords) {
    if (trimmed.includes(kw)) {
      score += 3;
      positiveHits++;
    }
  }

  // 房產詞 (門檻)
  const realEstateKeywords = [
    "房",
    "廳",
    "衛",
    "坪",
    "公寓",
    "大樓",
    "透天",
    "別墅",
    "套房",
    "雅房",
    "住家",
    "店面",
  ];
  let hits = 0;
  for (const kw of realEstateKeywords) {
    if (trimmed.includes(kw)) {
      score += 1;
      hits++;
    }
  }

  // P1/v2.4: 放寬門檻
  if (hits === 0) {
    // 若無房產詞，必須有正向詞 OR (數字率極低 且 長度>=8)
    // 避免 "今天天氣真好" (短廢話) 或 "Hello World" (已由中文檢核擋掉)
    const lowRatioPass = ratio <= 0.2 && trimmed.length >= 8;
    if (positiveHits === 0 && !lowRatioPass) return -100;
  }

  return score;
}

function selectBestTitle(lines: string[], allText: string): string | null {
  const candidates = lines
    .map((line) => ({
      line: line.trim(),
      score: scoreTitleLine(line, allText),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
  return candidates.length > 0 && candidates[0] ? candidates[0].line : null;
}

// ============ 輔助函數 ============

// 2.12: 處理 1+1 房 -> 2 房 (含錯誤處理)
function normalizeRooms(raw: string): string {
  if (raw.includes("+")) {
    const sum = raw.split("+").reduce((acc, curr) => {
      const num = parseFloat(curr);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    // 避免返回 NaN 或無效值
    return sum > 0 ? sum.toString() : raw;
  }
  return raw;
}

// ============ 主解析函數 ============

export function parse591Content(text: string): Parse591Result {
  const result: Parse591Result = {
    confidence: 0,
    fieldsFound: 0,
    missingFields: [],
  };

  if (!text || text.trim().length === 0) {
    result.missingFields = ["價格", "坪數", "格局", "地址", "標題"];
    return result;
  }

  const merged = mergeLines(text);
  const normalized = normalizeCity(merged); // 2.6: 台/臺正規化

  // 1. 價格 (IM-2.1)
  const priceMatch = parsePrice(normalized);
  if (priceMatch) {
    result.price = priceMatch.value;
    result.priceUnit = priceMatch.unit;
    result.priceRaw = priceMatch.raw;
    result.fieldsFound++;
    result.confidence += CONFIDENCE.PRICE;
  } else {
    result.missingFields.push("價格");
  }

  // 2. 坪數 (IM-2.2, 2.4)
  let sizeFound = false;
  // 先嘗試原始，再嘗試 cleanSize
  // 審查建議：行合併後先精準...清洗後寬鬆
  for (const pattern of SIZE_PATTERNS) {
    // 策略：對每一行嘗試 pattern? 或者全文。normalized 是全文。
    // SIZE_PATTERNS[0] 是精準，[1] 是模糊。
    let match = normalized.match(pattern);
    if (!match) {
      // 嘗試 cleanSize 後再 match
      const cleaned = cleanSize(normalized);
      match = cleaned.match(pattern);
    }

    if (match && match[1]) {
      result.size = match[1];
      result.fieldsFound++;
      result.confidence += CONFIDENCE.SIZE;
      sizeFound = true;
      break;
    }
  }
  if (!sizeFound) result.missingFields.push("坪數");

  // 3. 格局 (IM-2.3)
  let layoutFound = false;

  // 3.1 P1: 支援 1+1房 / 2.5房
  const stdMatch = normalized.match(LAYOUT_PATTERNS[0]); // Index 0 (Updated)
  if (stdMatch && stdMatch[1] && stdMatch[2] && stdMatch[3]) {
    result.rooms = normalizeRooms(stdMatch[1]); // 2.12: Sum 1+1
    result.halls = stdMatch[2];
    result.bathrooms = stdMatch[3];
    layoutFound = true;
    result.confidence += CONFIDENCE.LAYOUT_FULL;
  }

  // 3.2 無廳 (3房2衛) / 1+1房2衛
  if (!layoutFound) {
    const noHallMatch = normalized.match(LAYOUT_PATTERNS[1]); // Index 1 (Updated)
    if (noHallMatch && noHallMatch[1] && noHallMatch[2]) {
      result.rooms = normalizeRooms(noHallMatch[1]); // 2.12: Sum 1+1
      result.halls = "0";
      result.bathrooms = noHallMatch[2];
      layoutFound = true;
      result.confidence += CONFIDENCE.LAYOUT_FULL;
    }
  }

  // 3.3 開放式/套房
  if (!layoutFound) {
    if (
      normalized.includes("開放式") ||
      normalized.includes("套房") ||
      normalized.includes("雅房")
    ) {
      result.rooms = "1"; // 視為 1 房 (Studio)
      result.halls = "0";
      result.bathrooms = "1";
      layoutFound = true;
      result.confidence += CONFIDENCE.LAYOUT_STUDIO; // 15分
    }
  }

  if (layoutFound) {
    result.fieldsFound++; // 2.2: 格局只算一欄
  } else {
    result.missingFields.push("格局");
  }

  // 4. 地址 (IM-2.4, 2.6)
  let addressFound = false;
  for (const pattern of ADDRESS_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      result.address = match[0].trim();
      result.fieldsFound++;
      result.confidence += CONFIDENCE.ADDRESS;
      addressFound = true;
      break;
    }
  }
  if (!addressFound) result.missingFields.push("地址");

  // 5. 標題 (IM-2.5)
  const lines = normalized.split("\n").filter((l) => l.trim().length > 0);
  const bestTitle = selectBestTitle(lines, normalized);
  if (bestTitle) {
    result.title = bestTitle;
    result.fieldsFound++;
    result.confidence += CONFIDENCE.TITLE; // 10分
  } else {
    result.missingFields.push("標題");
  }

  // 6. ID (IM-2.6) - 不計分
  for (const pattern of ID_PATTERNS) {
    const patternMatch = normalized.match(pattern);
    if (patternMatch && patternMatch[1]) {
      result.listingId = patternMatch[1];
      break;
    }
  }

  // 封頂
  result.confidence = Math.min(result.confidence, 100);

  return result;
}

// 2.7 Detect591 增強
export function detect591Content(text: string): boolean {
  // R4: 降低門檻至 8 (適應 "租金25000台北" 等短貼文)
  if (!text || text.trim().length < 8) return false;
  if (text.includes("591")) return true;

  // 關鍵字計分
  let score = 0;
  if (/[\d,]+\s*(?:萬|元)/.test(text)) score++;
  if (/[\d.]+\s*坪/.test(text)) score++;
  if (/\d+房/.test(text)) score++;
  if (/(?:台北|臺北|新北|桃園|台中|高雄)[市縣]/.test(text)) score++;
  // if (/(?:月租|租金|元\/月)/.test(text)) score++; // P1: 移除單獨租金給分，避免與金額重複計分導致純租金誤判

  // P1: 租金+地名 強力特徵 (避免純數字+元誤判)
  const hasRent = /(?:月租|租金|元\/月)/.test(text);
  const hasLoc = /(?:台北|臺北|新北|桃園|台中|高雄)[市縣]/.test(text);
  if (hasRent && hasLoc) score += 2;

  // P1: 純租金無地名，應排除 (score >= 2 才能通過)
  // 如果只有 租金 (1分) -> Fail. Good.

  return score >= 2;
}
