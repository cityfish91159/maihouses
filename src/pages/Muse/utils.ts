// MUSE Night Mode - Utility Functions

// 獲取台灣時間（UTC+8）的小時數
// 直接使用 UTC 時間加 8 小時
export function getTaiwanHour(): number {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const taiwanHour = (utcHour + 8) % 24;
  return taiwanHour;
}

// Helper to trigger haptic feedback (only works after user interaction)
let hasUserInteracted = false;

export const markUserInteraction = (): void => {
  hasUserInteracted = true;
};

export const triggerHeartbeat = (pattern = [50, 100, 50, 100]): void => {
  if (hasUserInteracted && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration not supported or blocked
    }
  }
};

// 獲取或創建 Session ID
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('muse_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('muse_session_id', sessionId);
  }
  return sessionId;
};

// 判斷是否在色色限制時段 (8:00-17:00) - 使用台灣時間
export const isInSexyLockedHours = (): boolean => {
  const hour = getTaiwanHour();
  return hour >= 8 && hour < 17;
};

// 檢查今天是否已解鎖
export const isSexyUnlockedToday = (): boolean => {
  const unlockedDate = localStorage.getItem('sexy_unlocked_today');
  return unlockedDate === new Date().toDateString();
};

// 設定今天已解鎖
export const setSexyUnlockedToday = (): void => {
  localStorage.setItem('sexy_unlocked_today', new Date().toDateString());
};

// 判斷時段模式 - 使用台灣時間
export type TimeMode = 'morning' | 'afternoon' | 'evening' | 'night';

export const getTimeMode = (): TimeMode => {
  const hour = getTaiwanHour();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
};

// Default MUSE avatar (blurred placeholder)
export const DEFAULT_MUSE_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMUExQTFBIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0MCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNNTAgMTgwQzUwIDE0MCA3MiAxMjAgMTAwIDEyMEMxMjggMTIwIDE1MCAxNDAgMTUwIDE4MCIgZmlsbD0iIzMzMzMzMyIvPgo8L3N2Zz4=';

// 📷 EXIF 資料結構
export interface ExifData {
  // 拍攝時間
  dateTime?: string;
  dateTimeOriginal?: string;
  // GPS 位置
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  // 裝置資訊
  make?: string;        // 製造商 (Apple, Samsung, etc)
  model?: string;       // 型號 (iPhone 15 Pro, etc)
  software?: string;    // 軟體 (可能暴露編輯過)
  // 拍攝參數
  orientation?: number;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  focalLength?: string;
  // 原始資料
  hasExif: boolean;
  rawData?: Record<string, unknown>;
}

// 📷 從照片提取 EXIF 資料
export const extractExifData = (file: File): Promise<ExifData> => {
  return new Promise((resolve) => {
    // 只處理 JPEG/TIFF（其他格式沒有 EXIF）
    if (!file.type.match(/image\/(jpeg|tiff|heic)/i)) {
      resolve({ hasExif: false });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve({ hasExif: false });
        return;
      }

      try {
        const exif = parseExifFromBuffer(buffer);
        resolve(exif);
      } catch {
        resolve({ hasExif: false });
      }
    };
    reader.onerror = () => resolve({ hasExif: false });
    reader.readAsArrayBuffer(file);
  });
};

// 📷 解析 EXIF 資料（輕量級解析器）
function parseExifFromBuffer(buffer: ArrayBuffer): ExifData {
  const view = new DataView(buffer);

  // 檢查 JPEG 魔數
  if (view.getUint16(0) !== 0xFFD8) {
    return { hasExif: false };
  }

  let offset = 2;
  const length = buffer.byteLength;
  const result: ExifData = { hasExif: false, rawData: {} };

  while (offset < length) {
    if (view.getUint8(offset) !== 0xFF) break;

    const marker = view.getUint8(offset + 1);

    // APP1 marker (EXIF)
    if (marker === 0xE1) {
      const segmentLength = view.getUint16(offset + 2);
      const exifStart = offset + 4;

      // 檢查 "Exif\0\0" 標記
      const exifHeader = String.fromCharCode(
        view.getUint8(exifStart),
        view.getUint8(exifStart + 1),
        view.getUint8(exifStart + 2),
        view.getUint8(exifStart + 3)
      );

      if (exifHeader === 'Exif') {
        result.hasExif = true;
        const tiffStart = exifStart + 6;

        // 判斷字節序（II = little endian, MM = big endian）
        const byteOrder = view.getUint16(tiffStart);
        const littleEndian = byteOrder === 0x4949;

        // 讀取 IFD0 偏移
        const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);

        // 解析 IFD0
        parseIfd(view, tiffStart, tiffStart + ifd0Offset, littleEndian, result);

        // 尋找 EXIF SubIFD
        if (result.rawData?.exifOffset) {
          parseIfd(view, tiffStart, tiffStart + (result.rawData.exifOffset as number), littleEndian, result);
        }

        // 尋找 GPS IFD
        if (result.rawData?.gpsOffset) {
          parseGpsIfd(view, tiffStart, tiffStart + (result.rawData.gpsOffset as number), littleEndian, result);
        }
      }
      break;
    }

    // 跳過其他標記
    if (marker === 0xD8 || marker === 0xD9 || marker === 0x01) {
      offset += 2;
    } else {
      const segmentLength = view.getUint16(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  return result;
}

// 解析 IFD（Image File Directory）
function parseIfd(view: DataView, tiffStart: number, ifdOffset: number, littleEndian: boolean, result: ExifData): void {
  try {
    const entryCount = view.getUint16(ifdOffset, littleEndian);

    for (let i = 0; i < entryCount; i++) {
      const entryOffset = ifdOffset + 2 + (i * 12);
      const tag = view.getUint16(entryOffset, littleEndian);
      const type = view.getUint16(entryOffset + 2, littleEndian);
      const count = view.getUint32(entryOffset + 4, littleEndian);
      const valueOffset = entryOffset + 8;

      switch (tag) {
        case 0x010F: // Make
          result.make = readString(view, tiffStart, valueOffset, count, littleEndian);
          break;
        case 0x0110: // Model
          result.model = readString(view, tiffStart, valueOffset, count, littleEndian);
          break;
        case 0x0131: // Software
          result.software = readString(view, tiffStart, valueOffset, count, littleEndian);
          break;
        case 0x0112: // Orientation
          result.orientation = view.getUint16(valueOffset, littleEndian);
          break;
        case 0x0132: // DateTime
          result.dateTime = readString(view, tiffStart, valueOffset, count, littleEndian);
          break;
        case 0x8769: // EXIF SubIFD Offset
          result.rawData!.exifOffset = view.getUint32(valueOffset, littleEndian);
          break;
        case 0x8825: // GPS IFD Offset
          result.rawData!.gpsOffset = view.getUint32(valueOffset, littleEndian);
          break;
        case 0x9003: // DateTimeOriginal
          result.dateTimeOriginal = readString(view, tiffStart, valueOffset, count, littleEndian);
          break;
        case 0x829A: // ExposureTime
          result.exposureTime = readRational(view, tiffStart, valueOffset, littleEndian);
          break;
        case 0x829D: // FNumber
          result.fNumber = readRational(view, tiffStart, valueOffset, littleEndian);
          break;
        case 0x8827: // ISO
          result.iso = view.getUint16(valueOffset, littleEndian);
          break;
        case 0x920A: // FocalLength
          result.focalLength = readRational(view, tiffStart, valueOffset, littleEndian);
          break;
      }
    }
  } catch {
    // 忽略解析錯誤
  }
}

// 解析 GPS IFD
function parseGpsIfd(view: DataView, tiffStart: number, ifdOffset: number, littleEndian: boolean, result: ExifData): void {
  try {
    const entryCount = view.getUint16(ifdOffset, littleEndian);
    let latRef = 'N', lonRef = 'E';
    let lat: number[] = [], lon: number[] = [], alt = 0;

    for (let i = 0; i < entryCount; i++) {
      const entryOffset = ifdOffset + 2 + (i * 12);
      const tag = view.getUint16(entryOffset, littleEndian);
      const valueOffset = entryOffset + 8;

      switch (tag) {
        case 0x0001: // GPSLatitudeRef
          latRef = String.fromCharCode(view.getUint8(valueOffset));
          break;
        case 0x0002: // GPSLatitude
          lat = readGpsCoord(view, tiffStart, valueOffset, littleEndian);
          break;
        case 0x0003: // GPSLongitudeRef
          lonRef = String.fromCharCode(view.getUint8(valueOffset));
          break;
        case 0x0004: // GPSLongitude
          lon = readGpsCoord(view, tiffStart, valueOffset, littleEndian);
          break;
        case 0x0006: // GPSAltitude
          alt = readRationalValue(view, tiffStart, valueOffset, littleEndian);
          break;
      }
    }

    if (lat.length === 3 && lat[0] !== undefined && lat[1] !== undefined && lat[2] !== undefined) {
      result.gpsLatitude = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === 'S' ? -1 : 1);
    }
    if (lon.length === 3 && lon[0] !== undefined && lon[1] !== undefined && lon[2] !== undefined) {
      result.gpsLongitude = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef === 'W' ? -1 : 1);
    }
    if (alt) {
      result.gpsAltitude = alt;
    }
  } catch {
    // 忽略解析錯誤
  }
}

// 讀取字串
function readString(view: DataView, tiffStart: number, valueOffset: number, count: number, littleEndian: boolean): string {
  let offset = valueOffset;
  if (count > 4) {
    offset = tiffStart + view.getUint32(valueOffset, littleEndian);
  }
  let str = '';
  for (let i = 0; i < count - 1; i++) {
    const char = view.getUint8(offset + i);
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str.trim();
}

// 讀取有理數
function readRational(view: DataView, tiffStart: number, valueOffset: number, littleEndian: boolean): string {
  const offset = tiffStart + view.getUint32(valueOffset, littleEndian);
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  if (denominator === 0) return '0';
  return `${numerator}/${denominator}`;
}

// 讀取有理數值
function readRationalValue(view: DataView, tiffStart: number, valueOffset: number, littleEndian: boolean): number {
  const offset = tiffStart + view.getUint32(valueOffset, littleEndian);
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

// 讀取 GPS 座標
function readGpsCoord(view: DataView, tiffStart: number, valueOffset: number, littleEndian: boolean): number[] {
  const offset = tiffStart + view.getUint32(valueOffset, littleEndian);
  const result: number[] = [];
  for (let i = 0; i < 3; i++) {
    const numerator = view.getUint32(offset + i * 8, littleEndian);
    const denominator = view.getUint32(offset + i * 8 + 4, littleEndian);
    result.push(denominator ? numerator / denominator : 0);
  }
  return result;
}

// 📷 格式化 EXIF 資料為人類可讀格式
export const formatExifForDisplay = (exif: ExifData): string => {
  if (!exif.hasExif) return '無 EXIF 資料';

  const parts: string[] = [];

  if (exif.dateTimeOriginal || exif.dateTime) {
    parts.push(`📅 拍攝時間: ${exif.dateTimeOriginal || exif.dateTime}`);
  }

  if (exif.gpsLatitude !== undefined && exif.gpsLongitude !== undefined) {
    parts.push(`📍 GPS: ${exif.gpsLatitude.toFixed(6)}, ${exif.gpsLongitude.toFixed(6)}`);
  }

  if (exif.make || exif.model) {
    parts.push(`📱 裝置: ${[exif.make, exif.model].filter(Boolean).join(' ')}`);
  }

  if (exif.software) {
    parts.push(`🖼️ 軟體: ${exif.software}`);
  }

  return parts.length > 0 ? parts.join('\n') : '無有效 EXIF 資料';
};
