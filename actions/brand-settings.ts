"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { brandGeneralSettingsSchema, globalShapesSchema } from "@/lib/validations/brand-settings";
import { revalidatePath } from "next/cache";

// Helper to check user permission on a brand (accepts either PocketBase record ID or slug)
async function verifyBrandAccess(pb: any, brandIdOrSlug: string, userId: string, requireOwner = false) {
  let brand: any = null;
  try {
    brand = await pb.collection("brands").getOne(brandIdOrSlug);
  } catch {
    try {
      brand = await pb.collection("brands").getFirstListItem(`slug = "${brandIdOrSlug}"`);
    } catch {
      throw new Error("You do not have access to this brand project.");
    }
  }

  const isOwner = brand.user === userId;

  if (requireOwner && !isOwner) {
    throw new Error("Only the project owner can perform this action.");
  }

  if (isOwner) return { brand, role: "OWNER" };

  try {
    const tm = await pb.collection("teamMembers").getFirstListItem(
      `brand = "${brand.id}" && user = "${userId}"`
    );
    if (tm.role === "VIEWER") {
      throw new Error("Viewers do not have editing permissions.");
    }
    return { brand, role: tm.role };
  } catch {
    throw new Error("You do not have access to this brand project.");
  }
}

export async function updateBrandGeneralAction(
  brandId: string,
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session." };
    }

    const { brand } = await verifyBrandAccess(pb, brandId, user.id);
    const userTier = (user.tier as string)?.toUpperCase() || "FREE";

    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      slug: formData.get("slug")?.toString().toLowerCase().trim() || "",
      metaTitle: formData.get("metaTitle")?.toString().trim() || undefined,
      metaDescription: formData.get("metaDescription")?.toString().trim() || undefined,
      customDomain: formData.get("customDomain")?.toString().trim().toLowerCase() || undefined,
      password: formData.get("password")?.toString() || undefined,
      removePassword: formData.get("removePassword") === "true",
      hideLogobookBadge: formData.get("hideLogobookBadge") === "true",
    };

    const parsed = brandGeneralSettingsSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input data" };
    }

    // 1. Tier Enforcement
    if (parsed.data.customDomain && parsed.data.customDomain.length > 0 && userTier === "FREE") {
      return { success: false, error: "Custom domain feature requires Company tier or higher." };
    }

    if (parsed.data.password && parsed.data.password.length > 0 && userTier === "FREE") {
      return { success: false, error: "Password protection requires Company tier or higher." };
    }

    if (parsed.data.hideLogobookBadge && userTier !== "AGENCY" && userTier !== "PLATINUM") {
      return { success: false, error: "Hiding Logobook badge requires Agency or Platinum tier." };
    }

    // 2. Check slug uniqueness if changed
    if (parsed.data.slug !== brand.slug) {
      try {
        const existing = await pb.collection("brands").getFirstListItem(`slug = "${parsed.data.slug}" && id != "${brand.id}"`);
        if (existing) {
          return { success: false, error: "This subdomain slug is already in use by another brand." };
        }
      } catch {
        // Unique slug -> good
      }
    }

    // 3. Prepare payload for brands collection
    const updateData: Record<string, any> = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      customDomain: parsed.data.customDomain || "",
      hideLogobookBadge: parsed.data.hideLogobookBadge || false,
    };

    if (parsed.data.metaTitle || parsed.data.metaDescription) {
      const existingDesc = brand.description || {};
      updateData.description = {
        ...existingDesc,
        metaTitle: parsed.data.metaTitle || "",
        metaDescription: parsed.data.metaDescription || "",
      };
    }

    if (parsed.data.removePassword) {
      updateData.passwordHash = "";
    } else if (parsed.data.password && parsed.data.password.trim().length > 0) {
      updateData.passwordHash = parsed.data.password.trim();
    }

    await pb.collection("brands").update(brand.id, updateData);

    revalidatePath(`/admin/brand/${brand.id}`);
    revalidatePath(`/admin/brand/${brand.slug}`);
    revalidatePath(`/admin/brand/${brand.id}/settings`);
    revalidatePath(`/admin/brand/${brand.slug}/settings`);
    revalidatePath("/admin");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update brand general settings:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update brand settings",
    };
  }
}

export async function uploadBrandFaviconAction(
  brandId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; faviconUrl?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session." };
    }

    const { brand } = await verifyBrandAccess(pb, brandId, user.id);

    const faviconFile = formData.get("favicon") as File | null;
    if (!faviconFile || faviconFile.size === 0) {
      return { success: false, error: "No favicon file provided" };
    }

    if (faviconFile.size > 2 * 1024 * 1024) {
      return { success: false, error: "Favicon must be less than 2 MB" };
    }

    // Upload to mediaAssets collection
    const assetPayload = new FormData();
    assetPayload.set("brand", brand.id);
    assetPayload.set("name", "Favicon");
    assetPayload.set("type", "ICON");
    assetPayload.set("file", faviconFile);

    const mediaAsset = await pb.collection("mediaAssets").create(assetPayload);

    // Link in brands collection
    await pb.collection("brands").update(brand.id, {
      favicon: mediaAsset.id,
    });

    revalidatePath(`/admin/brand/${brand.id}/settings`);
    revalidatePath(`/admin/brand/${brand.slug}/settings`);
    return {
      success: true,
      faviconUrl: pb.files.getURL(mediaAsset, mediaAsset.file),
    };
  } catch (err: unknown) {
    console.error("Failed to upload favicon:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload favicon",
    };
  }
}

export async function updateGlobalShapesAction(
  brandId: string,
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session." };
    }

    const { brand } = await verifyBrandAccess(pb, brandId, user.id);

    const rawData = {
      radiusMode: formData.get("radiusMode")?.toString() || "rounded",
      customRadiusPx: formData.get("customRadiusPx")?.toString() || "3",
      borderWidthPx: formData.get("borderWidthPx")?.toString() || "1",
      semanticSuccess: formData.get("semanticSuccess")?.toString().trim() || undefined,
      semanticWarning: formData.get("semanticWarning")?.toString().trim() || undefined,
      semanticDanger: formData.get("semanticDanger")?.toString().trim() || undefined,
      semanticInfo: formData.get("semanticInfo")?.toString().trim() || undefined,
      manualBgColor: formData.get("manualBgColor")?.toString().trim() || undefined,
      themeConfig: formData.get("themeConfig")?.toString().trim() || undefined,
    };

    const parsed = globalShapesSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid global shapes input" };
    }

    const pbRadiusMode =
      parsed.data.radiusMode === "sharp"
        ? "SQUARE"
        : parsed.data.radiusMode === "pill"
        ? "PILL"
        : "ROUNDED";

    let parsedThemeConfig: any = null;
    if (parsed.data.themeConfig) {
      try {
        parsedThemeConfig = JSON.parse(parsed.data.themeConfig);
      } catch {
        parsedThemeConfig = null;
      }
    }

    const payload: Record<string, any> = {
      brand: brand.id,
      radiusMode: pbRadiusMode,
      customRadiusPx: parsed.data.customRadiusPx,
      borderWidthPx: parsed.data.borderWidthPx,
      semanticSuccess: parsed.data.semanticSuccess || "",
      semanticWarning: parsed.data.semanticWarning || "",
      semanticDanger: parsed.data.semanticDanger || "",
      semanticInfo: parsed.data.semanticInfo || "",
      manualBgColor: parsed.data.manualBgColor || "#0e161d",
    };

    if (parsedThemeConfig) {
      payload.themeConfig = parsedThemeConfig;
    }

    // Check if globalShapes record exists for this brand (using real brand.id)
    let existingRecordId: string | null = null;
    try {
      const existing = await pb.collection("globalShapes").getFirstListItem(`brand = "${brand.id}"`);
      if (existing) existingRecordId = existing.id;
    } catch {
      // not found -> create
    }

    if (existingRecordId) {
      await pb.collection("globalShapes").update(existingRecordId, payload);
    } else {
      await pb.collection("globalShapes").create(payload);
    }

    revalidatePath(`/admin/brand/${brand.id}`);
    revalidatePath(`/admin/brand/${brand.slug}`);
    revalidatePath(`/admin/brand/${brand.id}/settings`);
    revalidatePath(`/admin/brand/${brand.slug}/settings`);
    revalidatePath(`/manual/${brand.slug}`);
    revalidatePath(`/m/${brand.slug}`);

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update global shapes:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update visual shapes",
    };
  }
}

export async function deleteBrandAction(
  brandId: string,
  confirmName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session." };
    }

    // Require OWNER to delete
    const { brand } = await verifyBrandAccess(pb, brandId, user.id, true);

    if (confirmName.trim() !== brand.name.trim()) {
      return { success: false, error: "Confirmation name does not match brand name." };
    }

    await pb.collection("brands").delete(brand.id);

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to delete brand:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete brand",
    };
  }
}
