import { z } from "zod";
import { cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M14: Digitálne odtiene (Tonal Steps Matrix & UI Examples)
 */

export const m14TonalStepsSchema = z.object({
  baseColorIds: z.array(z.string()).default([]),
  generationMode: z.enum(["hsluv_auto", "manual_override"]).default("hsluv_auto"),
  overrides: z.record(z.string(), z.record(z.string(), z.string())).default({}),
  showContrastRule: z.boolean().default(true),
  showUiExamples: z.boolean().default(true),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M14TonalStepsConfig = z.infer<typeof m14TonalStepsSchema>;
