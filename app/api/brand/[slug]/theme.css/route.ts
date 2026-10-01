import { NextRequest, NextResponse } from "next/server";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { generateBrandCssTheme } from "@/lib/tokens/generator";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * GET /api/brand/[slug]/theme.css
 * Public CSS stylesheet containing :root custom properties for brand colors,
 * typography, and shapes.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return new NextResponse("/* 400: Missing brand slug parameter */", {
        status: 400,
        headers: { "Content-Type": "text/css; charset=utf-8" },
      });
    }

    const pb = await getServerPocketBase();
    let brandRecord: any = null;

    try {
      brandRecord = await pb
        .collection("brands")
        .getFirstListItem(`slug = "${slug}" || customDomain = "${slug}" || id = "${slug}"`);
    } catch {
      // Not found
    }

    if (!brandRecord) {
      return new NextResponse(`/* 404: Brand '${slug}' not found */`, {
        status: 404,
        headers: { "Content-Type": "text/css; charset=utf-8" },
      });
    }

    const snapshot = brandRecord.publishedConfig as PublishedBrandSnapshot | null;
    if (!snapshot || !snapshot.brand) {
      return new NextResponse(
        `/* 404: Brand '${brandRecord.name || slug}' has not published any manual version yet. */`,
        {
          status: 404,
          headers: { "Content-Type": "text/css; charset=utf-8" },
        }
      );
    }

    // Fetch Level 1 Cascade Tokens (or use defaults)
    let cascadeTokens = null;
    try {
      const cascadeRes = await getBrandCascadeTokensAction(brandRecord.id);
      if (cascadeRes.success) {
        cascadeTokens = cascadeRes.tokens;
      }
    } catch {
      // Fallback to internal token generation
    }

    const cssContent = generateBrandCssTheme({
      snapshot,
      cascadeTokens,
    });

    return new NextResponse(cssContent, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate theme.css:", error);
    return new NextResponse(`/* 500: Failed to generate CSS theme */`, {
      status: 500,
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  }
}
