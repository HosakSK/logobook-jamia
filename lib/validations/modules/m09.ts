import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M09: Minimálna veľkosť loga (Minimum Size)
 */

export const m09DimensionSchema = z.object({
  width: z.coerce.number().min(1),
  height: z.coerce.number().optional().nullable(),
});

export const m09MinSizeSchema = z.object({
  mediumMode: z.enum(["print", "digital", "both"]).default("both"),
  printMm: m09DimensionSchema.nullable().default({
    width: 25,
    height: null,
  }),
  digitalPx: m09DimensionSchema.nullable().default({
    width: 80,
    height: null,
  }),
  ruleText: i18nTextSchema.default({
    en: "To ensure legibility, this logo variation must not be reproduced smaller than the specified minimum dimensions. For smaller applications, use the standalone icon/symbol.",
    sk: "Pre zachovanie čitateľnosti nie je povolené používať túto variantu loga v rozmeroch menších, než sú stanovené minimá. Pre menšie aplikácie použite samostatný symbol.",
    cs: "Pro zachování čitelnosti není povoleno používat tuto variantu loga v rozměrech menších, než jsou stanovená minima. Pro menší aplikace použijte samostatný symbol.",
  }),
  svgSource: z.enum(["inherit_m07", "library", "direct_upload"]).default("library"),
  assetId: z.string().nullable().default(null),
  customSvgUrl: z.string().nullable().default(null),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M09MinSizeConfig = z.infer<typeof m09MinSizeSchema>;
export type M09Dimension = z.infer<typeof m09DimensionSchema>;
