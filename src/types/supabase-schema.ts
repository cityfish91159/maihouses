/**
 * Supabase Database Types (從 migrations 手動生成)
 *
 * 📌 這不是 Supabase CLI 自動生成的
 * 📌 如果 DB schema 改變，必須手動更新此檔案
 *
 * @see supabase/migrations/20251127_properties_schema.sql
 * @see supabase/migrations/20241201_property_community_link.sql
 * @see supabase/migrations/20251127_property_upload_schema.sql
 * @see supabase/migrations/20251206_fix_community_reviews_view.sql
 * @see supabase/migrations/20260122_add_trust_enabled.sql
 * @see supabase/migrations/20260130_agent_profile_extension.sql
 *
 * 最後更新: 2026-01-30
 */

// ============================================
// Properties Table
// ============================================

/**
 * properties 表 Row 型別
 *
 * 欄位來源：
 * - 20251127_properties_schema.sql: 基本欄位
 * - 20241201_property_community_link.sql: community_id, community_name, address_fingerprint
 * - 20251127_property_upload_schema.sql: size, rooms, halls, bathrooms, age, floor_*, features, advantage_*, disadvantage
 */
export interface PropertyRow {
  // 主鍵與識別
  id: string; // UUID PRIMARY KEY
  public_id: string; // TEXT UNIQUE NOT NULL, e.g. 'MH-100001'

  // 基本資訊 (20251127_properties_schema.sql)
  title: string; // TEXT NOT NULL
  price: number; // NUMERIC NOT NULL
  address: string; // TEXT NOT NULL
  description: string | null; // TEXT
  images: string[]; // TEXT[] DEFAULT '{}'

  // 來源資訊 (20251127_properties_schema.sql)
  source_platform: string; // TEXT DEFAULT 'MH'
  source_external_id: string | null; // TEXT

  // 關聯 (20251127_properties_schema.sql + 20241201_property_community_link.sql)
  agent_id: string | null; // UUID REFERENCES agents(id)
  community_id: string | null; // UUID REFERENCES communities(id)
  community_name: string | null; // TEXT
  address_fingerprint: string | null; // TEXT

  // 詳細規格 (20251127_property_upload_schema.sql)
  size: number | null; // NUMERIC
  rooms: number; // NUMERIC DEFAULT 0
  halls: number; // NUMERIC DEFAULT 0
  bathrooms: number; // NUMERIC DEFAULT 0
  age: number | null; // NUMERIC
  floor_current: string | null; // TEXT
  floor_total: number | null; // NUMERIC
  property_type: string; // TEXT DEFAULT '電梯大樓'
  features: string[]; // TEXT[] DEFAULT '{}'

  // 兩好一公道 (20251127_property_upload_schema.sql)
  advantage_1: string | null; // TEXT
  advantage_2: string | null; // TEXT
  disadvantage: string | null; // TEXT

  // 安心留痕 (20260122_add_trust_enabled.sql)
  trust_enabled: boolean; // BOOLEAN NOT NULL DEFAULT false

  // 時間戳記
  created_at: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at: string; // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================
// Communities Table
// ============================================

/**
 * communities 表 Row 型別
 *
 * @see 20241201_property_community_link.sql
 */
export interface CommunityRow {
  id: string; // UUID PRIMARY KEY
  name: string; // TEXT NOT NULL
  address: string | null; // TEXT
  address_fingerprint: string | null; // TEXT

  // 狀態
  is_verified: boolean; // BOOLEAN DEFAULT FALSE
  completeness_score: number; // INTEGER DEFAULT 20

  // 基本資訊
  district: string | null; // TEXT
  city: string; // TEXT DEFAULT '台北市'
  building_age: number | null; // INTEGER
  total_units: number | null; // INTEGER
  management_fee: number | null; // INTEGER

  // 故事性推薦欄位
  story_vibe: string | null; // TEXT
  two_good: string[] | null; // TEXT[]
  one_fair: string | null; // TEXT
  resident_quote: string | null; // TEXT
  best_for: string[] | null; // TEXT[]
  lifestyle_tags: string[] | null; // TEXT[]
  features: string[] | null; // TEXT[]

  // 媒體
  cover_image: string | null; // TEXT
  gallery: string[] | null; // TEXT[]

  // 統計
  score: number; // DECIMAL(2,1) DEFAULT 0
  review_count: number; // INTEGER DEFAULT 0
  property_count: number; // INTEGER DEFAULT 0

  // AI 處理紀錄
  ai_metadata: Record<string, unknown>; // JSONB DEFAULT '{}'

  // 時間戳記
  created_at: string; // TIMESTAMPTZ DEFAULT NOW()
  updated_at: string; // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================
// Community Reviews View
// ============================================

/**
 * community_reviews VIEW 型別
 *
 * ⚠️ 注意：這是一個 VIEW，不是 TABLE
 * @see 20251206_fix_community_reviews_view.sql
 *
 * 這個 view 從 properties 表生成，包含評價相關欄位
 */
export interface CommunityReviewRow {
  id: string; // p.id
  community_id: string; // p.community_id
  author_id: string | null; // p.agent_id AS author_id
  property_id: string; // p.id AS property_id
  advantage_1: string | null; // p.advantage_1
  advantage_2: string | null; // p.advantage_2
  disadvantage: string | null; // p.disadvantage
  source_platform: string | null; // p.source_platform
  source: string | null; // p.source_external_id AS source
  created_at: string; // p.created_at
  content: {
    // jsonb_build_object(...)
    pros: (string | null)[];
    cons: string | null;
    property_title: string;
  };
}

// ============================================
// Agents Table
// ============================================

/**
 * agents 表 Row 型別
 *
 * @see 20251127_properties_schema.sql
 */
export interface AgentRow {
  id: string; // UUID PRIMARY KEY
  internal_code: number; // SERIAL
  name: string; // TEXT NOT NULL
  avatar_url: string | null; // TEXT
  company: string | null; // TEXT
  trust_score: number; // INTEGER DEFAULT 80
  encouragement_count: number; // INTEGER DEFAULT 0
  visit_count: number; // INTEGER DEFAULT 0
  deal_count: number; // INTEGER DEFAULT 0
  points: number; // INTEGER DEFAULT 1000
  quota_s: number; // INTEGER DEFAULT 0
  quota_a: number; // INTEGER DEFAULT 0
  bio: string | null; // TEXT
  specialties: string[] | null; // TEXT[]
  certifications: string[] | null; // TEXT[]
  joined_at: string | null; // TIMESTAMPTZ
  phone: string | null; // TEXT
  line_id: string | null; // TEXT
  license_number: string | null; // TEXT
  is_verified: boolean; // BOOLEAN DEFAULT false
  verified_at: string | null; // TIMESTAMPTZ
  service_rating: number; // DECIMAL(2,1) DEFAULT 0
  review_count: number; // INTEGER DEFAULT 0
  completed_cases: number; // INTEGER DEFAULT 0
  active_listings: number; // INTEGER DEFAULT 0
  created_at: string; // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================
// Profiles Table
// ============================================

/**
 * profiles 表 Row 型別
 *
 * @see 20260104_auth_1_phone_constraint.sql (AUTH-1)
 */
export interface ProfileRow {
  id: string; // UUID PRIMARY KEY REFERENCES auth.users(id)
  email: string | null; // TEXT
  role: string | null; // TEXT
  phone: string | null; // TEXT (AUTH-1: 允許 NULL 用以支援 OAuth，但前端註冊強制必填)

  // 其他可能存在的欄位 (需根據實際 DB schema 補充)
  // full_name: string | null;
  // avatar_url: string | null;
  updated_at: string | null; // TIMESTAMPTZ
}

// ============================================
// Type Aliases for API Usage
// ============================================

/**
 * API 用的簡化型別（只包含常用欄位）
 */
export type PropertyForAPI = Pick<
  PropertyRow,
  | 'id'
  | 'public_id'
  | 'title'
  | 'price'
  | 'address'
  | 'images'
  | 'community_id'
  | 'community_name'
  | 'size'
  | 'rooms'
  | 'halls'
  | 'bathrooms'
  | 'features'
  | 'advantage_1'
  | 'advantage_2'
  | 'disadvantage'
  | 'age'
>;

/**
 * community_reviews view 用的型別
 * 注意：這是 VIEW，欄位來自 properties 表的轉換
 */
export type ReviewForAPI = CommunityReviewRow;
