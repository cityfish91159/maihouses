import { supabase } from '../../../lib/supabase';
import { z } from 'zod';
import {
  AppData,
  Grade,
  GradeSchema,
  Lead,
  LeadSchema,
  Listing,
  ListingSchema,
  FeedPostSchema,
  FeedPost,
  UserDataSchema,
  SupabaseListing, // UAG-9: Import SupabaseListing
} from '../types/uag.types';
import {
  GRADE_PROTECTION_HOURS,
  FEED_TITLE_PREVIEW_LENGTH,
  DEFAULT_PROTECTION_HOURS,
} from '../uag-config';
import { logger } from '../../../lib/logger';

// FEED-01 Phase 8: community_posts 查詢返回類型
// 注意：Supabase 的 JOIN 返回類型可能是 object 或 array，使用 unknown 再 narrow
interface SupabaseCommunityPost {
  id: string;
  community_id: string;
  content: string;
  visibility: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  community: unknown; // Supabase JOIN 返回類型不穩定，手動處理
}

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
  notification_status: string | null;
  conversations: { id: string }[]; // 修6: 關聯對話 ID
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

const LatestPropertyRowSchema = z.object({
  session_id: z.string().min(1),
  property_id: z.string().nullable(),
});

const PropertyStatsRowSchema = z.object({
  property_id: z.string().min(1),
  view_count: z.coerce.number().int().min(0),
  unique_sessions: z.coerce.number().int().min(0),
  total_duration: z.coerce.number().min(0),
  line_clicks: z.coerce.number().int().min(0),
  call_clicks: z.coerce.number().int().min(0),
});

const UagEventLookupRowSchema = z.object({
  session_id: z.string(),
  property_id: z.string().nullable(),
});

const UagEventRowSchema = z.object({
  property_id: z.string().nullable(),
  session_id: z.string(),
  duration: z.number().nullable(),
  actions: z.record(z.string(), z.number()).nullable(),
});

// Helper function for remaining hours calculation
const calculateRemainingHours = (
  purchasedAt: number | string | undefined | null,
  grade: Grade
): number => {
  if (!purchasedAt) return 0;

  const totalHours = GRADE_PROTECTION_HOURS[grade] || DEFAULT_PROTECTION_HOURS;
  const purchasedTime = new Date(purchasedAt).getTime();
  const elapsedHours = (Date.now() - purchasedTime) / (1000 * 60 * 60);

  return Math.max(0, Math.min(totalHours, totalHours - elapsedHours));
};

function ensureRequiredId(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}

function parseRpcRows<T extends z.ZodTypeAny>(
  rpcName: string,
  schema: T,
  rawRows: unknown
): z.infer<T>[] {
  if (!Array.isArray(rawRows)) {
    logger.warn('[UAGService] RPC returned non-array payload', { rpcName });
    return [];
  }

  const parseResult = z.array(schema).safeParse(rawRows);
  if (!parseResult.success) {
    logger.warn('[UAGService] RPC payload validation failed', {
      rpcName,
      error: parseResult.error.message,
    });
    return [];
  }

  return parseResult.data;
}

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
// FEED-01 Phase 8: feedData 改為 SupabaseCommunityPost[]
const transformSupabaseData = (
  userData: SupabaseUserData,
  leadsData: SupabaseLeadData[],
  listingsData: SupabaseListing[],
  feedData: SupabaseCommunityPost[],
  statsData: Array<{
    property_id: string;
    view_count: number;
    click_count: number;
  }> | null // UAG-20-Phase3
): AppData => {
  // 1. Validate User Data (Critical)
  const userRaw = {
    points: userData.points,
    quota: { s: userData.quota_s, a: userData.quota_a },
  };

  const userResult = UserDataSchema.safeParse(userRaw);
  if (!userResult.success) {
    logger.error('[UAGService] User Data Validation Failed', {
      error: userResult.error.message,
    });
    throw new Error('Failed to load user profile');
  }

  // 2. Transform and Validate Leads (Resilient)
  const validLeads: Lead[] = [];
  for (const l of leadsData) {
    let remainingHours = l.remaining_hours != null ? Number(l.remaining_hours) : undefined;

    if (remainingHours == null && l.purchased_at && l.status === 'purchased') {
      // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as Grade
      const gradeResult = GradeSchema.safeParse(l.grade);
      if (gradeResult.success) {
        remainingHours = calculateRemainingHours(l.purchased_at, gradeResult.data);
      }
    }

    const transformed = {
      ...l,
      grade: l.grade,
      status: l.status,
      ...(remainingHours != null ? { remainingHours } : {}),
    };

    const result = LeadSchema.safeParse(transformed);
    if (result.success) {
      validLeads.push(result.data);
    } else {
      logger.warn('[UAGService] Skipping invalid lead', {
        error: result.error.issues,
      });
    }
  }

  // 3. Transform and Validate Listings (UAG-20: 修改資料轉換邏輯)
  // UAG-20-Phase3: 建立統計數據 Map
  const statsMap = new Map((statsData ?? []).map((s) => [s.property_id, s]));

  const validListings: Listing[] = [];
  for (const listing of listingsData) {
    const stats = statsMap.get(listing.public_id);

    const transformed = {
      ...listing,
      tags: listing.features ?? [],
      thumbnail: listing.images?.[0] ?? undefined,
      view: stats?.view_count ?? 0,
      click: stats?.click_count ?? 0,
      fav: 0,
    };

    const result = ListingSchema.safeParse(transformed);
    if (result.success) {
      validListings.push(result.data);
    } else {
      logger.warn('[UAGService] Skipping invalid listing', {
        error: result.error.issues,
      });
    }
  }

  // 4. Validate Feed (FEED-01 Phase 8: 轉換 community_posts 為 UAG FeedPost 格式)
  const validFeed: FeedPost[] = [];
  for (const post of feedData) {
    const content = post.content ?? '';
    const contentPreview = content.slice(0, FEED_TITLE_PREVIEW_LENGTH);
    const title = contentPreview + (content.length > FEED_TITLE_PREVIEW_LENGTH ? '...' : '');
    // FEED-01 Phase 8: 使用 extractCommunityName helper 處理 Supabase JOIN 返回
    const communityName = extractCommunityName(post.community);
    const meta = `來自：${communityName}・${post.comments_count || 0} 則留言`;

    const transformed = {
      id: post.id,
      title,
      meta,
      body: content, // FEED-01 Phase 8 優化：使用處理後的 content（已處理 null）
      communityId: post.community_id,
      communityName,
      likesCount: post.likes_count ?? 0,
      commentsCount: post.comments_count ?? 0,
      created_at: post.created_at,
    };

    const result = FeedPostSchema.safeParse(transformed);
    if (result.success) {
      validFeed.push(result.data);
    } else {
      logger.warn('[UAGService] Skipping invalid feed post', {
        error: result.error.issues,
      });
    }
  }

  return {
    user: userResult.data,
    leads: validLeads,
    listings: validListings,
    feed: validFeed,
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
 * FEED-01 Phase 8: 安全提取 community name
 * Supabase JOIN 返回類型不穩定，可能是 object 或 array
 */
function extractCommunityName(community: unknown, fallback = '社區牆'): string {
  if (Array.isArray(community) && community[0]?.name) {
    return community[0].name;
  }
  if (community && typeof community === 'object' && 'name' in community) {
    // [NASA TypeScript Safety] 使用類型守衛取代 as Record
    const nameValue = (community as { name: unknown }).name;
    return typeof nameValue === 'string' && nameValue ? nameValue : fallback;
  }
  return fallback;
}

/**
 * 從字串生成穩定 hash（用於固定 intent/坐標）
 * 問題 #6-7 修復：用 session_id hash 替代 Math.random()
 */
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
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
    case 'S':
      return 90 + (hash % 10); // 90-99
    case 'A':
      return 70 + (hash % 20); // 70-89
    case 'B':
      return 50 + (hash % 20); // 50-69
    case 'C':
      return 30 + (hash % 20); // 30-49
    default:
      return 10 + (hash % 20); // 10-29
  }
}

/**
 * 從 grade 計算點數價格
 */
function gradeToPrice(grade: string): number {
  switch (grade) {
    case 'S':
      return 20;
    case 'A':
      return 10;
    case 'B':
      return 3;
    case 'C':
      return 1;
    default:
      return 0.5;
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
    const validatedUserId = ensureRequiredId(userId, 'userId');

    // 1. 並行查詢：用戶資料、sessions、已購買記錄、listings（含 community_id）
    const [userRes, sessionsRes, purchasedRes, listingsRes] = await Promise.all([
      supabase.from('users').select('points, quota_s, quota_a').eq('id', validatedUserId).single(),
      // 正確數據源：uag_sessions（匿名瀏覽行為），不是 leads（真實個資）
      supabase
        .from('uag_sessions')
        .select('session_id, agent_id, grade, total_duration, property_count, last_active, summary')
        .eq('agent_id', validatedUserId)
        .in('grade', ['S', 'A', 'B', 'C', 'F'])
        .order('last_active', { ascending: false })
        .limit(50),
      // 問題 #3-4 修復：查詢已購買的 session_id
      // UAG-15/修5: 加入 notification_status
      supabase
        .from('uag_lead_purchases')
        // 修6: 關聯 conversation_id
        .select('session_id, id, created_at, notification_status, conversations(id)')
        .eq('agent_id', validatedUserId),
      // UAG-20: 改查 properties 表（listings 表不存在）
      // FEED-01 Phase 8 Bug 1: 加入 community_id 用於過濾 feed
      supabase
        .from('properties')
        .select('public_id, title, images, features, created_at, community_id')
        .eq('agent_id', validatedUserId)
        .order('created_at', { ascending: false }),
    ]);

    // FEED-01 Phase 8 優化：錯誤檢查必須在使用 data 之前
    if (userRes.error) throw userRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    // purchasedRes.error 不阻斷，只記錄警告
    if (purchasedRes.error) {
      logger.warn('[UAGService] Failed to fetch purchased leads', {
        error: purchasedRes.error.message,
      });
    }
    if (listingsRes.error) throw listingsRes.error;

    // FEED-01 Phase 8: 從房仲的房源中提取 community_id（去重）
    const agentCommunityIds = [
      ...new Set(
        (listingsRes.data ?? []).map((p) => p.community_id).filter((id): id is string => id != null)
      ),
    ];

    // FEED-01 Phase 8: 查詢房仲相關社區的貼文（需要等待 listingsRes 完成）
    const feedRes =
      agentCommunityIds.length > 0
        ? await supabase
            .from('community_posts')
            .select(
              `
              id,
              community_id,
              content,
              visibility,
              likes_count,
              comments_count,
              created_at,
              community:communities(name)
            `
            )
            .in('community_id', agentCommunityIds)
            .eq('visibility', 'public')
            .order('likes_count', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(5)
        : { data: [] satisfies SupabaseCommunityPost[], error: null };

    // FEED-01 Phase 8: feedRes 錯誤不阻斷，只記錄警告（feed 非核心功能）
    if (feedRes.error) {
      logger.warn('[UAGService] Failed to fetch community posts', {
        error: feedRes.error.message,
      });
    }

    // UAG-20-Phase3: 查詢房源統計數據
    const propertyIds = (listingsRes.data ?? []).map((p) => p.public_id);
    const statsRes =
      propertyIds.length > 0
        ? await supabase
            .from('property_view_stats')
            .select('property_id, view_count, click_count')
            .in('property_id', propertyIds)
        : { data: null, error: null };

    if (statsRes.error) {
      logger.warn('[UAGService] Failed to fetch property stats', {
        error: statsRes.error.message,
      });
    }

    // 問題 #3-4 修復：建立已購買 session_id 集合
    // UAG-15/修5: 擴充 Map 包含 notification_status
    const purchasedMap = new Map<
      string,
      {
        id: string;
        created_at: string;
        notification_status: string | undefined;
        conversation_id: string | undefined; // 修6
      }
    >();
    for (const p of purchasedRes.data ?? []) {
      purchasedMap.set(p.session_id, {
        id: p.id,
        created_at: p.created_at,
        notification_status: p.notification_status ?? undefined,
        // 修6: 取第一個關聯的 conversation_id
        conversation_id: p.conversations?.[0]?.id,
      });
    }

    // 獲取每個 session 最近瀏覽的物件
    // N+1 優化：使用 RPC 批次查詢，而非逐一查詢
    const sessionIds = (sessionsRes.data ?? []).map((s) => s.session_id);
    const propertyMap = new Map<string, string>();

    if (sessionIds.length > 0) {
      // 優先使用優化版 RPC（SQL 層 DISTINCT ON）
      const { data: latestProperties, error: rpcError } = await supabase.rpc(
        'get_latest_property_per_session',
        { p_session_ids: sessionIds }
      );

      if (!rpcError && latestProperties) {
        const parsedLatestProperties = parseRpcRows(
          'get_latest_property_per_session',
          LatestPropertyRowSchema,
          latestProperties
        );

        // RPC 成功，直接使用結果
        for (const item of parsedLatestProperties) {
          if (item.property_id) {
            propertyMap.set(item.session_id, item.property_id);
          }
        }
      } else {
        // Fallback: 使用原本的查詢方式
        logger.warn('[UAGService] get_latest_property_per_session RPC failed, using fallback', {
          error: rpcError?.message,
        });

        const { data: events, error: eventsError } = await supabase
          .from('uag_events')
          .select('session_id, property_id')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false });

        if (eventsError) {
          logger.warn('[UAGService] Fallback uag_events query failed', {
            error: eventsError.message,
          });
        }

        // 每個 session 取第一個（最近的）property_id
        const parsedEvents = parseRpcRows('uag_events:fallback', UagEventLookupRowSchema, events);
        for (const evt of parsedEvents) {
          if (!propertyMap.has(evt.session_id) && evt.property_id) {
            propertyMap.set(evt.session_id, evt.property_id);
          }
        }
      }
    }

    // 轉換 uag_sessions 為 Lead 格式
    // AUDIT-01 Phase 5: Lead.id 語義說明
    // - 未購買 (status="new"): id = session_id (如 sess-B218-mno345)
    // - 已購買 (status="purchased"): id = purchase UUID (如 57a4097a-...)
    // session_id 欄位永不變化，始終用於追蹤匿名消費者
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
        // AUDIT-01 Phase 5: id 根據購買狀態設定不同值
        // isPurchased=true: id = purchase UUID (from uag_lead_purchases.id)
        // isPurchased=false: id = session_id (用於購買 API 的參數)
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
        y: 15 + Math.floor(index / 5) * 15 + ((hash >> 16) % 10),
        created_at: session.last_active,
        // 如果已購買，計算剩餘保護時間
        ...(isPurchased
          ? {
              // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as Grade
              remainingHours: (() => {
                const gradeResult = GradeSchema.safeParse(grade);
                return gradeResult.success
                  ? calculateRemainingHours(purchased.created_at, gradeResult.data)
                  : 0;
              })(),
              // UAG-15/修5: 加入通知狀態
              notification_status: purchased.notification_status,
              // 修6: 加入對話 ID
              conversation_id: purchased.conversation_id,
            }
          : {}),
      };
    });

    return transformSupabaseData(
      userRes.data,
      leadsData,
      listingsRes.data,
      feedRes.data ?? [], // FEED-01 Phase 8: feedRes 可能為 null（錯誤時）
      statsRes.data // UAG-20-Phase3
    );
  }

  // 獲取某房仲所有房源的瀏覽統計
  static async fetchPropertyViewStats(agentId: string): Promise<PropertyViewStats[]> {
    try {
      const validatedAgentId = ensureRequiredId(agentId, 'agentId');

      // UAG-10: 使用優化版 RPC (SQL 層聚合，10-100 倍效能提升)
      const { data, error } = await supabase.rpc('get_property_stats_optimized', {
        p_agent_id: validatedAgentId,
      });

      if (error) {
        logger.warn('[UAGService] Optimized RPC error, trying legacy RPC', {
          error: error.message,
        });
        // Fallback 1: 嘗試舊版 RPC
        const { data: legacyData, error: legacyError } = await supabase.rpc(
          'get_agent_property_stats',
          {
            p_agent_id: validatedAgentId,
          }
        );

        if (!legacyError && legacyData) {
          return parseRpcRows('get_agent_property_stats', PropertyStatsRowSchema, legacyData);
        }

        // Fallback 2: 直接查詢（效能最差，僅作為最後手段）
        logger.warn('[UAGService] Legacy RPC also failed, using fallback', {
          error: legacyError?.message,
        });
        return await UAGService.fetchPropertyViewStatsFallback(validatedAgentId);
      }

      return parseRpcRows('get_property_stats_optimized', PropertyStatsRowSchema, data);
    } catch (e) {
      logger.error('[UAGService] fetchPropertyViewStats error', {
        error: e instanceof Error ? e.message : 'Unknown',
      });
      return [];
    }
  }

  // Fallback 方法：直接從 uag_events 查詢
  private static async fetchPropertyViewStatsFallback(
    agentId: string
  ): Promise<PropertyViewStats[]> {
    const validatedAgentId = ensureRequiredId(agentId, 'agentId');

    // 先取得該房仲的所有房源 public_id
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('public_id')
      .eq('agent_id', validatedAgentId);

    if (propError || !properties?.length) return [];

    const publicIds = properties
      .map((p) => p.public_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    if (publicIds.length === 0) return [];

    // 查詢這些房源的事件統計
    const { data: events, error: evtError } = await supabase
      .from('uag_events')
      .select('property_id, session_id, duration, actions')
      .in('property_id', publicIds);

    if (evtError || !events) return [];

    const parsedEvents = parseRpcRows('uag_events:stats', UagEventRowSchema, events);
    if (parsedEvents.length === 0) return [];

    // 手動聚合
    const statsMap = new Map<string, PropertyViewStats>();

    for (const evt of parsedEvents) {
      const pid = evt.property_id;
      if (!pid) continue;

      if (!statsMap.has(pid)) {
        statsMap.set(pid, {
          property_id: pid,
          view_count: 0,
          unique_sessions: 0,
          total_duration: 0,
          line_clicks: 0,
          call_clicks: 0,
        });
      }
      const stat = statsMap.get(pid);
      if (!stat) continue;

      stat.view_count++;
      stat.total_duration += evt.duration || 0;

      // [NASA TypeScript Safety] 使用類型守衛取代 as Record
      const actions = evt.actions;
      if (actions && typeof actions === 'object') {
        if ('click_line' in actions && typeof actions.click_line === 'number' && actions.click_line)
          stat.line_clicks++;
        if ('click_call' in actions && typeof actions.click_call === 'number' && actions.click_call)
          stat.call_clicks++;
      }
    }

    // 計算 unique sessions
    const sessionsByProperty = new Map<string, Set<string>>();
    for (const evt of parsedEvents) {
      if (!evt.property_id) continue;
      if (!sessionsByProperty.has(evt.property_id)) {
        sessionsByProperty.set(evt.property_id, new Set());
      }
      const sessions = sessionsByProperty.get(evt.property_id);
      if (sessions) {
        sessions.add(evt.session_id);
      }
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
    const validatedUserId = ensureRequiredId(userId, 'userId');
    const validatedLeadId = ensureRequiredId(leadId, 'leadId');

    if (!Number.isFinite(cost) || cost < 0) {
      return { success: false, error: 'Invalid cost' };
    }

    const gradeResult = GradeSchema.safeParse(grade);
    if (!gradeResult.success) {
      return { success: false, error: 'Invalid grade' };
    }

    const { data, error } = await supabase.rpc('purchase_lead', {
      p_user_id: validatedUserId,
      p_lead_id: validatedLeadId,
      p_cost: cost,
      p_grade: gradeResult.data,
    });

    if (error) {
      logger.error('[UAGService] purchaseLead RPC error', {
        error: error.message,
      });
      throw error;
    }

    // Zod 驗證 RPC 返回值
    const parsed = PurchaseLeadResultSchema.safeParse(data);
    if (!parsed.success) {
      logger.error('[UAGService] Invalid purchaseLead response', {
        error: parsed.error.message,
      });
      return { success: false, error: 'Invalid RPC response' };
    }

    return parsed.data;
  }
}
