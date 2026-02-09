import { logger } from '../lib/logger';

/**
 * Generic analytics event tracking (temporarily disabled).
 *
 * NOTE:
 * - `/api/uag/track` is a property-intent endpoint with a strict payload contract.
 * - This function is used by generic app events (page_view, error_boundary, etc.).
 * - Keep disabled until a dedicated `/api/analytics` endpoint is implemented.
 */
export function trackEvent(event: string, page: string, targetId?: string): void {
  if (!event?.trim() || !page?.trim()) {
    logger.warn('[Analytics] invalid event payload, skipped', { event, page, targetId });
    return;
  }

  if (import.meta.env.DEV) {
    logger.debug('[Analytics] trackEvent (disabled)', { event, page, targetId });
  }
}
