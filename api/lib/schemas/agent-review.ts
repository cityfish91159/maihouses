/**
 * Agent Review Zod Schemas（API 端專用）
 *
 * 與 src/types/agent-review.ts 保持同步
 * API serverless 環境無法跨邊界 import src/ 下的模組
 */

import { z } from 'zod';

export const CreateReviewPayloadSchema = z.object({
  agentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
  trustCaseId: z.string().uuid(),
  propertyId: z.string().trim().min(1).max(64).optional(),
});

export type CreateReviewPayload = z.infer<typeof CreateReviewPayloadSchema>;
