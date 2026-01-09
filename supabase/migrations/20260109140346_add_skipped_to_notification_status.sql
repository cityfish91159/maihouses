-- UAG-15/修5: 新增 skipped 到 notification_status CHECK 約束
-- 問題：send-message.ts L387 嘗試寫入 'skipped' 但 DB CHECK 約束不允許

ALTER TABLE uag_lead_purchases
DROP CONSTRAINT IF EXISTS uag_lead_purchases_notification_status_check;

ALTER TABLE uag_lead_purchases
ADD CONSTRAINT uag_lead_purchases_notification_status_check
CHECK (notification_status IN ('pending', 'sent', 'no_line', 'unreachable', 'failed', 'skipped'));
