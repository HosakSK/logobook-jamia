import { z } from "zod";
import { optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M10: Príklady použitia a Mockup Galéria (Image Gallery)
 */

export const m10ImageItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  assetId: z.string().nullable().optional(),
  caption: optionalI18nTextSchema,
});

export const m10LightboxSchema = z.object({
  enabled: z.boolean().default(true),
  backdrop: z.enum(["frosted_glass", "solid"]).default("frosted_glass"),
});

export const m10ImageGallerySchema = z.object({
  columns: z.coerce.number().min(1).max(4).default(3),
  aspectRatio: z.enum(["original", "16/9", "4/3", "1/1"]).default("16/9"),
  showCaptions: z.boolean().default(true),
  lightbox: m10LightboxSchema.default({
    enabled: true,
    backdrop: "frosted_glass",
  }),
  images: z.array(m10ImageItemSchema).default([
    {
      id: "mockup-1",
      url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
      caption: {
        en: "Apparel & merchandise application on black cotton t-shirt",
        sk: "Aplikácia loga na prémiových bavlnených tričkách",
        cs: "Aplikace loga na bavlněných tričkách",
      },
    },
    {
      id: "mockup-2",
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1000&q=80",
      caption: {
        en: "Outdoor architectural signage and building facade branding",
        sk: "Exteriérové architektonické značenie a fasáda budovy",
        cs: "Exteriérové značení a fasáda budovy",
      },
    },
    {
      id: "mockup-3",
      url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80",
      caption: {
        en: "Corporate stationery, business cards and envelope branding",
        sk: "Firemné tlačoviny, vizitky a korešpondenčné obálky",
        cs: "Firemní tiskoviny, vizitky a obálky",
      },
    },
  ]),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M10ImageGalleryConfig = z.infer<typeof m10ImageGallerySchema>;
export type M10ImageItem = z.infer<typeof m10ImageItemSchema>;
