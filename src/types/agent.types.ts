import { z } from 'zod';

const NullableStringSchema = z.string().nullable();
const OptionalNullableStringSchema = z.string().nullable().optional();

export const AgentProfileApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar_url: NullableStringSchema,
  company: NullableStringSchema,
  bio: OptionalNullableStringSchema,
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  phone: OptionalNullableStringSchema,
  line_id: OptionalNullableStringSchema,
  license_number: OptionalNullableStringSchema,
  is_verified: z.boolean().optional(),
  verified_at: OptionalNullableStringSchema,
  trust_score: z.number(),
  encouragement_count: z.number(),
  service_rating: z.number(),
  review_count: z.number(),
  completed_cases: z.number(),
  active_listings: z.number(),
  service_years: z.number(),
  joined_at: OptionalNullableStringSchema,
  internal_code: z.number().optional(),
  visit_count: z.number().optional(),
  deal_count: z.number().optional(),
});

export const AgentProfileMeApiSchema = AgentProfileApiSchema.extend({
  email: NullableStringSchema,
  points: z.number(),
  quota_s: z.number(),
  quota_a: z.number(),
  created_at: NullableStringSchema,
});

export const AgentProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  company: z.string().nullable(),
  bio: z.string().nullable(),
  specialties: z.array(z.string()),
  certifications: z.array(z.string()),
  phone: z.string().nullable(),
  lineId: z.string().nullable(),
  licenseNumber: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
  verifiedAt: z.string().nullable().optional(),
  trustScore: z.number(),
  encouragementCount: z.number(),
  serviceRating: z.number(),
  reviewCount: z.number(),
  completedCases: z.number(),
  activeListings: z.number(),
  serviceYears: z.number(),
  joinedAt: z.string().nullable().optional(),
  internalCode: z.number().optional(),
  visitCount: z.number().optional(),
  dealCount: z.number().optional(),
});

export const AgentProfileMeSchema = AgentProfileSchema.extend({
  email: z.string().nullable(),
  points: z.number(),
  quotaS: z.number(),
  quotaA: z.number(),
  createdAt: z.string().nullable(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;
export type AgentProfileMe = z.infer<typeof AgentProfileMeSchema>;
export type AgentProfileApi = z.infer<typeof AgentProfileApiSchema>;
export type AgentProfileMeApi = z.infer<typeof AgentProfileMeApiSchema>;

type AtLeastOne<T extends Record<string, unknown>> = {
  [K in keyof T]-?: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];

type AgentProfileUpdatableFields = {
  name: string;
  company: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  phone: string | null;
  lineId: string | null;
  licenseNumber: string | null;
  joinedAt: string;
};

export type UpdateAgentProfilePayload = AtLeastOne<AgentProfileUpdatableFields>;
