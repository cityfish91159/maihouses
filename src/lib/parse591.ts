/**
 * 591 物件資訊解析器 (IM-2 Production Grade v2.1)
 * @description 用於解析從 591 網站複製的物件內容，帶多重 fallback 策略
 * @version 2.1.0 - 2025-12-29
 * 
 * 修正項目：
 * - 2.1: 價格正規化，支援租/售單位區分，億→萬換算
 * - 2.2: fieldsFound 一欄一計（格局只算一欄）
 * - 2.3: 格局容錯：1.5衛、0廳、開放式
 * - 2.4: 坪數模糊 fallback：約XX坪、含車位、含公設
 * - 2.5: 標題評分制，選最高分候選
 * - 2.6: 地址正規化台/臺，跨行合併
 * - 2.7: detect591 增強租金特徵
 */

export interface Parse591Result {
  /** 物件標題 */
  title?: string;
  /** 價格數值（統一為萬或月租） */
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
  return text.replace(/臺/g, '台');
}

/** 合併跨行文字 */
function mergeLines(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** 清理坪數字串（移除「約」「含車位」「含公設」等） */
function cleanSize(str: string): string {
  return str
    .replace(/約/g, '')
    .replace(/含車位/g, '')
    .replace(/含公設/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .trim();
}

// ============ 價格解析模式 (支援租/售區分) ============

interface PriceMatch {
  value: string;
  unit: string;
  raw: string;
}

/** 解析價格，回傳數值、單位、原始字串 */
function parsePrice(text: string): PriceMatch | null {
  // 售價/總價：億元
  const billionMatch = text.match(/(?:售價|總價)[：:]\s*([\d.]+)\s*億/);
  if (billionMatch && billionMatch[1] && billionMatch[0]) {
    const value = String(parseFloat(billionMatch[1]) * 10000);
    return { value, unit: '萬', raw: billionMatch[0] };
  }

  // 售價/總價：萬元
  const saleMatch = text.match(/(?:售價|總價)[：:]\s*([\d,]+)\s*萬/);
  if (saleMatch && saleMatch[1] && saleMatch[0]) {
    const value = saleMatch[1].replace(/,/g, '');
    return { value, unit: '萬', raw: saleMatch[0] };
  }

  // 月租金/租金：XX 元/月
  const rentMonthMatch = text.match(/(?:月租金?|租金)[：:]\s*([\d,]+)\s*(?:元)?(?:\/月)?/);
  if (rentMonthMatch && rentMonthMatch[1] && rentMonthMatch[0]) {
    const value = rentMonthMatch[1].replace(/,/g, '');
    return { value, unit: '元/月', raw: rentMonthMatch[0] };
  }

  // 季租金
  const quarterMatch = text.match(/季租金?[：:]\s*([\d,]+)\s*元?/);
  if (quarterMatch && quarterMatch[1] && quarterMatch[0]) {
    const value = quarterMatch[1].replace(/,/g, '');
    return { value, unit: '元/季', raw: quarterMatch[0] };
  }

  // 年租金
  const yearMatch = text.match(/年租金?[：:]\s*([\d,]+)\s*元?/);
  if (yearMatch && yearMatch[1] && yearMatch[0]) {
    const value = yearMatch[1].replace(/,/g, '');
    return { value, unit: '元/年', raw: yearMatch[0] };
  }

  // 簡化格式：XXXX 萬（無冒號，預設售價）
  const simpleWanMatch = text.match(/([\d,]+)\s*萬(?:元)?/);
  if (simpleWanMatch && simpleWanMatch[1] && simpleWanMatch[0]) {
    const value = simpleWanMatch[1].replace(/,/g, '');
    return { value, unit: '萬', raw: simpleWanMatch[0] };
  }

  // 簡化元/月格式
  const simpleRentMatch = text.match(/([\d,]+)\s*元\s*\/\s*月/);
  if (simpleRentMatch && simpleRentMatch[1] && simpleRentMatch[0]) {
    const value = simpleRentMatch[1].replace(/,/g, '');
    return { value, unit: '元/月', raw: simpleRentMatch[0] };
  }

  return null;
}

// ============ 坪數解析模式 (含模糊 fallback) ============

const SIZE_PATTERNS = [
  // 精準格式：權狀/建坪/室內/坪數：34.2 坪
  /(?:權狀|建坪|室內|主建物|坪數)[：:]\s*([\d.]+)\s*坪/,
  // 含車位/公設後的坪數
  /(?:約)?\s*([\d.]+)\s*坪\s*(?:\(含[^)]+\)|（含[^）]+）)?/,
  // 最寬鬆：任何數字+坪
  /([\d.]+)\s*坪/,
] as const;

// ============ 格局解析模式 (支援半衛/0廳/開放式) ============

const LAYOUT_PATTERNS = [
  // 標準格局：3房2廳2衛（支援空白和半衛 1.5）
  /(\d+)\s*房\s*(\d+)\s*廳\s*([\d.]+)\s*衛/,
  // 冒號格式：格局：3房2廳2衛
  /格局[：:]\s*(\d+)\s*房\s*(\d+)\s*廳\s*([\d.]+)\s*衛/,
  // 無廳格式：3房2衛（0廳）
  /(\d+)\s*房\s*([\d.]+)\s*衛/,
  // 開放式格局
  /開放式\s*(\d+)?\s*房?\s*([\d.]+)?\s*衛?/,
] as const;

// ============ 地址解析模式 (台/臺正規化，跨行) ============

const ADDRESS_PATTERNS = [
  // 完整地址：台北市信義區信義路五段7號3樓之2
  /[台臺]?(?:北|中|南|東)?(?:市|縣)?[^，,\n]{0,5}[區鄉鎮市][^，,\n]{2,30}[路街道巷弄號樓](?:之\d+)?/,
  // 主要城市完整地址
  /(?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|新竹|基隆|嘉義)[市縣]?[^，,\n]{2,30}[區鄉鎮][^，,\n]{0,25}[路街道巷弄號樓]?/,
  // 簡化地址：只到區
  /(?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|新竹|基隆|嘉義)[市縣][^，,\n]{2,15}[區鄉鎮]/,
] as const;

/** 591 物件 ID 解析模式 */
const ID_PATTERNS = [
  /detail\/(\d+)/,
  /id=(\d+)/,
  /591\.com\.tw\/\w+\/(\d+)/,
] as const;

// ============ 標題評分函數 (選最高分) ============

interface TitleCandidate {
  line: string;
  score: number;
}

/** 計算標題行的分數 */
function scoreTitleLine(line: string, allText: string): number {
  const trimmed = line.trim();
  let score = 0;

  // 長度檢查：8-40 最佳
  if (trimmed.length < 5 || trimmed.length > 60) return -100;
  if (trimmed.length >= 8 && trimmed.length <= 40) score += 10;
  else if (trimmed.length >= 5 && trimmed.length <= 50) score += 5;

  // 純數字或數字佔比過高 → 扣分
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount / trimmed.length > 0.4) return -100;
  if (digitCount / trimmed.length > 0.2) score -= 5;

  // 包含冒號且短 → 可能是標籤，扣分
  if ((trimmed.includes('：') || trimmed.includes(':')) && trimmed.length < 15) {
    score -= 20;
  }

  // 跳過明顯的價格/地址/ID 行
  const skipPatterns = [
    /^https?:\/\//,
    /^591/,
    /^售價/,
    /^租金/,
    /^坪數/,
    /^格局/,
    /^地址/,
    /^月租/,
    /^\d+萬/,
    /^\d+元/,
  ];
  for (const pattern of skipPatterns) {
    if (pattern.test(trimmed)) return -100;
  }

  // 情緒/優點詞加分
  const positiveKeywords = [
    '景觀', '視野', '採光', '方正', '稀有', '精緻', '豪華', '高樓層',
    '近捷運', '近車站', '學區', '生活機能', '交通便利', '裝潢', '全新',
    '電梯', '大坪數', '超值', '急售', '屋主自售', '優質',
  ];
  for (const kw of positiveKeywords) {
    if (trimmed.includes(kw)) score += 3;
  }

  // 房產相關詞加分（輕微）
  const realEstateKeywords = [
    '房', '廳', '衛', '坪', '區', '市', '路', '街', '號', '樓', '層',
    '套房', '雅房', '公寓', '大樓', '透天', '別墅', '店面', '住宅', '華廈',
  ];
  let realEstateHits = 0;
  for (const kw of realEstateKeywords) {
    if (trimmed.includes(kw)) {
      score += 1;
      realEstateHits++;
    }
  }

  // 若完全沒有房產關鍵字 → 不可能是有效標題
  if (realEstateHits === 0) return -100;

  return score;
}

/** 選擇最佳標題 */
function selectBestTitle(lines: string[], allText: string): string | null {
  const candidates: TitleCandidate[] = lines
    .map(line => ({ line: line.trim(), score: scoreTitleLine(line, allText) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates.length > 0 ? candidates[0]!.line : null;
}

// ============ 主解析函數 ============

/**
 * 解析 591 物件內容 (Production Grade v2.1)
 * @param text 從 591 複製的文字內容
 * @returns 解析結果，包含信心分數與缺失欄位
 * 
 * @description
 * 信心分數計算：
 * - 價格：25 分
 * - 坪數：25 分
 * - 格局：20 分（套房/雅房 15 分）
 * - 地址：20 分
 * - 標題：10 分
 * 
 * fieldsFound 計算：
 * - 價格、坪數、格局、地址、標題各算 1 欄（共 5 欄）
 */
export function parse591Content(text: string): Parse591Result {
  const result: Parse591Result = {
    confidence: 0,
    fieldsFound: 0,
    missingFields: [],
  };

  if (!text || text.trim().length === 0) {
    result.missingFields = ['價格', '坪數', '格局', '地址', '標題'];
    return result;
  }

  // 預處理：正規化空白、換行、台/臺
  const merged = mergeLines(text);
  const normalized = normalizeCity(merged);

  // ============ IM-2.1 價格解析 (含單位) ============
  const priceMatch = parsePrice(normalized);
  if (priceMatch) {
    result.price = priceMatch.value;
    result.priceUnit = priceMatch.unit;
    result.priceRaw = priceMatch.raw;
    result.fieldsFound++;
    result.confidence += CONFIDENCE.PRICE;
  } else {
    result.missingFields.push('價格');
  }

  // ============ IM-2.2 坪數解析 (含模糊 fallback) ============
  let sizeFound = false;
  for (const pattern of SIZE_PATTERNS) {
    const cleanedText = cleanSize(normalized);
    const match = cleanedText.match(pattern);
    if (match && match[1]) {
      result.size = match[1];
      result.fieldsFound++;
      result.confidence += CONFIDENCE.SIZE;
      sizeFound = true;
      break;
    }
  }
  if (!sizeFound) {
    result.missingFields.push('坪數');
  }

  // ============ IM-2.3 格局解析 (含半衛/0廳/開放式) ============
  let layoutFound = false;
  
  // 標準 N房N廳N衛
  for (const pattern of LAYOUT_PATTERNS.slice(0, 2)) {
    const match = normalized.match(pattern);
    if (match && match[1] && match[2] && match[3]) {
      result.rooms = match[1];
      result.halls = match[2];
      result.bathrooms = match[3];
      result.fieldsFound++; // 格局只算一欄
      result.confidence += CONFIDENCE.LAYOUT_FULL;
      layoutFound = true;
      break;
    }
  }

  // Fallback: N房N衛（無廳）
  if (!layoutFound) {
    const noHallMatch = normalized.match(/(\d+)\s*房\s*([\d.]+)\s*衛/);
    if (noHallMatch && noHallMatch[1] && noHallMatch[2]) {
      result.rooms = noHallMatch[1];
      result.halls = '0';
      result.bathrooms = noHallMatch[2];
      result.fieldsFound++;
      result.confidence += CONFIDENCE.LAYOUT_FULL;
      layoutFound = true;
    }
  }

  // Fallback: 開放式
  if (!layoutFound && normalized.includes('開放式')) {
    result.rooms = '1';
    result.halls = '0';
    result.bathrooms = '1';
    result.fieldsFound++;
    result.confidence += CONFIDENCE.LAYOUT_STUDIO;
    layoutFound = true;
  }

  // Fallback: 套房/雅房
  if (!layoutFound) {
    if (normalized.includes('套房') || normalized.includes('雅房')) {
      result.rooms = '1';
      result.halls = '0';
      result.bathrooms = '1';
      result.fieldsFound++;
      result.confidence += CONFIDENCE.LAYOUT_STUDIO;
      layoutFound = true;
    }
  }

  if (!layoutFound) {
    result.missingFields.push('格局');
  }

  // ============ IM-2.4 地址解析 (台/臺已正規化) ============
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
  if (!addressFound) {
    result.missingFields.push('地址');
  }

  // ============ IM-2.5 標題擷取 (評分制) ============
  const lines = normalized.split('\n').filter(l => l.trim().length > 0);
  const bestTitle = selectBestTitle(lines, normalized);
  if (bestTitle) {
    result.title = bestTitle;
    result.fieldsFound++;
    result.confidence += CONFIDENCE.TITLE;
  } else {
    result.missingFields.push('標題');
  }

  // ============ IM-2.6 591 物件 ID 擷取 ============
  for (const pattern of ID_PATTERNS) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      result.listingId = match[1];
      // ID 不計入 confidence 和 fieldsFound
      break;
    }
  }

  // ============ IM-2.7 信心分數封頂 ============
  result.confidence = Math.min(result.confidence, 100);

  return result;
}

/**
 * 智慧偵測是否為 591 內容 (增強版)
 * @param text 貼上的文字內容
 * @returns 是否可能是 591 內容
 */
export function detect591Content(text: string): boolean {
  if (!text || text.trim().length < 10) return false;

  // 包含「591」關鍵字
  if (text.includes('591')) return true;

  // 包含「萬」和「坪」（房地產特徵）
  if (text.includes('萬') && text.includes('坪')) return true;

  // 租金特徵
  const hasRentKeyword = /(?:月租|租金|元\/月|元\s*\/\s*月)/.test(text);
  if (hasRentKeyword && text.includes('坪')) return true;

  // 包含房地產關鍵字組合
  const hasPrice = /[\d,]+\s*萬/.test(text) || /[\d,]+\s*元\s*\/?\s*月/.test(text);
  const hasSize = /[\d.]+\s*坪/.test(text);
  const hasLayout = /\d+房\d*廳?\d*衛?/.test(text);
  const hasAddress = /(?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄)[市縣]/.test(text);
  const hasIdPattern = /(?:detail\/\d+|id=\d+|591\.com\.tw)/.test(text);

  // 至少有兩個關鍵特徵
  const matchCount = [hasPrice, hasSize, hasLayout, hasAddress, hasRentKeyword, hasIdPattern].filter(Boolean).length;
  return matchCount >= 2;
}
