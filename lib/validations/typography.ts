import { z } from "zod";

export const FONT_SOURCES = [
  "GOOGLE_FONTS",
  "ADOBE_FONTS",
  "CUSTOM_UPLOAD",
] as const;
export type FontSource = (typeof FONT_SOURCES)[number];

export const FONT_ROLES = [
  "HEADING",
  "BODY",
  "DISPLAY",
  "MONOSPACE",
  "EMAIL",
] as const;
export type FontRole = (typeof FONT_ROLES)[number];

export const POPULAR_GOOGLE_FONTS = [
  "Inter",
  "Plus Jakarta Sans",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Playfair Display",
  "Outfit",
  "Space Grotesk",
  "Open Sans",
  "Lora",
  "DM Sans",
  "Cinzel",
  "Fira Code",
  "JetBrains Mono",
] as const;

export const DEFAULT_PANGRAMS = [
  "Príliš žltý kôň úpel temné tóny.",
  "Kŕdeľ šťastných ďatľov učí koňa žrať kôru.",
  "Vypätá dcéra grófa zjedla štyri melóny a päť klobás.",
  "Příliš žluťoučký kůň úpěl ďábelské ódy.",
  "The quick brown fox jumps over the lazy dog.",
  "ABCČDĎEÉFGHIÍJKLĹĽMNŇOÓÔPQRŔSŠTŤUÚVWXYÝZŽ 0123456789",
] as const;

/**
 * Sanitizes Adobe Project ID input.
 * Designers often paste full <link rel="stylesheet" href="https://use.typekit.net/xyz123.css">
 * or direct URLs. This extracts only the clean alphanumeric project ID (e.g. xyz123).
 */
export function sanitizeAdobeProjectId(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  
  // 1. Match URL pattern use.typekit.net/XYZ123.css or use.typekit.net/XYZ123
  const urlMatch = trimmed.match(/use\.typekit\.net\/([a-zA-Z0-9]+)(?:\.css)?/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  
  // 2. Match XYZ123.css
  const cssMatch = trimmed.match(/^([a-zA-Z0-9]+)\.css$/i);
  if (cssMatch && cssMatch[1]) {
    return cssMatch[1];
  }
  
  // 3. Match alphanumeric project ID pattern (typically 6-8 chars)
  const idMatch = trimmed.match(/([a-zA-Z0-9]{5,12})/);
  if (idMatch && idMatch[1] && !trimmed.includes("<") && !trimmed.includes("http")) {
    return idMatch[1];
  }

  // 4. Strip non-alphanumeric characters
  return trimmed.replace(/[^a-zA-Z0-9]/g, "");
}

export const saveTypographySchema = z
  .object({
    name: z.string().min(1, { message: "Názov písma je povinný" }),
    role: z.enum(FONT_ROLES, { message: "Vyberte platnú typografickú rolu" }),
    fontSource: z.enum(FONT_SOURCES, { message: "Vyberte zdroj písma" }),
    googleFontFamily: z.string().optional(),
    adobeProjectId: z.string().optional(),
    fontFamilyName: z.string().optional(),
    licenseConfirmed: z.boolean().optional().default(false),
    licenseAllowsOfflineDistribution: z.boolean().optional().default(false),
    sampleText: z.string().optional(),
    weights: z.array(z.number()).optional().default([400, 700]),
    fallback: z.string().optional().default("sans-serif"),
    order: z.coerce.number().optional().default(0),
  })
  .refine(
    (data) => {
      if (data.fontSource === "GOOGLE_FONTS") {
        return !!(data.googleFontFamily?.trim() || data.fontFamilyName?.trim());
      }
      return true;
    },
    {
      message: "Pre Google Fonts zadajte názov rodiny písma.",
      path: ["googleFontFamily"],
    }
  )
  .refine(
    (data) => {
      if (data.fontSource === "ADOBE_FONTS") {
        return !!data.adobeProjectId?.trim();
      }
      return true;
    },
    {
      message: "Pre Adobe Fonts zadajte Project ID.",
      path: ["adobeProjectId"],
    }
  )
  .refine(
    (data) => {
      if (data.fontSource === "ADOBE_FONTS") {
        return !!data.fontFamilyName?.trim();
      }
      return true;
    },
    {
      message: "Pre Adobe Fonts zadajte názov rodiny (CSS font-family).",
      path: ["fontFamilyName"],
    }
  )
  .refine(
    (data) => {
      if (data.fontSource === "CUSTOM_UPLOAD") {
        return data.licenseConfirmed === true;
      }
      return true;
    },
    {
      message: "Pre vlastný font musíte potvrdiť vlastníctvo platnej webovej licencie.",
      path: ["licenseConfirmed"],
    }
  );

export type SaveTypographyInput = z.infer<typeof saveTypographySchema>;
