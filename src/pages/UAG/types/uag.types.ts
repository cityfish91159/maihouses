import { z } from "zod";

export const GradeSchema = z.enum(["S", "A", "B", "C", "F"]);
export type Grade = z.infer<typeof GradeSchema>;

export const LeadStatusSchema = z.enum(["new", "purchased"]);
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
  "pending",
  "sent",
  "no_line",
  "unreachable",
  "failed",
  "skipped",
]);
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

// Schema for the transformed Lead object used in the UI
export const LeadSchema = SupabaseLeadSchema.extend({
  remainingHours: z.number().optional(),
  // UAG-15/修5: 通知狀態
  notification_status: NotificationStatusSchema.optional(),
  // 修6: 對話 ID
  conversation_id: z.string().optional(),
});

export type Lead = z.infer<typeof LeadSchema>;

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
