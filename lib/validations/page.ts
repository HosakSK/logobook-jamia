import { z } from "zod";

export const createPageSchema = z.object({
  title: z.union([
    z.string().min(1, "Názov stránky je povinný").max(100),
    z.record(z.string(), z.string()),
  ]),
  slug: z
    .string()
    .min(1, "Slug je povinný")
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug môže obsahovať len malé písmená, čísla a pomlčky (napr. uvod alebo logo-pravidla)"
    ),
  parentId: z.string().optional(),
  isInMenu: z.boolean().default(true),
  menuStyle: z.enum(["main", "submenu", "hidden"]).default("main"),
});

export type CreatePageSchemaInput = z.infer<typeof createPageSchema>;

export const updatePageSchema = z.object({
  title: z.union([z.string().min(1), z.record(z.string(), z.string())]).optional(),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  parentId: z.string().nullable().optional(),
  isInMenu: z.boolean().optional(),
  menuStyle: z.enum(["main", "submenu", "hidden"]).optional(),
  order: z.number().optional(),
});

export type UpdatePageSchemaInput = z.infer<typeof updatePageSchema>;

export const createContainerSchema = z.object({
  pageId: z.string().min(1),
  layoutType: z
    .enum(["FULL", "HALF_HALF", "ONE_THIRD_TWO_THIRDS", "TWO_THIRDS_ONE_THIRD", "THREE_EQUAL", "CUSTOM"])
    .default("FULL"),
  showH2: z.boolean().optional(),
  h2Title: z.record(z.string(), z.string()).optional(),
  backgroundColor: z.string().optional(),
});

export type CreateContainerSchemaInput = z.infer<typeof createContainerSchema>;

export const createModuleSchema = z.object({
  columnId: z.string().min(1),
  moduleType: z.string().min(1),
  showH3: z.boolean().default(true),
  h3Title: z.record(z.string(), z.string()).optional(),
  config: z.record(z.string(), z.unknown()).default({}),
});

export type CreateModuleSchemaInput = z.infer<typeof createModuleSchema>;
