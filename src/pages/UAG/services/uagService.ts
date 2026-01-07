import { supabase } from '../../../lib/supabase';
import { z } from 'zod';
import {
  AppData,
  Grade,
  Lead,
  LeadSchema,
  Listing,
  ListingSchema,
  FeedPostSchema,
  FeedPost,
  UserDataSchema,
  SupabaseListing, // UAG-9: Import SupabaseListing
} from '../types/uag.types';
import { GRADE_PROTECTION_HOURS } from '../uag-config';
import { logger } from '../../../lib/logger';

// UAG-9: Define Supabase-sourced types for better safety
type SupabaseFeedPost = z.infer<typeof FeedPostSchema>;

interface SupabaseSession {
  session_id: string;
  agent_id: string;
  grade: string;
  total_duration: number;
  property_count: number;
  last_active: string;
  summary: string | null;
}

interface SupabasePurchasedLead {
  session_id: string;
  id: string;
  created_at: string;
}

interface SupabaseUagEvent {
  session_id: string;
  property_id: string | null;
}

interface UagEventRow {
  property_id: string;
  session_id: string;
  duration: number | null;
  actions: Record<string, number> | null;
}

/**
 * purchase_lead RPC 返回類型
 */
const PurchaseLeadResultSchema = z.object({
  success: z.boolean(),
  used_quota: z.boolean().optional(),
  purchase_id: z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(), // UAG-13 [NEW]
  error: z.string().optional(),
});

export type PurchaseLeadResult = z.infer<typeof PurchaseLeadResultSchema>;

// Helper function for remaining hours calculation
const calculateRemainingHours = (
  purchasedAt: number | string | undefined | null,
  grade: Grade
): number => {
  if (!purchasedAt) return 0;
  
  const totalHours = GRADE_PROTECTION_HOURS[grade] || 336;
  const purchasedTime = new Date(purchasedAt).getTime();
  const elapsedHours = (Date.now() - purchasedTime) / (1000 * 60 * 60);
  
  return Math.max(0, Math.min(totalHours, totalHours - elapsedHours));
};

interface SupabaseUserData {
  points: number;
  quota_s: number;
  quota_a: number;
}

interface SupabaseLeadData {
  purchased_at?: string | number | null;
  grade: string;
  status: string;
  remaining_hours?: number | null;
  [key: string]: unknown;
}

// UAG-9: Use stricter types for incoming data
const transformSupabaseData = (
  userData: SupabaseUserData,
  leadsData: SupabaseLeadData[],
  listingsData: SupabaseListing[],
  feedData: SupabaseFeedPost[]
): AppData => {
  // 1. Validate User Data (Critical)
  const userRaw = {
    points: userData.points,
    quota: { s: userData.quota_s, a: userData.quota_a }
  };

  const userResult = UserDataSchema.safeParse(userRaw);
  if (!userResult.success) {
    logger.error('[UAGService] User Data Validation Failed', { error: userResult.error.message });
    throw new Error('Failed to load user profile');
  }

  // 2. Transform and Validate Leads (Resilient)
  const validLeads: Lead[] = [];
  for (const l of leadsData) {
    let remainingHours = l.remaining_hours != null ? Number(l.remaining_hours) : undefined;

    if (remainingHours == null && l.purchased_at && l.status === 'purchased') {
      remainingHours = calculateRemainingHours(l.purchased_at, l.grade as Grade);
    }

    const transformed = {
      ...l,
      grade: l.grade,
      status: l.status,
      ...(remainingHours != null ? { remainingHours } : {})
    };

    const result = LeadSchema.safeParse(transformed);
    if (result.success) {
      validLeads.push(result.data);
    } else {
      logger.warn('[UAGService] Skipping invalid lead', { error: result.error.issues });
    }
  }

  // 3. Transform and Validate Listings
  const validListings: Listing[] = [];
  for (const l of listingsData) {
    // Safe cast because we validate with Zod immediately after
    const listing = l as Record<string, unknown>;
    const transformed = {
      ...listing,
      title: (listing.title as string) || '',
      tags: (listing.tags as string[] | null) ?? [],
      view: (listing.view_count as number | undefined) ?? 0,
      click: (listing.click_count as number | undefined) ?? 0,
      fav: (listing.fav_count as number | undefined) ?? 0,
      thumbColor: (listing.thumb_color as string | undefined) ?? '#e5e7eb'
    };

    const result = ListingSchema.safeParse(transformed);
    if (result.success) {
      validListings.push(result.data);
    } else {
      logger.warn('[UAGService] Skipping invalid listing', { error: result.error.issues });
    }
  }

  // 4. Validate Feed
  const validFeed: FeedPost[] = [];
  for (const post of feedData) {
    const result = FeedPostSchema.safeParse(post);
    if (result.success) {
      validFeed.push(result.data);
    } else {
      logger.warn('[UAGService] Skipping invalid feed post', { error: result.error.issues });
    }
  }

  return {
    user: userResult.data,
    leads: validLeads,
    listings: validListings,
    feed: validFeed
  };
};

// 房源瀏覽統計介面
export interface PropertyViewStats {
  property_id: string;
  view_count: number;
  unique_sessions: number;
  total_duration: number;
  line_clicks: number;
  call_clicks: number;
}

/**
 * 從字串生成穩定 hash（用於固定 intent/坐標）
 * 問題 #6-7 修復：用 session_id hash 替代 Math.random()
 */
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 從 grade 計算 intent 分數（穩定版本）
 * 問題 #6 修復：用 session_id hash 替代 Math.random()
 */
function gradeToIntent(grade: string, sessionId: string): number {
  const hash = stableHash(sessionId);
  switch (grade) {
    case 'S': return 90 + (hash % 10); // 90-99
    case 'A': return 70 + (hash % 20); // 70-89
    case 'B': return 50 + (hash % 20); // 50-69
    case 'C': return 30 + (hash % 20); // 30-49
    default: return 10 + (hash % 20);  // 10-29
  }
}

/**
 * 從 grade 計算點數價格
 */
function gradeToPrice(grade: string): number {
  switch (grade) {
    case 'S': return 20;
    case 'A': return 10;
    case 'B': return 3;
    case 'C': return 1;
    default: return 0.5;
  }
}

/**
 * 生成 AI 建議
 */
function generateAiSuggestion(grade: string, visitCount: number): string {
  if (grade === 'S') {
    return visitCount >= 3 ? '🔥 強烈建議立即發送訊息！' : '高意願客戶，請優先處理';
  }
  if (grade === 'A') {
    return visitCount >= 2 ? '深度瀏覽用戶，建議發送邀約' : 'A 級客戶，適合推薦物件';
  }
  if (grade === 'B') {
    return '中度興趣，可發送物件資訊';
  }
  if (grade === 'C') {
    return '輕度興趣，建議先觀察';
  }
  return '潛在客戶';
}

export class UAGService {
  /**
   * 從 uag_sessions 獲取匿名潛在客戶數據（非 leads 表的真實個資）
   *
   * 問題 #3-4 修復：排除已購買的 session + 正確設置 status
   */
  static async fetchAppData(userId: string): Promise<AppData> {
    // 1. 並行查詢：用戶資料、sessions、已購買記錄、listings、feed
    const [userRes, sessionsRes, purchasedRes, listingsRes, feedRes] = await Promise.all([
      supabase.from('users').select('points, quota_s, quota_a').single(),
      // 正確數據源：uag_sessions（匿名瀏覽行為），不是 leads（真實個資）
      supabase
        .from('uag_sessions')
        .select('session_id, agent_id, grade, total_duration, property_count, last_active, summary')
        .eq('agent_id', userId)
        .in('grade', ['S', 'A', 'B', 'C', 'F'])
        .order('last_active', { ascending: false })
        .limit(50),
      // 問題 #3-4 修復：查詢已購買的 session_id
      supabase
        .from('uag_lead_purchases')
        .select('session_id, id, created_at')
        .eq('agent_id', userId),
      supabase.from('listings').select('*').eq('agent_id', userId),
      supabase.from('feed').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    if (userRes.error) throw userRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    // purchasedRes.error 不阻斷，只記錄警告
    if (purchasedRes.error) {
      logger.warn('[UAGService] Failed to fetch purchased leads', { error: purchasedRes.error.message });
    }
    if (listingsRes.error) throw listingsRes.error;
    if (feedRes.error) throw feedRes.error;

    // 問題 #3-4 修復：建立已購買 session_id 集合
    const purchasedMap = new Map<string, { id: string; created_at: string }>();
    for (const p of purchasedRes.data ?? []) {
      purchasedMap.set(p.session_id, { id: p.id, created_at: p.created_at });
    }

    // 獲取每個 session 最近瀏覽的物件
    const sessionIds = (sessionsRes.data ?? []).map(s => s.session_id);
    const propertyMap = new Map<string, string>();

    if (sessionIds.length > 0) {
      const { data: events } = await supabase
        .from('uag_events')
        .select('session_id, property_id')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false });

      // 每個 session 取第一個（最近的）property_id
      if (events) {
        for (const evt of events) {
          if (!propertyMap.has(evt.session_id) && evt.property_id) {
            propertyMap.set(evt.session_id, evt.property_id);
          }
        }
      }
    }

    // 轉換 uag_sessions 為 Lead 格式
    const leadsData: SupabaseLeadData[] = (sessionsRes.data ?? []).map((session, index) => {
      const grade = session.grade || 'F';
      const propertyId = propertyMap.get(session.session_id);
      const sessionId = session.session_id;

      // 問題 #3-4 修復：從 purchasedMap 確定 status
      const purchased = purchasedMap.get(sessionId);
      const isPurchased = purchased !== undefined;
      const status = isPurchased ? 'purchased' : 'new';

      // 問題 #6-7 修復：使用 stableHash 生成穩定的 intent 和坐標
      const hash = stableHash(sessionId);

      return {
        // 問題 #3 修復：如果已購買，使用 purchase.id (UUID)，否則用 session_id
        id: isPurchased ? purchased.id : sessionId,
        name: `訪客-${sessionId.slice(-4).toUpperCase()}`,
        grade,
        intent: gradeToIntent(grade, sessionId),
        prop: propertyId ?? '物件瀏覽',
        visit: session.property_count ?? 1,
        price: gradeToPrice(grade),
        status,
        purchased_at: isPurchased ? purchased.created_at : null,
        ai: generateAiSuggestion(grade, session.property_count ?? 1),
        session_id: sessionId, // 必填
        property_id: propertyId,
        // 問題 #7 修復：用 hash 生成穩定坐標
        x: 15 + (hash % 5) * 15 + ((hash >> 8) % 10),
        y: 15 + (Math.floor(index / 5)) * 15 + ((hash >> 16) % 10),
        created_at: session.last_active,
        // 如果已購買，計算剩餘保護時間
        ...(isPurchased ? {
          remainingHours: calculateRemainingHours(purchased.created_at, grade as Grade)
        } : {}),
      };
    });

    return transformSupabaseData(userRes.data, leadsData, listingsRes.data, feedRes.data);
  }

  // 獲取某房仲所有房源的瀏覽統計
  static async fetchPropertyViewStats(agentId: string): Promise<PropertyViewStats[]> {
    try {
      // 從 uag_events 表聚合統計
      // 注意：這裡用的是 property_id 對應 properties.public_id
      const { data, error } = await supabase
        .rpc('get_agent_property_stats', { p_agent_id: agentId });

      if (error) {
        logger.warn('[UAGService] PropertyViewStats RPC error, using fallback', { error: error.message });
        // Fallback：直接查詢 (效能較差但可用)
        return await UAGService.fetchPropertyViewStatsFallback(agentId);
      }

      return data || [];
    } catch (e) {
      logger.error('[UAGService] fetchPropertyViewStats error', { error: e instanceof Error ? e.message : 'Unknown' });
      return [];
    }
  }

  // Fallback 方法：直接從 uag_events 查詢
  private static async fetchPropertyViewStatsFallback(agentId: string): Promise<PropertyViewStats[]> {
    // 先取得該房仲的所有房源 public_id
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('public_id')
      .eq('agent_id', agentId);

    if (propError || !properties?.length) return [];

    const publicIds = properties.map(p => p.public_id);

    // 查詢這些房源的事件統計
    const { data: events, error: evtError } = await supabase
      .from('uag_events')
      .select('property_id, session_id, duration, actions')
      .in('property_id', publicIds);

    if (evtError || !events) return [];

    // 手動聚合
    const statsMap = new Map<string, PropertyViewStats>();
    
    for (const evt of events) {
      const pid = evt.property_id;
      if (!statsMap.has(pid)) {
        statsMap.set(pid, {
          property_id: pid,
          view_count: 0,
          unique_sessions: 0,
          total_duration: 0,
          line_clicks: 0,
          call_clicks: 0
        });
      }
      const stat = statsMap.get(pid)!;
      stat.view_count++;
      stat.total_duration += evt.duration || 0;
      
      const actions = evt.actions as Record<string, number> | null;
      if (actions?.click_line) stat.line_clicks++;
      if (actions?.click_call) stat.call_clicks++;
    }

    // 計算 unique sessions
    const sessionsByProperty = new Map<string, Set<string>>();
    for (const evt of events) {
      if (!sessionsByProperty.has(evt.property_id)) {
        sessionsByProperty.set(evt.property_id, new Set());
      }
      sessionsByProperty.get(evt.property_id)!.add(evt.session_id);
    }

    for (const [pid, sessions] of sessionsByProperty) {
      const stat = statsMap.get(pid);
      if (stat) stat.unique_sessions = sessions.size;
    }

    return Array.from(statsMap.values());
  }

  /**
   * 購買客戶
   *
   * 問題 #2 修復：返回 RPC 的 JSONB 結果，不再忽略
   */
  static async purchaseLead(
    userId: string,
    leadId: string,
    cost: number,
    grade: Grade
  ): Promise<PurchaseLeadResult> {
    const { data, error } = await supabase.rpc('purchase_lead', {
      p_user_id: userId,
      p_lead_id: leadId,
      p_cost: cost,
      p_grade: grade
    });

    if (error) {
      logger.error('[UAGService] purchaseLead RPC error', { error: error.message });
      throw error;
    }

    // Zod 驗證 RPC 返回值
    const parsed = PurchaseLeadResultSchema.safeParse(data);
    if (!parsed.success) {
      logger.error('[UAGService] Invalid purchaseLead response', { error: parsed.error.message });
      return { success: false, error: 'Invalid RPC response' };
    }

    return parsed.data;
  }
}
