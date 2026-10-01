import { NextRequest, NextResponse } from "next/server";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { generateBrandAiContext } from "@/lib/export/ai-context-generator";

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
 * GET /api/brand/[slug]/ai.md
 * Markdown endpoint for AI agents, Cursor, and ChatGPT.
 * Identical content to llms.txt, formatted as markdown.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return new NextResponse("Error: Missing brand slug parameter", {
        status: 400,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
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
      return new NextResponse(`Error: Brand '${slug}' not found`, {
        status: 404,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }

    const snapshot = brandRecord.publishedConfig as PublishedBrandSnapshot | null;
    if (!snapshot || !snapshot.brand) {
      return new NextResponse(
        `Error: Brand '${brandRecord.name || slug}' has not published any manual version yet.`,
        {
          status: 404,
          headers: { "Content-Type": "text/markdown; charset=utf-8" },
        }
      );
    }

    // Resolve appBaseUrl from request
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "logobook.sk";
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.includes("89.168") || host.includes("sslip.io")
        ? "http"
        : "https");
    const appBaseUrl = `${proto}://${host}`;

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

    const aiContextContent = generateBrandAiContext({
      snapshot,
      cascadeTokens,
      appBaseUrl,
    });

    return new NextResponse(aiContextContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate ai.md:", error);
    return new NextResponse(`Error: Failed to generate AI context for brand`, {
      status: 500,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
}
