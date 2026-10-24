import { z } from "zod";

export const COLOR_CATEGORIES = [
  "CORE",
  "DIGITAL",
  "BACKGROUND",
  "TYPOGRAPHY",
  "SEMANTIC",
  "CUSTOM",
] as const;

export type ColorCategory = (typeof COLOR_CATEGORIES)[number];

export const COLOR_ROLES = [
  "PRIMARY",
  "SECONDARY",
  "ACCENT",
  "DIGITAL",
  "BG_DAY",
  "BG_NIGHT",
  "TEXT_DAY",
  "TEXT_NIGHT",
  "SUCCESS",
  "WARNING",
  "DANGER",
  "INFO",
  "NEUTRAL",
  "CUSTOM",
] as const;

export type ColorRole = (typeof COLOR_ROLES)[number];

export interface ColorCategoryDefinition {
  id: ColorCategory;
  labelSk: string;
  labelEn: string;
  descriptionSk: string;
  descriptionEn: string;
  icon: string;
  allowedRoles: ColorRole[];
}

export const COLOR_CATEGORY_DEFINITIONS: Record<ColorCategory, ColorCategoryDefinition> = {
  CORE: {
    id: "CORE",
    labelSk: "Brandové jadro",
    labelEn: "Core Brand",
    descriptionSk: "Primárne, sekundárne a akcentové farby tvoriace základ vizuálnej identity",
    descriptionEn: "Primary, secondary and accent colors shaping the core brand identity",
    icon: "Palette",
    allowedRoles: ["PRIMARY", "SECONDARY", "ACCENT"],
  },
  DIGITAL: {
    id: "DIGITAL",
    labelSk: "Digitálne prvky & UI",
    labelEn: "Digital & UI",
    descriptionSk: "Interaktívne prvky, linky, tlačidlá, aktívne a hover stavy v digitálnych rozhraniach",
    descriptionEn: "Interactive accents, links, buttons, active and hover states across digital products",
    icon: "Monitor",
    allowedRoles: ["DIGITAL"],
  },
  BACKGROUND: {
    id: "BACKGROUND",
    labelSk: "Farby pozadia (Day / Night)",
    labelEn: "Background Colors (Day / Night)",
    descriptionSk: "Podkladové plátna, povrchy kariet a kontajnery pre denný a nočný režim",
    descriptionEn: "Canvas backdrops, card surfaces and panels for day and night modes",
    icon: "SunMoon",
    allowedRoles: ["BG_DAY", "BG_NIGHT"],
  },
  TYPOGRAPHY: {
    id: "TYPOGRAPHY",
    labelSk: "Farby písma (Day / Night)",
    labelEn: "Typography Colors (Day / Night)",
    descriptionSk: "Textové odtiene pre nadpisy, bežný text a tlmené popisky v svetlom aj tmavom režime",
    descriptionEn: "Text shades for headings, body copy and muted captions in day and night modes",
    icon: "Type",
    allowedRoles: ["TEXT_DAY", "TEXT_NIGHT"],
  },
  SEMANTIC: {
    id: "SEMANTIC",
    labelSk: "Sémantické farby (Do's & Don'ts)",
    labelEn: "UI Semantics (Do's & Don'ts)",
    descriptionSk: "Systémové stavy rozhrania: úspech / odporúčané, varovanie, chyba / zákaz a informácie",
    descriptionEn: "System UI statuses: success/do's, warning, danger/don'ts, and informational notices",
    icon: "ShieldAlert",
    allowedRoles: ["SUCCESS", "WARNING", "DANGER", "INFO"],
  },
  CUSTOM: {
    id: "CUSTOM",
    labelSk: "Doplnkové & Neutrálne",
    labelEn: "Custom & Neutral",
    descriptionSk: "Doplnkové odtiene, neutrálne tóny a špecifické farebné akcenty mimo hlavných kategórií",
    descriptionEn: "Supporting shades, neutrals and specific accents outside standard roles",
    icon: "Layers",
    allowedRoles: ["NEUTRAL", "CUSTOM"],
  },
};

export interface ColorRoleDefinition {
  role: ColorRole;
  category: ColorCategory;
  labelSk: string;
  labelEn: string;
  badgeLabelSk: string;
  badgeLabelEn: string;
  tagColorClass: string;
  mode?: "day" | "night" | "neutral";
}

export const COLOR_ROLE_DEFINITIONS: Record<ColorRole, ColorRoleDefinition> = {
  PRIMARY: {
    role: "PRIMARY",
    category: "CORE",
    labelSk: "Primárna farba (hlavná identita)",
    labelEn: "Primary Color (Main Identity)",
    badgeLabelSk: "Primárna",
    badgeLabelEn: "Primary",
    tagColorClass: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  },
  SECONDARY: {
    role: "SECONDARY",
    category: "CORE",
    labelSk: "Sekundárna farba (sprievodná)",
    labelEn: "Secondary Color (Supporting)",
    badgeLabelSk: "Sekundárna",
    badgeLabelEn: "Secondary",
    tagColorClass: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  },
  ACCENT: {
    role: "ACCENT",
    category: "CORE",
    labelSk: "Akcentová farba (upútavka)",
    labelEn: "Accent Color (Highlight)",
    badgeLabelSk: "Akcent",
    badgeLabelEn: "Accent",
    tagColorClass: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  },
  DIGITAL: {
    role: "DIGITAL",
    category: "DIGITAL",
    labelSk: "Digitálna / Interaktívna (web & app)",
    labelEn: "Digital / Interactive (Web & App)",
    badgeLabelSk: "Digitálna",
    badgeLabelEn: "Digital",
    tagColorClass: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
  },
  BG_DAY: {
    role: "BG_DAY",
    category: "BACKGROUND",
    labelSk: "Pozadie – Denný režim (☀️ Svetlé plátno)",
    labelEn: "Background – Day Mode (☀️ Light Canvas)",
    badgeLabelSk: "Pozadie (☀️ Deň)",
    badgeLabelEn: "Bg (☀️ Day)",
    tagColorClass: "bg-orange-300/20 text-orange-200 border-orange-300/30",
    mode: "day",
  },
  BG_NIGHT: {
    role: "BG_NIGHT",
    category: "BACKGROUND",
    labelSk: "Pozadie – Nočný režim (🌙 Tmavé plátno)",
    labelEn: "Background – Night Mode (🌙 Dark Canvas)",
    badgeLabelSk: "Pozadie (🌙 Noc)",
    badgeLabelEn: "Bg (🌙 Night)",
    tagColorClass: "bg-indigo-400/20 text-indigo-300 border-indigo-400/30",
    mode: "night",
  },
  TEXT_DAY: {
    role: "TEXT_DAY",
    category: "TYPOGRAPHY",
    labelSk: "Písmo – Denný režim (☀️ Text na svetlom)",
    labelEn: "Typography – Day Mode (☀️ Text on Light)",
    badgeLabelSk: "Písmo (☀️ Deň)",
    badgeLabelEn: "Text (☀️ Day)",
    tagColorClass: "bg-amber-200/20 text-amber-100 border-amber-200/30",
    mode: "day",
  },
  TEXT_NIGHT: {
    role: "TEXT_NIGHT",
    category: "TYPOGRAPHY",
    labelSk: "Písmo – Nočný režim (🌙 Text na tmavom)",
    labelEn: "Typography – Night Mode (🌙 Text on Dark)",
    badgeLabelSk: "Písmo (🌙 Noc)",
    badgeLabelEn: "Text (🌙 Night)",
    tagColorClass: "bg-purple-300/20 text-purple-200 border-purple-300/30",
    mode: "night",
  },
  SUCCESS: {
    role: "SUCCESS",
    category: "SEMANTIC",
    labelSk: "Úspech / Odporúčané (Do's pravidlá)",
    labelEn: "Success / Approved (Do's rules)",
    badgeLabelSk: "Do's / Úspech",
    badgeLabelEn: "Do / Success",
    tagColorClass: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
  },
  WARNING: {
    role: "WARNING",
    category: "SEMANTIC",
    labelSk: "Upozornenie (Pozor / Poznámka)",
    labelEn: "Warning (Notice / Attention)",
    badgeLabelSk: "Upozornenie",
    badgeLabelEn: "Warning",
    tagColorClass: "bg-yellow-400/25 text-yellow-300 border-yellow-400/40",
  },
  DANGER: {
    role: "DANGER",
    category: "SEMANTIC",
    labelSk: "Zákaz / Chyba (Don'ts pravidlá)",
    labelEn: "Danger / Restriction (Don'ts rules)",
    badgeLabelSk: "Don'ts / Zákaz",
    badgeLabelEn: "Don't / Danger",
    tagColorClass: "bg-rose-500/25 text-rose-300 border-rose-500/40",
  },
  INFO: {
    role: "INFO",
    category: "SEMANTIC",
    labelSk: "Informácia (Systémový oznam)",
    labelEn: "Information (Notice / Banner)",
    badgeLabelSk: "Informácia",
    badgeLabelEn: "Info",
    tagColorClass: "bg-sky-400/25 text-sky-300 border-sky-400/40",
  },
  NEUTRAL: {
    role: "NEUTRAL",
    category: "CUSTOM",
    labelSk: "Neutrálna farba (sivá / plátno)",
    labelEn: "Neutral Color (Greyscale / Surface)",
    badgeLabelSk: "Neutrálna",
    badgeLabelEn: "Neutral",
    tagColorClass: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  },
  CUSTOM: {
    role: "CUSTOM",
    category: "CUSTOM",
    labelSk: "Vlastná / Doplnková farba",
    labelEn: "Custom / Supplementary Color",
    badgeLabelSk: "Vlastná",
    badgeLabelEn: "Custom",
    tagColorClass: "bg-zinc-400/20 text-zinc-300 border-zinc-400/30",
  },
};

/**
 * Resolves the category for a color, using fallback deduction from role if missing.
 */
export function resolveColorCategory(
  role: ColorRole,
  category?: string | null
): ColorCategory {
  if (category && (COLOR_CATEGORIES as readonly string[]).includes(category)) {
    return category as ColorCategory;
  }
  const def = COLOR_ROLE_DEFINITIONS[role];
  return def ? def.category : "CUSTOM";
}

export const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const saveColorSchema = z.object({
  name: z.string().min(1, { message: "Názov farby je povinný" }),
  nameSk: z.string().optional(),
  nameCs: z.string().optional(),
  category: z.enum(COLOR_CATEGORIES).optional(),
  role: z.enum(COLOR_ROLES),
  hex: z
    .string()
    .trim()
    .regex(hexColorRegex, { message: "Neplatný HEX formát (očakáva sa napr. #0055FF alebo #FFF)" }),
  rgb: z.string().optional(),
  cmykC: z.coerce.number().min(0).max(100).optional().nullable(),
  cmykM: z.coerce.number().min(0).max(100).optional().nullable(),
  cmykY: z.coerce.number().min(0).max(100).optional().nullable(),
  cmykK: z.coerce.number().min(0).max(100).optional().nullable(),
  pantoneC: z.string().optional(),
  pantoneU: z.string().optional(),
  pantoneTCX: z.string().optional(),
  ral: z.string().optional(),
  order: z.coerce.number().optional().default(0),
});

export const bulkImportColorsSchema = z.object({
  hexText: z.string().min(3, { message: "Zadajte aspoň jeden platný HEX kód farby." }),
  category: z.enum(COLOR_CATEGORIES).optional().default("CORE"),
});

export type SaveColorInput = z.infer<typeof saveColorSchema>;
export type BulkImportColorsInput = z.infer<typeof bulkImportColorsSchema>;
