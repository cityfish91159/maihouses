import { z } from 'zod';

export const ToggleReviewLikePayloadSchema = z.object({
  propertyId: z.string().trim().min(1),
});

export type ToggleReviewLikePayload = z.infer<typeof ToggleReviewLikePayloadSchema>;

export const ReviewLikeResponseSchema = z.object({
  success: z.literal(true),
  liked: z.boolean(),
  totalLikes: z.number().int().min(0),
});

export type ReviewLikeResponse = z.infer<typeof ReviewLikeResponseSchema>;

export const ReviewLikeQuerySchema = z.object({
  propertyId: z.preprocess((value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  }, z.string().trim().min(1)),
});

export type ReviewLikeQuery = z.infer<typeof ReviewLikeQuerySchema>;
