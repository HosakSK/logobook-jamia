import { z } from "zod";

/**
 * Brand project limits by subscription tier (Single Source of Truth)
 */
export const TIER_LIMITS: Record<string, number> = {
  FREE: 1,
  COMPANY: 3,
  FREELANCER: 8,
  AGENCY: 30,
  PLATINUM: 999999,
};

/**
 * Team member limits by subscription tier (Owner + invited collaborators)
 */
export const TEAM_LIMITS: Record<string, number> = {
  FREE: 1, // 1 user (Owner only, 0 invitations)
  COMPANY: 3, // 3 members (Owner + 2 collaborators, e.g. client + freelancer)
  FREELANCER: 3, // 3 members (Owner + 2 collaborators)
  AGENCY: 10, // 10 members
  PLATINUM: 999999, // Unlimited team members
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
