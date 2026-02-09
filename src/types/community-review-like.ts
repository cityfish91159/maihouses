import { z } from 'zod';

export const ReviewLikeResponseSchema = z.object({
  success: z.literal(true),
  liked: z.boolean(),
  totalLikes: z.number().int().min(0),
});

export type ReviewLikeResponse = z.infer<typeof ReviewLikeResponseSchema>;

export const ToggleReviewLikePayloadSchema = z.object({
  propertyId: z.string().min(1),
});

export type ToggleReviewLikePayload = z.infer<typeof ToggleReviewLikePayloadSchema>;

export const GetReviewLikeResponseSchema = z.object({
  success: z.literal(true),
  liked: z.boolean(),
  totalLikes: z.number().int().min(0),
});

export type GetReviewLikeResponse = z.infer<typeof GetReviewLikeResponseSchema>;
