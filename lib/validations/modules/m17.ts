import { z } from "zod";
import { optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M17: Univerzálna edukatívna tabuľka (Universal Color Guide)
 */

export const m17EnabledRowsSchema = z.object({
  hex: z.boolean().default(true),
  rgb: z.boolean().default(true),
  cmyk: z.boolean().default(true),
  pantoneC: z.boolean().default(true),
  pantoneU: z.boolean().default(false),
  pantoneTcx: z.boolean().default(false),
  ral: z.boolean().default(false),
});

export const m17GuidelinesTableSchema = z.object({
  enabledRows: m17EnabledRowsSchema.default({
    hex: true,
    rgb: true,
    cmyk: true,
    pantoneC: true,
    pantoneU: false,
    pantoneTcx: false,
    ral: false,
  }),
  customNote: optionalI18nTextSchema.optional(),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M17EnabledRows = z.infer<typeof m17EnabledRowsSchema>;
export type M17GuidelinesTableConfig = z.infer<typeof m17GuidelinesTableSchema>;
