import { GlobalShapesRecord, GlobalColorsRecord, GlobalTypographyRecord } from "@/types/pocketbase-types";

/**
 * Universal multi-language text mapping where key is locale code (e.g. 'sk', 'en', 'cs')
 * and value is the localized string.
 */
export type I18nRecord = Record<string, string>;

/**
 * Cascade Radius Mode options for Level 3 Overrides
 */
export type CascadeRadiusMode = "inherit" | "sharp" | "rounded" | "pill" | "custom";

/**
 * Standardized Level 3 Local Style Overrides stored within `module.config.styleOverrides`
 */
export interface CascadeStyleOverrides {
  radiusMode?: CascadeRadiusMode;
  customRadiusPx?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidthPx?: number;
  paddingY?: "none" | "small" | "normal" | "large";
  customCssClass?: string;
}

/**
 * Base configuration interface for all modules (M01 - M25)
 */
export interface BaseModuleConfig {
  styleOverrides?: CascadeStyleOverrides;
  [key: string]: unknown;
}

/**
 * Fully resolved brand tokens injected into the CSS variables cascade and React Context
 */
import { ManualThemeConfig, ResolvedTheme } from "@/lib/constants/themes";

export interface BrandCascadeTokens {
  radius: string; // e.g. "3px", "0px", "9999px"
  radiusMode: "sharp" | "rounded" | "pill";
  customRadiusPx: number;
  borderWidth: string; // e.g. "1px"
  borderWidthPx: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    heading: string;
    success?: string;
    warning?: string;
    danger?: string;
    info?: string;
    [key: string]: string | undefined;
  };
  palette: Array<{ hex: string; role: string; name: string }>;
  manualBgColor?: string;
  themeConfig?: ManualThemeConfig;
  theme?: ResolvedTheme;
  typography?: {
    headingFontFamily?: string;
    bodyFontFamily?: string;
  };
}

/**
 * Standard props received by every Module component in ModuleDispatcher
 */
export interface ModuleRenderProps<TConfig extends BaseModuleConfig = BaseModuleConfig> {
  id?: string;
  moduleType: string;
  order?: number;
  showH3?: boolean;
  h3Title?: I18nRecord;
  config: TConfig;
  locale?: string;
  isEditor?: boolean;
  onConfigChange?: (newConfig: TConfig) => void;
}
