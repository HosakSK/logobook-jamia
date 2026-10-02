import { CSSProperties } from "react";
import {
  GlobalShapesRecord,
  GlobalColorsRecord,
  GlobalTypographyRecord,
} from "@/types/pocketbase-types";
import {
  BrandCascadeTokens,
  CascadeStyleOverrides,
  CascadeRadiusMode,
} from "@/lib/types/module";
import { BrandColor } from "@/lib/types/color";

/**
 * Calculates CSS radius string based on mode and pixel value.
 */
export function computeBrandRadiusValue(
  mode: string = "rounded",
  customPx: number = 3
): string {
  switch (mode) {
    case "sharp":
      return "0px";
    case "pill":
      return "9999px";
    case "rounded":
    default:
      return `${Math.max(0, customPx)}px`;
  }
}

/**
 * Computes standard CSS custom properties for Level 1 Brand Tokens.
 * These are injected into the root manual layout and container DOM elements.
 */
export function computeBrandCssVariables(
  shapes?: Partial<GlobalShapesRecord> | null,
  colors?: Array<Partial<GlobalColorsRecord> | BrandColor> | null,
  typography?: Array<Partial<GlobalTypographyRecord>> | null
): Record<string, string> {
  const radiusMode = shapes?.radiusMode || "rounded";
  const customRadiusPx = shapes?.customRadiusPx ?? 3;
  const borderWidthPx = shapes?.borderWidthPx ?? 1;

  const radiusValue = computeBrandRadiusValue(radiusMode, customRadiusPx);
  const borderWidthValue = `${Math.max(0, borderWidthPx)}px`;

  // Color mapping by role
  let primary = "#c8d400";
  let secondary = "#17212a";
  let accent = "#009f80";
  let neutral = "#fafbfc";

  if (colors && colors.length > 0) {
    for (const c of colors) {
      if (!c.hex) continue;
      const role = c.role?.toUpperCase();
      if (role === "PRIMARY") primary = c.hex;
      else if (role === "SECONDARY") secondary = c.hex;
      else if (role === "ACCENT") accent = c.hex;
      else if (role === "NEUTRAL") neutral = c.hex;
    }
  }

  // Semantic colors
  const success = shapes?.semanticSuccess || "#10b981";
  const warning = shapes?.semanticWarning || "#f59e0b";
  const danger = shapes?.semanticDanger || "#bb4934";
  const info = shapes?.semanticInfo || "#3b82f6";

  // Typography
  let headingFont = "var(--font-sans)";
  let bodyFont = "var(--font-sans)";

  if (typography && typography.length > 0) {
    for (const t of typography) {
      const role = t.role?.toUpperCase();
      const family = t.fontFamilyName || t.googleFontFamily;
      if (family) {
        if (role === "HEADING" || role === "DISPLAY") {
          headingFont = `"${family}", sans-serif`;
        } else if (role === "BODY") {
          bodyFont = `"${family}", sans-serif`;
        }
      }
    }
  }

  const manualBg = (shapes as any)?.manualBgColor || "#0e161d";

  return {
    "--brand-radius": radiusValue,
    "--brand-radius-mode": radiusMode,
    "--brand-border-width": borderWidthValue,
    "--brand-color-primary": primary,
    "--brand-color-secondary": secondary,
    "--brand-color-accent": accent,
    "--brand-color-neutral": neutral,
    "--brand-color-success": success,
    "--brand-color-warning": warning,
    "--brand-color-danger": danger,
    "--brand-color-info": info,
    "--brand-font-heading": headingFont,
    "--brand-font-body": bodyFont,
    "--brand-manual-bg": manualBg,
  };
}

/**
 * Builds the BrandCascadeTokens object from database records.
 */
export function buildBrandCascadeTokens(
  shapes?: Partial<GlobalShapesRecord> | null,
  colors?: Array<Partial<GlobalColorsRecord> | BrandColor> | null,
  typography?: Array<Partial<GlobalTypographyRecord>> | null
): BrandCascadeTokens {
  const radiusMode = (shapes?.radiusMode as "sharp" | "rounded" | "pill") || "rounded";
  const customRadiusPx = shapes?.customRadiusPx ?? 3;
  const borderWidthPx = shapes?.borderWidthPx ?? 1;
  const manualBgColor = (shapes as any)?.manualBgColor || "#0e161d";

  let primary = "#c8d400";
  let secondary = "#17212a";
  let accent = "#009f80";
  let neutral = "#fafbfc";

  const palette: Array<{ hex: string; role: string; name: string }> = [];

  if (colors && colors.length > 0) {
    for (const c of colors) {
      if (!c.hex) continue;
      const role = (c.role as string)?.toUpperCase() || "CUSTOM";
      const name =
        typeof c.name === "object" && c.name !== null
          ? (c.name as Record<string, string>).sk || (c.name as Record<string, string>).en || role
          : String(c.name || role);

      palette.push({ hex: c.hex, role, name });

      if (role === "PRIMARY") primary = c.hex;
      else if (role === "SECONDARY") secondary = c.hex;
      else if (role === "ACCENT") accent = c.hex;
      else if (role === "NEUTRAL") neutral = c.hex;
    }
  }

  return {
    radius: computeBrandRadiusValue(radiusMode, customRadiusPx),
    radiusMode,
    customRadiusPx,
    borderWidth: `${Math.max(0, borderWidthPx)}px`,
    borderWidthPx,
    manualBgColor,
    colors: {
      primary,
      secondary,
      accent,
      neutral,
      success: shapes?.semanticSuccess || "#10b981",
      warning: shapes?.semanticWarning || "#f59e0b",
      danger: shapes?.semanticDanger || "#bb4934",
      info: shapes?.semanticInfo || "#3b82f6",
    },
    palette,
  };
}

/**
 * Resolves the final border radius applying the Three-Tier Cascade rule:
 * Level 1/2: Global Token (`--brand-radius`)
 * Level 3: Local Override (Sharp / Pill / Custom / Rounded)
 */
export function resolveCascadeRadius(
  override?: CascadeStyleOverrides,
  tokens?: BrandCascadeTokens
): string {
  if (override?.radiusMode && override.radiusMode !== "inherit") {
    switch (override.radiusMode) {
      case "sharp":
        return "0px";
      case "pill":
        return "9999px";
      case "custom":
        return `${Math.max(0, override.customRadiusPx ?? 3)}px`;
      case "rounded":
        return `${Math.max(0, override.customRadiusPx ?? tokens?.customRadiusPx ?? 3)}px`;
    }
  }

  return tokens?.radius || "var(--brand-radius, 3px)";
}

/**
 * Resolves a color applying the Three-Tier Cascade:
 * Level 3: Local Override (`override.backgroundColor` or `override.textColor`)
 * Level 1/2: Global Token (primary / secondary / accent / neutral)
 */
export function resolveCascadeColor(
  overrideColor?: string,
  fallbackRoleKey: "primary" | "secondary" | "accent" | "neutral" | "success" | "warning" | "danger" | "info" = "primary",
  tokens?: BrandCascadeTokens
): string {
  if (overrideColor && overrideColor.trim().length > 0) {
    return overrideColor;
  }
  if (tokens?.colors?.[fallbackRoleKey]) {
    return tokens.colors[fallbackRoleKey]!;
  }
  return `var(--brand-color-${fallbackRoleKey})`;
}

/**
 * Resolves border width with cascade.
 */
export function resolveCascadeBorderWidth(
  overrideWidthPx?: number,
  tokens?: BrandCascadeTokens
): string {
  if (overrideWidthPx !== undefined && overrideWidthPx !== null) {
    return `${Math.max(0, overrideWidthPx)}px`;
  }
  return tokens?.borderWidth || "var(--brand-border-width, 1px)";
}

/**
 * Converts a module's Level 3 styleOverrides into a React CSSProperties object.
 */
export function resolveCascadeStyleObject(
  overrides?: CascadeStyleOverrides,
  tokens?: BrandCascadeTokens
): CSSProperties {
  const styles: CSSProperties = {};

  if (overrides) {
    if (overrides.radiusMode && overrides.radiusMode !== "inherit") {
      styles.borderRadius = resolveCascadeRadius(overrides, tokens);
    }
    if (overrides.backgroundColor) {
      styles.backgroundColor = overrides.backgroundColor;
    }
    if (overrides.textColor) {
      styles.color = overrides.textColor;
    }
    if (overrides.borderColor) {
      styles.borderColor = overrides.borderColor;
    }
    if (overrides.borderWidthPx !== undefined && overrides.borderWidthPx !== null) {
      styles.borderWidth = `${overrides.borderWidthPx}px`;
    }
  }

  return styles;
}
