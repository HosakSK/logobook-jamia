import { z } from "zod";
import { optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M15: Neutrálne a systémové podklady (Digital Backgrounds)
 */

export const m15SurfaceSchema = z.object({
  id: z.string(),
  name: optionalI18nTextSchema,
  description: optionalI18nTextSchema.optional(),
  colorSource: z.enum(["global", "custom"]).default("custom"),
  globalColorId: z.string().nullable().default(null),
  customHex: z.string().default("#FFFFFF"),
  textColor: z.enum(["light", "dark", "auto"]).default("auto"),
});

export const m15NeutralBackgroundsSchema = z.object({
  assetIdToTest: z.string().nullable().default(null),
  customLogoUrl: z.string().nullable().default(null),
  surfaces: z.array(m15SurfaceSchema).default([]),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M15Surface = z.infer<typeof m15SurfaceSchema>;
export type M15NeutralBackgroundsConfig = z.infer<typeof m15NeutralBackgroundsSchema>;
