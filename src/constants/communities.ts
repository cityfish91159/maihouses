/**
 * 社區常數
 *
 * 集中管理社區相關常數，避免各處硬編碼不同步
 *
 * @module constants/communities
 */

/**
 * 社區 ID 與名稱對照表
 * 用於 Mock 資料與 UI 顯示
 *
 * TODO: P5 時從 API 取得社區列表，此處改為 fallback
 */
export const COMMUNITY_NAME_MAP: Record<string, string> = {
  "test-uuid": "惠宇上晴",
  "community-2": "遠雄中央公園",
  "community-3": "國泰建設",
};

/**
 * 根據社區 ID 取得名稱
 * @param communityId - 社區 ID
 * @param fallback - 找不到時的預設值
 * @returns 社區名稱
 */
export function getCommunityName(
  communityId: string | undefined,
  fallback = "我的社區",
): string {
  if (!communityId) return fallback;
  return COMMUNITY_NAME_MAP[communityId] ?? fallback;
}

/**
 * 檢查社區 ID 是否有效（存在於對照表中）
 * @param communityId - 社區 ID
 * @returns 是否有效
 */
export function isValidCommunityId(communityId: string | undefined): boolean {
  if (!communityId) return false;
  return communityId in COMMUNITY_NAME_MAP;
}
