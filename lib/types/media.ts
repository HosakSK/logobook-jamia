export const MEDIA_TYPES = [
  "IMAGE",
  "ICON",
  "PATTERN",
  "DOCUMENT",
  "VIDEO",
  "EXTERNAL",
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const ICON_SEMANTIC_ROLES = [
  "NONE",
  "SUCCESS",
  "ERROR",
  "WARNING",
  "INFO",
  "DOWNLOAD",
] as const;

export type IconSemanticRole = (typeof ICON_SEMANTIC_ROLES)[number];

export interface IconMetadata {
  semanticRole?: IconSemanticRole;
  isMulticolor?: boolean;
  category?: string;
  tags?: string[];
  svgCode?: string;
}

export interface PatternMetadata {
  isMulticolor?: boolean;
  category?: string;
  tags?: string[];
  svgCode?: string;
}

export interface MediaAsset {
  id: string;
  brand: string;
  file?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileName: string;
  fileType: MediaType;
  altText?: string;
  externalUrl?: string;
  fileSize?: number;
  mimeType?: string;
  order: number;
  semanticRole?: IconSemanticRole;
  isMulticolor?: boolean;
  category?: string;
  created: string;
  updated: string;
}

export type MediaFilterType = "ALL" | MediaType;
