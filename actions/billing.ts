"use server";

import { getServerPocketBase, savePocketBaseCookie } from "@/lib/pocketbase-server";
import { TIER_LIMITS } from "@/lib/validations/brand";
import { STORAGE_LIMITS, UsageStats } from "@/lib/constants/billing";
import { generateLemonCheckoutUrl, isLemonSandbox } from "@/lib/lemon/checkout";
import { LemonPlanId } from "@/lib/lemon/types";
import { sendTierActivatedEmail } from "@/lib/email/resend";

export async function getUsageStatsAction(): Promise<UsageStats> {
  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  if (!user || !pb.authStore.isValid) {
    return {
      tier: "FREE",
      brandsUsed: 0,
      brandsMax: 1,
      storageUsedMb: 0,
      storageMaxMb: 500,
    };
  }

  const userTier = (user.tier as string)?.toUpperCase() || "FREE";
  const brandsMax = TIER_LIMITS[userTier] || 1;
  const storageMaxMb = STORAGE_LIMITS[userTier] || 500;

  let brandsUsed = 0;
  let storageUsedMb = 0;

  try {
    const ownedBrands = await pb.collection("brands").getFullList({
      filter: `user = "${user.id}"`,
      fields: "id",
    });
    brandsUsed = ownedBrands.length;

    if (ownedBrands.length > 0) {
      const brandFilter = ownedBrands.map((b: any) => `brand = "${b.id}"`).join(" || ");
      const mediaAssets = await pb.collection("mediaAssets").getFullList({
        filter: brandFilter,
        fields: "id,file",
      });

      // Approximate storage calculation based on uploaded files (~0.8 MB avg for vectors/favicons)
      storageUsedMb = Number((mediaAssets.length * 0.8).toFixed(1));
    }
  } catch (err) {
    console.error("Failed to query usage stats:", err);
  }

  return {
    tier: userTier,
    brandsUsed,
    brandsMax,
    storageUsedMb,
    storageMaxMb,
  };
}

export async function requestUpgradeAction(
  planId: string,
  billingCycle: "monthly" | "yearly",
  brandId?: string
): Promise<{ success: boolean; message: string; checkoutUrl?: string; isSandbox?: boolean }> {
  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  if (!user || !pb.authStore.isValid) {
    return { success: false, message: "Neautorizovaný prístup. Prihláste sa prosím." };
  }

  const validPlanId = planId.toUpperCase() as LemonPlanId;
  const isSandbox = isLemonSandbox();

  const checkoutUrl = generateLemonCheckoutUrl({
    planId: validPlanId,
    billingCycle,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    brandId,
  });

  return {
    success: true,
    message: `Pripravená platba pre balíček ${planId} (${billingCycle === "yearly" ? "Ročne" : "Mesačne"}).`,
    checkoutUrl,
    isSandbox,
  };
}

/**
 * Developer Sandbox helper: Updates user tier in test/sandbox mode
 * to test feature unlocking without real credit card input.
 */
export async function simulateDevUpgradeAction(
  targetTier: string
): Promise<{ success: boolean; message: string }> {
  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  if (!user || !pb.authStore.isValid) {
    return { success: false, message: "Neautorizovaný prístup. Prihláste sa prosím." };
  }

  const validTier = targetTier.toUpperCase();
  if (!["FREE", "COMPANY", "FREELANCER", "AGENCY", "PLATINUM"].includes(validTier)) {
    return { success: false, message: "Neplatný tier." };
  }

  try {
    await pb.collection("users").update(user.id, {
      tier: validTier,
    });

    // Refresh auth session
    await pb.collection("users").authRefresh();
    await savePocketBaseCookie(pb);

    // Send transactional welcome email
    if (validTier !== "FREE" && user.email) {
      sendTierActivatedEmail({
        toEmail: user.email,
        userName: user.name,
        planName: validTier,
        billingCycle: "monthly",
      }).catch((e) => console.warn("Dev email send error:", e));
    }

    return {
      success: true,
      message: `[Sandbox] Váš účet bol úspešne prepnutý na tier ${validTier}! Všetky funkcie sú odomknuté.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Chyba pri aktualizácii tieru";
    return { success: false, message: msg };
  }
}

