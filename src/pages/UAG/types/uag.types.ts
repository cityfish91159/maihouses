import { z } from 'zod';

export const GradeSchema = z.enum(['S', 'A', 'B', 'C', 'F']);
export type Grade = z.infer<typeof GradeSchema>;

export const LeadStatusSchema = z.enum(['new', 'purchased']);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

// Schema for data coming directly from Supabase
// 注意：id 可能是 uag_lead_purchases.id (UUID) 或 session_id (非 UUID)
export const SupabaseLeadSchema = z
  .object({
    id: z.string(), // 購買前為 session_id，購買後為 purchase UUID
    name: z.string(),
    grade: GradeSchema,
    intent: z.number(),
    prop: z.string(),
    visit: z.number(),
    price: z.number(),
    status: LeadStatusSchema,
    purchased_at: z.union([z.string(), z.number(), z.null()]).optional(),
    purchased_by: z.string().nullable().optional(),
    transaction_hash: z.string().nullable().optional(),
    ai: z.string(),
    remaining_hours: z.number().nullable().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    created_at: z.string().optional(),
    session_id: z.string(), // 必填：追蹤匿名消費者
    property_id: z.string().optional(), // TEXT 格式如 'MH-100001'，不是 UUID
  })
  .passthrough(); // Allow extra fields

// UAG-15/修5: 通知狀態 Schema
export const NotificationStatusSchema = z.enum([
  'pending',
  'sent',
  'no_line',
  'unreachable',
  'failed',
  'skipped',
]);
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

// ============================================================================
// Lead Schema 定義
// ============================================================================

/**
 * LeadSchema - 完整的 Lead Zod Schema（向後兼容）
 *
 * 注意：id 欄位的語義在購買前後會改變：
 * - 未購買時（status === "new"）：id = session_id（格式：sess-XXXX-xxx）
 * - 已購買時（status === "purchased"）：id = purchase UUID
 *
 * session_id 欄位永不變化，始終追蹤匿名消費者
 */
export const LeadSchema = SupabaseLeadSchema.extend({
  remainingHours: z.number().optional(),
  // UAG-15/修5: 通知狀態
  notification_status: NotificationStatusSchema.optional(),
  // 修6: 對話 ID
  conversation_id: z.string().optional(),
});

/**
 * Lead 類型（從 Zod Schema 推導）
 *
 * AUDIT-01 Phase 5: 重構說明
 * Lead.id 的語義在購買前後改變：
 * - status === "new" → id 是 session_id（如 sess-B218-mno345）
 * - status === "purchased" → id 是 purchase UUID（如 57a4097a-...）
 *
 * 使用類型守衛 isPurchasedLead/isUnpurchasedLead 來區分使用場景
 */
export type Lead = z.infer<typeof LeadSchema>;

// ============================================================================
// 類型別名（語義化區分）
// ============================================================================

/**
 * 未購買 Lead 類型
 *
 * - id = session_id（格式：sess-XXXX-xxx）
 * - status = "new"
 *
 * @example
 * ```ts
 * if (isUnpurchasedLead(lead)) {
 *   // TypeScript 知道 lead 是 UnpurchasedLead
 *   // lead.id 在此處語義上是 session_id
 * }
 * ```
 */
export type UnpurchasedLead = Lead & { status: 'new' };

/**
 * 已購買 Lead 類型
 *
 * - id = purchase UUID（來自 uag_lead_purchases.id）
 * - status = "purchased"
 * - 包含 notification_status、conversation_id 等購買後欄位
 *
 * @example
 * ```ts
 * if (isPurchasedLead(lead)) {
 *   // TypeScript 知道 lead 是 PurchasedLead
 *   // lead.id 在此處語義上是 purchase UUID
 *   // lead.notification_status、lead.conversation_id 可安全存取
 * }
 * ```
 */
export type PurchasedLead = Lead & { status: 'purchased' };

// ============================================================================
// 類型守衛
// ============================================================================

/**
 * 檢查 Lead 是否為已購買狀態
 *
 * 使用此守衛後，TypeScript 可以正確推導：
 * - lead.id 語義上是 purchase UUID
 * - lead.notification_status 可安全存取
 * - lead.conversation_id 可安全存取
 *
 * @example
 * ```ts
 * if (isPurchasedLead(lead)) {
 *   // lead.notification_status 可用
 *   // lead.conversation_id 可用
 *   // lead.id 是 purchase UUID
 *   const convId = lead.conversation_id;
 * }
 * ```
 */
export function isPurchasedLead(lead: Lead): lead is PurchasedLead {
  return lead.status === 'purchased';
}

/**
 * 檢查 Lead 是否為未購買狀態
 *
 * 使用此守衛後，TypeScript 可以正確推導：
 * - lead.id 語義上是 session_id
 * - lead.status === "new"
 *
 * @example
 * ```ts
 * if (isUnpurchasedLead(lead)) {
 *   // lead.id 是 session_id
 *   // lead.status === "new"
 *   onBuyLead(lead.id); // 傳遞 session_id 給購買 API
 * }
 * ```
 */
export function isUnpurchasedLead(lead: Lead): lead is UnpurchasedLead {
  return lead.status === 'new';
}

/**
 * Exhaustive check helper - 確保所有 LeadStatus 都被處理
 *
 * 用於 switch 語句確保完整性，如果新增狀態會在編譯期報錯
 *
 * @example
 * ```ts
 * function handleLead(lead: Lead) {
 *   if (isPurchasedLead(lead)) {
 *     // 處理已購買
 *   } else if (isUnpurchasedLead(lead)) {
 *     // 處理未購買
 *   } else {
 *     assertNeverLeadStatus(lead.status);
 *   }
 * }
 * ```
 */
export function assertNeverLeadStatus(status: never): never {
  throw new Error(`Unexpected LeadStatus: ${status}`);
}

// UAG-20: 修復「我的房源總覽」資料連接 - Phase 1
export const SupabaseListingSchema = z
  .object({
    public_id: z.string(), // UAG-20: 新增 - 對應 properties.public_id
    title: z.string(),
    images: z.array(z.string()).optional().nullable(), // UAG-20: 新增 - 對應 properties.images
    features: z.array(z.string()).optional().nullable(), // UAG-20: 新增 - 對應 properties.features
    community_id: z.string().optional().nullable(), // FEED-01 Phase 8: 用於過濾社區貼文
    // REMOVED: tags - 改用 features 從資料庫查詢
    view_count: z.number().optional(),
    click_count: z.number().optional(),
    fav_count: z.number().optional(),
    // REMOVED: thumb_color - 改用實際圖片 URL
  })
  .passthrough();

export type SupabaseListing = z.infer<typeof SupabaseListingSchema>;

export const ListingSchema = SupabaseListingSchema.extend({
  view: z.number().optional(),
  click: z.number().optional(),
  fav: z.number().optional(),
  thumbnail: z.string().optional(), // UAG-20: 新增 - 圖片 URL (images[0])
  tags: z.array(z.string()).optional(), // UAG-20: 新增 - 轉換自 features
  // REMOVED: thumbColor - 改用 thumbnail
});

export type Listing = z.infer<typeof ListingSchema>;

export const FeedPostSchema = z
  .object({
    id: z.string(), // FEED-01 Phase 8: community_posts.id
    title: z.string(),
    meta: z.string(),
    body: z.string(),
    communityId: z.string().optional(), // FEED-01 Phase 8: 社區 ID
    communityName: z.string().optional(), // FEED-01 Phase 8: 社區名稱
    likesCount: z.number().optional(), // FEED-01 Phase 8: 讚數
    commentsCount: z.number().optional(), // FEED-01 Phase 8: 留言數
    created_at: z.string().optional(),
  })
  .passthrough();

export type FeedPost = z.infer<typeof FeedPostSchema>;

export const UserDataSchema = z.object({
  points: z.number(),
  quota: z.object({
    s: z.number(),
    a: z.number(),
  }),
});

export type UserData = z.infer<typeof UserDataSchema>;

export const PropertyViewStatsSchema = z.object({
  property_id: z.string(),
  view_count: z.number(),
  unique_sessions: z.number(),
  total_duration: z.number(),
  line_clicks: z.number(),
  call_clicks: z.number(),
});

export type PropertyViewStats = z.infer<typeof PropertyViewStatsSchema>;

export const AppDataSchema = z.object({
  user: UserDataSchema,
  leads: z.array(LeadSchema),
  listings: z.array(ListingSchema),
  feed: z.array(FeedPostSchema),
});

export type AppData = z.infer<typeof AppDataSchema>;

// 房仲個人資料（用於 UAG Header）
export const AgentProfileSchema = z.object({
  id: z.string(),
  internalCode: z.number().optional(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  company: z.string(),
  trustScore: z.number(),
  encouragementCount: z.number(),
  visitCount: z.number(),
  dealCount: z.number(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;
