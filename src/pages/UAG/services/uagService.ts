import { supabase } from '../../../lib/supabase';
import {
  AppData,
  Grade,
  Lead,
  LeadSchema,
  Listing,
  ListingSchema,
  FeedPostSchema,
  FeedPost,
  UserDataSchema
} from '../types/uag.types';
import { GRADE_PROTECTION_HOURS } from '../uag-config';

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

const transformSupabaseData = (
  userData: SupabaseUserData,
  leadsData: SupabaseLeadData[],
  listingsData: unknown[],
  feedData: unknown[]
): AppData => {
  // 1. Validate User Data (Critical)
  const userRaw = {
    points: userData.points,
    quota: { s: userData.quota_s, a: userData.quota_a }
  };
  
  const userResult = UserDataSchema.safeParse(userRaw);
  if (!userResult.success) {
    console.error('Critical: User Data Validation Failed', userResult.error);
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
      console.warn('Skipping invalid lead:', result.error.issues);
    }
  }

  // 3. Transform and Validate Listings
  const validListings: Listing[] = [];
  for (const l of listingsData) {
    const listing = l as Record<string, unknown>;
    const transformed = {
      ...listing,
      title: listing.title as string,
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
      console.warn('Skipping invalid listing:', result.error.issues);
    }
  }

  // 4. Validate Feed
  const validFeed: FeedPost[] = [];
  for (const post of feedData) {
    const result = FeedPostSchema.safeParse(post);
    if (result.success) {
      validFeed.push(result.data);
    } else {
      console.warn('Skipping invalid feed post:', result.error.issues);
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
 * 從 grade 計算 intent 分數
 */
function gradeToIntent(grade: string): number {
  switch (grade) {
    case 'S': return 90 + Math.floor(Math.random() * 10); // 90-99
    case 'A': return 70 + Math.floor(Math.random() * 20); // 70-89
    case 'B': return 50 + Math.floor(Math.random() * 20); // 50-69
    case 'C': return 30 + Math.floor(Math.random() * 20); // 30-49
    default: return 10 + Math.floor(Math.random() * 20);  // 10-29
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
   */
  static async fetchAppData(userId: string): Promise<AppData> {
    const [userRes, sessionsRes, listingsRes, feedRes] = await Promise.all([
      supabase.from('users').select('points, quota_s, quota_a').single(),
      // 正確數據源：uag_sessions（匿名瀏覽行為），不是 leads（真實個資）
      supabase
        .from('uag_sessions')
        .select('session_id, agent_id, grade, total_duration, property_count, last_active, summary')
        .eq('agent_id', userId)
        .in('grade', ['S', 'A', 'B', 'C', 'F'])
        .order('last_active', { ascending: false })
        .limit(50),
      supabase.from('listings').select('*').eq('agent_id', userId),
      supabase.from('feed').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    if (userRes.error) throw userRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (listingsRes.error) throw listingsRes.error;
    if (feedRes.error) throw feedRes.error;

    // 獲取每個 session 最近瀏覽的物件
    const sessionIds = (sessionsRes.data || []).map(s => s.session_id);
    let propertyMap = new Map<string, string>();

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
    const leadsData: SupabaseLeadData[] = (sessionsRes.data || []).map((session, index) => {
      const grade = session.grade || 'F';
      const propertyId = propertyMap.get(session.session_id);

      return {
        id: session.session_id, // 使用 session_id 作為 Lead ID
        name: `訪客-${session.session_id.slice(-4).toUpperCase()}`,
        grade,
        intent: gradeToIntent(grade),
        prop: propertyId || '物件瀏覽',
        visit: session.property_count || 1,
        price: gradeToPrice(grade),
        status: 'new',
        ai: generateAiSuggestion(grade, session.property_count || 1),
        session_id: session.session_id,
        property_id: propertyId,
        // 雷達座標（隨機分佈）
        x: 15 + (index % 5) * 15 + Math.random() * 10,
        y: 15 + Math.floor(index / 5) * 15 + Math.random() * 10,
        created_at: session.last_active,
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
        console.warn('PropertyViewStats RPC error, using fallback:', error);
        // Fallback：直接查詢 (效能較差但可用)
        return await UAGService.fetchPropertyViewStatsFallback(agentId);
      }

      return data || [];
    } catch (e) {
      console.error('fetchPropertyViewStats error:', e);
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

  static async purchaseLead(
    userId: string,
    leadId: string,
    cost: number,
    grade: Grade
  ): Promise<void> {
    const { error } = await supabase.rpc('purchase_lead', {
      p_user_id: userId,
      p_lead_id: leadId,
      p_cost: cost,
      p_grade: grade
    });

    if (error) throw error;
  }
}
