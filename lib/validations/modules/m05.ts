import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M05: Samostatné tlačidlo (Button Block / Download Button)
 */

export const m05IconSchema = z.object({
  source: z.enum(["system", "m25", "none"]).default("system"),
  iconId: z.string().default("download"),
  position: z.enum(["left", "right"]).default("left"),
  customIconUrl: z.string().optional(),
});

export const m05DownloadButtonSchema = z.object({
  align: z.enum(["left", "center", "right", "full"]).default("center"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  style: z.enum(["primary", "secondary", "outline", "ghost", "custom"]).default("primary"),
  customColors: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    })
    .optional(),
  icon: m05IconSchema.default({
    source: "system",
    iconId: "download",
    position: "left",
  }),
  openInNewTab: z.boolean().default(false),
  label: i18nTextSchema.default({
    en: "Download Assets",
    sk: "Stiahnuť podklady",
    cs: "Stáhnout podklady",
  }),
  linkType: z.enum(["external", "internal", "media"]).default("external"),
  url: z.string().default("#"),
  internalPageId: z.string().optional(),
  mediaAssetId: z.string().optional(),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M05DownloadButtonConfig = z.infer<typeof m05DownloadButtonSchema>;
