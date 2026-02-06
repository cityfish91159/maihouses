import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { AgentProfile, AgentProfileMe, UpdateAgentProfilePayload } from '../types/agent.types';

const AgentProfileApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  company: z.string().nullable(),
  bio: z.string().nullable().optional(),
  specialties: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  phone: z.string().nullable().optional(),
  line_id: z.string().nullable().optional(),
  trust_score: z.number(),
  encouragement_count: z.number(),
  service_rating: z.number(),
  review_count: z.number(),
  completed_cases: z.number(),
  active_listings: z.number(),
  service_years: z.number(),
  joined_at: z.string().nullable().optional(),
  internal_code: z.number().optional(),
  visit_count: z.number().optional(),
  deal_count: z.number().optional(),
});

const AgentProfileMeApiSchema = AgentProfileApiSchema.extend({
  email: z.string().nullable(),
  points: z.number(),
  quota_s: z.number(),
  quota_a: z.number(),
  created_at: z.string().nullable(),
});

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message?: string;
  };
};

const ApiResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    success: z.boolean(),
    data: schema.optional(),
    error: z
      .object({
        message: z.string().optional(),
      })
      .optional(),
  }) as z.ZodType<ApiResponse<z.infer<T>>>;

const AgentProfileResponseSchema = ApiResponseSchema(AgentProfileApiSchema);
const AgentProfileMeResponseSchema = ApiResponseSchema(AgentProfileMeApiSchema);

const mapAgentProfile = (data: z.infer<typeof AgentProfileApiSchema>): AgentProfile => {
  const profile: AgentProfile = {
    id: data.id,
    name: data.name,
    avatarUrl: data.avatar_url,
    company: data.company,
    bio: data.bio ?? null,
    specialties: data.specialties ?? [],
    certifications: data.certifications ?? [],
    phone: data.phone ?? null,
    lineId: data.line_id ?? null,
    trustScore: data.trust_score,
    encouragementCount: data.encouragement_count,
    serviceRating: data.service_rating,
    reviewCount: data.review_count,
    completedCases: data.completed_cases,
    activeListings: data.active_listings,
    serviceYears: data.service_years,
  };

  if (data.joined_at !== undefined) {
    profile.joinedAt = data.joined_at;
  }
  if (data.internal_code !== undefined) {
    profile.internalCode = data.internal_code;
  }
  if (data.visit_count !== undefined) {
    profile.visitCount = data.visit_count;
  }
  if (data.deal_count !== undefined) {
    profile.dealCount = data.deal_count;
  }

  return profile;
};

const mapAgentProfileMe = (data: z.infer<typeof AgentProfileMeApiSchema>): AgentProfileMe => ({
  ...mapAgentProfile(data),
  email: data.email,
  points: data.points,
  quotaS: data.quota_s,
  quotaA: data.quota_a,
  createdAt: data.created_at,
});

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
  schema?: z.ZodType<ApiResponse<T>>
): Promise<T> {
  const response = await fetch(input, init);
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = json?.error?.message || json?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (!schema) return json as T;

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    logger.error('[agentService] response validation failed', {
      error: parsed.error.message,
    });
    throw new Error('Invalid API response');
  }

  const data = parsed.data;
  if (!data.success || data.data === undefined) {
    throw new Error(data.error?.message || 'API returned success: false');
  }

  return data.data;
}

export async function fetchAgentProfile(agentId: string): Promise<AgentProfile> {
  const data = await fetchJson(
    `/api/agent/profile?id=${encodeURIComponent(agentId)}`,
    undefined,
    AgentProfileResponseSchema
  );
  return mapAgentProfile(data);
}

export async function fetchAgentMe(): Promise<AgentProfileMe> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('未登入');
  }

  const data = await fetchJson(
    '/api/agent/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    AgentProfileMeResponseSchema
  );
  return mapAgentProfileMe(data);
}

export async function updateAgentProfile(payload: UpdateAgentProfilePayload): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('未登入');
  }

  const body = {
    name: payload.name,
    bio: payload.bio,
    specialties: payload.specialties,
    certifications: payload.certifications,
    phone: payload.phone,
    line_id: payload.lineId,
    joined_at: payload.joinedAt,
  };

  const response = await fetch('/api/agent/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.success) {
    const message = json?.error?.message || json?.error || '更新失敗';
    throw new Error(message);
  }

  return json?.data?.updated_at || '';
}

export async function uploadAgentAvatar(file: File): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('未登入');
  }

  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/agent/avatar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.success) {
    const message = json?.error?.message || json?.error || '上傳失敗';
    throw new Error(message);
  }

  return json?.data?.avatar_url || '';
}
