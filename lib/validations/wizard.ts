import { z } from "zod";

export const dimensionMatrixSchema = z.object({
  media: z
    .array(z.enum(["cmyk", "rgb", "special"]))
    .min(1, "Zvoľte aspoň jedno reprodukčné médium (CMYK, RGB alebo Špeciálne)."),
  orientations: z
    .array(z.enum(["horizontal", "vertical", "symbol"]))
    .min(1, "Zvoľte aspoň jednu orientáciu loga (Horizontálne, Vertikálne alebo Symbol)."),
  hasClaimOption: z.boolean().default(true),
  backgrounds: z.array(z.enum(["light", "dark"])).default(["light", "dark"]),
  includeIntroPage: z.boolean().default(true),
  includeColorsPage: z.boolean().default(true),
  includeTypographyPage: z.boolean().default(true),
});

export type DimensionMatrixSchemaInput = z.infer<typeof dimensionMatrixSchema>;
