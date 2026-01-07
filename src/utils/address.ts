/**
 * 地址工具函數
 * 共用於 CommunityPicker 和 propertyService
 */

/**
 * 計算地址指紋（去除樓層、戶號、空白）
 * 同棟大樓的不同樓層會得到相同指紋
 */
export const computeAddressFingerprint = (addr: string): string => {
  let clean = addr;
  // 1. 移除郵遞區號 (3-5碼開頭)
  clean = clean.replace(/^\d{3,5}/, "");
  // 2. 移除「樓」「F」之後的所有字元
  clean = clean.replace(/(\d+[fF樓].*)$/, "");
  // 3. 移除「之X」「-X」戶號
  clean = clean.replace(/[之\-－—]\d+/g, "");
  // 4. 移除「號」字但保留數字
  clean = clean.replace(/號/g, "");
  // 5. 移除空白
  clean = clean.replace(/\s+/g, "");
  return clean;
};

/**
 * 社區名正規化（統一格式，解決「惠宇上晴」vs「惠宇 上晴」問題）
 * 用於比對時，不改變實際儲存的名稱
 */
export const normalizeCommunityName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, "") // 移除半形空格
    .replace(/[　]/g, "") // 移除全形空格
    .replace(/[（）]/g, (s) => (s === "（" ? "(" : ")")) // 全形括號→半形
    .replace(/[「」『』]/g, "") // 移除書名號
    .replace(/[．·]/g, "") // 移除中間點
    .toLowerCase(); // 統一小寫（處理英文社區名）
};
