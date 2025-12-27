import { Lead, UserData } from '../types/uag.types';

export const validateQuota = (lead: Lead, user: UserData): { valid: boolean; error?: string } => {
  if (lead.grade === 'S' && user.quota.s <= 0) {
    return { valid: false, error: 'S 級配額已用完' };
  }
  if (lead.grade === 'A' && user.quota.a <= 0) {
    return { valid: false, error: 'A 級配額已用完' };
  }
  return { valid: true };
};
