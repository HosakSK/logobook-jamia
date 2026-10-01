import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M25: Knižnica ikon a piktogramov (Brand Icon Library & SVG Set)
 */

export const m25LayoutSchema = z.enum(["grid_small", "grid_medium", "grid_large"]);
export type M25Layout = z.infer<typeof m25LayoutSchema>;

export const m25IconStyleSchema = z.enum(["outline", "solid", "duotone"]);
export type M25IconStyle = z.infer<typeof m25IconStyleSchema>;

export const m25IconItemSchema = z.object({
  id: z.string(),
  name: i18nTextSchema,
  category: z.string().default("General"),
  style: m25IconStyleSchema.default("outline"),
  tags: z.array(z.string()).default([]),
  svgCode: z.string(),
});
export type M25IconItem = z.infer<typeof m25IconItemSchema>;

/**
 * High quality seed vector icon set (20 essential, clean stroke brand icons).
 * Designed on a 24x24 viewBox with currentColor stroke.
 */
export const DEFAULT_M25_ICONS: M25IconItem[] = [
  {
    id: "icon-home",
    name: { en: "Home", sk: "Domov", cs: "Domů" },
    category: "Navigation",
    style: "outline",
    tags: ["home", "house", "main", "start", "domov", "budova"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    id: "icon-search",
    name: { en: "Search", sk: "Hľadať", cs: "Hledat" },
    category: "Interface",
    style: "outline",
    tags: ["search", "find", "magnifier", "lupa", "hladat", "vyhladavanie"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  },
  {
    id: "icon-user",
    name: { en: "User Account", sk: "Používateľský účet", cs: "Uživatelský účet" },
    category: "Interface",
    style: "outline",
    tags: ["user", "account", "profile", "person", "profil", "používateľ", "kontakt"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  },
  {
    id: "icon-settings",
    name: { en: "Settings", sk: "Nastavenia", cs: "Nastavení" },
    category: "Interface",
    style: "outline",
    tags: ["settings", "gear", "options", "preferences", "nastavenia", "konfiguracia"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
  {
    id: "icon-mail",
    name: { en: "Email", sk: "E-mail", cs: "E-mail" },
    category: "Communication",
    style: "outline",
    tags: ["mail", "email", "message", "contact", "posta", "sprava", "schranka"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  },
  {
    id: "icon-phone",
    name: { en: "Phone", sk: "Telefón", cs: "Telefon" },
    category: "Communication",
    style: "outline",
    tags: ["phone", "call", "mobile", "contact", "telefon", "volanie"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  },
  {
    id: "icon-calendar",
    name: { en: "Calendar", sk: "Kalendár", cs: "Kalendář" },
    category: "Interface",
    style: "outline",
    tags: ["calendar", "date", "event", "schedule", "kalendar", "datum", "udalost"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  },
  {
    id: "icon-arrow-right",
    name: { en: "Arrow Right", sk: "Šípka vpravo", cs: "Šipka vpravo" },
    category: "Navigation",
    style: "outline",
    tags: ["arrow", "right", "next", "direction", "sipka", "dalsi", "smer"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  },
  {
    id: "icon-check",
    name: { en: "Checkmark", sk: "Potvrdenie", cs: "Potvrzení" },
    category: "Interface",
    style: "outline",
    tags: ["check", "success", "done", "ok", "potvrdenie", "fajka", "uspech"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  },
  {
    id: "icon-shield",
    name: { en: "Security Shield", sk: "Bezpečnostný štít", cs: "Bezpečnostní štít" },
    category: "Interface",
    style: "outline",
    tags: ["shield", "security", "protect", "safety", "bezpecnost", "stit", "ochrana"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  {
    id: "icon-lock",
    name: { en: "Lock", sk: "Zámok", cs: "Zámek" },
    category: "Interface",
    style: "outline",
    tags: ["lock", "private", "secure", "password", "zamok", "heslo", "sukromie"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  },
  {
    id: "icon-download",
    name: { en: "Download", sk: "Stiahnuť", cs: "Stáhnout" },
    category: "Interface",
    style: "outline",
    tags: ["download", "save", "arrow", "export", "stiahnut", "ulozit"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  },
  {
    id: "icon-share",
    name: { en: "Share", sk: "Zdieľať", cs: "Sdílet" },
    category: "Communication",
    style: "outline",
    tags: ["share", "forward", "social", "send", "zdielat", "odoslat"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  },
  {
    id: "icon-shopping-cart",
    name: { en: "Shopping Cart", sk: "Nákupný košík", cs: "Nákupní košík" },
    category: "Commerce",
    style: "outline",
    tags: ["cart", "shop", "ecommerce", "buy", "store", "kosik", "nakup", "obchod"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  },
  {
    id: "icon-globe",
    name: { en: "Globe", sk: "Zemeguľa", cs: "Zeměkoule" },
    category: "Navigation",
    style: "outline",
    tags: ["globe", "world", "earth", "web", "internet", "zemegula", "svet", "jazyk"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  },
  {
    id: "icon-file-text",
    name: { en: "Document", sk: "Dokument", cs: "Dokument" },
    category: "Commerce",
    style: "outline",
    tags: ["file", "document", "contract", "invoice", "papier", "dokument", "zmluva", "faktura"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  },
  {
    id: "icon-bell",
    name: { en: "Notification Bell", sk: "Upozornenia", cs: "Upozornění" },
    category: "Interface",
    style: "outline",
    tags: ["bell", "notification", "alert", "sound", "zvonok", "upozornenie", "notifikacia"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  },
  {
    id: "icon-star",
    name: { en: "Star Rating", sk: "Hviezdička", cs: "Hvězdička" },
    category: "Interface",
    style: "outline",
    tags: ["star", "favorite", "rating", "bookmark", "hviezda", "oblubene", "hodnotenie"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  {
    id: "icon-briefcase",
    name: { en: "Briefcase", sk: "Kufrík / Práca", cs: "Kufřík / Práce" },
    category: "Commerce",
    style: "outline",
    tags: ["briefcase", "work", "job", "business", "office", "praca", "kancelaria", "obchod"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  },
  {
    id: "icon-heart",
    name: { en: "Heart / Like", sk: "Srdiečko / Like", cs: "Srdíčko / Like" },
    category: "Interface",
    style: "outline",
    tags: ["heart", "like", "love", "favorite", "srdce", "oblubene"],
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  },
];

export const m25IconLibrarySchema = z.object({
  layout: m25LayoutSchema.default("grid_medium"),
  enableSearch: z.boolean().default(true),
  showCategories: z.boolean().default(true),
  showColorPicker: z.boolean().default(true),
  defaultColor: z.string().default("theme"),
  showDownloadAllZip: z.boolean().default(true),
  downloadAllZipUrl: z.string().nullable().default(null),
  guidelinesText: i18nTextSchema.optional(),
  icons: z.array(m25IconItemSchema).default(DEFAULT_M25_ICONS),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M25IconLibraryConfig = z.infer<typeof m25IconLibrarySchema>;
