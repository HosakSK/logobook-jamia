/**
 * PocketBase Schema Type Definitions for Logobook.sk
 * Complete Data Model (02.01 & 02.02)
 */

export type IsoDateString = string;
export type RecordIdString = string;
export type HTMLString = string;

// System & Auth base fields
export interface BaseSystemFields<T = unknown> {
  id: RecordIdString;
  created: IsoDateString;
  updated: IsoDateString;
  collectionId: string;
  collectionName: Collections;
  expand?: T;
}

export interface AuthSystemFields<T = unknown> extends BaseSystemFields<T> {
  email: string;
  emailVisibility: boolean;
  verified: boolean;
}

// -----------------------------------------------------------------------------
// Enums / Select Types
// -----------------------------------------------------------------------------

export type UserLocale = "sk" | "en" | "de";

export type UserTier = "FREE" | "COMPANY" | "FREELANCER" | "AGENCY" | "PLATINUM";

export type BrandStatus = "LIVE" | "DEV" | "ARCHIVED";

export type TeamMemberRole = "OWNER" | "EDITOR" | "VIEWER";

export type GlobalColorRole = "PRIMARY" | "SECONDARY" | "ACCENT" | "NEUTRAL" | "CUSTOM";

export type GlobalRadiusMode = "SQUARE" | "ROUNDED" | "PILL";

export type GlobalTypographyRole = "HEADING" | "BODY" | "DISPLAY" | "MONOSPACE" | "EMAIL";

export type GlobalFontSource = "GOOGLE_FONTS" | "CUSTOM_UPLOAD" | "ADOBE_FONTS";

export type AssetMedium =
  | "DIGITAL_RGB"
  | "PRINT_CMYK"
  | "PRINT_PANTONE"
  | "PRINT_MONOCHROME"
  | "PRINT_WB"
  | "UNIVERSAL";

export type AssetOrientation = "HORIZONTAL" | "VERTICAL" | "SYMBOL";

export type AssetBackground = "LIGHT" | "DARK";

export type AssetFileFormat = "SVG" | "PDF" | "EPS" | "AI" | "PNG" | "ZIP";

export type MediaAssetType = "IMAGE" | "ICON" | "PATTERN" | "DOCUMENT";

export type PageMenuStyle = "main" | "submenu" | "hidden";

export type ContainerLayoutType =
  | "FULL"
  | "HALF_HALF"
  | "ONE_THIRD_TWO_THIRDS"
  | "TWO_THIRDS_ONE_THIRD"
  | "THREE_EQUAL"
  | "CUSTOM";

export type ContainerHeightMode = "AUTO" | "FIXED";

export type ModuleType =
  | "M01_Nadpis"
  | "M02_RichText"
  | "M03_Banner"
  | "M04_Razcestnik"
  | "M05_DownloadTlacidlo"
  | "M06_OddelovacMedzera"
  | "M07_ZobrazenieLoga"
  | "M08_OchrannaZonaLoga"
  | "M09_MinimalnaVelkostLoga"
  | "M10_ObrazokGaleria"
  | "M11_MaticaLogotypov"
  | "M12_KartaFarby"
  | "M13_PaletaFarieb"
  | "M14_TonalSteps"
  | "M15_NeutralneASystemovePodklady"
  | "M16_VzorkovnikyAPaletyNaStiahnutie"
  | "M17_UniverzalnaEdukativnaTabulka"
  | "M18_Typografia"
  | "M19_Patterny"
  | "M20_DosAndDonts"
  | "M21_FiremnaVizitka"
  | "M22_EmailPodpis"
  | "M23_SocialMedia"
  | "M24_FiremneTapetyAPozadia"
  | "M25_KniznicaIkon";

// -----------------------------------------------------------------------------
// Collection Record Definitions (02.01 Core)
// -----------------------------------------------------------------------------

export interface UsersRecord {
  name?: string;
  avatar?: string;
  locale?: UserLocale;
  tier?: UserTier;
  lemonCustomerId?: string;
  lemonSubId?: string;
}

export interface BrandsRecord<
  TPublishedConfig = Record<string, unknown>,
  TEnabledLocales = string[],
  TDescription = Record<string, string>
> {
  user: RecordIdString;
  name: string;
  slug: string;
  customDomain?: string;
  isDomainVerified?: boolean;
  status: BrandStatus;
  publishedConfig?: TPublishedConfig;
  passwordHash?: string;
  hideLogobookBadge?: boolean;
  defaultLocale?: UserLocale;
  enabledLocales?: TEnabledLocales;
  headerLogo?: RecordIdString;
  favicon?: RecordIdString;
  description?: TDescription;
}

export interface TeamMembersRecord {
  user: RecordIdString;
  brand: RecordIdString;
  role: TeamMemberRole;
}

export interface AgencyDefaultsRecord<
  TClearance = Record<string, unknown>,
  TMinSize = Record<string, unknown>,
  TRules = Record<string, unknown>,
  TPageTree = Record<string, unknown>,
  TTexts = Record<string, unknown>
> {
  user: RecordIdString;
  defaultClearanceZone?: TClearance;
  defaultMinSize?: TMinSize;
  defaultRules?: TRules;
  defaultPageTree?: TPageTree;
  defaultTexts?: TTexts;
}

export interface PageTemplatesRecord<
  TName = Record<string, string>,
  TDescription = Record<string, string>,
  TStructure = Record<string, unknown>
> {
  user?: RecordIdString;
  isSystem?: boolean;
  name: TName;
  description?: TDescription;
  category?: string;
  structure: TStructure;
}

// -----------------------------------------------------------------------------
// Collection Record Definitions (02.02 Brand Assets & PageBuilder)
// -----------------------------------------------------------------------------

export interface GlobalColorsRecord<TName = Record<string, string>> {
  brand: RecordIdString;
  name: TName;
  role: GlobalColorRole;
  hex: string;
  rgb?: string;
  cmykC?: number;
  cmykM?: number;
  cmykY?: number;
  cmykK?: number;
  pantoneC?: string;
  pantoneU?: string;
  pantoneTCX?: string;
  ral?: string;
  order?: number;
}

export interface GlobalShapesRecord {
  brand: RecordIdString;
  radiusMode: GlobalRadiusMode;
  customRadiusPx?: number;
  borderWidthPx?: number;
  semanticSuccess?: string;
  semanticWarning?: string;
  semanticDanger?: string;
  semanticInfo?: string;
  manualBgColor?: string;
  themeConfig?: any;
}

export interface GlobalTypographyRecord<
  TSettings = Record<string, unknown>,
  TSampleText = Record<string, string>
> {
  brand: RecordIdString;
  name: string;
  role: GlobalTypographyRole;
  fontSource: GlobalFontSource;
  googleFontFamily?: string;
  adobeProjectId?: string;
  fontFamilyName?: string;
  customFont?: string;
  licenseConfirmed?: boolean;
  licenseAllowsOfflineDistribution?: boolean;
  settings?: TSettings;
  sampleText?: TSampleText;
  order?: number;
}

export interface MediaAssetsRecord {
  brand: RecordIdString;
  file: string;
  fileName: string;
  fileType: MediaAssetType;
  altText?: string;
}

export interface AssetsRecord<
  TName = Record<string, string>,
  TClearanceZone = Record<string, unknown>,
  TMinSize = Record<string, unknown>
> {
  brand: RecordIdString;
  name: TName;
  medium: AssetMedium;
  orientation: AssetOrientation;
  hasClaim?: boolean;
  background: AssetBackground;
  svgContent?: string;
  preview?: string;
  clearanceZone?: TClearanceZone;
  minSize?: TMinSize;
  order?: number;
}

export interface AssetFilesRecord {
  asset: RecordIdString;
  file: string;
  fileFormat: AssetFileFormat;
  order?: number;
}

export interface PagesRecord<TTitle = Record<string, string>> {
  brand: RecordIdString;
  parent?: RecordIdString;
  title: TTitle;
  slug: string;
  isInMenu?: boolean;
  menuStyle: PageMenuStyle;
  order?: number;
  templateId?: string;
}

export interface ContainersRecord<
  TColumnWidths = number[],
  TH2Title = Record<string, string>
> {
  page: RecordIdString;
  order?: number;
  layoutType: ContainerLayoutType;
  columnCount?: number;
  columnWidths?: TColumnWidths;
  showH2?: boolean;
  h2Title?: TH2Title;
  backgroundColor?: string;
  heightMode?: ContainerHeightMode;
  fixedHeight?: number;
}

export interface ColumnsRecord {
  container: RecordIdString;
  order?: number;
  backgroundColor?: string;
}

export interface ModulesRecord<
  TH3Title = Record<string, string>,
  TConfig = Record<string, unknown>
> {
  column: RecordIdString;
  moduleType: ModuleType;
  order?: number;
  showH3?: boolean;
  h3Title?: TH3Title;
  config?: TConfig;
  linkGroupId?: string;
}

// -----------------------------------------------------------------------------
// Response Types
// -----------------------------------------------------------------------------

export type UsersResponse<TExpand = unknown> = UsersRecord & AuthSystemFields<TExpand>;
export type BrandsResponse<TExpand = unknown> = BrandsRecord & BaseSystemFields<TExpand>;
export type TeamMembersResponse<TExpand = unknown> = TeamMembersRecord & BaseSystemFields<TExpand>;
export type AgencyDefaultsResponse<TExpand = unknown> = AgencyDefaultsRecord & BaseSystemFields<TExpand>;
export type PageTemplatesResponse<TExpand = unknown> = PageTemplatesRecord & BaseSystemFields<TExpand>;
export type GlobalColorsResponse<TExpand = unknown> = GlobalColorsRecord & BaseSystemFields<TExpand>;
export type GlobalShapesResponse<TExpand = unknown> = GlobalShapesRecord & BaseSystemFields<TExpand>;
export type GlobalTypographyResponse<TExpand = unknown> = GlobalTypographyRecord & BaseSystemFields<TExpand>;
export type MediaAssetsResponse<TExpand = unknown> = MediaAssetsRecord & BaseSystemFields<TExpand>;
export type AssetsResponse<TExpand = unknown> = AssetsRecord & BaseSystemFields<TExpand>;
export type AssetFilesResponse<TExpand = unknown> = AssetFilesRecord & BaseSystemFields<TExpand>;
export type PagesResponse<TExpand = unknown> = PagesRecord & BaseSystemFields<TExpand>;
export type ContainersResponse<TExpand = unknown> = ContainersRecord & BaseSystemFields<TExpand>;
export type ColumnsResponse<TExpand = unknown> = ColumnsRecord & BaseSystemFields<TExpand>;
export type ModulesResponse<TExpand = unknown> = ModulesRecord & BaseSystemFields<TExpand>;

// -----------------------------------------------------------------------------
// Collections Enum & Map
// -----------------------------------------------------------------------------

export enum Collections {
  Users = "users",
  Brands = "brands",
  TeamMembers = "teamMembers",
  AgencyDefaults = "agencyDefaults",
  PageTemplates = "pageTemplates",
  GlobalColors = "globalColors",
  GlobalShapes = "globalShapes",
  GlobalTypography = "globalTypography",
  MediaAssets = "mediaAssets",
  Assets = "assets",
  AssetFiles = "assetFiles",
  Pages = "pages",
  Containers = "containers",
  Columns = "columns",
  Modules = "modules",
}

export type Schema = {
  [Collections.Users]: UsersResponse;
  [Collections.Brands]: BrandsResponse;
  [Collections.TeamMembers]: TeamMembersResponse;
  [Collections.AgencyDefaults]: AgencyDefaultsResponse;
  [Collections.PageTemplates]: PageTemplatesResponse;
  [Collections.GlobalColors]: GlobalColorsResponse;
  [Collections.GlobalShapes]: GlobalShapesResponse;
  [Collections.GlobalTypography]: GlobalTypographyResponse;
  [Collections.MediaAssets]: MediaAssetsResponse;
  [Collections.Assets]: AssetsResponse;
  [Collections.AssetFiles]: AssetFilesResponse;
  [Collections.Pages]: PagesResponse;
  [Collections.Containers]: ContainersResponse;
  [Collections.Columns]: ColumnsResponse;
  [Collections.Modules]: ModulesResponse;
};
