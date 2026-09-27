export const MEDIA_TYPES = [
  "IMAGE",
  "ICON",
  "PATTERN",
  "DOCUMENT",
  "VIDEO",
  "EXTERNAL",
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

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
  created: string;
  updated: string;
}

export type MediaFilterType = "ALL" | MediaType;
