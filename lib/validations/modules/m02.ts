import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

export const m02RichTextSchema = z.object({
  fontFamily: z.string().optional().default("var(--font-body)"),
  size: z.enum(["small", "body", "lead", "custom"]).default("body"),
  customFontSize: z.number().nullable().optional().default(null),
  maxWidth: z.enum(["prose", "full"]).default("prose"),
  editorMode: z.enum(["plain_text", "rich_text", "markdown"]).default("rich_text"),
  content: i18nTextSchema.default({
    en: "<p>Write rich text content here. Provide brand rules, rationale, and usage specifications.</p>",
    sk: "<p>Sem napíšte formátovaný text. Definujte pravidlá značky, odôvodnenia a špecifikácie použitia.</p>",
  }),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M02RichTextConfig = z.infer<typeof m02RichTextSchema>;
