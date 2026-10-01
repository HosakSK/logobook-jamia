import { z } from "zod";
import { optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M19: Vzory a Patterny (Brand Patterns & Motifs)
 */

export const m19PreviewSchema = z.object({
  id: z.string(),
  type: z.enum(["pattern_viewer", "seamless_tiler", "static_image"]).default("pattern_viewer"),
  url: z.string(),
  label: optionalI18nTextSchema,
  defaultScale: z.number().default(1.0),
  defaultRepeat: z.boolean().default(true), // Toggle repeat vs no-repeat (single motif)
});

export const m19DownloadSchema = z.object({
  format: z.string().default("SVG"),
  url: z.string(),
  label: optionalI18nTextSchema.optional(),
});

export const m19PatternItemSchema = z.object({
  id: z.string(),
  title: optionalI18nTextSchema,
  description: optionalI18nTextSchema.optional(),
  previews: z.array(m19PreviewSchema).default([]),
  downloads: z.array(m19DownloadSchema).default([]),
  showDownloadAllZip: z.boolean().default(true),
});

export const m19PatternsConfigSchema = z.object({
  layout: z.enum(["grid", "stack"]).default("grid"),
  columns: z.number().default(2),
  items: z.array(m19PatternItemSchema).default([]),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M19Preview = z.infer<typeof m19PreviewSchema>;
export type M19Download = z.infer<typeof m19DownloadSchema>;
export type M19PatternItem = z.infer<typeof m19PatternItemSchema>;
export type M19PatternsConfig = z.infer<typeof m19PatternsConfigSchema>;
