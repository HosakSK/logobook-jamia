"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { BrandCascadeTokens } from "@/lib/types/module";
import {
  buildBrandCascadeTokens,
  computeBrandCssVariables,
} from "@/lib/utils/cascade";
import {
  GlobalShapesRecord,
  GlobalColorsRecord,
  GlobalTypographyRecord,
} from "@/types/pocketbase-types";

/**
 * Server action to fetch and compute Level 1 Brand Tokens for a given brand project.
 * Usable by both Admin PageBuilder and public manual layout renderer.
 */
export async function getBrandCascadeTokensAction(brandId: string): Promise<{
  success: boolean;
  tokens: BrandCascadeTokens;
  cssVariables: Record<string, string>;
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();

    let shapes: GlobalShapesRecord | null = null;
    let colors: GlobalColorsRecord[] = [];
    let typography: GlobalTypographyRecord[] = [];

    // 1. Fetch global shapes
    try {
      shapes = await pb
        .collection("globalShapes")
        .getFirstListItem<GlobalShapesRecord>(`brand = "${brandId}"`);
    } catch {
      // Shapes record not yet created -> defaults apply
    }

    // 2. Fetch global colors
    try {
      colors = await pb.collection("globalColors").getFullList<GlobalColorsRecord>({
        filter: `brand = "${brandId}"`,
        sort: "order",
      });
    } catch {
      // Colors empty -> defaults apply
    }

    // 3. Fetch global typography
    try {
      typography = await pb
        .collection("globalTypography")
        .getFullList<GlobalTypographyRecord>({
          filter: `brand = "${brandId}"`,
          sort: "order",
        });
    } catch {
      // Typography empty -> defaults apply
    }

    const tokens = buildBrandCascadeTokens(shapes, colors, typography);
    const cssVariables = computeBrandCssVariables(shapes, colors, typography);

    return {
      success: true,
      tokens,
      cssVariables,
    };
  } catch (err: unknown) {
    console.error("Failed to load brand cascade tokens:", err);
    return {
      success: false,
      tokens: buildBrandCascadeTokens(null, null, null),
      cssVariables: computeBrandCssVariables(null, null, null),
      error: err instanceof Error ? err.message : "Failed to load brand tokens",
    };
  }
}
