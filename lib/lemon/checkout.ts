import { LemonPlanId, LemonBillingCycle } from "./types";

export interface GenerateCheckoutUrlInput {
  planId: LemonPlanId;
  billingCycle: LemonBillingCycle;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  brandId?: string;
  redirectUrl?: string;
}

export function isLemonSandbox(): boolean {
  return (
    process.env.LEMONSQUEEZY_SANDBOX === "true" ||
    process.env.NODE_ENV !== "production"
  );
}

/**
 * Returns the configured Lemon Squeezy Variant ID for a plan and billing cycle.
 */
export function getLemonVariantId(planId: LemonPlanId, billingCycle: LemonBillingCycle): string | null {
  const envKey = `LEMONSQUEEZY_VARIANT_${planId.toUpperCase()}_${billingCycle.toUpperCase()}`;
  return process.env[envKey] || null;
}

/**
 * Generates an embedded Lemon.js checkout URL with custom tracking data.
 */
export function generateLemonCheckoutUrl(input: GenerateCheckoutUrlInput): string {
  const { planId, billingCycle, user, brandId, redirectUrl } = input;
  const storeSlug = process.env.LEMONSQUEEZY_STORE_SLUG || "logobook";
  const variantId = getLemonVariantId(planId, billingCycle);

  // If a real variant ID is provided, use standard Lemon Squeezy checkout link
  const baseUrl = variantId
    ? `https://${storeSlug}.lemonsqueezy.com/buy/${variantId}`
    : `https://${storeSlug}.lemonsqueezy.com/buy/${planId.toLowerCase()}-${billingCycle}`;

  const params = new URLSearchParams();

  // Prefill customer details
  if (user.email) {
    params.set("checkout[email]", user.email);
  }
  if (user.name) {
    params.set("checkout[name]", user.name);
  }

  // Pack custom_data for webhook extraction
  params.set("checkout[custom][user_id]", user.id);
  params.set("checkout[custom][plan_id]", planId);
  params.set("checkout[custom][billing_cycle]", billingCycle);
  if (brandId) {
    params.set("checkout[custom][brand_id]", brandId);
  }

  // Overlay embed mode
  params.set("embed", "1");
  params.set("media", "0");
  params.set("logo", "1");
  params.set("desc", "1");
  params.set("discount", "0");

  if (isLemonSandbox()) {
    params.set("test", "1");
  }

  if (redirectUrl) {
    params.set("checkout[success_url]", redirectUrl);
  }

  return `${baseUrl}?${params.toString()}`;
}
