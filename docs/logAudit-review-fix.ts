/**
 * 稽核日誌記錄（阻塞模式）
 *
 * WHY 阻塞模式:
 * - 房產交易涉及金錢與法律責任，必須確保每個操作都有完整稽核記錄
 * - 若稽核日誌寫入失敗，繼續交易可能導致無法追溯的合規風險
 * - 符合金融級系統 "Fail-Fast" 原則：寧可交易失敗，不可紀錄遺失
 *
 * Team 11 修復: 從靜默失敗改為阻塞模式
 *
 * @param txId - 交易 ID
 * @param action - 操作類型（如 "view", "submit", "confirm"）
 * @param user - 包含 id, role, ip, user_agent 的完整使用者資訊
 * @throws Error 當稽核日誌寫入失敗或輸入驗證失敗時
 *
 * @example
 * ```ts
 * await logAudit("tx-123", "submit_step_2", {
 *   id: "buyer-456",
 *   role: "buyer",
 *   txId: "tx-123",
 *   ip: "203.0.113.45",
 *   agent: "Mozilla/5.0..."
 * });
 * ```
 */
export async function logAudit(txId: string, action: string, user: AuditUser): Promise<void> {
  // [NASA TypeScript Safety] 驗證必要欄位
  if (!user.id?.trim() || !txId?.trim() || !action?.trim()) {
    const errMsg =
      `[AUDIT_LOG_INVALID_INPUT] Missing required fields: ` +
      `user_id=${user.id || 'EMPTY'}, txId=${txId || 'EMPTY'}, action=${action || 'EMPTY'}`;
    logger.error('[trust/_utils] Audit log validation failed', { txId, action, userId: user.id });
    throw new Error(errMsg);
  }

  const { error } = await supabase.from('audit_logs').insert({
    transaction_id: txId,
    action,
    user_id: user.id,
    role: user.role,
    ip: user.ip?.trim() || 'unknown',
    user_agent: user.agent?.trim() || 'unknown',
    created_at: new Date().toISOString(),
  });

  if (error) {
    // [Draconian RLS Audit] 檢查是否為權限問題
    if (error.code === '42501') {
      logger.error('[trust/_utils] CRITICAL: Audit log RLS violation', {
        txId,
        action,
        error: error.message,
        hint: 'Check SUPABASE_SERVICE_ROLE_KEY is set correctly',
      });
      throw new Error(
        `[AUDIT_LOG_RLS_VIOLATION] Insufficient privileges to write audit log. ` +
          `This indicates a critical security configuration error.`
      );
    }

    logger.error('[trust/_utils] Audit log failed', error, {
      txId,
      action,
      userId: user.id,
      role: user.role,
    });
    throw new Error(
      `[AUDIT_LOG_FAILED] Failed to log audit trail for transaction ${txId} (action: ${action}): ${error.message}`
    );
  }
}
