import { z } from "zod";
import { optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M12: Karta farby (Color Card)
 */

export const m12DisplaySystemsSchema = z.object({
  hex: z.boolean().default(true),
  rgb: z.boolean().default(true),
  cmyk: z.boolean().default(true),
  pantoneC: z.boolean().default(true),
  pantoneU: z.boolean().default(false),
  pantoneTcx: z.boolean().default(false),
  ral: z.boolean().default(true),
  wcag: z.boolean().default(true),
});

export const m12ColorCardSchema = z.object({
  globalColorId: z.string().nullable().default(null),
  displaySystems: m12DisplaySystemsSchema.default({
    hex: true,
    rgb: true,
    cmyk: true,
    pantoneC: true,
    pantoneU: false,
    pantoneTcx: false,
    ral: true,
    wcag: true,
  }),
  customColor: z
    .object({
      name: optionalI18nTextSchema,
      role: z.string().optional(),
      hex: z.string().default("#C8D400"),
      rgb: z.string().optional(),
      cmykC: z.number().optional().nullable(),
      cmykM: z.number().optional().nullable(),
      cmykY: z.number().optional().nullable(),
      cmykK: z.number().optional().nullable(),
      pantoneC: z.string().optional(),
      pantoneU: z.string().optional(),
      pantoneTCX: z.string().optional(),
      ral: z.string().optional(),
    })
    .optional(),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M12ColorCardConfig = z.infer<typeof m12ColorCardSchema>;
export type M12DisplaySystems = z.infer<typeof m12DisplaySystemsSchema>;
