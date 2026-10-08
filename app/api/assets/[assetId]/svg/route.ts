import { NextRequest, NextResponse } from "next/server";
import { getServerPocketBase } from "@/lib/pocketbase-server";

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
 * GET /api/assets/[assetId]/svg
 * Serves the clean, raw vector SVG for any brand asset directly from PocketBase.
 * Provides a lightweight, unpadded, sharp vector endpoint suitable for <img src="...">,
 * favicons, headers, and previews.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await context.params;

    if (!assetId) {
      return new NextResponse("Missing assetId parameter", { status: 400 });
    }

    const pb = await getServerPocketBase();
    let assetRec: any = null;

    try {
      assetRec = await pb.collection("assets").getOne(assetId);
    } catch {
      // Not found by ID
    }

    if (!assetRec) {
      return new NextResponse("Asset not found", { status: 404 });
    }

    // 1. If physical SVG exists in assetFiles, we can stream/redirect or return content
    let svgContent = assetRec.svgContent || "";

    if (!svgContent) {
      // Check if there is an SVG file in assetFiles
      try {
        const svgFileRec = await pb.collection("assetFiles").getFirstListItem(
          `asset = "${assetRec.id}" && fileFormat = "SVG"`
        );
        if (svgFileRec && svgFileRec.file) {
          const fileUrl = pb.files.getURL(svgFileRec, svgFileRec.file);
          const res = await fetch(fileUrl);
          if (res.ok) {
            svgContent = await res.text();
          }
        }
      } catch {
        // no attached SVG
      }
    }

    if (!svgContent) {
      return new NextResponse("No vector SVG content available for this asset", { status: 404 });
    }

    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    console.error("Failed to serve asset SVG:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
