import { AssetMedium, AssetOrientation, AssetBackground } from "@/lib/validations/asset";

export interface SuggestLogoNameParams {
  brandName?: string;
  medium: AssetMedium;
  orientation: AssetOrientation;
  hasClaim?: boolean;
  background: AssetBackground;
}

/**
 * Generates a structured logo name based on assigned parameters.
 * Format example: "logobook_print_cmyk_width_darkbg"
 */
export function suggestLogoName({
  brandName,
  medium,
  orientation,
  hasClaim,
  background,
}: SuggestLogoNameParams): string {
  const parts: string[] = [];

  // 1. Brand prefix (e.g. logobook)
  const cleanBrand = (brandName || "logo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (cleanBrand) {
    parts.push(cleanBrand);
  }

  // 2. Medium (print_cmyk, print_pantone, print_monochrome, print_wb, digital_rgb, universal)
  if (medium === "PRINT_CMYK") {
    parts.push("print_cmyk");
  } else if (medium === "PRINT_PANTONE") {
    parts.push("print_pantone");
  } else if (medium === "PRINT_MONOCHROME") {
    parts.push("print_monochrome");
  } else if (medium === "PRINT_WB") {
    parts.push("print_wb");
  } else if (medium === "DIGITAL_RGB") {
    parts.push("digital_rgb");
  } else {
    parts.push("universal");
  }

  // 3. Orientation & Claim (width, width_claim, height, height_claim, symbol)
  if (orientation === "SYMBOL") {
    parts.push("symbol");
  } else if (orientation === "VERTICAL") {
    parts.push(hasClaim ? "height_claim" : "height");
  } else {
    // HORIZONTAL (width)
    parts.push(hasClaim ? "width_claim" : "width");
  }

  // 4. Background (darkbg, lightbg)
  if (background === "DARK") {
    parts.push("darkbg");
  } else {
    parts.push("lightbg");
  }

  return parts.join("_");
}
