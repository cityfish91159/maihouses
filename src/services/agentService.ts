import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { getErrorMessage, UNKNOWN_ERROR_MESSAGE } from '../lib/error';
import {
  AgentProfileApiSchema,
  AgentProfileMeApiSchema,
  AgentProfileMeSchema,
  AgentProfileSchema,
  type AgentProfile,
  type AgentProfileApi,
  type AgentProfileMe,
  type AgentProfileMeApi,
  type UpdateAgentProfilePayload,
} from '../types/agent.types';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message?: string;
  };
};

const createApiResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    success: z.boolean(),
    data: schema.optional(),
    error: z
      .object({
        message: z.string().optional(),
      })
      .optional(),
  }) as z.ZodType<ApiResponse<z.infer<T>>>;

const AgentProfileResponseSchema = createApiResponseSchema(AgentProfileApiSchema);
const AgentProfileMeResponseSchema = createApiResponseSchema(AgentProfileMeApiSchema);

const RETRY_DELAYS_MS = [200, 600] as const;
const DEFAULT_RETRY_DELAY_MS = 600;
const HTTP_METHOD_GET = 'GET';

const ERROR_REQUEST_FAILED = 'Request failed';
const ERROR_INVALID_API_RESPONSE = 'Invalid API response';
const ERROR_API_SUCCESS_FALSE = 'API returned success: false';
const ERROR_UNAUTHORIZED = '未登入';
const ERROR_EMPTY_AGENT_ID = 'agentId 不可為空';
const ERROR_EMPTY_UPDATE_PAYLOAD = '更新內容不可為空';
const ERROR_INVALID_FILE = '請提供有效的頭像檔案';
const ERROR_UPDATE_FAILED = '更新失敗';
const ERROR_UPLOAD_FAILED = '上傳失敗';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryByStatus = (status: number) => status >= 500 || status === 429;

const shouldRetryByMethod = (init?: RequestInit) =>
  (init?.method ?? HTTP_METHOD_GET).toUpperCase() === HTTP_METHOD_GET;

const getRetryDelay = (attempt: number) => {
  const fallbackDelay = RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] ?? DEFAULT_RETRY_DELAY_MS;
  return RETRY_DELAYS_MS[attempt] ?? fallbackDelay;
};

const parseJsonSafely = async (response: Response): Promise<unknown> =>
  response.json().catch(() => ({}));

const getApiErrorField = (json: unknown): unknown => {
  if (typeof json !== 'object' || json === null) {
    return undefined;
  }

  return (json as { error?: unknown }).error;
};

const getApiErrorMessage = (json: unknown, fallback: string, status?: number): string => {
  const extractedMessage = getErrorMessage(getApiErrorField(json));
  if (extractedMessage !== UNKNOWN_ERROR_MESSAGE) {
    return extractedMessage;
  }

  if (typeof status === 'number') {
    return `HTTP ${status}`;
  }

  return fallback;
};

const mapAgentProfile = (data: AgentProfileApi): AgentProfile =>
  AgentProfileSchema.parse({
    id: data.id,
    name: data.name,
    avatarUrl: data.avatar_url,
    company: data.company,
    bio: data.bio ?? null,
    specialties: data.specialties ?? [],
    certifications: data.certifications ?? [],
    phone: data.phone ?? null,
    lineId: data.line_id ?? null,
    licenseNumber: data.license_number ?? null,
    isVerified: data.is_verified ?? false,
    verifiedAt: data.verified_at ?? null,
    trustScore: data.trust_score,
    encouragementCount: data.encouragement_count,
    serviceRating: data.service_rating,
    reviewCount: data.review_count,
    completedCases: data.completed_cases,
    activeListings: data.active_listings,
    serviceYears: data.service_years,
    joinedAt: data.joined_at ?? undefined,
    internalCode: data.internal_code ?? undefined,
    visitCount: data.visit_count ?? undefined,
    dealCount: data.deal_count ?? undefined,
  });

const mapAgentProfileMe = (data: AgentProfileMeApi): AgentProfileMe =>
  AgentProfileMeSchema.parse({
    ...mapAgentProfile(data),
    email: data.email,
    points: data.points,
    quotaS: data.quota_s,
    quotaA: data.quota_a,
    createdAt: data.created_at,
  });

const fetchWithRetry = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  let response: Response | null = null;
  let fetchError: unknown = null;

  const allowRetry = shouldRetryByMethod(init);
  const maxRetries = allowRetry ? RETRY_DELAYS_MS.length : 0;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      response = await fetch(input, init);
      fetchError = null;

      if (!allowRetry || !shouldRetryByStatus(response.status) || attempt === maxRetries) {
        return response;
      }
    } catch (err) {
      fetchError = err;
      if (attempt === maxRetries) {
        throw err;
      }
    }

    await delay(getRetryDelay(attempt));
  }

  if (response) return response;
  throw fetchError instanceof Error ? fetchError : new Error(ERROR_REQUEST_FAILED);
};

const validateAndExtractApiResponse = <T>(json: unknown, schema?: z.ZodType<ApiResponse<T>>): T => {
  if (!schema) return json as T;

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    logger.error('[agentService] response validation failed', {
      error: parsed.error.message,
    });
    throw new Error(ERROR_INVALID_API_RESPONSE);
  }

  const data = parsed.data;
  if (!data.success || data.data === undefined) {
    throw new Error(data.error?.message || ERROR_API_SUCCESS_FALSE);
  }

  return data.data;
};

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
  schema?: z.ZodType<ApiResponse<T>>
): Promise<T> {
  const response = await fetchWithRetry(input, init);
  const json = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(json, ERROR_REQUEST_FAILED, response.status));
  }

  return validateAndExtractApiResponse(json, schema);
}

async function getAuthTokenOrThrow(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;
  if (!token) {
    throw new Error(ERROR_UNAUTHORIZED);
  }
  return token;
}

const buildUpdateRequestBody = (payload: UpdateAgentProfilePayload) =>
  Object.fromEntries(
    Object.entries({
      name: payload.name,
      company: payload.company,
      bio: payload.bio,
      specialties: payload.specialties,
      certifications: payload.certifications,
      phone: payload.phone,
      line_id: payload.lineId,
      license_number: payload.licenseNumber,
      joined_at: payload.joinedAt,
    }).filter(([, value]) => value !== undefined)
  );

export async function fetchAgentProfile(agentId: string): Promise<AgentProfile> {
  const normalizedId = agentId.trim();
  if (!normalizedId) {
    throw new Error(ERROR_EMPTY_AGENT_ID);
  }

  const data = await fetchJson(
    `/api/agent/profile?id=${encodeURIComponent(normalizedId)}`,
    undefined,
    AgentProfileResponseSchema
  );
  return mapAgentProfile(data);
}

export async function fetchAgentMe(): Promise<AgentProfileMe> {
  const token = await getAuthTokenOrThrow();
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
  const token = await getAuthTokenOrThrow();
  const body = buildUpdateRequestBody(payload);

  if (Object.keys(body).length === 0) {
    throw new Error(ERROR_EMPTY_UPDATE_PAYLOAD);
  }

  const response = await fetch('/api/agent/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await parseJsonSafely(response);
  if (!response.ok || !(json as { success?: boolean })?.success) {
    throw new Error(getApiErrorMessage(json, ERROR_UPDATE_FAILED, response.status));
  }

  return (json as { data?: { updated_at?: string } })?.data?.updated_at ?? '';
}

export async function uploadAgentAvatar(file: File): Promise<string> {
  if (!file || file.size <= 0) {
    throw new Error(ERROR_INVALID_FILE);
  }

  const token = await getAuthTokenOrThrow();
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/agent/avatar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await parseJsonSafely(response);
  if (!response.ok || !(json as { success?: boolean })?.success) {
    throw new Error(getApiErrorMessage(json, ERROR_UPLOAD_FAILED, response.status));
  }

  return (json as { data?: { avatar_url?: string } })?.data?.avatar_url ?? '';
}
