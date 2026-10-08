/**
 * Configuration for the Dimension Matrix Engine (Tree Wizard)
 */
export type LogoCompositionKey =
  | "horizontal"
  | "vertical"
  | "symbol"
  | "horizontal_claim"
  | "vertical_claim";

export interface DimensionMatrixConfig {
  media: Array<"cmyk" | "rgb" | "special">;
  compositions?: Array<LogoCompositionKey>;
  orientations?: Array<"horizontal" | "vertical" | "symbol">;
  hasClaimOption?: boolean;
  backgrounds?: Array<"light" | "dark">;
  includeIntroPage?: boolean;
  includeColorsPage?: boolean;
  includeTypographyPage?: boolean;
}

export interface DimensionMatrixResult {
  success: boolean;
  createdPagesCount: number;
  createdModulesCount: number;
  skippedPagesCount: number;
  firstPageId?: string;
  error?: string;
}
