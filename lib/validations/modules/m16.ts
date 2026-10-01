import { z } from "zod";
import { optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M16: Vzorkovníky a palety na stiahnutie (Color Swatches Download)
 */

export const m16SwatchItemSchema = z.object({
  id: z.string(),
  title: optionalI18nTextSchema,
  description: optionalI18nTextSchema.optional(),
  buttonLabel: optionalI18nTextSchema,
  badgeText: z.string().default("ASE"),
  storageType: z.enum(["LOGOBOOK_R2", "EXTERNAL_LINK", "AUTO_GENERATE"]).default("EXTERNAL_LINK"),
  autoGenerateType: z.enum(["css_variables", "json_tokens"]).optional(),
  fileUrl: z.string().default(""),
});

export const m16PaletteDownloadsSchema = z.object({
  title: optionalI18nTextSchema.default({
    en: "Palette & Swatch Downloads",
    sk: "Vzorkovníky a palety na stiahnutie",
  }),
  description: optionalI18nTextSchema.optional(),
  items: z.array(m16SwatchItemSchema).default([]),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M16SwatchItem = z.infer<typeof m16SwatchItemSchema>;
export type M16PaletteDownloadsConfig = z.infer<typeof m16PaletteDownloadsSchema>;
