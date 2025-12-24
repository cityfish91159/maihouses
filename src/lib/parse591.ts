/**
 * 591 物件資訊解析器
 * @description 用於解析從 591 網站複製的物件內容
 */

export interface Parse591Result {
  /** 物件標題 */
  title?: string;
  /** 價格（萬元） */
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

/**
 * 解析 591 物件內容
 * @param text 從 591 複製的文字內容
 * @returns 解析結果
 */
export function parse591Content(text: string): Parse591Result {
  const result: Parse591Result = {
    confidence: 0,
    fieldsFound: 0
  };

  if (!text || text.trim().length === 0) {
    return result;
  }

  const trimmed = text.trim();

  // 解析價格：匹配「售價 1,288 萬」「租金 25,000 元/月」「總價 2,880萬」
  const pricePatterns = [
    /(?:售價|總價|租金)[：:]\s*([\d,]+)\s*萬/,
    /(?:售價|總價)[：:]\s*([\d,]+)/,
    /[\d,]+\s*萬(?:元)?/
  ];

  for (const pattern of pricePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const priceStr = match[1] || match[0];
      result.price = priceStr.replace(/[^\d]/g, '');
      if (result.price) {
        result.fieldsFound++;
        result.confidence += 25;
        break;
      }
    }
  }

  // 解析坪數：匹配「權狀 34.2 坪」「建坪 28 坪」「34坪」
  const sizePatterns = [
    /(?:權狀|建坪|室內|坪數)[：:]\s*([\d.]+)\s*坪/,
    /([\d.]+)\s*坪/
  ];

  for (const pattern of sizePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      result.size = match[1];
      result.fieldsFound++;
      result.confidence += 25;
      break;
    }
  }

  // 解析格局：匹配「3房2廳2衛」「2房1廳1衛」「套房」「雅房」
  const layoutPattern = /(\d+)\s*房\s*(\d+)\s*廳\s*(\d+)\s*衛/;
  const layoutMatch = trimmed.match(layoutPattern);
  if (layoutMatch) {
    result.rooms = layoutMatch[1];
    result.halls = layoutMatch[2];
    result.bathrooms = layoutMatch[3];
    result.fieldsFound += 3;
    result.confidence += 20;
  } else if (trimmed.includes('套房') || trimmed.includes('雅房')) {
    result.rooms = '1';
    result.halls = '0';
    result.bathrooms = '1';
    result.fieldsFound += 3;
    result.confidence += 15;
  }

  // 解析地址：匹配「台北市信義區信義路五段7號」「臺北市中正區」
  const addressPatterns = [
    /[台臺][北中南高][市縣][^\n]{2,30}[路街巷弄號]/,
    /[台臺][北中南高][市縣][^\n]{2,20}區/
  ];

  for (const pattern of addressPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      result.address = match[0].trim();
      result.fieldsFound++;
      result.confidence += 20;
      break;
    }
  }

  // 解析標題：尋找 5-50 字的非數字主導行
  const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines) {
    // 跳過太短、太長或主要是數字的行
    if (line.length < 5 || line.length > 50) continue;
    const digitCount = (line.match(/\d/g) || []).length;
    if (digitCount / line.length > 0.3) continue;

    // 跳過明顯的標籤行（包含太多特殊符號）
    if (line.includes('：') && line.length < 15) continue;

    result.title = line;
    result.fieldsFound++;
    result.confidence += 10;
    break;
  }

  // 解析 591 物件 ID：匹配 URL 中的 detail/123456 或 id=123456
  const idPatterns = [
    /detail\/(\d+)/,
    /id=(\d+)/,
    /591\.com\.tw\/\w+\/(\d+)/
  ];

  for (const pattern of idPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      result.listingId = match[1];
      // ID 不計入 confidence 和 fieldsFound
      break;
    }
  }

  // 確保信心分數不超過 100
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
  const hasAddress = /[台臺][北中南高][市縣]/.test(text);

  // 至少有兩個關鍵特徵
  const matchCount = [hasPrice, hasSize, hasLayout, hasAddress].filter(Boolean).length;
  return matchCount >= 2;
}
