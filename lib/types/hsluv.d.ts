declare module "hsluv" {
  export class Hsluv {
    hex: string;
    rgb_r: number;
    rgb_g: number;
    rgb_b: number;
    xyz_x: number;
    xyz_y: number;
    xyz_z: number;
    luv_l: number;
    luv_u: number;
    luv_v: number;
    lch_l: number;
    lch_c: number;
    lch_h: number;
    hsluv_h: number;
    hsluv_s: number;
    hsluv_l: number;
    hpluv_h: number;
    hpluv_p: number;
    hpluv_l: number;

    rgbToHex(): void;
    hexToRgb(): void;
    xyzToRgb(): void;
    rgbToXyz(): void;
    xyzToLuv(): void;
    luvToXyz(): void;
    luvToLch(): void;
    lchToLuv(): void;
    hsluvToLch(): void;
    lchToHsluv(): void;
    hsluvToHex(): void;
    hexToHsluv(): void;
    rgbToHsluv(): void;
    hsluvToRgb(): void;
  }
}
