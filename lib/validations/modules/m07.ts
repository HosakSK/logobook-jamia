import { z } from "zod";
import { optionalI18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Standard educational descriptions for logo file formats.
 * Primary language is English (EN), with Slovak (SK) and Czech (CS) translations.
 */
export const DEFAULT_FORMAT_DESCRIPTIONS: Record<string, Record<string, string>> = {
  SVG: {
    en: "Scalable vector format for websites, web apps, and modern digital interfaces.",
    sk: "Škálovateľný vektorový formát pre weby, aplikácie a moderný digitál.",
    cs: "Škálovatelný vektorový formát pro weby, aplikace a moderní digitál.",
  },
  PDF: {
    en: "Universal vector document format for high-quality printing and digital presentations.",
    sk: "Univerzálny vektorový dokument vhodný pre ofsetovú tlač aj digitálnu prezentáciu.",
    cs: "Univerzální vektorový dokument vhodný pro ofsetový tisk i digitální prezentaci.",
  },
  EPS: {
    en: "Industry standard vector format for professional printers and billboard production.",
    sk: "Štandardný vektorový formát pre profesionálne tlačiarne a veľkoformátovú tlač.",
    cs: "Standardní vektorový formát pro profesionální tiskárny a velkoformátový tisk.",
  },
  AI: {
    en: "Original editable Adobe Illustrator vector source file for graphic designers.",
    sk: "Originálny upraviteľný zdrojový súbor Adobe Illustrator pre grafických dizajnérov.",
    cs: "Originální upravitelný zdrojový soubor Adobe Illustrator pro grafické designéry.",
  },
  PNG: {
    en: "High-resolution raster image with transparent background for office apps and social media.",
    sk: "Rastrový obrázok vo vysokom rozlíšení s priehľadným pozadím pre Word, PowerPoint a sociálne siete.",
    cs: "Rastrový obrázek ve vysokém rozlišení s průhledným pozadím pro Word, PowerPoint a sociální sítě.",
  },
  JPG: {
    en: "Compressed raster image with solid background for quick previews and email signatures.",
    sk: "Komprimovaný rastrový obrázok s plným pozadím pre rýchle náhľady a e-mailové podpisy.",
    cs: "Komprimovaný rastrový obrázek s plným pozadím pro rychlé náhledy a e-mailové podpisy.",
  },
};

export const m07FormatItemSchema = z.object({
  id: z.string(),
  format: z.enum(["PDF", "SVG", "EPS", "AI", "PNG", "JPG"]),
  storageType: z.enum(["LOGOBOOK_R2", "EXTERNAL_LINK"]).default("LOGOBOOK_R2"),
  url: z.string().default(""),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  customDescription: optionalI18nTextSchema,
});

export const m07MetaSchema = z.object({
  medium: z.enum(["cmyk", "rgb", "universal"]).default("universal"),
  orientation: z.enum(["horizontal", "vertical", "symbol"]).default("horizontal"),
  hasClaim: z.boolean().default(false),
  backgroundType: z.enum(["light", "dark", "brand", "monochrome"]).default("light"),
});

export const m07DirectPreviewSchema = z.object({
  svgUrl: z.string().default(""),
  mockupImageUrl: z.string().default(""),
  backgroundColor: z.string().default("transparent"),
  showCopySvg: z.boolean().default(true),
});

export const m07DownloadAllSchema = z.object({
  enabled: z.boolean().default(true),
  mode: z.enum(["zip_client", "external_link"]).default("zip_client"),
  url: z.string().default(""),
});

export const m07AssetViewerSchema = z.object({
  sourceMode: z.enum(["direct_upload", "library"]).default("library"),
  assetId: z.string().nullable().default(null),
  meta: m07MetaSchema.default({
    medium: "universal",
    orientation: "horizontal",
    hasClaim: false,
    backgroundType: "light",
  }),
  directPreview: m07DirectPreviewSchema.default({
    svgUrl: "",
    mockupImageUrl: "",
    backgroundColor: "transparent",
    showCopySvg: true,
  }),
  formats: z.array(m07FormatItemSchema).default([]),
  downloadAll: m07DownloadAllSchema.default({
    enabled: true,
    mode: "zip_client",
    url: "",
  }),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M07AssetViewerConfig = z.infer<typeof m07AssetViewerSchema>;
export type M07FormatItem = z.infer<typeof m07FormatItemSchema>;
