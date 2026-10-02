import { NextRequest, NextResponse } from "next/server";
import {
  verifyLemonWebhookSignature,
  processLemonWebhookPayload,
} from "@/lib/lemon/webhook";
import { LemonWebhookPayload } from "@/lib/lemon/types";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Signature",
    },
  });
}

/**
 * POST /api/webhooks/lemon
 * Webhook receiver for Lemon Squeezy order and subscription events.
 * Secured via HMAC-SHA256 x-signature validation.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") || "";

    const isValid = verifyLemonWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[Lemon Squeezy Webhook] Invalid HMAC-SHA256 signature.");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    let payload: LemonWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as LemonWebhookPayload;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const result = await processLemonWebhookPayload(payload);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error: any) {
    console.error("[Lemon Squeezy Webhook] Exception occurred:", error);
    return NextResponse.json(
      { error: "Internal server error processing webhook" },
      { status: 500 }
    );
  }
}
