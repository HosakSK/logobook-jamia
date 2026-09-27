import {
  AssetBackground,
  AssetFileFormat,
  AssetMedium,
  AssetOrientation,
} from "@/lib/validations/asset";

export interface BrandAssetFile {
  id: string;
  asset: string;
  file: string;
  fileUrl: string;
  fileFormat: AssetFileFormat;
  order?: number;
  created: string;
}

export interface BrandAsset {
  id: string;
  brand: string;
  name: Record<string, string>;
  medium: AssetMedium;
  orientation: AssetOrientation;
  hasClaim: boolean;
  background: AssetBackground;
  svgContent: string;
  preview?: string;
  previewUrl?: string;
  clearanceZone?: Record<string, any>;
  minSize?: Record<string, any>;
  order?: number;
  files: BrandAssetFile[];
  created: string;
  updated: string;
}
