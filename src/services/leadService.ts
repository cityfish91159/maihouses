/**
 * Lead Service - 客戶線索管理服務
 * 用於房仲追蹤與管理潛在客戶
 */

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

// Lead 狀態類型
export type LeadStatus =
  | 'new' // 新線索
  | 'contacted' // 已聯繫
  | 'qualified' // 已確認需求
  | 'scheduled' // 已約看
  | 'visited' // 已看屋
  | 'negotiating' // 議價中
  | 'closed_won' // 成交
  | 'closed_lost'; // 流失

// Lead 事件類型
export type LeadEventType =
  | 'INITIAL_CONTACT' // 初次聯繫表單
  | 'CALL_SUMMARY' // 通話摘要
  | 'LINE_MESSAGE' // LINE 訊息
  | 'VISIT_SCHEDULED' // 預約看屋
  | 'VISIT_COMPLETE' // 看屋完成
  | 'VISIT_CANCELLED' // 看屋取消
  | 'OFFER_SUBMITTED' // 出價
  | 'OFFER_ACCEPTED' // 出價接受
  | 'OFFER_REJECTED' // 出價拒絕
  | 'CONTRACT_SIGNED' // 簽約
  | 'STATUS_CHANGE' // 狀態變更
  | 'NOTE_ADDED'; // 備註新增

// Lead 資料結構
export interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_line_id?: string;
  agent_id: string;
  property_id: string;
  source: 'sidebar' | 'mobile_bar' | 'booking' | 'direct'; // 'booking' deprecated (Phase 11-A #2)
  status: LeadStatus;
  budget_range?: string;
  preferred_contact_time?: string;
  needs_description?: string;
  response_time_seconds?: number;
  first_response_at?: string;
  created_at: string;
  updated_at: string;
}

// Lead 事件結構
export interface LeadEvent {
  id: string;
  lead_id: string;
  event_type: LeadEventType;
  event_data: Record<string, unknown>;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// 建立新 Lead 的參數
export interface CreateLeadParams {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerLineId?: string;
  // 客戶端僅作提示，後端會以 propertyId 解析最終 agentId（權威來源）。
  agentId: string;
  propertyId: string;
  source: 'sidebar' | 'mobile_bar' | 'booking' | 'direct'; // 'booking' deprecated (Phase 11-A #2)
  budgetRange?: string;
  preferredContactTime?: string;
  needsDescription?: string;
}

// 建立 Lead 回應
export interface CreateLeadResponse {
  success: boolean;
  leadId?: string;
  error?: string;
}

interface CreateLeadApiResponse {
  success: boolean;
  data?: {
    leadId?: string;
    agentId?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

/**
 * 建立新的客戶線索
 */
export async function createLead(params: CreateLeadParams): Promise<CreateLeadResponse> {
  try {
    const response = await fetch('/api/lead/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail,
        customerLineId: params.customerLineId,
        propertyId: params.propertyId,
        source: params.source,
        budgetRange: params.budgetRange,
        preferredContactTime: params.preferredContactTime,
        needsDescription: params.needsDescription,
        agentId: params.agentId,
      }),
    });

    const json = (await response.json().catch(() => null)) as CreateLeadApiResponse | null;

    if (!response.ok || !json?.success) {
      const errorMessage = json?.error?.message || `HTTP ${response.status}`;
      logger.error('[LeadService] Create lead API error', {
        status: response.status,
        propertyId: params.propertyId,
        clientAgentId: params.agentId,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }

    const leadId = json.data?.leadId;
    const resolvedAgentId = json.data?.agentId;
    if (!leadId) {
      logger.error('[LeadService] Create lead API missing leadId', {
        propertyId: params.propertyId,
        clientAgentId: params.agentId,
        resolvedAgentId,
      });
      return { success: false, error: '建立諮詢失敗，請稍後再試' };
    }

    if (resolvedAgentId && params.agentId && resolvedAgentId !== params.agentId) {
      logger.warn('[LeadService] AgentId overridden by backend', {
        propertyId: params.propertyId,
        clientAgentId: params.agentId,
        resolvedAgentId,
      });
    }

    return { success: true, leadId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知錯誤';
    logger.error('[LeadService] Create lead exception', { error: err });
    return { success: false, error: errorMessage };
  }
}

/**
 * 取得房仲的所有線索
 */
export async function getLeadsForAgent(agentId: string): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[LeadService] Get leads error', { error });
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('[LeadService] Get leads exception', { error: err });
    return [];
  }
}

/**
 * 取得特定物件的線索
 */
export async function getLeadsForProperty(propertyId: string): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[LeadService] Get property leads error', { error });
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('[LeadService] Get property leads exception', { error: err });
    return [];
  }
}

/**
 * 更新 Lead 狀態
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  notes?: string
): Promise<boolean> {
  try {
    // 更新狀態
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      logger.error('[LeadService] Update status error', { error: updateError });
      return false;
    }

    // 記錄狀態變更事件
    await addLeadEvent(
      leadId,
      'STATUS_CHANGE',
      {
        new_status: newStatus,
      },
      notes
    );

    return true;
  } catch (err) {
    logger.error('[LeadService] Update status exception', { error: err });
    return false;
  }
}

/**
 * 記錄首次回應（計算回應時間）
 */
export async function recordFirstResponse(leadId: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update({
        first_response_at: now,
        updated_at: now,
      })
      .eq('id', leadId)
      .is('first_response_at', null); // 只更新尚未回應的

    if (error) {
      logger.error('[LeadService] Record response error', { error });
      return false;
    }

    return true;
  } catch (err) {
    logger.error('[LeadService] Record response exception', { error: err });
    return false;
  }
}

/**
 * 新增 Lead 事件
 */
export async function addLeadEvent(
  leadId: string,
  eventType: LeadEventType,
  eventData: Record<string, unknown> = {},
  notes?: string
): Promise<boolean> {
  try {
    // 取得當前用戶
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('lead_events').insert({
      lead_id: leadId,
      event_type: eventType,
      event_data: eventData,
      notes: notes || null,
      created_by: user?.id || null,
    });

    if (error) {
      logger.error('[LeadService] Add event error', { error });
      return false;
    }

    return true;
  } catch (err) {
    logger.error('[LeadService] Add event exception', { error: err });
    return false;
  }
}

/**
 * 取得 Lead 的所有事件
 */
export async function getLeadEvents(leadId: string): Promise<LeadEvent[]> {
  try {
    const { data, error } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('[LeadService] Get events error', { error });
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('[LeadService] Get events exception', { error: err });
    return [];
  }
}

/**
 * 取得房仲的線索統計
 */
export async function getAgentLeadStats(agentId: string): Promise<{
  total: number;
  new: number;
  contacted: number;
  scheduled: number;
  closedWon: number;
  avgResponseTime: number | null;
}> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('status, response_time_seconds')
      .eq('agent_id', agentId);

    if (error) {
      logger.error('[LeadService] Get stats error', { error });
      return {
        total: 0,
        new: 0,
        contacted: 0,
        scheduled: 0,
        closedWon: 0,
        avgResponseTime: null,
      };
    }

    const leads = data || [];
    const responseTimes = leads
      .map((l) => l.response_time_seconds)
      .filter((t): t is number => t !== null && t !== undefined);

    return {
      total: leads.length,
      new: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      scheduled: leads.filter((l) => l.status === 'scheduled').length,
      closedWon: leads.filter((l) => l.status === 'closed_won').length,
      avgResponseTime:
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null,
    };
  } catch (err) {
    logger.error('[LeadService] Get stats exception', { error: err });
    return {
      total: 0,
      new: 0,
      contacted: 0,
      scheduled: 0,
      closedWon: 0,
      avgResponseTime: null,
    };
  }
}

/**
 * 記錄通話摘要
 */
export async function recordCallSummary(
  leadId: string,
  duration: number,
  summary: string,
  outcome: 'interested' | 'follow_up' | 'not_interested'
): Promise<boolean> {
  return addLeadEvent(leadId, 'CALL_SUMMARY', {
    duration_seconds: duration,
    summary,
    outcome,
  });
}

/**
 * 預約看屋
 */
export async function scheduleVisit(
  leadId: string,
  visitDate: string,
  visitTime: string,
  notes?: string
): Promise<boolean> {
  // 更新狀態為已約看
  const statusUpdated = await updateLeadStatus(leadId, 'scheduled');
  if (!statusUpdated) return false;

  // 記錄預約事件
  return addLeadEvent(
    leadId,
    'VISIT_SCHEDULED',
    {
      visit_date: visitDate,
      visit_time: visitTime,
    },
    notes
  );
}

/**
 * 完成看屋
 */
export async function completeVisit(
  leadId: string,
  feedback: 'very_interested' | 'interested' | 'neutral' | 'not_interested',
  notes?: string
): Promise<boolean> {
  // 更新狀態
  const statusUpdated = await updateLeadStatus(leadId, 'visited');
  if (!statusUpdated) return false;

  // 記錄看屋完成事件
  return addLeadEvent(
    leadId,
    'VISIT_COMPLETE',
    {
      customer_feedback: feedback,
    },
    notes
  );
}

export const leadService = {
  createLead,
  getLeadsForAgent,
  getLeadsForProperty,
  updateLeadStatus,
  recordFirstResponse,
  addLeadEvent,
  getLeadEvents,
  getAgentLeadStats,
  recordCallSummary,
  scheduleVisit,
  completeVisit,
};
