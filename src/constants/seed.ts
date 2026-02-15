/**
 * Seed constants used by mock/demo entry points.
 * Keep this centralized to avoid hardcoded IDs across pages.
 */
import { deepFreeze } from '../lib/deepFreeze';

export const SEED_CONSTANTS = deepFreeze({
  COMMUNITY_ID: 'test-uuid',
} as const);

export const SEED_COMMUNITY_ID = SEED_CONSTANTS.COMMUNITY_ID;
