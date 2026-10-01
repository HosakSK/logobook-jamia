import { z } from "zod";
import { i18nTextSchema, optionalI18nTextSchema } from "./module";

export const templateCategorySchema = z.enum([
  "Logo",
  "Farby",
  "Typografia",
  "Materiály",
  "Všeobecné",
]);
export type TemplateCategory = z.infer<typeof templateCategorySchema>;

export const savePageAsTemplateSchema = z.object({
  name: i18nTextSchema,
  description: optionalI18nTextSchema,
  category: z.string().default("Všeobecné"),
});
export type SavePageAsTemplateInput = z.infer<typeof savePageAsTemplateSchema>;

export const applyTemplateSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  mode: z.enum(["replace", "append"]).default("replace"),
});
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;
