import { Lead, UserData } from "../types/uag.types";

/**
 * 驗證用戶是否能購買指定 Lead
 *
 * 邏輯與 purchase_lead RPC 保持一致：
 * 1. S 級：優先用 quota_s，無配額時用 points
 * 2. A 級：優先用 quota_a，無配額時用 points
 * 3. B/C/F 級：直接用 points
 * 4. 只有「配額=0 且 點數不足」時才失敗
 */
export const validateQuota = (
  lead: Lead,
  user: UserData,
): { valid: boolean; error?: string } => {
  const price = lead.price ?? 0;

  // S 級：有配額 OR 點數足夠
  if (lead.grade === "S") {
    if (user.quota.s > 0) {
      return { valid: true }; // 用配額
    }
    if (user.points >= price) {
      return { valid: true }; // 用點數
    }
    return { valid: false, error: "S 級配額已用完且點數不足" };
  }

  // A 級：有配額 OR 點數足夠
  if (lead.grade === "A") {
    if (user.quota.a > 0) {
      return { valid: true }; // 用配額
    }
    if (user.points >= price) {
      return { valid: true }; // 用點數
    }
    return { valid: false, error: "A 級配額已用完且點數不足" };
  }

  // B/C/F 級：直接用點數
  if (user.points < price) {
    return { valid: false, error: "點數不足" };
  }

  return { valid: true };
};
