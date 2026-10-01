import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M24: Firemné tapety a pozadia (Brand Wallpapers & Backgrounds)
 */

export const m24CategorySchema = z.enum([
  "desktop",
  "mobile",
  "virtual_meeting",
  "tablet",
]);
export type M24Category = z.infer<typeof m24CategorySchema>;

export const m24FrameTypeSchema = z.enum(["desktop", "mobile", "none"]);
export type M24FrameType = z.infer<typeof m24FrameTypeSchema>;

export const m24ResolutionsSchema = z.object({
  uhd_4k: z.string().nullable().default(null),
  qhd: z.string().nullable().default(null),
  fhd: z.string().nullable().default(null),
  mobile: z.string().nullable().default(null),
  tablet: z.string().nullable().default(null),
});
export type M24Resolutions = z.infer<typeof m24ResolutionsSchema>;

export const m24WallpaperItemSchema = z.object({
  id: z.string(),
  title: i18nTextSchema,
  category: m24CategorySchema.default("desktop"),
  previewUrl: z.string().default(""),
  frameType: m24FrameTypeSchema.default("desktop"),
  resolutions: m24ResolutionsSchema.default({
    uhd_4k: null,
    qhd: null,
    fhd: null,
    mobile: null,
    tablet: null,
  }),
});
export type M24WallpaperItem = z.infer<typeof m24WallpaperItemSchema>;

export const DEFAULT_M24_WALLPAPERS: M24WallpaperItem[] = [
  {
    id: "wp-desktop-dark",
    title: {
      en: "Dark Geometric Horizon (Desktop)",
      sk: "Tmavý geometrický horizont (Desktop)",
      cs: "Tmavý geometrický horizont (Desktop)",
    },
    category: "desktop",
    previewUrl: "",
    frameType: "desktop",
    resolutions: {
      uhd_4k: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=3840&q=90",
      qhd: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=90",
      fhd: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=90",
      mobile: null,
      tablet: null,
    },
  },
  {
    id: "wp-mobile-neon",
    title: {
      en: "Neon Brand Gradient (Smartphone)",
      sk: "Neónový brandový gradient (Smartfón)",
      cs: "Neonový brandový gradient (Smartfón)",
    },
    category: "mobile",
    previewUrl: "",
    frameType: "mobile",
    resolutions: {
      uhd_4k: null,
      qhd: null,
      fhd: null,
      mobile: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1170&q=90",
      tablet: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2048&q=90",
    },
  },
  {
    id: "wp-virtual-meeting",
    title: {
      en: "Minimal Studio Room (Zoom / Teams)",
      sk: "Virtuálna zasadačka (Zoom / Teams)",
      cs: "Virtuální zasedačka (Zoom / Teams)",
    },
    category: "virtual_meeting",
    previewUrl: "",
    frameType: "desktop",
    resolutions: {
      uhd_4k: null,
      qhd: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2560&q=90",
      fhd: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=90",
      mobile: null,
      tablet: null,
    },
  },
];

export const m24WallpapersSchema = z.object({
  gridColumns: z.coerce.number().min(1).max(3).default(2),
  showDeviceFrames: z.boolean().default(true),
  downloadAllZipUrl: z.string().nullable().default(null),
  showDownloadAllZip: z.boolean().default(true),
  wallpapers: z.array(m24WallpaperItemSchema).default(DEFAULT_M24_WALLPAPERS),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M24WallpapersConfig = z.infer<typeof m24WallpapersSchema>;
