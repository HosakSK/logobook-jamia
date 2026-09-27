"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { TIER_LIMITS } from "@/lib/validations/brand";
import { STORAGE_LIMITS, UsageStats } from "@/lib/constants/billing";

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
  billingCycle: "monthly" | "yearly"
): Promise<{ success: boolean; message: string; checkoutUrl?: string }> {
  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  if (!user || !pb.authStore.isValid) {
    return { success: false, message: "Unauthorized. Please sign in." };
  }

  // Placeholder checkout url for Lemon Squeezy integration in ticket 21
  const checkoutUrl = `https://checkout.lemonsqueezy.com/buy/placeholder-${planId.toLowerCase()}-${billingCycle}?checkout[email]=${encodeURIComponent(user.email)}`;

  return {
    success: true,
    message: `Prechod na balíček ${planId} (${billingCycle === "yearly" ? "Ročne" : "Mesačne"}) bol zaznamenaný.`,
    checkoutUrl,
  };
}
