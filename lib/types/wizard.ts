/**
 * Configuration for the Dimension Matrix Engine (Tree Wizard)
 */
export interface DimensionMatrixConfig {
  media: Array<"cmyk" | "rgb" | "special">;
  orientations: Array<"horizontal" | "vertical" | "symbol">;
  hasClaimOption: boolean;
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
