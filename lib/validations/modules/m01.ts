import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

export const m01HeadingSchema = z.object({
  level: z.enum(["h1", "h2", "h3", "h4"]).default("h2"),
  fontFamily: z.string().optional().default("var(--font-heading)"),
  align: z.enum(["left", "center", "right"]).default("left"),
  showAccentLine: z.boolean().default(false),
  accentColor: z.string().optional(),
  text: i18nTextSchema.default({
    en: "Section Heading",
    sk: "Názov sekcie",
  }),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M01HeadingConfig = z.infer<typeof m01HeadingSchema>;
