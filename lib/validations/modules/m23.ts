import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M23: Sociálne siete a bannery (Social Media Kit)
 */

export const m23PlatformSchema = z.enum([
  "instagram",
  "linkedin",
  "facebook",
  "youtube",
  "x",
  "tiktok",
  "custom",
]);
export type M23Platform = z.infer<typeof m23PlatformSchema>;

export const m23FormatTypeSchema = z.enum(["avatar", "cover", "post", "story"]);
export type M23FormatType = z.infer<typeof m23FormatTypeSchema>;

export const m23DownloadFormatSchema = z.enum([
  "PNG",
  "PSD",
  "FIGMA",
  "AI",
  "ZIP",
  "SVG",
]);
export type M23DownloadFormat = z.infer<typeof m23DownloadFormatSchema>;

export const m23DownloadItemSchema = z.object({
  id: z.string(),
  format: m23DownloadFormatSchema.default("PNG"),
  url: z.string().default(""),
  label: i18nTextSchema,
});
export type M23DownloadItem = z.infer<typeof m23DownloadItemSchema>;

export const m23FormatItemSchema = z.object({
  id: z.string(),
  platform: m23PlatformSchema.default("instagram"),
  type: m23FormatTypeSchema.default("post"),
  title: i18nTextSchema,
  dimensions: z.object({
    width: z.coerce.number().min(50).max(10000).default(1080),
    height: z.coerce.number().min(50).max(10000).default(1080),
  }).default({ width: 1080, height: 1080 }),
  previewUrl: z.string().default(""),
  downloads: z.array(m23DownloadItemSchema).default([]),
});
export type M23FormatItem = z.infer<typeof m23FormatItemSchema>;

export const DEFAULT_M23_FORMATS: M23FormatItem[] = [
  // Instagram
  {
    id: "ig-avatar",
    platform: "instagram",
    type: "avatar",
    title: {
      en: "Profile Avatar (1:1)",
      sk: "Profilový avatar (1:1)",
      cs: "Profilový avatar (1:1)",
    },
    dimensions: { width: 1080, height: 1080 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-ig-av-png",
        format: "PNG",
        url: "",
        label: { en: "Download Hi-Res PNG", sk: "Stiahnuť PNG (1080×1080)", cs: "Stáhnout PNG (1080×1080)" },
      },
    ],
  },
  {
    id: "ig-post",
    platform: "instagram",
    type: "post",
    title: {
      en: "Feed Post Portrait (4:5)",
      sk: "Príspevok na výšku (4:5)",
      cs: "Příspěvek na výšku (4:5)",
    },
    dimensions: { width: 1080, height: 1350 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-ig-post-figma",
        format: "FIGMA",
        url: "",
        label: { en: "Figma Post Template", sk: "Figma šablóna príspevku", cs: "Figma šablona příspěvku" },
      },
    ],
  },
  {
    id: "ig-story",
    platform: "instagram",
    type: "story",
    title: {
      en: "Story / Reel Cover (9:16)",
      sk: "Príbeh / Reel (9:16)",
      cs: "Příběh / Reel (9:16)",
    },
    dimensions: { width: 1080, height: 1920 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-ig-story-psd",
        format: "PSD",
        url: "",
        label: { en: "Photoshop Story Template", sk: "Photoshop šablóna príbehu", cs: "Photoshop šablona příběhu" },
      },
    ],
  },

  // LinkedIn
  {
    id: "li-avatar",
    platform: "linkedin",
    type: "avatar",
    title: {
      en: "Company Logo Icon (1:1)",
      sk: "Firemný avatar (1:1)",
      cs: "Firemní avatar (1:1)",
    },
    dimensions: { width: 400, height: 400 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-li-av-png",
        format: "PNG",
        url: "",
        label: { en: "Download PNG", sk: "Stiahnuť PNG", cs: "Stáhnout PNG" },
      },
    ],
  },
  {
    id: "li-cover",
    platform: "linkedin",
    type: "cover",
    title: {
      en: "Company Page Cover Header",
      sk: "Hlavička firemného profilu",
      cs: "Záhlaví firemního profilu",
    },
    dimensions: { width: 1128, height: 191 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-li-cov-png",
        format: "PNG",
        url: "",
        label: { en: "Download Cover PNG", sk: "Stiahnuť Cover PNG", cs: "Stáhnout Cover PNG" },
      },
      {
        id: "dl-li-cov-psd",
        format: "PSD",
        url: "",
        label: { en: "Photoshop Template", sk: "Photoshop šablóna", cs: "Photoshop šablona" },
      },
    ],
  },

  // Facebook
  {
    id: "fb-cover",
    platform: "facebook",
    type: "cover",
    title: {
      en: "Page Banner Cover",
      sk: "Hlavička Facebook stránky",
      cs: "Záhlaví Facebook stránky",
    },
    dimensions: { width: 820, height: 312 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-fb-cov-png",
        format: "PNG",
        url: "",
        label: { en: "Download Cover PNG", sk: "Stiahnuť Cover PNG", cs: "Stáhnout Cover PNG" },
      },
    ],
  },

  // YouTube
  {
    id: "yt-cover",
    platform: "youtube",
    type: "cover",
    title: {
      en: "Channel Art Banner (16:9)",
      sk: "Banner YouTube kanála (16:9)",
      cs: "Banner YouTube kanálu (16:9)",
    },
    dimensions: { width: 2560, height: 1440 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-yt-cov-psd",
        format: "PSD",
        url: "",
        label: { en: "Photoshop Banner with Safe Area", sk: "Photoshop banner s bezpečnou zónou", cs: "Photoshop banner s bezpečnou zónou" },
      },
    ],
  },

  // X (Twitter)
  {
    id: "x-cover",
    platform: "x",
    type: "cover",
    title: {
      en: "Profile Header Banner (3:1)",
      sk: "Záhlavie X profilu (3:1)",
      cs: "Záhlaví X profilu (3:1)",
    },
    dimensions: { width: 1500, height: 500 },
    previewUrl: "",
    downloads: [
      {
        id: "dl-x-cov-png",
        format: "PNG",
        url: "",
        label: { en: "Download Header PNG", sk: "Stiahnuť Header PNG", cs: "Stáhnout Header PNG" },
      },
    ],
  },
];

export const m23SocialMediaSchema = z.object({
  platforms: z.array(m23PlatformSchema).default([
    "instagram",
    "linkedin",
    "facebook",
    "youtube",
    "x",
  ]),
  formats: z.array(m23FormatItemSchema).default(DEFAULT_M23_FORMATS),
  downloadAllZipUrl: z.string().nullable().default(null),
  showDownloadAllZip: z.boolean().default(true),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M23SocialMediaConfig = z.infer<typeof m23SocialMediaSchema>;
