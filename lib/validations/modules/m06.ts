import { z } from "zod";
import { cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M06: Oddelovač a Medzera (Divider & Spacer)
 */

export const m06SeparatorSchema = z.object({
  type: z.enum(["spacer", "divider"]).default("divider"),
  
  // Spacer configuration
  height: z.enum(["8", "16", "24", "32", "48", "64", "96", "128"]).default("32"),

  // Divider configuration
  margin: z.enum(["none", "small", "medium", "large"]).default("medium"),
  style: z.enum(["solid", "dashed", "dotted", "none"]).default("solid"),
  thickness: z.coerce.number().min(0).max(10).default(1),
  color: z.enum(["neutral", "accent", "custom"]).default("neutral"),
  customHex: z.string().nullable().optional(),
  width: z.enum(["100", "50_center", "25_left"]).default("100"),

  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M06SeparatorConfig = z.infer<typeof m06SeparatorSchema>;
