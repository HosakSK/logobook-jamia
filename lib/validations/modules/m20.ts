import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M20: Pravidlá Do's & Don'ts (Brand Integrity Rules)
 */

export const m20ItemTypeSchema = z.enum(["do", "dont", "warning"]);
export type M20ItemType = z.infer<typeof m20ItemTypeSchema>;

export const m20BackgroundModeSchema = z.enum([
  "auto",
  "dark",
  "light",
  "checkerboard",
  "custom",
]);
export type M20BackgroundMode = z.infer<typeof m20BackgroundModeSchema>;

export const m20RuleItemSchema = z.object({
  id: z.string(),
  type: m20ItemTypeSchema.default("dont"),
  imageUrl: z.string().default(""),
  assetId: z.string().nullable().optional(),
  title: i18nTextSchema,
  description: i18nTextSchema.optional(),
  background: m20BackgroundModeSchema.default("auto"),
  customBgHex: z.string().optional(),
});
export type M20RuleItem = z.infer<typeof m20RuleItemSchema>;

export const DEFAULT_M20_ITEMS: M20RuleItem[] = [
  {
    id: "rule-1",
    type: "dont",
    imageUrl: "",
    title: {
      en: "Do not distort or stretch",
      sk: "Nedeformujte proporcie",
      cs: "Nedeformujte proporce",
    },
    description: {
      en: "Never scale the logo disproportionately horizontally or vertically.",
      sk: "Nikdy nemeňte pomer strán loga na šírku ani na výšku.",
      cs: "Nikdy neměňte poměr stran loga na šířku ani na výšku.",
    },
    background: "auto",
  },
  {
    id: "rule-2",
    type: "dont",
    imageUrl: "",
    title: {
      en: "Do not alter official colors",
      sk: "Nemeňte schválené farby",
      cs: "Neměňte schválené barvy",
    },
    description: {
      en: "Always use only approved primary and secondary color combinations.",
      sk: "Vždy používajte iba schválené primárne a sekundárne farebné kombinácie.",
      cs: "Vždy používejte pouze schválené primární a sekundární barevné kombinace.",
    },
    background: "auto",
  },
  {
    id: "rule-3",
    type: "do",
    imageUrl: "",
    title: {
      en: "Maintain approved contrast & clearspace",
      sk: "Správny kontrast a ochranná zóna",
      cs: "Správný kontrast a ochranná zóna",
    },
    description: {
      en: "Use the approved logo version ensuring sufficient contrast against the surface.",
      sk: "Používajte schválenú verziu loga zabezpečujúcu dostatočný kontrast voči podkladu.",
      cs: "Používejte schválenou verzi loga zajišťující dostatečný kontrast vůči podkladu.",
    },
    background: "auto",
  },
  {
    id: "rule-4",
    type: "warning",
    imageUrl: "",
    title: {
      en: "Monochrome version only when necessary",
      sk: "Jednofarebná verzia len vo výnimočných prípadoch",
      cs: "Jednobarevná verze pouze ve výjimečných případech",
    },
    description: {
      en: "Use 1-color black or white version only when technical printing limitations require it.",
      sk: "Čiernobielu verziu použite iba vtedy, ak technické limity tlače neumožňujú plnú farebnosť.",
      cs: "Černobílou verzi použijte pouze tehdy, pokud technické limity tisku neumožňují plnou barevnost.",
    },
    background: "auto",
  },
];

export const m20DosAndDontsSchema = z.object({
  doColor: z.string().nullable().default(null),
  dontColor: z.string().nullable().default(null),
  warningColor: z.string().nullable().default(null),
  columns: z.coerce.number().min(1).max(4).default(2),
  defaultBackground: m20BackgroundModeSchema.default("auto"),
  badgePosition: z.enum(["top-left", "top-right"]).default("top-left"),
  showFilter: z.boolean().default(false),
  items: z.array(m20RuleItemSchema).default(DEFAULT_M20_ITEMS),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M20DosAndDontsConfig = z.infer<typeof m20DosAndDontsSchema>;
