import { z } from "zod";
import { i18nTextSchema, optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

export const m04CardButtonSchema = z.object({
  label: i18nTextSchema.default({
    en: "Explore section",
    sk: "Prejsť do sekcie",
  }),
  style: z.enum(["primary", "secondary", "outline", "ghost"]).default("primary"),
});

export const m04CardItemSchema = z.object({
  id: z.string(),
  imageUrl: z.string().optional(),
  title: i18nTextSchema.default({
    en: "Section Title",
    sk: "Názov sekcie",
  }),
  description: optionalI18nTextSchema,
  targetPageId: z.string().optional(),
  targetUrl: z.string().optional(),
  button: m04CardButtonSchema.default({
    label: { en: "Explore section", sk: "Prejsť do sekcie" },
    style: "primary",
  }),
});

export const m04RazcestnikSchema = z.object({
  columns: z.coerce.number().min(1).max(3).default(2),
  clickableEntireCard: z.boolean().default(true),
  items: z.array(m04CardItemSchema).default([
    {
      id: "card-sample-1",
      imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
      title: {
        en: "Print Logo Assets",
        sk: "Tlačové podklady loga",
      },
      description: {
        en: "CMYK vector files, EPS and PDF formats for offset printing.",
        sk: "Vektorové súbory CMYK, formáty EPS a PDF pre ofsetovú tlač.",
      },
      targetUrl: "#print",
      button: {
        label: { en: "View print guidelines", sk: "Zobraziť tlačové pravidlá" },
        style: "primary",
      },
    },
    {
      id: "card-sample-2",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      title: {
        en: "Digital & Screen Assets",
        sk: "Digitálne formáty pre obrazovky",
      },
      description: {
        en: "RGB SVG, PNG and WebP assets optimized for web and mobile applications.",
        sk: "RGB súbory SVG, PNG a WebP optimalizované pre web a aplikácie.",
      },
      targetUrl: "#digital",
      button: {
        label: { en: "Explore digital guidelines", sk: "Preskúmať digitálne pravidlá" },
        style: "secondary",
      },
    },
  ]),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M04CardItem = z.infer<typeof m04CardItemSchema>;
export type M04RazcestnikConfig = z.infer<typeof m04RazcestnikSchema>;
