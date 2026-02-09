import { z } from 'zod';

export const RatingDistributionSchema = z.object({
  '1': z.number().int().nonnegative(),
  '2': z.number().int().nonnegative(),
  '3': z.number().int().nonnegative(),
  '4': z.number().int().nonnegative(),
  '5': z.number().int().nonnegative(),
});

export const AgentReviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable(),
  createdAt: z.string(),
  reviewerName: z.string(),
});

export type AgentReview = z.infer<typeof AgentReviewSchema>;

export const AgentReviewListDataSchema = z.object({
  reviews: z.array(AgentReviewSchema),
  total: z.number().int().nonnegative(),
  avgRating: z.number().min(0).max(5),
  distribution: RatingDistributionSchema,
});

export const AgentReviewListResponseSchema = z.object({
  success: z.literal(true),
  data: AgentReviewListDataSchema,
});

export type AgentReviewListResponse = z.infer<typeof AgentReviewListResponseSchema>;
export type AgentReviewListData = z.infer<typeof AgentReviewListDataSchema>;

export const CreateReviewPayloadSchema = z.object({
  agentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
  trustCaseId: z.string().uuid().optional(),
  propertyId: z.string().trim().min(1).max(64).optional(),
});

export type CreateReviewPayload = z.infer<typeof CreateReviewPayloadSchema>;

export const CreateReviewResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    reviewId: z.string().uuid(),
  }),
});

export type CreateReviewResponse = z.infer<typeof CreateReviewResponseSchema>;
