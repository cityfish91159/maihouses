import { logger } from '../../../lib/logger';
import type { PropertyReportData } from '../types';

// Generator 的亮點格式
interface GeneratorHighlight {
  id: string;
  icon: string;
  title: string;
  description: string;
  selected: boolean;
}

// Generator 的物件資料格式
interface GeneratorPropertyData {
  id: string;
  title: string;
  address: string;
  district: string;
  price: number; // 原始數值 (例: 32880000)
  pricePerPing: number;
  size: number;
  rooms: string; // 字串格式 (例: "3房2廳2衛")
  floor: string;
  floorTotal: number;
  age: number;
  direction: string;
  parking: string;
  managementFee: number; // 月費 (例: 3500)
  community: string;
  communityYear: number;
  communityUnits: number;
  propertyType: string;
  description: string;
  images: string[];
  highlights: GeneratorHighlight[];
}

// 解碼後的完整報告資料
interface DecodedReportData {
  property: GeneratorPropertyData;
  agent: {
    name: string;
    phone?: string;
    company: string;
  };
}

// [NASA TypeScript Safety] 類型守衛驗證 DecodedReportData
function isDecodedReportData(obj: unknown): obj is DecodedReportData {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.property === 'object' &&
    record.property !== null &&
    typeof record.agent === 'object' &&
    record.agent !== null
  );
}

/**
 * 解析格局字串
 * @param rooms 格局字串 (例: "3房2廳2衛")
 * @returns 解析後的格局數字
 */
function parseRoomString(rooms: string): {
  rooms: number;
  halls: number;
  bathrooms: number;
} {
  const match = rooms.match(/(\d+)房(\d+)廳(\d+)衛/);
  if (!match) {
    logger.warn('[dataAdapter] Unable to parse room string', { rooms });
    return { rooms: 0, halls: 0, bathrooms: 0 };
  }
  return {
    rooms: parseInt(match[1] ?? '0', 10),
    halls: parseInt(match[2] ?? '0', 10),
    bathrooms: parseInt(match[3] ?? '0', 10),
  };
}

/**
 * 計算每坪管理費
 * @param totalFee 月管理費總額
 * @param size 權狀坪數
 * @returns 每坪管理費 (四捨五入)
 */
function calculateManagementFeePerPing(totalFee: number, size: number): number {
  if (size <= 0) {
    logger.warn('[dataAdapter] Invalid size for management fee calculation', {
      totalFee,
      size,
    });
    return 0;
  }
  return Math.round(totalFee / size);
}

/**
 * 從 URL 參數解碼報告資料
 * @param searchParams URL 搜尋參數
 * @returns 解碼後的報告資料,失敗返回 null
 */
export function decodeReportDataFromURL(searchParams: URLSearchParams): DecodedReportData | null {
  const encodedData = searchParams.get('d');
  if (!encodedData) {
    logger.debug("[dataAdapter] No 'd' parameter found in URL");
    return null;
  }

  try {
    // 三層解碼: decodeURIComponent -> atob -> escape -> decodeURIComponent -> JSON.parse
    const decodedString = decodeURIComponent(encodedData);
    const base64Decoded = atob(decodedString);
    const utf8Decoded = decodeURIComponent(escape(base64Decoded));
    const parsed: unknown = JSON.parse(utf8Decoded);
    // [NASA TypeScript Safety] 使用類型守衛取代 as DecodedReportData
    if (!isDecodedReportData(parsed)) {
      logger.error('[dataAdapter] Invalid report data structure');
      return null;
    }
    const data = parsed;

    logger.debug('[dataAdapter] Successfully decoded report data', {
      reportId: data.property.id,
    });

    return data;
  } catch (e) {
    logger.error('[dataAdapter] URL decode failed', {
      error: e,
      urlParam: encodedData.substring(0, 50),
    });
    return null;
  }
}

/**
 * 將 Generator 的物件資料轉換為 ReportPage 的格式
 * @param generator Generator 的物件資料
 * @returns 轉換後的 PropertyReportData
 */
export function convertPropertyData(generator: GeneratorPropertyData): PropertyReportData {
  // 解析格局
  const { rooms, halls, bathrooms } = parseRoomString(generator.rooms);

  // 計算每坪管理費
  const managementFee = calculateManagementFeePerPing(generator.managementFee, generator.size);

  return {
    id: generator.id,
    publicId: generator.id, // 使用相同的 id
    title: generator.title,
    price: Math.round(generator.price / 10000), // 轉換為萬為單位
    address: generator.address,
    description: generator.description,
    images: generator.images,
    size: generator.size,
    age: generator.age,
    rooms,
    halls,
    bathrooms,
    floorCurrent: generator.floor,
    floorTotal: generator.floorTotal,
    propertyType: generator.propertyType,
    direction: generator.direction,
    parking: generator.parking,
    communityName: generator.community, // 欄位名映射
    communityYear: generator.communityYear,
    communityUnits: generator.communityUnits,
    managementFee,
    // agent 資訊會在 ReportPage 中單獨處理
    agent: {
      id: 'temp',
      name: '',
      avatarUrl: '',
      company: '',
    },
  };
}
