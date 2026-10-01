import { z } from "zod";
import { i18nTextSchema, cascadeStyleOverridesSchema } from "../module";

/**
 * Zod validation schema for Module M08: Ochranná zóna loga (Clearance Zone)
 * Strictly defined as percentage (%) of width or height.
 */

export const m08RectangularZoneSchema = z.object({
  enabled: z.boolean().default(true),
  dimension: z.enum(["width", "height"]).default("width"),
  percentage: z.coerce.number().min(1).max(50).default(15),
});

export const m08CircularZoneSchema = z.object({
  enabled: z.boolean().default(false),
  radiusPercentage: z.coerce.number().min(1).max(50).default(20),
});

export const m08ZonesSchema = z.object({
  rectangular: m08RectangularZoneSchema.default({
    enabled: true,
    dimension: "width",
    percentage: 15,
  }),
  circular: m08CircularZoneSchema.default({
    enabled: false,
    radiusPercentage: 20,
  }),
});

export const m08ClearanceZoneSchema = z.object({
  svgSource: z.enum(["inherit_m07", "library", "direct_upload"]).default("library"),
  assetId: z.string().nullable().default(null),
  customSvgUrl: z.string().nullable().default(null),
  customDiagramUrl: z.string().nullable().default(null),
  zones: m08ZonesSchema.default({
    rectangular: { enabled: true, dimension: "width", percentage: 15 },
    circular: { enabled: false, radiusPercentage: 20 },
  }),
  ruleText: i18nTextSchema.default({
    en: "The clearance zone represents the mandatory minimum safe space surrounding the logo, defined as a percentage of its dimension. No typography, graphical elements, or page borders may encroach into this protective perimeter.",
    sk: "Ochranná zóna predstavuje povinný minimálny prázdny priestor okolo loga, definovaný ako percento z jeho rozmeru. Žiadne texty, grafické prvky ani okraje strany nesmú zasahovať do tohto vymedzeného priestoru.",
    cs: "Ochranná zóna představuje povinný minimální prázdný prostor kolem loga, definovaný jako procento z jeho rozměru. Žádné texty, grafické prvky ani okraje strany nesmí zasahovat do tohoto vymezeného prostoru.",
  }),
  styleOverrides: cascadeStyleOverridesSchema.optional(),
});

export type M08ClearanceZoneConfig = z.infer<typeof m08ClearanceZoneSchema>;
export type M08RectangularZone = z.infer<typeof m08RectangularZoneSchema>;
export type M08CircularZone = z.infer<typeof m08CircularZoneSchema>;
