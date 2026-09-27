/**
 * This file was generated based on the PocketBase schema for Logobook.sk
 * Single-Database Tenancy Data Model (02.01)
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

// -----------------------------------------------------------------------------
// Collection Record Definitions
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
  headerLogo?: string;
  favicon?: string;
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
// Response Types
// -----------------------------------------------------------------------------

export type UsersResponse<TExpand = unknown> = UsersRecord & AuthSystemFields<TExpand>;
export type BrandsResponse<TExpand = unknown> = BrandsRecord & BaseSystemFields<TExpand>;
export type TeamMembersResponse<TExpand = unknown> = TeamMembersRecord & BaseSystemFields<TExpand>;
export type AgencyDefaultsResponse<TExpand = unknown> = AgencyDefaultsRecord & BaseSystemFields<TExpand>;
export type PageTemplatesResponse<TExpand = unknown> = PageTemplatesRecord & BaseSystemFields<TExpand>;

// -----------------------------------------------------------------------------
// Collections Enum & Map
// -----------------------------------------------------------------------------

export enum Collections {
  Users = "users",
  Brands = "brands",
  TeamMembers = "teamMembers",
  AgencyDefaults = "agencyDefaults",
  PageTemplates = "pageTemplates",
}

export type Schema = {
  [Collections.Users]: UsersResponse;
  [Collections.Brands]: BrandsResponse;
  [Collections.TeamMembers]: TeamMembersResponse;
  [Collections.AgencyDefaults]: AgencyDefaultsResponse;
  [Collections.PageTemplates]: PageTemplatesResponse;
};
