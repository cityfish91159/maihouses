/**
 * TrustManager Service Layer
 *
 * 負責 TrustManager 元件的所有 Supabase 操作
 * 將直接的 supabase 呼叫抽取為可測試的 service 函數
 */

import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { getErrorMessage } from '../lib/error';
import type { TrustTransaction, TrustStep } from '../types/trust.types';

// ========== Zod Schemas ==========

const TrustStepSchema = z
  .object({
    step: z.number(),
    name: z.string(),
    done: z.boolean(),
    confirmed: z.boolean(),
    date: z.string().nullable(),
    note: z.string(),
    confirmedAt: z.string().optional(),
  })
  .transform(
    (data): TrustStep => ({
      step: data.step,
      name: data.name,
      done: data.done,
      confirmed: data.confirmed,
      date: data.date,
      note: data.note,
      ...(data.confirmedAt !== undefined && { confirmedAt: data.confirmedAt }),
    })
  );

const TrustTransactionSchema = z
  .object({
    id: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    case_name: z.string(),
    agent_id: z.string(),
    agent_name: z.string().nullable(),
    guest_token: z.string(),
    token_expires_at: z.string(),
    current_step: z.number(),
    steps_data: z.array(TrustStepSchema),
    status: z.enum(['active', 'completed', 'cancelled']),
  })
  .transform((data): TrustTransaction => data);

const TrustTransactionArraySchema = z.array(TrustTransactionSchema);

const ProfileSchema = z.object({
  full_name: z.string().nullable(),
});

// ========== Service Result Types ==========

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========== Service Functions ==========

/**
 * 取得當前登入使用者
 */
export async function getCurrentUser(): Promise<ServiceResult<{ id: string; email: string }>> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.error('[trustManagerService] getCurrentUser failed', { error });
      return { success: false, error: error.message };
    }

    if (!user) {
      return { success: false, error: '使用者未登入' };
    }

    return {
      success: true,
      data: { id: user.id, email: user.email ?? '' },
    };
  } catch (err) {
    logger.error('[trustManagerService] getCurrentUser exception', { error: getErrorMessage(err) });
    return { success: false, error: '取得使用者資訊失敗' };
  }
}

/**
 * 取得使用者的信任交易案件列表
 */
export async function loadTrustCases(
  agentId: string
): Promise<ServiceResult<TrustTransaction[]>> {
  try {
    const { data, error } = await supabase
      .from('trust_transactions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[trustManagerService] loadTrustCases failed', { agentId, error });
      return { success: false, error: error.message };
    }

    const parseResult = TrustTransactionArraySchema.safeParse(data ?? []);
    if (!parseResult.success) {
      logger.error('[trustManagerService] loadTrustCases validation failed', {
        agentId,
        error: parseResult.error,
      });
      return { success: false, error: '資料格式驗證失敗' };
    }

    return { success: true, data: parseResult.data };
  } catch (err) {
    logger.error('[trustManagerService] loadTrustCases exception', {
      agentId,
      error: getErrorMessage(err),
    });
    return { success: false, error: '載入案件列表失敗' };
  }
}

/**
 * 取得使用者的 profile（姓名）
 */
export async function getUserProfile(
  userId: string
): Promise<ServiceResult<{ full_name: string | null }>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn('[trustManagerService] getUserProfile failed', { userId, error });
      return { success: false, error: error.message };
    }

    const parseResult = ProfileSchema.safeParse(data);
    if (!parseResult.success) {
      return { success: false, error: '資料格式驗證失敗' };
    }

    return { success: true, data: parseResult.data };
  } catch (err) {
    logger.error('[trustManagerService] getUserProfile exception', {
      userId,
      error: getErrorMessage(err),
    });
    return { success: false, error: '取得使用者資料失敗' };
  }
}

/**
 * 建立新的信任交易案件
 */
export async function createTrustCase(params: {
  caseName: string;
  agentId: string;
  agentName: string;
}): Promise<ServiceResult<TrustTransaction>> {
  try {
    const { data, error } = await supabase
      .from('trust_transactions')
      .insert({
        case_name: params.caseName,
        agent_id: params.agentId,
        agent_name: params.agentName,
      })
      .select()
      .single();

    if (error) {
      logger.error('[trustManagerService] createTrustCase failed', { params, error });
      return { success: false, error: error.message };
    }

    const parseResult = TrustTransactionSchema.safeParse(data);
    if (!parseResult.success) {
      logger.error('[trustManagerService] createTrustCase validation failed', {
        error: parseResult.error,
      });
      return { success: false, error: '資料格式驗證失敗' };
    }

    return { success: true, data: parseResult.data };
  } catch (err) {
    logger.error('[trustManagerService] createTrustCase exception', { error: getErrorMessage(err) });
    return { success: false, error: '建立案件失敗' };
  }
}

/**
 * 更新案件步驟資料
 */
export async function updateTrustSteps(params: {
  txId: string;
  currentStep: number;
  stepsData: TrustStep[];
  status?: 'active' | 'completed' | 'cancelled';
}): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('trust_transactions')
      .update({
        current_step: params.currentStep,
        steps_data: params.stepsData,
        status: params.status ?? 'active',
      })
      .eq('id', params.txId);

    if (error) {
      logger.error('[trustManagerService] updateTrustSteps failed', { params, error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error('[trustManagerService] updateTrustSteps exception', { error: getErrorMessage(err) });
    return { success: false, error: '更新步驟失敗' };
  }
}

/**
 * 刪除（取消）案件
 */
export async function cancelTrustCase(txId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('trust_transactions')
      .update({ status: 'cancelled' })
      .eq('id', txId);

    if (error) {
      logger.error('[trustManagerService] cancelTrustCase failed', { txId, error });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error('[trustManagerService] cancelTrustCase exception', {
      txId,
      error: getErrorMessage(err),
    });
    return { success: false, error: '刪除案件失敗' };
  }
}
