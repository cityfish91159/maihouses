/**
 * 房源亮點標籤工具
 * 用於區分「規格 (Specs)」與「特色 (Highlights)」
 * UP-4: 嚴格分流，亮點膠囊不應包含數據化規格
 */

// 定義規格型關鍵字的正則表達式
// 包含：X房, X廳, X衛, X室, X坪, X樓, X年, B1車位...
const SPEC_PATTERNS = [
    /^\d+(\.\d+)?\s*[坪房廳衛室]/,     // 30.5坪, 3房, 2廳, 2衛
    /^\d+\s*樓(之\d+)?$/,               // 5樓, 12樓之3
    /^(高|中|低)樓層$/,                  // 高樓層, 低樓層
    /^屋齡\s*\d+\s*年$/,                 // 屋齡10年
    /^總樓層\s*\d+$/,                    // 總樓層15
    /^朝向/,                             // 朝南, 朝向東北
    /^格局/,                             // 格局方正
    /^車位/,                             // 車位平面
    /^[B|b]\d+車位/,                     // B1車位
    /^管理費/,                           // 管理費...
    /^公設比/,                           // 公設比...
    /^(主建|地坪|建坪|附屬)\d+/,          // 主建30坪
    /^\d+個陽台/                         // 1個陽台
];

/**
 * 檢查是否為規格型標籤
 * @param tag 標籤文字
 * @returns true if tag looks like a spec (should be hidden/removed)
 */
export function isSpecTag(tag: string): boolean {
    if (!tag) return false;
    const normalized = tag.trim();
    return SPEC_PATTERNS.some(regex => regex.test(normalized));
}

/**
 * 過濾掉規格型標籤
 * @param tags 原始標籤陣列
 * @returns 純淨的特色標籤陣列
 */
export function filterHighlights(tags: string[]): string[] {
    if (!Array.isArray(tags)) return [];
    return tags.filter(tag => !isSpecTag(tag));
}
