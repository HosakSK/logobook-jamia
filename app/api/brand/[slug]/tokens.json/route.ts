import { NextRequest, NextResponse } from "next/server";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { generateBrandW3cTokens } from "@/lib/tokens/generator";

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
 * GET /api/brand/[slug]/tokens.json
 * Public W3C Design Tokens Community Group (DTCG) specification endpoint.
 * Direct remote source for Figma Tokens Studio, Style Dictionary, and CI/CD pipelines.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Missing brand slug parameter" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
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
      return NextResponse.json(
        { error: `Brand '${slug}' not found` },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const snapshot = brandRecord.publishedConfig as PublishedBrandSnapshot | null;
    if (!snapshot || !snapshot.brand) {
      return NextResponse.json(
        {
          error: `Brand '${brandRecord.name || slug}' has not published any manual version yet.`,
        },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
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
      // Fallback
    }

    const tokens = generateBrandW3cTokens({
      snapshot,
      cascadeTokens,
    });

    return NextResponse.json(tokens, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate tokens.json:", error);
    return NextResponse.json(
      { error: "Failed to generate design tokens" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
