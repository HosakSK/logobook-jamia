import { z } from "zod";
import { cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M18: Typografia (Typography Showcase & Type Tester)
 */

export const m18HierarchyLevelSchema = z.object({
  size: z.number().default(32),
  weight: z.number().default(600),
  lineHeight: z.number().default(1.25),
});

export const m18HierarchySchema = z.object({
  h1: z
    .object({
      size: z.number().default(48),
      weight: z.number().default(700),
      lineHeight: z.number().default(1.2),
    })
    .default({ size: 48, weight: 700, lineHeight: 1.2 }),
  h2: z
    .object({
      size: z.number().default(32),
      weight: z.number().default(600),
      lineHeight: z.number().default(1.25),
    })
    .default({ size: 32, weight: 600, lineHeight: 1.25 }),
  h3: z
    .object({
      size: z.number().default(24),
      weight: z.number().default(500),
      lineHeight: z.number().default(1.3),
    })
    .default({ size: 24, weight: 500, lineHeight: 1.3 }),
  body: z
    .object({
      size: z.number().default(16),
      weight: z.number().default(400),
      lineHeight: z.number().default(1.6),
    })
    .default({ size: 16, weight: 400, lineHeight: 1.6 }),
});

export const m18TypographySchema = z.object({
  typographyId: z.string().nullable().default(null),
  license: z.string().default("SIL Open Font License"),
  authors: z.string().default("Tokotype / Google Fonts"),
  selectedWeights: z.array(z.number()).default([300, 400, 600, 800]),
  isVariableFont: z.boolean().default(false),
  showTypeTester: z.boolean().default(true),
  showGlyphSet: z.boolean().default(true),
  showHierarchyTable: z.boolean().default(true),
  hierarchy: m18HierarchySchema.default({
    h1: { size: 48, weight: 700, lineHeight: 1.2 },
    h2: { size: 32, weight: 600, lineHeight: 1.25 },
    h3: { size: 24, weight: 500, lineHeight: 1.3 },
    body: { size: 16, weight: 400, lineHeight: 1.6 },
  }),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M18HierarchyLevel = z.infer<typeof m18HierarchyLevelSchema>;
export type M18Hierarchy = z.infer<typeof m18HierarchySchema>;
export type M18TypographyConfig = z.infer<typeof m18TypographySchema>;
