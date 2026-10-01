import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M21: Firemná vizitka a Tlačoviny (Business Card & Print Showcase)
 */

export const m21ProductTypeSchema = z.enum([
  "business_card",
  "flyer",
  "postcard",
  "custom",
]);
export type M21ProductType = z.infer<typeof m21ProductTypeSchema>;

export const m21DimensionStandardSchema = z.enum([
  "eu_90_50",
  "eu_85_55",
  "us_89_51",
  "a6_148_105",
  "a5_210_148",
  "dl_210_99",
  "a4_210_297",
  "custom",
]);
export type M21DimensionStandard = z.infer<typeof m21DimensionStandardSchema>;

export const m21DownloadFormatSchema = z.enum([
  "PDF",
  "INDD",
  "IDML",
  "AI",
  "EPS",
  "ZIP",
  "PSD",
]);
export type M21DownloadFormat = z.infer<typeof m21DownloadFormatSchema>;

export const m21DownloadItemSchema = z.object({
  id: z.string(),
  format: m21DownloadFormatSchema.default("PDF"),
  url: z.string().default(""),
  label: i18nTextSchema,
  fileSize: z.string().optional(),
});
export type M21DownloadItem = z.infer<typeof m21DownloadItemSchema>;

export const m21BusinessCardSchema = z.object({
  productType: m21ProductTypeSchema.default("business_card"),
  customProductTitle: i18nTextSchema.optional(),
  previews: z.object({
    face: z.string().default(""),
    back: z.string().nullable().default(""),
    orientation: z.enum(["landscape", "portrait"]).default("landscape"),
  }).default({
    face: "",
    back: "",
    orientation: "landscape",
  }),
  dimensions: z.object({
    standard: m21DimensionStandardSchema.default("eu_90_50"),
    width: z.coerce.number().min(10).max(1000).default(90),
    height: z.coerce.number().min(10).max(1000).default(50),
    bleed: z.coerce.number().min(0).max(50).default(2),
    safeZone: z.coerce.number().min(0).max(50).default(4),
  }).default({
    standard: "eu_90_50",
    width: 90,
    height: 50,
    bleed: 2,
    safeZone: 4,
  }),
  technicalOverlay: z.object({
    mode: z.enum(["generated", "custom_svg"]).default("generated"),
    customSvgUrl: z.string().nullable().default(null),
    showByDefault: z.boolean().default(false),
  }).default({
    mode: "generated",
    customSvgUrl: null,
    showByDefault: false,
  }),
  paperSpecs: z.object({
    recommendedPaper: i18nTextSchema.default({
      en: "350g/m² Silk Coated Cardstock with Matte Laminate",
      sk: "350g/m² Krieda matná s matnou Soft-touch lamináciou",
      cs: "350g/m² Křída matná s matnou Soft-touch laminací",
    }),
    finishing: i18nTextSchema.default({
      en: "Spot UV Varnish on brand logo / icon",
      sk: "Parciálny 3D UV lak na logu / symbole",
      cs: "Parciální 3D UV lak na logu / symbolu",
    }),
    colorMode: z.string().default("CMYK (ISO Coated v2 / Fogra 39)"),
  }).default({
    recommendedPaper: {
      en: "350g/m² Silk Coated Cardstock with Matte Laminate",
      sk: "350g/m² Krieda matná s matnou Soft-touch lamináciou",
      cs: "350g/m² Křída matná s matnou Soft-touch laminací",
    },
    finishing: {
      en: "Spot UV Varnish on brand logo / icon",
      sk: "Parciálny 3D UV lak na logu / symbole",
      cs: "Parciální 3D UV lak na logu / symbolu",
    },
    colorMode: "CMYK (ISO Coated v2 / Fogra 39)",
  }),
  downloads: z.array(m21DownloadItemSchema).default([
    {
      id: "dl-pdf",
      format: "PDF",
      url: "",
      label: {
        en: "Print-ready PDF with Bleed & Crop Marks",
        sk: "Tlačové PDF so spadávkou a orezovými značkami",
        cs: "Tiskové PDF se spadávkou a ořezovými značkami",
      },
      fileSize: "2.4 MB",
    },
    {
      id: "dl-indd",
      format: "INDD",
      url: "",
      label: {
        en: "Adobe InDesign Package (.indd + .idml)",
        sk: "Adobe InDesign balíček (.indd + .idml)",
        cs: "Adobe InDesign balíček (.indd + .idml)",
      },
      fileSize: "8.1 MB",
    },
    {
      id: "dl-ai",
      format: "AI",
      url: "",
      label: {
        en: "Adobe Illustrator Vector Template (.ai)",
        sk: "Vektorová šablóna Adobe Illustrator (.ai)",
        cs: "Vektorová šablona Adobe Illustrator (.ai)",
      },
      fileSize: "4.5 MB",
    },
  ]),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M21BusinessCardConfig = z.infer<typeof m21BusinessCardSchema>;
