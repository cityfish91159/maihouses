import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { cors } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';

const CreateLeadRequestSchema = z
  .object({
    customerName: z.string().trim().min(1).max(100),
    customerPhone: z.string().trim().min(6).max(30),
    customerEmail: z.string().trim().email().optional(),
    customerLineId: z.string().trim().max(100).optional(),
    propertyId: z.string().trim().min(1).max(64),
    source: z.enum(['sidebar', 'mobile_bar', 'booking', 'direct']),
    budgetRange: z.string().trim().max(120).optional(),
    preferredContactTime: z.string().trim().max(120).optional(),
    needsDescription: z.string().trim().max(4000).optional(),
    // Client hint only; server does not trust this value.
    agentId: z.string().trim().optional(),
  })
  .strict();

const PropertyOwnerSchema = z.object({
  public_id: z.string(),
  agent_id: z.string().nullable(),
});

const LEAD_CREATE_ERROR_CODES = {
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
  PROPERTY_AGENT_MISSING: 'PROPERTY_AGENT_MISSING',
  LEAD_CREATE_FAILED: 'LEAD_CREATE_FAILED',
} as const;

function extractLeadId(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const maybeId = (data as { id?: unknown }).id;
    if (typeof maybeId === 'string' && maybeId.trim()) return maybeId;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, 'POST only'));
    return;
  }

  const bodyResult = CreateLeadRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
    res
      .status(400)
      .json(
        errorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid request body', bodyResult.error.issues)
      );
    return;
  }

  const body = bodyResult.data;
  const supabase = getSupabaseAdmin();

  try {
    // Server-authoritative mapping: resolve final agent_id from propertyId.
    const { data: propertyRow, error: propertyError } = await supabase
      .from('properties')
      .select('public_id, agent_id')
      .eq('public_id', body.propertyId)
      .single();

    if (propertyError || !propertyRow) {
      logger.warn('[lead/create] property not found', {
        propertyId: body.propertyId,
        error: propertyError?.message,
      });
      res
        .status(404)
        .json(errorResponse(LEAD_CREATE_ERROR_CODES.PROPERTY_NOT_FOUND, 'Property not found'));
      return;
    }

    const parsedProperty = PropertyOwnerSchema.safeParse(propertyRow);
    if (!parsedProperty.success) {
      logger.error('[lead/create] invalid property row schema', {
        propertyId: body.propertyId,
        issues: parsedProperty.error.issues,
      });
      res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Invalid property data'));
      return;
    }

    const resolvedAgentId = parsedProperty.data.agent_id?.trim() ?? '';
    if (!resolvedAgentId || resolvedAgentId === 'unknown') {
      logger.warn('[lead/create] property has invalid agent_id', {
        propertyId: body.propertyId,
        resolvedAgentId,
      });
      res
        .status(422)
        .json(
          errorResponse(
            LEAD_CREATE_ERROR_CODES.PROPERTY_AGENT_MISSING,
            'Property is not bound to an agent'
          )
        );
      return;
    }

    if (body.agentId && body.agentId !== resolvedAgentId) {
      logger.warn('[lead/create] client agentId mismatch, server value applied', {
        propertyId: body.propertyId,
        clientAgentId: body.agentId,
        resolvedAgentId,
      });
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_lead', {
      p_customer_name: body.customerName,
      p_customer_phone: body.customerPhone,
      p_customer_email: body.customerEmail || null,
      p_customer_line_id: body.customerLineId || null,
      p_agent_id: resolvedAgentId,
      p_property_id: body.propertyId,
      p_source: body.source,
      p_budget_range: body.budgetRange || null,
      p_preferred_contact_time: body.preferredContactTime || null,
      p_needs_description: body.needsDescription || null,
    });

    if (rpcError) {
      logger.error('[lead/create] create_lead RPC failed', {
        error: rpcError.message,
        propertyId: body.propertyId,
        resolvedAgentId,
      });
      res
        .status(500)
        .json(errorResponse(LEAD_CREATE_ERROR_CODES.LEAD_CREATE_FAILED, 'Failed to create lead'));
      return;
    }

    const leadId = extractLeadId(rpcData);
    if (!leadId) {
      logger.error('[lead/create] RPC returned invalid lead id', {
        propertyId: body.propertyId,
        resolvedAgentId,
        rpcData,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Invalid create_lead response'));
      return;
    }

    res
      .status(200)
      .json(
        successResponse({
          leadId,
          agentId: resolvedAgentId,
        })
      );
  } catch (error) {
    logger.error('[lead/create] unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      propertyId: body.propertyId,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
  }
}
