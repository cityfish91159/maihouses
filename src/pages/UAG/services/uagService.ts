import { supabase } from '../../../lib/supabase';
import { 
  AppData, 
  Grade, 
  LeadSchema, 
  ListingSchema,
  FeedPostSchema,
  UserDataSchema
} from '../types/uag.types';
import { GRADE_HOURS } from '../uag-config';

// Helper function for remaining hours calculation
const calculateRemainingHours = (
  purchasedAt: number | string | undefined | null,
  grade: Grade
): number => {
  if (!purchasedAt) return 0;
  
  const totalHours = GRADE_HOURS[grade] || 336;
  const purchasedTime = new Date(purchasedAt).getTime();
  const elapsedHours = (Date.now() - purchasedTime) / (1000 * 60 * 60);
  
  return Math.max(0, Math.min(totalHours, totalHours - elapsedHours));
};

const transformSupabaseData = (
  userData: any,
  leadsData: any[],
  listingsData: any[],
  feedData: any[]
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
  const validLeads = leadsData.map((l: any) => {
    let remainingHours = l.remaining_hours != null ? Number(l.remaining_hours) : null;

    if (remainingHours == null && l.purchased_at && l.status === 'purchased') {
      remainingHours = calculateRemainingHours(l.purchased_at, l.grade as Grade);
    }

    return {
      ...l,
      grade: l.grade,
      status: l.status,
      ...(remainingHours != null ? { remainingHours } : {})
    };
  }).filter(lead => {
    const result = LeadSchema.safeParse(lead);
    if (!result.success) {
      console.warn(`Skipping invalid lead (${lead.id}):`, result.error.flatten());
      return false;
    }
    return true;
  });

  // 3. Transform and Validate Listings
  const validListings = listingsData.map((l: any) => ({
    ...l,
    title: l.title,
    tags: l.tags ?? [],
    view: l.view_count ?? 0,
    click: l.click_count ?? 0,
    fav: l.fav_count ?? 0,
    thumbColor: l.thumb_color ?? '#e5e7eb'
  })).filter(listing => {
    const result = ListingSchema.safeParse(listing);
    if (!result.success) {
      console.warn('Skipping invalid listing:', result.error.flatten());
      return false;
    }
    return true;
  });

  // 4. Validate Feed
  const validFeed = feedData.filter(post => {
    const result = FeedPostSchema.safeParse(post);
    if (!result.success) {
      console.warn('Skipping invalid feed post:', result.error.flatten());
      return false;
    }
    return true;
  });

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

export class UAGService {
  static async fetchAppData(userId: string): Promise<AppData> {
    const [userRes, leadsRes, listingsRes, feedRes] = await Promise.all([
      supabase.from('users').select('points, quota_s, quota_a').single(),
      supabase.from('leads').select('*'),
      supabase.from('listings').select('*').eq('agent_id', userId),
      supabase.from('feed').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    if (userRes.error) throw userRes.error;
    if (leadsRes.error) throw leadsRes.error;
    if (listingsRes.error) throw listingsRes.error;
    if (feedRes.error) throw feedRes.error;

    return transformSupabaseData(userRes.data, leadsRes.data, listingsRes.data, feedRes.data);
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
