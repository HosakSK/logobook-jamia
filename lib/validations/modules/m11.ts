import { z } from "zod";
import { cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M11: Interaktívna matica logotypov (Logo Matrix)
 */

export const m11FilterAxisSchema = z.enum(["medium", "orientation", "claim", "background"]);

export const m11DefaultViewSchema = z.object({
  medium: z.enum(["all", "cmyk", "rgb", "universal"]).default("all"),
  orientation: z.enum(["all", "horizontal", "vertical", "symbol"]).default("all"),
  claim: z.enum(["all", "with_claim", "no_claim"]).default("all"),
  background: z.enum(["all", "light", "dark", "brand", "monochrome"]).default("all"),
});

export const m11LogoMatrixSchema = z.object({
  dataSource: z.enum(["auto", "manual"]).default("auto"),
  allowedFilters: z
    .array(m11FilterAxisSchema)
    .default(["medium", "orientation", "claim", "background"]),
  defaultView: m11DefaultViewSchema.default({
    medium: "all",
    orientation: "all",
    claim: "all",
    background: "all",
  }),
  columns: z.coerce.number().min(2).max(4).default(3),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M11LogoMatrixConfig = z.infer<typeof m11LogoMatrixSchema>;
export type M11FilterAxis = z.infer<typeof m11FilterAxisSchema>;
export type M11DefaultView = z.infer<typeof m11DefaultViewSchema>;
