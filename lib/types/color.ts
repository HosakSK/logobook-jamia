import { ColorRole } from "@/lib/validations/color";

export interface BrandColor {
  id: string;
  brand: string;
  name: Record<string, string>;
  role: ColorRole;
  hex: string;
  rgb: string;
  cmykC?: number | null;
  cmykM?: number | null;
  cmykY?: number | null;
  cmykK?: number | null;
  pantoneC?: string;
  pantoneU?: string;
  pantoneTCX?: string;
  ral?: string;
  order: number;
  created: string;
  updated: string;
}
