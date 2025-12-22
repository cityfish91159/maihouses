/**
 * 房源亮點標籤工具
 * 用於區分「規格 (Specs)」與「特色 (Highlights)」
 * UP-4: 嚴格分流，亮點膠囊不應包含數據化規格
 */

// 定義規格型關鍵字的正則表達式
// 包含：X房, X廳, X衛, X室, X坪, X樓, X年, B1車位...
const SPEC_PATTERNS = [
    /^\d+(\.\d+)?\s*[房廳衛室坪樓年]/, // 3房, 2.5衛, 25坪, 5樓, 10年
    /^[B|b]\d+車位/,                 // B1車位
    /^(主建|地坪|建坪|附屬|屋齡)\d+/,      // 主建30坪, 屋齡5年
    /^\d+個陽台/                      // 1個陽台
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
