/**
 * 591 物件資訊解析器 (IM-2 Production Grade)
 * @description 用於解析從 591 網站複製的物件內容，帶多重 fallback 策略
 * @version 2.0.0 - 2025-12-29
 */

export interface Parse591Result {
  /** 物件標題 */
  title?: string;
  /** 價格（萬元或月租） */
  price?: string;
  /** 地址 */
  address?: string;
  /** 坪數 */
  size?: string;
  /** 房數 */
  rooms?: string;
  /** 廳數 */
  halls?: string;
  /** 衛浴數 */
  bathrooms?: string;
  /** 591 物件 ID */
  listingId?: string;
  /** 信心分數 (0-100) */
  confidence: number;
  /** 已解析的欄位數量 */
  fieldsFound: number;
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

// ============ 正規表達式模式 (多重 fallback) ============

/** 價格解析模式 - 優先級從高到低 */
const PRICE_PATTERNS = [
  // 結構化格式：售價/總價/租金：1,288 萬
  /(?:售價|總價)[：:]\s*([\d,]+)\s*萬/,
  // 月租格式：月租/租金：25,000 元
  /(?:月租|租金|月租金)[：:]\s*([\d,]+)\s*(?:元|\/月)?/,
  // 季/年租格式
  /(?:季租金|年租金)[：:]\s*([\d,]+)\s*元?/,
  // 簡化格式：1280萬（無冒號）
  /([\d,]+)\s*萬(?:元)?/,
] as const;

/** 坪數解析模式 */
const SIZE_PATTERNS = [
  // 結構化格式：權狀/建坪/室內/坪數：34.2 坪
  /(?:權狀|建坪|室內|坪數)[：:]\s*([\d.]+)\s*坪/,
  // 簡化格式：34.2坪 或 34.2 坪
  /([\d.]+)\s*坪/,
] as const;

/** 格局解析模式 */
const LAYOUT_PATTERNS = [
  // 標準格局：3房2廳2衛（支援空白）
  /(\d+)\s*房\s*(\d+)\s*廳\s*(\d+)\s*衛/,
  // 冒號格式：格局：3房2廳2衛
  /格局[：:]\s*(\d+)\s*房\s*(\d+)\s*廳\s*(\d+)\s*衛/,
] as const;

/** 
 * 地址解析模式
 * 支援：台/臺 + 所有主要縣市
 */
const ADDRESS_PATTERNS = [
  // 完整地址：台北市信義區信義路五段7號
  /[台臺]?(?:北|中|南|東)?(?:市|縣)?[^，,\n]{0,5}[區鄉鎮市][^，,\n]{2,30}[路街道巷弄號樓]/,
  // 主要城市：台北市、新北市、桃園市、台中市、台南市、高雄市
  /(?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|新竹|基隆|嘉義)[市縣]?[^，,\n]{2,30}[區鄉鎮][^，,\n]{0,20}[路街道巷弄號]?/,
  // 簡化地址：只到區
  /(?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|新竹|基隆|嘉義)[市縣][^，,\n]{2,15}[區鄉鎮]/,
] as const;

/** 591 物件 ID 解析模式 */
const ID_PATTERNS = [
  /detail\/(\d+)/,
  /id=(\d+)/,
  /591\.com\.tw\/\w+\/(\d+)/,
] as const;

// ============ 工具函數 ============

/** 清理價格字串（移除逗號） */
function cleanPrice(str: string): string {
  return str.replace(/[^\d]/g, '');
}

/** 判斷是否為有意義的標題（非 keyword 行、非純數字、適當長度、含房產關鍵字） */
function isValidTitle(line: string): boolean {
  const trimmed = line.trim();
  
  // 長度檢查
  if (trimmed.length < 5 || trimmed.length > 50) return false;
  
  // 純數字或數字佔比過高
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount / trimmed.length > 0.3) return false;
  
  // 跳過 keyword 行（包含冒號且太短，通常是標籤）
  if (trimmed.includes('：') && trimmed.length < 15) return false;
  if (trimmed.includes(':') && trimmed.length < 15) return false;
  
  // 跳過常見廢話 pattern
  const skipPatterns = [
    /^https?:\/\//,
    /^591/,
    /^售價/,
    /^租金/,
    /^坪數/,
    /^格局/,
    /^地址/,
    /^月租/,
  ];
  for (const pattern of skipPatterns) {
    if (pattern.test(trimmed)) return false;
  }
  
  // 必須包含至少一個房產相關關鍵字
  const realEstateKeywords = [
    '房', '廳', '衛', '坪', '萬', '租', '售', '區', '市', '路', '街', '號',
    '樓', '層', '室', '套房', '雅房', '公寓', '大樓', '透天', '別墅', '店面',
    '住宅', '華廈', '電梯', '捷運', '學區', '車位', '陽台', '裝潢', '景觀',
    '近', '站', '分鐘', '機能', '採光', '格局', '方正', '豪宅', '精緻',
  ];
  const hasRealEstateKeyword = realEstateKeywords.some(kw => trimmed.includes(kw));
  if (!hasRealEstateKeyword) return false;
  
  return true;
}

// ============ 主解析函數 ============

/**
 * 解析 591 物件內容 (Production Grade)
 * @param text 從 591 複製的文字內容
 * @returns 解析結果，包含信心分數
 * 
 * @description
 * 信心分數計算：
 * - 價格：25 分
 * - 坪數：25 分
 * - 格局：20 分（套房/雅房 15 分）
 * - 地址：20 分
 * - 標題：10 分
 */
export function parse591Content(text: string): Parse591Result {
  const result: Parse591Result = {
    confidence: 0,
    fieldsFound: 0,
  };

  if (!text || text.trim().length === 0) {
    return result;
  }

  // 預處理：正規化空白與換行
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // ============ IM-2.1 價格解析 ============
  for (const pattern of PRICE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      const priceStr = match[1] || match[0];
      const cleaned = cleanPrice(priceStr);
      if (cleaned && cleaned.length > 0) {
        result.price = cleaned;
        result.fieldsFound++;
        result.confidence += CONFIDENCE.PRICE;
        break;
      }
    }
  }

  // ============ IM-2.2 坪數解析 ============
  for (const pattern of SIZE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      result.size = match[1];
      result.fieldsFound++;
      result.confidence += CONFIDENCE.SIZE;
      break;
    }
  }

  // ============ IM-2.3 格局解析 ============
  let layoutFound = false;
  for (const pattern of LAYOUT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match && match[1] && match[2] && match[3]) {
      result.rooms = match[1];
      result.halls = match[2];
      result.bathrooms = match[3];
      result.fieldsFound += 3;
      result.confidence += CONFIDENCE.LAYOUT_FULL;
      layoutFound = true;
      break;
    }
  }

  // Fallback: 套房/雅房
  if (!layoutFound) {
    if (normalized.includes('套房') || normalized.includes('雅房')) {
      result.rooms = '1';
      result.halls = '0';
      result.bathrooms = '1';
      result.fieldsFound += 3;
      result.confidence += CONFIDENCE.LAYOUT_STUDIO;
    }
  }

  // ============ IM-2.4 地址解析 ============
  for (const pattern of ADDRESS_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      result.address = match[0].trim();
      result.fieldsFound++;
      result.confidence += CONFIDENCE.ADDRESS;
      break;
    }
  }

  // ============ IM-2.5 標題擷取 ============
  const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines) {
    if (isValidTitle(line)) {
      result.title = line;
      result.fieldsFound++;
      result.confidence += CONFIDENCE.TITLE;
      break;
    }
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
 * 智慧偵測是否為 591 內容
 * @param text 貼上的文字內容
 * @returns 是否可能是 591 內容
 */
export function detect591Content(text: string): boolean {
  if (!text || text.trim().length < 10) return false;

  // 包含「591」關鍵字
  if (text.includes('591')) return true;

  // 包含「萬」和「坪」（房地產特徵）
  if (text.includes('萬') && text.includes('坪')) return true;

  // 包含房地產關鍵字組合
  const hasPrice = /[\d,]+\s*萬/.test(text);
  const hasSize = /[\d.]+\s*坪/.test(text);
  const hasLayout = /\d+房\d+廳\d+衛/.test(text);
  const hasAddress = /(?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄)[市縣]/.test(text);

  // 至少有兩個關鍵特徵
  const matchCount = [hasPrice, hasSize, hasLayout, hasAddress].filter(Boolean).length;
  return matchCount >= 2;
}
