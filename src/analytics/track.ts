import { logger } from '../lib/logger';
import { getErrorMessage } from '../lib/error';
import { isDemoMode } from '../lib/pageMode';

// 簡易埋點（事件命名更貼近用戶語意）
export async function track(event: string, payload?: Record<string, unknown>) {
  if (isDemoMode()) return;

  try {
    // keepalive + await：確保頁面離開時請求不中斷，
    // 同時 await 讓呼叫端可選擇等待完成後再執行後續邏輯
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...payload }),
      keepalive: true,
    });

    if (!response.ok) {
      logger.warn('[Analytics] Track request failed', {
        status: response.status,
        event,
      });
      return;
    }

    logger.debug('[track]', { event, payload: payload || {} });
  } catch (err) {
    logger.error('[Analytics] Track failed', { error: getErrorMessage(err) });
  }
}
export const Events = {
  QuietOn: 'user.needs_quiet_space',
  QuietOff: 'user.back_to_explore',
  QuietAutoOff: 'user.quiet_space_timeout',
  QuietTurnUsed: 'user.quiet_space_turn_used',
  WarmbarView: 'ui.warmbar_view',
  WarmbarContinue: 'ui.warmbar_click_continue',
  WarmbarDismiss: 'ui.warmbar_click_dismiss',
  MoodPick: 'user.feeling_set',
  NoteSaved: 'user.reflects_on_viewing',
  DebriefGen: 'user.debrief_mna_generated',
  DebriefSave: 'user.debrief_saved',
  BudgetCopy: 'user.seeks_budget_clarity',
  ELI5Open: 'user.needs_plain_explain',
  RewriteGen: 'user.needs_polite_message_generated',
  RewriteAdopt: 'user.polite_message_adopted',
};
