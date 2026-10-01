import { z } from "zod";
import { cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M13: Farebná paleta (Color Palette Grid / Row)
 */

export const m13DisplaySystemsSchema = z.object({
  hex: z.boolean().default(true),
  rgb: z.boolean().default(false),
  cmyk: z.boolean().default(true),
  pantoneC: z.boolean().default(false),
});

export const m13ColorPaletteSchema = z.object({
  colorIds: z.array(z.string()).default([]),
  layout: z.enum(["tiles", "vertical_bars"]).default("tiles"),
  displaySystems: m13DisplaySystemsSchema.default({
    hex: true,
    rgb: false,
    cmyk: true,
    pantoneC: false,
  }),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M13ColorPaletteConfig = z.infer<typeof m13ColorPaletteSchema>;
export type M13DisplaySystems = z.infer<typeof m13DisplaySystemsSchema>;
