import { z } from "zod";

export const COLOR_ROLES = [
  "PRIMARY",
  "SECONDARY",
  "ACCENT",
  "NEUTRAL",
  "CUSTOM",
] as const;

export type ColorRole = (typeof COLOR_ROLES)[number];

export const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const saveColorSchema = z.object({
  name: z.string().min(1, { message: "Názov farby je povinný" }),
  nameSk: z.string().optional(),
  nameCs: z.string().optional(),
  role: z.enum(COLOR_ROLES),
  hex: z
    .string()
    .trim()
    .regex(hexColorRegex, { message: "Neplatný HEX formát (očakáva sa napr. #0055FF alebo #FFF)" }),
  rgb: z.string().optional(),
  cmykC: z.coerce.number().min(0).max(100).optional().nullable(),
  cmykM: z.coerce.number().min(0).max(100).optional().nullable(),
  cmykY: z.coerce.number().min(0).max(100).optional().nullable(),
  cmykK: z.coerce.number().min(0).max(100).optional().nullable(),
  pantoneC: z.string().optional(),
  pantoneU: z.string().optional(),
  pantoneTCX: z.string().optional(),
  ral: z.string().optional(),
  order: z.coerce.number().optional().default(0),
});

export const bulkImportColorsSchema = z.object({
  hexText: z.string().min(3, { message: "Zadajte aspoň jeden platný HEX kód farby." }),
});

export type SaveColorInput = z.infer<typeof saveColorSchema>;
export type BulkImportColorsInput = z.infer<typeof bulkImportColorsSchema>;
