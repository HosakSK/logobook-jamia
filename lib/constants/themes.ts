import { getWcagContrast } from "@/lib/utils/color-calc";

export type ManualThemeId = "abyss" | "deep" | "paper" | "mist" | "custom";

export interface ManualCustomColors {
  bgColor?: string;
  surfaceColor?: string;
  textColor?: string;
  headingColor?: string;
  mutedColor?: string;
  borderColor?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface ManualPatternConfig {
  enabled: boolean;
  patternUrl?: string;
  patternType?: "repeat" | "cover" | "contain" | "zoom" | "single";
  zoomPercent?: number; // e.g. 10 to 300, default 100
  position?: "center" | "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  marginPx?: number; // offset margin in px, e.g. 0 to 160
  colorMode?: "original" | "primary" | "secondary" | "accent" | "custom";
  customColorHex?: string;
  opacity?: number; // 0 to 1, default 0.15
  overlayGradient?: {
    enabled: boolean;
    direction: "to-bottom" | "to-top" | "to-right" | "to-left" | "to-bottom-right" | "to-bottom-left" | "radial";
    intensity?: number; // 0 to 1, default 1.0 (fade from 100% bg color to 0% transparent)
    spreadPercent?: number; // e.g. 20 to 100%, how far the transition stretches across the screen
  };
}

export interface ManualThemeConfig {
  themeId: ManualThemeId;
  headingColor?: string;
  custom?: ManualCustomColors;
  pattern?: ManualPatternConfig;
}

export interface ManualThemeDefinition {
  id: ManualThemeId;
  name: { sk: string; en: string };
  description: { sk: string; en: string };
  isDark: boolean;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  primaryColor: string;
  accentColor: string;
}

/**
 * 4 default presets using strictly the 6 background colors and brand accents from design_rules.md.
 * Pure #ffffff and #000000 are strictly forbidden in default themes.
 */
export const PRESET_THEMES: Record<Exclude<ManualThemeId, "custom">, ManualThemeDefinition> = {
  abyss: {
    id: "abyss",
    name: { sk: "Abyss (Hlboký vesmír)", en: "Abyss (Deep Space)" },
    description: { sk: "Najtmavší polnočný podklad so zvýšeným povrchom kariet", en: "Darkest midnight canvas with raised surfaces" },
    isDark: true,
    bgColor: "#070b0f",
    surfaceColor: "#17212a",
    textColor: "#fafbfc",
    mutedColor: "#96abbe",
    borderColor: "rgba(63, 85, 102, 0.45)",
    primaryColor: "#c8d400",
    accentColor: "#009f80",
  },
  deep: {
    id: "deep",
    name: { sk: "Deep Slate (Grafit)", en: "Deep Slate (Graphite)" },
    description: { sk: "Hlboká grafitová bridlica s vyvýšenými panelmi", en: "Deep slate background with elevated panels" },
    isDark: true,
    bgColor: "#0e161d",
    surfaceColor: "#1f2c36",
    textColor: "#fafbfc",
    mutedColor: "#96abbe",
    borderColor: "rgba(63, 85, 102, 0.45)",
    primaryColor: "#009f80",
    accentColor: "#c8d400",
  },
  paper: {
    id: "paper",
    name: { sk: "Light Canvas (Svetlý papier)", en: "Light Canvas (Clean Paper)" },
    description: { sk: "Čistý svieži svetlý podklad so snehobielymi kartami", en: "Crisp light canvas with pure white cards" },
    isDark: false,
    bgColor: "#fafbfc",
    surfaceColor: "#ffffff",
    textColor: "#0e161d",
    mutedColor: "#64748b",
    borderColor: "#e2e8f0",
    primaryColor: "#c8d400",
    accentColor: "#009f80",
  },
  mist: {
    id: "mist",
    name: { sk: "Cool Mist (Chladná hmla)", en: "Cool Mist (Subtle Slate)" },
    description: { sk: "Jemný chladný podklad so snehobielymi kartami", en: "Subtle cool backdrop with pure white cards" },
    isDark: false,
    bgColor: "#f8fafc",
    surfaceColor: "#ffffff",
    textColor: "#0e161d",
    mutedColor: "#64748b",
    borderColor: "#e2e8f0",
    primaryColor: "#009f80",
    accentColor: "#bb4934",
  },
};

export interface ResolvedTheme {
  themeId: ManualThemeId;
  isDark: boolean;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
  headingColor: string;
  mutedColor: string;
  borderColor: string;
  primaryColor: string;
  accentColor: string;
}

/**
 * Resolves full theme colors based on theme configuration, fallback manualBgColor and brand colors.
 */
export function resolveManualTheme(
  themeConfig?: ManualThemeConfig | null,
  fallbackManualBgColor?: string,
  brandColors?: Array<{ hex?: string; role?: string }> | null
): ResolvedTheme {
  // Brand color fallbacks
  let brandPrimary = "#c8d400";
  let brandAccent = "#009f80";

  if (brandColors && brandColors.length > 0) {
    for (const c of brandColors) {
      if (!c.hex) continue;
      const role = c.role?.toUpperCase();
      if (role === "PRIMARY") brandPrimary = c.hex;
      else if (role === "ACCENT") brandAccent = c.hex;
    }
  }

  // Determine themeId
  let themeId: ManualThemeId = themeConfig?.themeId || "paper";

  // Backwards compatibility if themeConfig is missing but manualBgColor is set
  if (!themeConfig?.themeId && fallbackManualBgColor) {
    const normBg = fallbackManualBgColor.toLowerCase().trim();
    if (normBg === "#070b0f") themeId = "abyss";
    else if (normBg === "#0e161d") themeId = "deep";
    else if (normBg === "#fafbfc") themeId = "paper";
    else if (normBg === "#eef2f6") themeId = "mist";
    else themeId = "custom";
  }

  if (themeId === "custom") {
    const custom = themeConfig?.custom || {};
    const bgColor = custom.bgColor || fallbackManualBgColor || "#fafbfc";
    
    // Contrast check for text defaults
    let isDark = true;
    try {
      isDark = getWcagContrast(bgColor).preferredText === "white";
    } catch {
      isDark = true;
    }

    const textColor = custom.textColor || (isDark ? "#fafbfc" : "#0e161d");
    const headingColor = themeConfig?.headingColor || custom.headingColor || textColor;
    const surfaceColor = custom.surfaceColor || (isDark ? "#17212a" : "#ffffff");
    const mutedColor = custom.mutedColor || (isDark ? "#96abbe" : "#64748b");
    const borderColor = custom.borderColor || (isDark ? "rgba(63, 85, 102, 0.45)" : "#e2e8f0");
    const primaryColor = custom.primaryColor || brandPrimary;
    const accentColor = custom.accentColor || brandAccent;

    return {
      themeId: "custom",
      isDark,
      bgColor,
      surfaceColor,
      textColor,
      headingColor,
      mutedColor,
      borderColor,
      primaryColor,
      accentColor,
    };
  }

  const preset = PRESET_THEMES[themeId] || PRESET_THEMES.paper;
  const headingColor = themeConfig?.headingColor || preset.textColor;

  // For presets, if brand colors exist, prioritize brand primary / accent if requested, or keep preset accents
  return {
    themeId: preset.id,
    isDark: preset.isDark,
    bgColor: preset.bgColor,
    surfaceColor: preset.surfaceColor,
    textColor: preset.textColor,
    headingColor,
    mutedColor: preset.mutedColor,
    borderColor: preset.borderColor,
    primaryColor: brandPrimary || preset.primaryColor,
    accentColor: brandAccent || preset.accentColor,
  };
}
