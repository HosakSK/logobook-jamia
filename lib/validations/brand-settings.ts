import { z } from "zod";

export const brandGeneralSettingsSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(60),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  metaTitle: z.string().max(80).optional(),
  metaDescription: z.string().max(200).optional(),
  customDomain: z
    .string()
    .max(100)
    .optional(),
  password: z.string().max(100).optional(),
  removePassword: z.boolean().optional(),
  hideLogobookBadge: z.boolean().optional(),
});

export type BrandGeneralSettingsInput = z.infer<typeof brandGeneralSettingsSchema>;

export const globalShapesSchema = z.object({
  radiusMode: z
    .string()
    .optional()
    .transform((val) => {
      const lower = (val || "rounded").toLowerCase().trim();
      if (lower === "sharp" || lower === "square") return "sharp" as const;
      if (lower === "pill") return "pill" as const;
      return "rounded" as const;
    })
    .default("rounded"),
  customRadiusPx: z.coerce.number().min(0).max(64).default(3),
  borderWidthPx: z.coerce.number().min(0).max(8).default(1),
  semanticSuccess: z.string().optional(),
  semanticWarning: z.string().optional(),
  semanticDanger: z.string().optional(),
  semanticInfo: z.string().optional(),
  manualBgColor: z.string().optional(),
  themeConfig: z.string().optional(),
});

export type GlobalShapesInput = z.infer<typeof globalShapesSchema>;

