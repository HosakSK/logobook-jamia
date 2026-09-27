"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import { BrandTypography, TypographySettings } from "@/lib/types/typography";
import {
  saveTypographySchema,
  sanitizeAdobeProjectId,
  FontSource,
  FontRole,
} from "@/lib/validations/typography";

/**
 * Fetches all global typography records for a given brand project, sorted by order and creation.
 */
export async function getBrandTypographyAction(
  brandId: string
): Promise<{ success: boolean; typography: BrandTypography[]; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, typography: [], error: "Unauthorized" };
    }

    const records = await pb.collection("globalTypography").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "order",
    });

    const typography: BrandTypography[] = records.map((rec: any, idx: number) => {
      let customFontUrl = "";
      if (rec.customFont) {
        customFontUrl = pb.files.getURL(rec, rec.customFont);
      }

      let parsedSettings: TypographySettings = {};
      if (typeof rec.settings === "object" && rec.settings !== null) {
        parsedSettings = rec.settings;
      } else if (typeof rec.settings === "string") {
        try {
          parsedSettings = JSON.parse(rec.settings);
        } catch {
          parsedSettings = {};
        }
      }

      let sampleText = "";
      if (typeof rec.sampleText === "string") {
        sampleText = rec.sampleText;
      } else if (typeof rec.sampleText === "object" && rec.sampleText !== null) {
        sampleText = (rec.sampleText as any).text || "";
      }

      return {
        id: rec.id,
        brand: rec.brand,
        name: rec.name || "",
        role: (rec.role as FontRole) || "BODY",
        fontSource: (rec.fontSource as FontSource) || "GOOGLE_FONTS",
        googleFontFamily: rec.googleFontFamily || "",
        adobeProjectId: rec.adobeProjectId || "",
        fontFamilyName: rec.fontFamilyName || "",
        customFont: rec.customFont || "",
        customFontUrl,
        licenseConfirmed: Boolean(rec.licenseConfirmed),
        licenseAllowsOfflineDistribution: Boolean(rec.licenseAllowsOfflineDistribution),
        settings: parsedSettings,
        sampleText,
        order: typeof rec.order === "number" ? rec.order : idx,
        created: rec.created,
        updated: rec.updated,
      };
    });

    return { success: true, typography };
  } catch (err: any) {
    console.error("Failed to fetch brand typography:", err);
    return {
      success: false,
      typography: [],
      error: err.message || "Nepodarilo sa načítať typografiu značky.",
    };
  }
}

/**
 * Creates or updates a brand typography record in globalTypography.
 */
export async function saveBrandTypographyAction(
  brandId: string,
  typographyId: string | null,
  formData: FormData
): Promise<{ success: boolean; message: string; typographyId?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized. Prihláste sa znova." };
    }

    const name = ((formData.get("name") as string) || "").trim();
    const role = formData.get("role") as FontRole;
    const fontSource = formData.get("fontSource") as FontSource;
    let googleFontFamily = ((formData.get("googleFontFamily") as string) || "").trim();
    let adobeProjectId = ((formData.get("adobeProjectId") as string) || "").trim();
    let fontFamilyName = ((formData.get("fontFamilyName") as string) || "").trim();
    const sampleText = ((formData.get("sampleText") as string) || "").trim();
    const fallback = ((formData.get("fallback") as string) || "sans-serif").trim();

    const licenseConfirmed = formData.get("licenseConfirmed") === "true";
    const licenseAllowsOfflineDistribution = formData.get("licenseAllowsOfflineDistribution") === "true";

    // Parse weights
    const weightsRaw = formData.get("weights") as string;
    let weights: number[] = [400, 700];
    if (weightsRaw) {
      try {
        weights = JSON.parse(weightsRaw);
      } catch {
        // Fallback default
      }
    }

    // Sanitize Adobe Project ID if source is Adobe Fonts
    if (fontSource === "ADOBE_FONTS" && adobeProjectId) {
      adobeProjectId = sanitizeAdobeProjectId(adobeProjectId);
    }

    // If Google Fonts and fontFamilyName not set, set it to googleFontFamily
    if (fontSource === "GOOGLE_FONTS" && googleFontFamily && !fontFamilyName) {
      fontFamilyName = googleFontFamily;
    }

    // Validate using Zod schema
    const parsed = saveTypographySchema.safeParse({
      name,
      role,
      fontSource,
      googleFontFamily,
      adobeProjectId,
      fontFamilyName,
      licenseConfirmed,
      licenseAllowsOfflineDistribution,
      sampleText,
      weights,
      fallback,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Neplatné vstupné údaje";
      return { success: false, message: firstError };
    }

    // Prepare PocketBase payload FormData for file handling
    const pbFormData = new FormData();
    pbFormData.append("brand", brandId);
    pbFormData.append("name", name);
    pbFormData.append("role", role);
    pbFormData.append("fontSource", fontSource);
    pbFormData.append("googleFontFamily", googleFontFamily);
    pbFormData.append("adobeProjectId", adobeProjectId);
    pbFormData.append("fontFamilyName", fontFamilyName);
    pbFormData.append("licenseConfirmed", licenseConfirmed ? "true" : "false");
    pbFormData.append(
      "licenseAllowsOfflineDistribution",
      licenseAllowsOfflineDistribution ? "true" : "false"
    );

    const settings: TypographySettings = {
      weights,
      fallback,
      defaultSize: Number(formData.get("defaultSize")) || 16,
    };
    pbFormData.append("settings", JSON.stringify(settings));
    pbFormData.append("sampleText", JSON.stringify({ text: sampleText }));

    // Handle custom font file upload
    const customFontFile = formData.get("customFont") as File | null;
    if (customFontFile && customFontFile.size > 0) {
      pbFormData.append("customFont", customFontFile);
    } else if (fontSource === "CUSTOM_UPLOAD" && !typographyId) {
      return {
        success: false,
        message: "Pre vlastný font je nutné vybrať súbor písma (.woff2, .woff, .ttf, .otf).",
      };
    }

    let targetId = typographyId;
    if (typographyId) {
      await pb.collection("globalTypography").update(typographyId, pbFormData);
    } else {
      // Find highest order
      const existing = await pb.collection("globalTypography").getFullList({
        filter: `brand = "${brandId}"`,
        sort: "-order",
        perPage: 1,
      });
      const nextOrder = existing.length > 0 ? (existing[0].order || 0) + 1 : 0;
      pbFormData.append("order", String(nextOrder));

      const created = await pb.collection("globalTypography").create(pbFormData);
      targetId = created.id;
    }

    revalidatePath(`/admin/brand/${brandId}/typography`);
    return {
      success: true,
      message: typographyId
        ? "Písmo bolo úspešne upravené."
        : "Nové písmo bolo úspešne pridané do knižnice.",
      typographyId: targetId || undefined,
    };
  } catch (err: any) {
    console.error("Failed to save brand typography:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa uložiť písmo značky.",
    };
  }
}

/**
 * Deletes a typography record from globalTypography.
 */
export async function deleteBrandTypographyAction(
  brandId: string,
  typographyId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    await pb.collection("globalTypography").delete(typographyId);

    revalidatePath(`/admin/brand/${brandId}/typography`);
    return { success: true, message: "Písmo bolo úspešne odstránené z knižnice." };
  } catch (err: any) {
    console.error("Failed to delete brand typography:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa odstrániť písmo.",
    };
  }
}

/**
 * Reorders typography items according to the provided list of IDs.
 */
export async function reorderBrandTypographyAction(
  brandId: string,
  orderedIds: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      try {
        await pb.collection("globalTypography").update(id, { order: i });
      } catch (uErr) {
        console.warn(`Could not update order for typography ${id}:`, uErr);
      }
    }

    revalidatePath(`/admin/brand/${brandId}/typography`);
    return { success: true, message: "Poradie písiem bolo úspešne aktualizované." };
  } catch (err: any) {
    console.error("Failed to reorder typography:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa preusporiadať písma.",
    };
  }
}
