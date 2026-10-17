import { cache } from "react";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import {
  GlobalShapesRecord,
  GlobalColorsRecord,
  GlobalTypographyRecord,
} from "@/types/pocketbase-types";
import {
  buildBrandCascadeTokens,
  computeBrandCssVariables,
} from "@/lib/utils/cascade";

/**
 * React cache() deduplicates brand lookups across the same server request lifecycle.
 * When generateMetadata, ManualLayout, and LocalizedManualPage/SubPage all request
 * the brand by domain or slug, PocketBase is queried exactly once.
 */
export const getCachedBrandBySlug = cache(async (domainOrSlug: string) => {
  const pb = await getServerPocketBase();
  try {
    const brandRecord = await pb
      .collection("brands")
      .getFirstListItem(
        `slug = "${domainOrSlug}" || customDomain = "${domainOrSlug}" || id = "${domainOrSlug}"`,
        {
          expand: "headerLogo,favicon",
        }
      );
    return brandRecord;
  } catch {
    return null;
  }
});

/**
 * React cache() deduplicates cascade tokens and CSS variables.
 * Executes shapes, colors, and typography queries concurrently via Promise.allSettled.
 */
export const getCachedBrandTokens = cache(
  async (brandId: string, fallbackSnapshot?: any) => {
    try {
      const pb = await getServerPocketBase();

      let targetBrandId = brandId;
      if (brandId.length !== 15) {
        try {
          const b = await pb
            .collection("brands")
            .getFirstListItem(`id = "${brandId}" || slug = "${brandId}"`);
          targetBrandId = b.id;
        } catch {
          // fallback
        }
      }

      // Concurrently query shapes, colors, and typography
      const [shapesResult, colorsResult, typographyResult] = await Promise.allSettled([
        pb
          .collection("globalShapes")
          .getFirstListItem<GlobalShapesRecord>(`brand = "${targetBrandId}"`),
        pb.collection("globalColors").getFullList<GlobalColorsRecord>({
          filter: `brand = "${targetBrandId}"`,
          sort: "order",
        }),
        pb.collection("globalTypography").getFullList<GlobalTypographyRecord>({
          filter: `brand = "${targetBrandId}"`,
          sort: "order",
        }),
      ]);

      let shapes: GlobalShapesRecord | null =
        shapesResult.status === "fulfilled" ? shapesResult.value : null;
      const colors: GlobalColorsRecord[] =
        colorsResult.status === "fulfilled" ? colorsResult.value : [];
      const typography: GlobalTypographyRecord[] =
        typographyResult.status === "fulfilled" ? typographyResult.value : [];

      // Fallback if shapes record is not in database or unauthenticated
      if (!shapes && fallbackSnapshot?.brand?.themeConfig) {
        shapes = {
          themeConfig: fallbackSnapshot.brand.themeConfig,
          manualBgColor: fallbackSnapshot.brand.manualBgColor,
        } as any;
      }

      const tokens = buildBrandCascadeTokens(shapes, colors, typography);
      const cssVariables = computeBrandCssVariables(shapes, colors, typography);

      return {
        success: true,
        tokens,
        cssVariables,
      };
    } catch (err: unknown) {
      return {
        success: false,
        tokens: buildBrandCascadeTokens(null, null, null),
        cssVariables: computeBrandCssVariables(null, null, null),
        error: err instanceof Error ? err.message : "Failed to load brand tokens",
      };
    }
  }
);
