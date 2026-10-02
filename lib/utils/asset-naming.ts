import { AssetMedium, AssetOrientation, AssetBackground } from "@/lib/validations/asset";

export interface SuggestLogoNameParams {
  brandName?: string;
  medium: AssetMedium;
  orientation: AssetOrientation;
  hasClaim?: boolean;
  background: AssetBackground;
  note?: string;
}

/**
 * Generates a structured logo name based on assigned parameters and optional note.
 * Format example: "logobook_print_cmyk_width_darkbg_poznamka"
 */
export function suggestLogoName({
  brandName,
  medium,
  orientation,
  hasClaim,
  background,
  note,
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

  // 2. Medium (print_cmyk, digital_rgb, universal)
  if (medium === "PRINT_CMYK") {
    parts.push("print_cmyk");
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

  // 4. Background (darkbg, lightbg, transparentbg, inversebg, monochrome)
  if (background === "DARK") {
    parts.push("darkbg");
  } else if (background === "LIGHT") {
    parts.push("lightbg");
  } else if (background === "TRANSPARENT") {
    parts.push("transparentbg");
  } else if (background === "INVERSE") {
    parts.push("inversebg");
  } else if (background === "MONOCHROME") {
    parts.push("monochrome");
  }

  // 5. Note / Poznámka (optional, e.g. poznamka, v2, white, etc.)
  if (note && note.trim()) {
    const cleanNote = note
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (cleanNote) {
      parts.push(cleanNote);
    }
  }

  return parts.join("_");
}
