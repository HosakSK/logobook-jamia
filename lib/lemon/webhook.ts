import crypto from "crypto";
import { getAdminPocketBase } from "@/lib/pocketbase-server";
import { sendTierActivatedEmail } from "@/lib/email/resend";
import { LemonWebhookPayload, LemonPlanId } from "./types";
import { isLemonSandbox } from "./checkout";

/**
 * Validates the HMAC-SHA256 signature from Lemon Squeezy against LEMONSQUEEZY_WEBHOOK_SECRET.
 */
export function verifyLemonWebhookSignature(
  rawBody: string,
  signature: string,
  secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
): boolean {
  if (!secret) {
    if (isLemonSandbox()) {
      console.warn("[Lemon Squeezy Webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set. Allowing in sandbox/dev mode.");
      return true;
    }
    console.error("[Lemon Squeezy Webhook] Missing LEMONSQUEEZY_WEBHOOK_SECRET in production.");
    return false;
  }

  if (!signature) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(digest, signatureBuffer);
  } catch (err) {
    console.error("[Lemon Squeezy Webhook] Signature verification failed:", err);
    return false;
  }
}

/**
 * Resolves the plan tier from custom data or product/variant strings.
 */
function resolvePlanId(payload: LemonWebhookPayload): LemonPlanId {
  const custom = payload.meta?.custom_data;
  const rawPlan = (custom?.plan_id || custom?.planId || "").toUpperCase();

  if (["COMPANY", "FREELANCER", "AGENCY", "PLATINUM"].includes(rawPlan)) {
    return rawPlan as LemonPlanId;
  }

  const attrs = payload.data?.attributes;
  const productString = `${attrs?.product_name || ""} ${attrs?.variant_name || ""}`.toUpperCase();

  if (productString.includes("PLATINUM")) return "PLATINUM";
  if (productString.includes("AGENCY")) return "AGENCY";
  if (productString.includes("FREELANCER")) return "FREELANCER";
  if (productString.includes("COMPANY")) return "COMPANY";

  return "FREELANCER"; // Default sensible fallback
}

/**
 * Processes incoming verified Lemon Squeezy webhook events.
 */
export async function processLemonWebhookPayload(payload: LemonWebhookPayload): Promise<{
  success: boolean;
  message: string;
  tierUpdated?: string;
}> {
  const eventName = payload.meta?.event_name;
  const custom = payload.meta?.custom_data;
  const attrs = payload.data?.attributes;

  if (!eventName) {
    return { success: false, message: "Missing event_name in payload meta." };
  }

  console.log(`[Lemon Squeezy Webhook] Received event: ${eventName} for customer ${attrs?.user_email || "unknown"}`);

  const pb = await getAdminPocketBase();

  // Find target user by ID from custom_data, or by customer email
  let userRecord: any = null;
  const targetUserId = custom?.user_id || custom?.userId;
  const targetEmail = attrs?.user_email;

  if (targetUserId) {
    try {
      userRecord = await pb.collection("users").getOne(targetUserId);
    } catch {
      // User id not found in PB
    }
  }

  if (!userRecord && targetEmail) {
    try {
      userRecord = await pb.collection("users").getFirstListItem(`email = "${targetEmail}"`);
    } catch {
      // Email not found in PB
    }
  }

  if (!userRecord) {
    console.warn(`[Lemon Squeezy Webhook] Target user not found (userId: ${targetUserId}, email: ${targetEmail}).`);
    return {
      success: false,
      message: `User not found for userId: ${targetUserId} / email: ${targetEmail}`,
    };
  }

  const customerId = attrs?.customer_id ? String(attrs.customer_id) : undefined;
  const subId = payload.data?.id ? String(payload.data.id) : undefined;

  // Handle Subscription / Order Activations
  if (
    eventName === "order_created" ||
    eventName === "subscription_created" ||
    eventName === "subscription_updated" ||
    eventName === "subscription_resumed" ||
    eventName === "subscription_unpaused"
  ) {
    const status = (attrs?.status || "active").toLowerCase();

    // If subscription is active, trialing or paid
    if (status === "active" || status === "on_trial" || status === "paid" || eventName === "order_created") {
      const planId = resolvePlanId(payload);
      const billingCycle = (custom?.billing_cycle || custom?.billingCycle || "monthly") as "monthly" | "yearly";

      await pb.collection("users").update(userRecord.id, {
        tier: planId,
        lemonCustomerId: customerId || userRecord.lemonCustomerId,
        lemonSubId: subId || userRecord.lemonSubId,
      });

      console.log(`[Lemon Squeezy Webhook] Successfully upgraded user ${userRecord.email} to ${planId}`);

      // Send transactional onboarding email via Resend
      if (userRecord.email) {
        sendTierActivatedEmail({
          toEmail: userRecord.email,
          userName: userRecord.name || attrs?.user_name,
          planName: planId,
          billingCycle,
        }).catch((err) => {
          console.error("[Lemon Squeezy Webhook] Error sending welcome email:", err);
        });
      }

      return {
        success: true,
        message: `User ${userRecord.email} upgraded to tier ${planId}.`,
        tierUpdated: planId,
      };
    }
  }

  // Handle Cancellations / Expirations
  if (eventName === "subscription_expired" || eventName === "subscription_cancelled") {
    // Only downgrade if the subscription has actually reached its end
    const status = (attrs?.status || "").toLowerCase();
    if (status === "expired" || eventName === "subscription_expired") {
      await pb.collection("users").update(userRecord.id, {
        tier: "FREE",
      });

      console.log(`[Lemon Squeezy Webhook] User ${userRecord.email} downgraded to FREE (subscription expired).`);

      return {
        success: true,
        message: `User ${userRecord.email} downgraded to FREE.`,
        tierUpdated: "FREE",
      };
    }
  }

  return {
    success: true,
    message: `Event ${eventName} received and logged. No tier change required.`,
  };
}
