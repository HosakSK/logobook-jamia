import { z } from "zod";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { I18nRecord, CascadeStyleOverrides } from "@/lib/types/module";

/**
 * Zod validation schema for mandatory multilingual user-generated texts (titles, descriptions, labels).
 * Enforces key-value pairs where key is locale code (e.g. 'sk', 'en') and requires at least one non-empty string.
 */
export const i18nTextSchema = z
  .record(z.string(), z.string())
  .refine(
    (record) => {
      const keys = Object.keys(record);
      if (keys.length === 0) return false;
      return Object.values(record).some((val) => typeof val === "string" && val.trim().length > 0);
    },
    { message: "At least one non-empty localized text is required." }
  );

/**
 * Zod schema for optional multilingual fields (e.g. subtitle, button label).
 */
export const optionalI18nTextSchema = z.record(z.string(), z.string()).optional();

/**
 * Standardized Level 3 Local Style Overrides schema.
 * Allows modules to locally detach from Level 1 Global Brand Tokens.
 */
export const cascadeStyleOverridesSchema = z.object({
  radiusMode: z.enum(["inherit", "sharp", "rounded", "pill", "custom"]).optional(),
  customRadiusPx: z.coerce.number().min(0).max(64).optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidthPx: z.coerce.number().min(0).max(16).optional(),
  paddingY: z.enum(["none", "small", "normal", "large"]).optional(),
  customCssClass: z.string().max(100).optional(),
});

export type CascadeStyleOverridesInput = z.infer<typeof cascadeStyleOverridesSchema>;

/**
 * Base configuration schema for all modules (M01-M25).
 * Uses passthrough() so specific module schemas can extend it with their custom content fields.
 */
export const baseModuleConfigSchema = z
  .object({
    styleOverrides: cascadeStyleOverridesSchema.optional(),
  })
  .passthrough();

export type BaseModuleConfigInput = z.infer<typeof baseModuleConfigSchema>;

/**
 * Resolves a multilingual I18nRecord into a plain string according to locale preference:
 * 1. Target locale (e.g. 'sk')
 * 2. Fallback locale (default 'en')
 * 3. First non-empty value in the record
 * 4. Empty string fallback
 */
export function resolveI18nText(
  record: I18nRecord | undefined | null,
  locale: string = DEFAULT_LOCALE,
  fallbackLocale: string = DEFAULT_LOCALE
): string {
  if (!record || typeof record !== "object") return "";

  const exact = record[locale];
  if (typeof exact === "string" && exact.trim().length > 0) {
    return exact;
  }

  const fallback = record[fallbackLocale];
  if (typeof fallback === "string" && fallback.trim().length > 0) {
    return fallback;
  }

  for (const val of Object.values(record)) {
    if (typeof val === "string" && val.trim().length > 0) {
      return val;
    }
  }

  return "";
}

/**
 * Helper to initialize or update an I18nRecord with a new value for a specific locale.
 */
export function setI18nText(
  existing: I18nRecord | undefined | null,
  locale: string,
  value: string
): I18nRecord {
  return {
    ...(existing || {}),
    [locale]: value,
  };
}
