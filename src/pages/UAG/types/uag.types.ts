import { z } from 'zod';

export const GradeSchema = z.enum(['S', 'A', 'B', 'C', 'F']);
export type Grade = z.infer<typeof GradeSchema>;

export const LeadStatusSchema = z.enum(['new', 'purchased']);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

// Schema for data coming directly from Supabase
export const SupabaseLeadSchema = z.object({
  id: z.string(),
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
}).passthrough(); // Allow extra fields

// Schema for the transformed Lead object used in the UI
export const LeadSchema = SupabaseLeadSchema.extend({
  remainingHours: z.number().optional(),
  // We might want to standardize to camelCase in the future, but for now keep compatibility
});

export type Lead = z.infer<typeof LeadSchema>;

export const SupabaseListingSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()).optional().nullable(),
  view_count: z.number().optional(),
  click_count: z.number().optional(),
  fav_count: z.number().optional(),
  thumb_color: z.string().optional(),
}).passthrough();

export type SupabaseListing = z.infer<typeof SupabaseListingSchema>;

export const ListingSchema = SupabaseListingSchema.extend({
  view: z.number().optional(),
  click: z.number().optional(),
  fav: z.number().optional(),
  thumbColor: z.string().optional(),
});

export type Listing = z.infer<typeof ListingSchema>;

export const FeedPostSchema = z.object({
  title: z.string(),
  meta: z.string(),
  body: z.string(),
  created_at: z.string().optional(),
}).passthrough();

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
