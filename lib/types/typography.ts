import { FontSource, FontRole } from "@/lib/validations/typography";

export interface TypographySettings {
  weights?: number[];
  fallback?: string;
  defaultSize?: number;
  letterSpacing?: string;
  lineHeight?: string;
}

export interface BrandTypography {
  id: string;
  brand: string;
  name: string;
  role: FontRole;
  fontSource: FontSource;
  googleFontFamily?: string;
  adobeProjectId?: string;
  fontFamilyName?: string;
  customFont?: string;
  customFontUrl?: string;
  licenseConfirmed: boolean;
  licenseAllowsOfflineDistribution: boolean;
  settings: TypographySettings;
  sampleText?: string;
  order: number;
  created: string;
  updated: string;
}
