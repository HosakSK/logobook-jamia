import { z } from "zod";

export const ASSET_MEDIUMS = ["DIGITAL_RGB", "PRINT_CMYK", "UNIVERSAL"] as const;
export const ASSET_ORIENTATIONS = ["HORIZONTAL", "VERTICAL", "SYMBOL"] as const;
export const ASSET_BACKGROUNDS = [
  "LIGHT",
  "DARK",
  "MONOCHROME",
  "INVERSE",
  "TRANSPARENT",
] as const;
export const ASSET_FILE_FORMATS = ["SVG", "PDF", "EPS", "AI", "PNG", "ZIP"] as const;

export type AssetMedium = (typeof ASSET_MEDIUMS)[number];
export type AssetOrientation = (typeof ASSET_ORIENTATIONS)[number];
export type AssetBackground = (typeof ASSET_BACKGROUNDS)[number];
export type AssetFileFormat = (typeof ASSET_FILE_FORMATS)[number];

export const createAssetSchema = z
  .object({
    name: z.string().min(1, { message: "Názov loga je povinný" }),
    nameSk: z.string().optional(),
    nameCs: z.string().optional(),
    medium: z.enum(ASSET_MEDIUMS),
    orientation: z.enum(ASSET_ORIENTATIONS),
    hasClaim: z.boolean().default(false),
    background: z.enum(ASSET_BACKGROUNDS),
    svgContent: z.string().min(10, { message: "SVG obsah je povinný" }),
  })
  .refine(
    (data) => {
      // Symbol never has a claim
      if (data.orientation === "SYMBOL" && data.hasClaim) {
        return false;
      }
      return true;
    },
    {
      message: "Symbol loga nemôže obsahovať slogan / claim",
      path: ["hasClaim"],
    }
  );

export const updateAssetSchema = z
  .object({
    name: z.string().min(1, { message: "Názov loga je povinný" }),
    nameSk: z.string().optional(),
    nameCs: z.string().optional(),
    medium: z.enum(ASSET_MEDIUMS),
    orientation: z.enum(ASSET_ORIENTATIONS),
    hasClaim: z.boolean().default(false),
    background: z.enum(ASSET_BACKGROUNDS),
    clearanceZone: z.record(z.string(), z.any()).optional(),
    minSize: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.orientation === "SYMBOL" && data.hasClaim) {
        return false;
      }
      return true;
    },
    {
      message: "Symbol loga nemôže obsahovať slogan / claim",
      path: ["hasClaim"],
    }
  );

export const addAssetFileSchema = z.object({
  fileFormat: z.enum(ASSET_FILE_FORMATS),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
