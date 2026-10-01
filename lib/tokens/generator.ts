import { PublishedBrandSnapshot } from "@/actions/publish";
import { BrandCascadeTokens } from "@/lib/types/module";
import { generateTonalSteps } from "@/lib/utils/color-calc";

export interface DesignTokensGenerationInput {
  snapshot: PublishedBrandSnapshot;
  cascadeTokens?: BrandCascadeTokens | null;
}

/**
 * Generates standard CSS Custom Properties (:root stylesheet) for the brand.
 * Conforms to modern CSS specification with standard custom property naming.
 */
export function generateBrandCssTheme(input: DesignTokensGenerationInput): string {
  const { snapshot, cascadeTokens } = input;
  const brandName = snapshot.brand.name || "Brand";
  const version = snapshot.version || 1;
  const publishedAt = snapshot.publishedAt || new Date().toISOString();

  const primary = cascadeTokens?.colors.primary || "#c8d400";
  const secondary = cascadeTokens?.colors.secondary || "#17212a";
  const accent = cascadeTokens?.colors.accent || "#009f80";
  const neutral = cascadeTokens?.colors.neutral || "#fafbfc";
  const success = cascadeTokens?.colors.success || "#10b981";
  const warning = cascadeTokens?.colors.warning || "#f59e0b";
  const danger = cascadeTokens?.colors.danger || "#bb4934";
  const info = cascadeTokens?.colors.info || "#3b82f6";

  const radius = cascadeTokens?.radius || "3px";
  const borderWidth = cascadeTokens?.borderWidth || "1px";

  // Compute tonal steps for primary color
  const tonalSteps = generateTonalSteps(primary);

  // Additional custom palette colors
  const customColors = (cascadeTokens?.palette || []).filter(
    (c) => !["PRIMARY", "SECONDARY", "ACCENT", "NEUTRAL"].includes(c.role?.toUpperCase())
  );

  const lines: string[] = [
    `/**`,
    ` * Logobook.sk Design Tokens CSS Theme`,
    ` * Brand: ${brandName} (v${version})`,
    ` * Published: ${publishedAt}`,
    ` * Single Source of Truth for Web & App Developers`,
    ` */`,
    ``,
    `:root {`,
    `  /* --- Brand Core Colors --- */`,
    `  --color-primary: ${primary};`,
    `  --color-secondary: ${secondary};`,
    `  --color-accent: ${accent};`,
    `  --color-neutral: ${neutral};`,
    ``,
    `  /* --- Semantic UI Colors --- */`,
    `  --color-success: ${success};`,
    `  --color-warning: ${warning};`,
    `  --color-danger: ${danger};`,
    `  --color-info: ${info};`,
    ``,
    `  /* --- Primary Tonal Scale (HSLuv 50 - 900) --- */`,
  ];

  for (const step of tonalSteps) {
    lines.push(`  --color-primary-${step.step}: ${step.hex};`);
  }

  if (customColors.length > 0) {
    lines.push(``);
    lines.push(`  /* --- Custom Brand Palette --- */`);
    for (const c of customColors) {
      const slug = (c.name || c.role || "custom")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      lines.push(`  --color-${slug}: ${c.hex};`);
    }
  }

  lines.push(``);
  lines.push(`  /* --- Typography --- */`);
  lines.push(`  --font-family-heading: var(--brand-font-heading, var(--font-sans, system-ui, sans-serif));`);
  lines.push(`  --font-family-body: var(--brand-font-body, var(--font-sans, system-ui, sans-serif));`);
  lines.push(`  --font-size-h1: 48px;`);
  lines.push(`  --font-size-h2: 32px;`);
  lines.push(`  --font-size-h3: 24px;`);
  lines.push(`  --font-size-body: 16px;`);
  lines.push(`  --font-size-sm: 14px;`);
  lines.push(`  --font-size-xs: 12px;`);
  lines.push(``);
  lines.push(`  /* --- Geometry & Shapes --- */`);
  lines.push(`  --border-radius-base: ${radius};`);
  lines.push(`  --border-width-base: ${borderWidth};`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

/**
 * Generates W3C Design Tokens Community Group (DTCG) specification JSON.
 * Every token includes required '$value' and '$type' keys.
 * Fully compatible with Tokens Studio for Figma, Style Dictionary, and CI/CD tools.
 */
export function generateBrandW3cTokens(
  input: DesignTokensGenerationInput
): Record<string, unknown> {
  const { snapshot, cascadeTokens } = input;
  const brandName = snapshot.brand.name || "Brand";
  const version = snapshot.version || 1;

  const primary = cascadeTokens?.colors.primary || "#c8d400";
  const secondary = cascadeTokens?.colors.secondary || "#17212a";
  const accent = cascadeTokens?.colors.accent || "#009f80";
  const neutral = cascadeTokens?.colors.neutral || "#fafbfc";
  const success = cascadeTokens?.colors.success || "#10b981";
  const warning = cascadeTokens?.colors.warning || "#f59e0b";
  const danger = cascadeTokens?.colors.danger || "#bb4934";
  const info = cascadeTokens?.colors.info || "#3b82f6";

  const radius = cascadeTokens?.radius || "3px";
  const borderWidth = cascadeTokens?.borderWidth || "1px";

  const tonalSteps = generateTonalSteps(primary);

  const colorGroup: Record<string, unknown> = {
    primary: {
      $value: primary,
      $type: "color",
      $description: "Main primary brand color",
    },
    secondary: {
      $value: secondary,
      $type: "color",
      $description: "Secondary brand color",
    },
    accent: {
      $value: accent,
      $type: "color",
      $description: "Accent color for call-to-actions",
    },
    neutral: {
      $value: neutral,
      $type: "color",
      $description: "Neutral base canvas color",
    },
    success: {
      $value: success,
      $type: "color",
    },
    warning: {
      $value: warning,
      $type: "color",
    },
    danger: {
      $value: danger,
      $type: "color",
    },
    info: {
      $value: info,
      $type: "color",
    },
  };

  // Add tonal scale (50-900)
  for (const step of tonalSteps) {
    colorGroup[`primary-${step.step}`] = {
      $value: step.hex,
      $type: "color",
      $description: `Tonal step ${step.step} (${step.lightness}% lightness)`,
    };
  }

  // Add custom colors if present
  const customColors = (cascadeTokens?.palette || []).filter(
    (c) => !["PRIMARY", "SECONDARY", "ACCENT", "NEUTRAL"].includes(c.role?.toUpperCase())
  );
  for (const c of customColors) {
    const slug = (c.name || c.role || "custom")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    colorGroup[slug] = {
      $value: c.hex,
      $type: "color",
      $description: c.name || c.role,
    };
  }

  const typographyGroup: Record<string, unknown> = {
    "heading-1": {
      fontSize: { $value: "48px", $type: "dimension" },
      fontWeight: { $value: "700", $type: "fontWeight" },
      fontFamily: { $value: "Inter, sans-serif", $type: "fontFamily" },
      lineHeight: { $value: "1.15", $type: "dimension" },
    },
    "heading-2": {
      fontSize: { $value: "32px", $type: "dimension" },
      fontWeight: { $value: "700", $type: "fontWeight" },
      fontFamily: { $value: "Inter, sans-serif", $type: "fontFamily" },
      lineHeight: { $value: "1.25", $type: "dimension" },
    },
    "heading-3": {
      fontSize: { $value: "24px", $type: "dimension" },
      fontWeight: { $value: "600", $type: "fontWeight" },
      fontFamily: { $value: "Inter, sans-serif", $type: "fontFamily" },
      lineHeight: { $value: "1.3", $type: "dimension" },
    },
    body: {
      fontSize: { $value: "16px", $type: "dimension" },
      fontWeight: { $value: "400", $type: "fontWeight" },
      fontFamily: { $value: "Inter, sans-serif", $type: "fontFamily" },
      lineHeight: { $value: "1.5", $type: "dimension" },
    },
    "body-sm": {
      fontSize: { $value: "14px", $type: "dimension" },
      fontWeight: { $value: "400", $type: "fontWeight" },
      fontFamily: { $value: "Inter, sans-serif", $type: "fontFamily" },
      lineHeight: { $value: "1.5", $type: "dimension" },
    },
  };

  const borderGroup: Record<string, unknown> = {
    radius: {
      $value: radius,
      $type: "dimension",
    },
    width: {
      $value: borderWidth,
      $type: "dimension",
    },
  };

  return {
    $schema: "https://design-tokens.github.io/community-group/format/",
    name: `${brandName} Design Tokens`,
    version: String(version),
    color: colorGroup,
    typography: typographyGroup,
    border: borderGroup,
  };
}
