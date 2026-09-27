import { z } from "zod";

export const TIER_LIMITS: Record<string, number> = {
  FREE: 1,
  COMPANY: 2,
  FREELANCER: 10,
  AGENCY: 50,
  PLATINUM: 100,
};

export const createBrandSchema = z.object({
  name: z
    .string()
    .min(2, "Brand name must be at least 2 characters")
    .max(60, "Brand name must be at most 60 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40, "Slug must be at most 40 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase alphanumeric characters and hyphens, and cannot start or end with a hyphen"
    ),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
