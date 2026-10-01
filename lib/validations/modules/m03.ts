import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

export const m03BannerIconSchema = z.object({
  source: z.enum(["system", "m25", "custom_upload"]).default("system"),
  iconId: z.string().default("info"),
  position: z.enum(["left", "right", "none"]).default("left"),
});

export const m03BannerButtonSchema = z.object({
  show: z.boolean().default(false),
  label: i18nTextSchema.default({
    en: "Learn more",
    sk: "Zistiť viac",
  }),
  url: z.string().default("#"),
});

export const m03BannerSchema = z.object({
  variant: z.enum(["info", "warning", "danger", "success", "accent", "custom"]).default("info"),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
  icon: m03BannerIconSchema.default({
    source: "system",
    iconId: "info",
    position: "left",
  }),
  title: i18nTextSchema.default({
    en: "Important Notice",
    sk: "Dôležité upozornenie",
  }),
  content: i18nTextSchema.default({
    en: "Please review the brand guidelines specifications carefully before production.",
    sk: "Pred produkciou si dôkladne preštudujte špecifikácie manuálu značky.",
  }),
  button: m03BannerButtonSchema.default({
    show: false,
    label: { en: "Download guide", sk: "Stiahnuť návod" },
    url: "#",
  }),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M03BannerConfig = z.infer<typeof m03BannerSchema>;
export type M03BannerVariant = M03BannerConfig["variant"];
