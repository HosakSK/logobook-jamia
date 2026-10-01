import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M22: Generátor E-mailových Podpisov (Email Signature Generator)
 */

export const m22TemplateIdSchema = z.enum([
  "classic_corporate",
  "modern_minimal",
  "badge_card",
  "compact_inline",
  "creative_split",
  "promo_banner",
  "executive_elegant",
]);
export type M22TemplateId = z.infer<typeof m22TemplateIdSchema>;

export const m22SocialPlatformSchema = z.enum([
  "linkedin",
  "instagram",
  "facebook",
  "web",
  "x",
  "youtube",
]);
export type M22SocialPlatform = z.infer<typeof m22SocialPlatformSchema>;

export const m22SocialLinkSchema = z.object({
  id: z.string(),
  platform: m22SocialPlatformSchema,
  url: z.string().default(""),
});
export type M22SocialLink = z.infer<typeof m22SocialLinkSchema>;

export const m22EmailSignatureSchema = z.object({
  mode: z.enum(["preset_template", "custom_html"]).default("preset_template"),
  templateId: m22TemplateIdSchema.default("classic_corporate"),
  customHtml: z.string().nullable().default(null),
  fields: z.object({
    showPhoto: z.boolean().default(true),
    showRole: z.boolean().default(true),
    showPhone: z.boolean().default(true),
    showSocials: z.boolean().default(true),
    showWebsite: z.boolean().default(true),
    showDisclaimer: z.boolean().default(false),
  }).default({
    showPhoto: true,
    showRole: true,
    showPhone: true,
    showSocials: true,
    showWebsite: true,
    showDisclaimer: false,
  }),
  defaults: z.object({
    name: z.string().default("John Doe"),
    role: z.string().default("Creative Director"),
    phone: z.string().default("+421 900 123 456"),
    email: z.string().default("john.doe@company.com"),
    website: z.string().default("www.logobook.sk"),
    company: z.string().default("Logobook Studio"),
    photoUrl: z.string().default("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"),
    logoUrl: z.string().default("/logo/logo-symbol-light.svg"),
    primaryColor: z.string().default("#c8d400"),
  }).default({
    name: "John Doe",
    role: "Creative Director",
    phone: "+421 900 123 456",
    email: "john.doe@company.com",
    website: "www.logobook.sk",
    company: "Logobook Studio",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    logoUrl: "/logo/logo-symbol-light.svg",
    primaryColor: "#c8d400",
  }),
  disclaimerText: i18nTextSchema.default({
    en: "This message and any attachments are confidential and intended solely for the addressee. If you are not the intended recipient, please notify the sender and delete this message.",
    sk: "Táto správa a jej prílohy sú dôverné a určené výhradne adresátovi. Ak nie ste určeným príjemcom, informujte odosielateľa a správu vymažte.",
    cs: "Tato zpráva a její přílohy jsou důvěrné a určené výhradně adresátovi. Pokud nejste určeným příjemcem, informujte odesílatele a zprávu vymažte.",
  }),
  socialLinks: z.array(m22SocialLinkSchema).default([
    { id: "soc-1", platform: "linkedin", url: "https://linkedin.com/company/logobook" },
    { id: "soc-2", platform: "web", url: "https://logobook.sk" },
    { id: "soc-3", platform: "instagram", url: "https://instagram.com/logobook" },
  ]),
  promoBannerUrl: z.string().nullable().default(null),
  promoBannerLink: z.string().nullable().default(null),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M22EmailSignatureConfig = z.infer<typeof m22EmailSignatureSchema>;
