/**
 * Color math and conversion utilities:
 * - HEX <-> RGB
 * - W3C WCAG 2.1 Contrast Ratio and Relative Luminance
 * - Nearest RAL Classic matching
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface WcagContrastResult {
  whiteRatio: number;
  blackRatio: number;
  preferredText: "white" | "black";
  whiteScore: "AAA" | "AA" | "AA Large" | "Fail";
  blackScore: "AAA" | "AA" | "AA Large" | "Fail";
}

export interface RalMatch {
  code: string;
  name: string;
  hex: string;
  similarity: number; // 0 - 100%
}

/**
 * Normalizes and parses a HEX color string into RGB numbers (0-255).
 */
export function hexToRgb(hex: string): RgbColor | null {
  if (!hex) return null;
  let cleanHex = hex.trim().replace(/^#/, "");

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (cleanHex.length !== 6) {
    return null;
  }

  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB numbers to standardized #RRGGBB format.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates W3C relative luminance for an sRGB component.
 */
function srgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

/**
 * Returns W3C relative luminance (0 to 1).
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

/**
 * Calculates WCAG contrast ratio between two relative luminances.
 */
export function calculateContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function evaluateScore(ratio: number): "AAA" | "AA" | "AA Large" | "Fail" {
  if (ratio >= 7.0) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3.0) return "AA Large";
  return "Fail";
}

/**
 * Computes contrast ratio of a given HEX color against Pure White (#FFFFFF) and Pure Black (#000000).
 */
export function getWcagContrast(hex: string): WcagContrastResult {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return {
      whiteRatio: 1,
      blackRatio: 1,
      preferredText: "white",
      whiteScore: "Fail",
      blackScore: "Fail",
    };
  }

  const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  const lumWhite = 1.0;
  const lumBlack = 0.0;

  const whiteRatio = calculateContrastRatio(lum, lumWhite);
  const blackRatio = calculateContrastRatio(lum, lumBlack);

  const preferredText: "white" | "black" = whiteRatio >= blackRatio ? "white" : "black";

  return {
    whiteRatio,
    blackRatio,
    preferredText,
    whiteScore: evaluateScore(whiteRatio),
    blackScore: evaluateScore(blackRatio),
  };
}

export interface ContrastBetweenResult {
  ratio: number;
  score: "AAA" | "AA" | "AA Large" | "Fail";
  isAccessibleNormal: boolean; // >= 4.5
  isAccessibleLarge: boolean;  // >= 3.0
  warning?: string;
}

/**
 * Calculates WCAG 2.1 contrast ratio and rating directly between two HEX colors
 * (e.g. text color vs container background color).
 */
export function getContrastBetween(
  foregroundHex?: string | null,
  backgroundHex?: string | null
): ContrastBetweenResult {
  if (!foregroundHex || !backgroundHex) {
    return {
      ratio: 1,
      score: "Fail",
      isAccessibleNormal: false,
      isAccessibleLarge: false,
      warning: "Missing color inputs",
    };
  }

  const fgRgb = hexToRgb(foregroundHex);
  const bgRgb = hexToRgb(backgroundHex);

  if (!fgRgb || !bgRgb) {
    return {
      ratio: 1,
      score: "Fail",
      isAccessibleNormal: false,
      isAccessibleLarge: false,
      warning: "Invalid HEX format",
    };
  }

  const fgLum = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const ratio = calculateContrastRatio(fgLum, bgLum);
  const score = evaluateScore(ratio);
  const isAccessibleNormal = ratio >= 4.5;
  const isAccessibleLarge = ratio >= 3.0;

  let warning: string | undefined;
  if (!isAccessibleNormal) {
    if (isAccessibleLarge) {
      warning = "Nedostatočný kontrast pre bežný text (min. 4.5:1). Povolené iba pre veľké nadpisy (>18pt).";
    } else {
      warning = "Kriticky nízky kontrast podľa WCAG 2.1 AA (menej ako 3.0:1). Text bude pre mnohých používateľov nečitateľný.";
    }
  }

  return {
    ratio,
    score,
    isAccessibleNormal,
    isAccessibleLarge,
    warning,
  };
}

/**
 * Common RAL Classic colors palette with standard HEX matches.
 */
export const RAL_CLASSIC_PALETTE: { code: string; name: string; hex: string }[] = [
  { code: "RAL 1003", name: "Signal yellow", hex: "#EAB308" },
  { code: "RAL 1013", name: "Oyster white", hex: "#E3DAC9" },
  { code: "RAL 1018", name: "Zinc yellow", hex: "#F3DA35" },
  { code: "RAL 1023", name: "Traffic yellow", hex: "#F7B500" },
  { code: "RAL 2004", name: "Pure orange", hex: "#E05A16" },
  { code: "RAL 2008", name: "Bright red orange", hex: "#ED6B22" },
  { code: "RAL 3000", name: "Flame red", hex: "#AF2B1E" },
  { code: "RAL 3001", name: "Signal red", hex: "#A52019" },
  { code: "RAL 3003", name: "Ruby red", hex: "#8A171F" },
  { code: "RAL 3020", name: "Traffic red", hex: "#CC1105" },
  { code: "RAL 4005", name: "Blue lilac", hex: "#76689B" },
  { code: "RAL 4006", name: "Traffic purple", hex: "#992572" },
  { code: "RAL 4010", name: "Telemagenta", hex: "#C63980" },
  { code: "RAL 5002", name: "Ultramarine blue", hex: "#162E7B" },
  { code: "RAL 5005", name: "Signal blue", hex: "#154889" },
  { code: "RAL 5010", name: "Gentian blue", hex: "#0E467F" },
  { code: "RAL 5012", name: "Light blue", hex: "#2271B3" },
  { code: "RAL 5015", name: "Sky blue", hex: "#007CB0" },
  { code: "RAL 5017", name: "Traffic blue", hex: "#005387" },
  { code: "RAL 6005", name: "Moss green", hex: "#114232" },
  { code: "RAL 6018", name: "Yellow green", hex: "#48A43F" },
  { code: "RAL 6024", name: "Traffic green", hex: "#008351" },
  { code: "RAL 6032", name: "Signal green", hex: "#007D4D" },
  { code: "RAL 7001", name: "Silver grey", hex: "#8A959E" },
  { code: "RAL 7016", name: "Anthracite grey", hex: "#373F43" },
  { code: "RAL 7021", name: "Black grey", hex: "#2F3234" },
  { code: "RAL 7024", name: "Graphite grey", hex: "#45494E" },
  { code: "RAL 7035", name: "Light grey", hex: "#D7D7D7" },
  { code: "RAL 8017", name: "Chocolate brown", hex: "#442F29" },
  { code: "RAL 9001", name: "Cream", hex: "#FDF4E3" },
  { code: "RAL 9003", name: "Signal white", hex: "#ECECE7" },
  { code: "RAL 9004", name: "Signal black", hex: "#2B2B2C" },
  { code: "RAL 9005", name: "Jet black", hex: "#0E0E10" },
  { code: "RAL 9010", name: "Pure white", hex: "#FFFFFF" },
  { code: "RAL 9016", name: "Traffic white", hex: "#F6F6F6" },
];

/**
 * Finds the nearest matching RAL Classic color based on Euclidean RGB distance.
 */
export function findNearestRal(hex: string): RalMatch | null {
  const target = hexToRgb(hex);
  if (!target) return null;

  let bestMatch = RAL_CLASSIC_PALETTE[0];
  let minDistance = Infinity;

  for (const ral of RAL_CLASSIC_PALETTE) {
    const ralRgb = hexToRgb(ral.hex);
    if (!ralRgb) continue;

    // Euclidean distance in RGB color space
    const dR = target.r - ralRgb.r;
    const dG = target.g - ralRgb.g;
    const dB = target.b - ralRgb.b;
    const distance = Math.sqrt(dR * dR + dG * dG + dB * dB);

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = ral;
    }
  }

  // Max distance in RGB space is sqrt(255^2 * 3) ~= 441.67
  const maxDist = 441.67;
  const similarity = Math.max(0, Math.round((1 - minDistance / maxDist) * 100));

  return {
    code: bestMatch.code,
    name: bestMatch.name,
    hex: bestMatch.hex,
    similarity,
  };
}
