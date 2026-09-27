"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { createBrandSchema, TIER_LIMITS } from "@/lib/validations/brand";
import { revalidatePath } from "next/cache";

export interface CreateBrandResult {
  success: boolean;
  error?: string;
  brand?: {
    id: string;
    slug: string;
    name: string;
  };
}

export async function createBrandAction(
  _prevState: unknown,
  formData: FormData
): Promise<CreateBrandResult> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;

    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session. Please sign in again." };
    }

    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      slug: formData.get("slug")?.toString().toLowerCase().trim() || "",
      description: formData.get("description")?.toString().trim() || undefined,
    };

    const parsed = createBrandSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input data";
      return { success: false, error: firstError };
    }

    // 1. Check subscription tier limits
    const userTier = (user.tier as string)?.toUpperCase() || "FREE";
    const maxBrands = TIER_LIMITS[userTier] ?? 1;

    const existingOwned = await pb.collection("brands").getList(1, 1, {
      filter: `user = "${user.id}"`,
    });

    if (existingOwned.totalItems >= maxBrands) {
      return {
        success: false,
        error: `Limit reached for ${userTier} tier (${existingOwned.totalItems}/${maxBrands} brands). Please upgrade to create more.`,
      };
    }

    // 2. Check if slug is unique
    try {
      const existingSlug = await pb.collection("brands").getFirstListItem(`slug = "${parsed.data.slug}"`);
      if (existingSlug) {
        return { success: false, error: "This subdomain slug is already taken. Please choose another." };
      }
    } catch {
      // Record not found -> slug is free to use
    }

    // 3. Create brand record in PocketBase
    const createdBrand = await pb.collection("brands").create({
      user: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      status: "DEV",
      defaultLocale: (user.locale as string) || "sk",
      enabledLocales: ["sk", "en", "cs"],
      description: {
        sk: parsed.data.description || "",
        en: parsed.data.description || "",
        cs: parsed.data.description || "",
      },
      publishedConfig: {},
    });

    revalidatePath("/admin");

    return {
      success: true,
      brand: {
        id: createdBrand.id,
        slug: createdBrand.slug,
        name: createdBrand.name,
      },
    };
  } catch (err: unknown) {
    console.error("Error creating brand:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create brand. Please try again.",
    };
  }
}
