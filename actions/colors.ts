"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import { BrandColor } from "@/lib/types/color";
import {
  saveColorSchema,
  bulkImportColorsSchema,
  ColorRole,
  hexColorRegex,
} from "@/lib/validations/color";
import { hexToRgb } from "@/lib/utils/color-calc";

/**
 * Fetches all global colors for a given brand project, sorted by order and creation.
 */
export async function getBrandColorsAction(
  brandId: string
): Promise<{ success: boolean; colors: BrandColor[]; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, colors: [], error: "Unauthorized" };
    }

    const records = await pb.collection("globalColors").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "order",
    });

    const colors: BrandColor[] = records.map((rec: any, idx: number) => {
      let parsedName: Record<string, string> = {};
      if (typeof rec.name === "object" && rec.name !== null) {
        parsedName = rec.name;
      } else if (typeof rec.name === "string") {
        try {
          parsedName = JSON.parse(rec.name);
        } catch {
          parsedName = { en: rec.name, sk: rec.name };
        }
      }

      // Ensure RGB fallback from HEX if not stored
      let rgb = rec.rgb || "";
      if (!rgb && rec.hex) {
        const rgbObj = hexToRgb(rec.hex);
        if (rgbObj) {
          rgb = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;
        }
      }

      return {
        id: rec.id,
        brand: rec.brand,
        name: parsedName,
        role: (rec.role as ColorRole) || "CUSTOM",
        hex: rec.hex?.toUpperCase() || "#000000",
        rgb,
        cmykC: rec.cmykC !== undefined && rec.cmykC !== null ? Number(rec.cmykC) : null,
        cmykM: rec.cmykM !== undefined && rec.cmykM !== null ? Number(rec.cmykM) : null,
        cmykY: rec.cmykY !== undefined && rec.cmykY !== null ? Number(rec.cmykY) : null,
        cmykK: rec.cmykK !== undefined && rec.cmykK !== null ? Number(rec.cmykK) : null,
        pantoneC: rec.pantoneC || "",
        pantoneU: rec.pantoneU || "",
        pantoneTCX: rec.pantoneTCX || "",
        ral: rec.ral || "",
        order: typeof rec.order === "number" ? rec.order : idx,
        created: rec.created,
        updated: rec.updated,
      };
    });

    return { success: true, colors };
  } catch (err: any) {
    console.error("Failed to fetch brand colors:", err);
    return {
      success: false,
      colors: [],
      error: err.message || "Nepodarilo sa načítať farby značky.",
    };
  }
}

/**
 * Creates or updates a brand color record in globalColors.
 */
export async function saveGlobalColorAction(
  brandId: string,
  colorId: string | null,
  formData: FormData
): Promise<{ success: boolean; message: string; colorId?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized. Prihláste sa znova." };
    }

    const name = (formData.get("name") as string) || "";
    const nameSk = (formData.get("nameSk") as string) || "";
    const nameCs = (formData.get("nameCs") as string) || "";
    const role = formData.get("role") as ColorRole;
    let hex = (formData.get("hex") as string)?.trim().toUpperCase() || "";
    if (hex && !hex.startsWith("#")) {
      hex = `#${hex}`;
    }

    let rgb = (formData.get("rgb") as string)?.trim() || "";
    if (!rgb && hex) {
      const parsedRgb = hexToRgb(hex);
      if (parsedRgb) {
        rgb = `${parsedRgb.r}, ${parsedRgb.g}, ${parsedRgb.b}`;
      }
    }

    const cmykCVal = formData.get("cmykC");
    const cmykMVal = formData.get("cmykM");
    const cmykYVal = formData.get("cmykY");
    const cmykKVal = formData.get("cmykK");

    const cmykC = cmykCVal !== null && cmykCVal !== "" ? Number(cmykCVal) : null;
    const cmykM = cmykMVal !== null && cmykMVal !== "" ? Number(cmykMVal) : null;
    const cmykY = cmykYVal !== null && cmykYVal !== "" ? Number(cmykYVal) : null;
    const cmykK = cmykKVal !== null && cmykKVal !== "" ? Number(cmykKVal) : null;

    const pantoneC = (formData.get("pantoneC") as string)?.trim() || "";
    const pantoneU = (formData.get("pantoneU") as string)?.trim() || "";
    const pantoneTCX = (formData.get("pantoneTCX") as string)?.trim() || "";
    const ral = (formData.get("ral") as string)?.trim().toUpperCase() || "";

    const parsed = saveColorSchema.safeParse({
      name,
      nameSk,
      nameCs,
      role,
      hex,
      rgb,
      cmykC,
      cmykM,
      cmykY,
      cmykK,
      pantoneC,
      pantoneU,
      pantoneTCX,
      ral,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Neplatné vstupné údaje";
      return { success: false, message: firstError };
    }

    const nameObj: Record<string, string> = {
      en: name.trim(),
      sk: (nameSk || name).trim(),
      cs: (nameCs || nameSk || name).trim(),
    };

    const payload: Record<string, any> = {
      brand: brandId,
      name: nameObj,
      role,
      hex,
      rgb,
      cmykC,
      cmykM,
      cmykY,
      cmykK,
      pantoneC,
      pantoneU,
      pantoneTCX,
      ral,
    };

    let targetId = colorId;
    if (colorId) {
      await pb.collection("globalColors").update(colorId, payload);
    } else {
      // Find highest order
      const existing = await pb.collection("globalColors").getFullList({
        filter: `brand = "${brandId}"`,
        sort: "-order",
        perPage: 1,
      });
      const nextOrder = existing.length > 0 ? (existing[0].order || 0) + 1 : 0;
      payload.order = nextOrder;

      const created = await pb.collection("globalColors").create(payload);
      targetId = created.id;
    }

    revalidatePath(`/admin/brand/${brandId}/colors`);
    return {
      success: true,
      message: colorId ? "Farba bola úspešne upravená." : "Nová farba bola pridaná do palety.",
      colorId: targetId || undefined,
    };
  } catch (err: any) {
    console.error("Failed to save brand color:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa uložiť farbu.",
    };
  }
}

/**
 * Deletes a color from globalColors.
 */
export async function deleteGlobalColorAction(
  colorId: string,
  brandId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    await pb.collection("globalColors").delete(colorId);

    revalidatePath(`/admin/brand/${brandId}/colors`);
    return { success: true, message: "Farba bola úspešne odstránená z palety." };
  } catch (err: any) {
    console.error("Failed to delete brand color:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa odstrániť farbu.",
    };
  }
}

/**
 * Reorders colors according to the provided list of IDs.
 */
export async function reorderGlobalColorsAction(
  brandId: string,
  orderedColorIds: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    for (let i = 0; i < orderedColorIds.length; i++) {
      const id = orderedColorIds[i];
      try {
        await pb.collection("globalColors").update(id, { order: i });
      } catch (uErr) {
        console.warn(`Could not update order for color ${id}:`, uErr);
      }
    }

    revalidatePath(`/admin/brand/${brandId}/colors`);
    return { success: true, message: "Poradie farieb bolo úspešne aktualizované." };
  } catch (err: any) {
    console.error("Failed to reorder colors:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa preusporiadať farby.",
    };
  }
}

/**
 * Bulk imports colors from a raw text of HEX values (separated by commas, newlines, or spaces).
 */
export async function bulkImportColorsAction(
  brandId: string,
  hexListText: string
): Promise<{ success: boolean; message: string; importedCount?: number }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    const parsed = bulkImportColorsSchema.safeParse({ hexText: hexListText });
    if (!parsed.success) {
      return { success: false, message: "Zadajte aspoň jeden HEX kód." };
    }

    // Extract valid hex codes from text
    const matches = hexListText.match(/#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
    const validHexes: string[] = [];

    for (const m of matches) {
      const formatted = m.startsWith("#") ? m.toUpperCase() : `#${m.toUpperCase()}`;
      if (hexColorRegex.test(formatted) && !validHexes.includes(formatted)) {
        validHexes.push(formatted);
      }
    }

    if (validHexes.length === 0) {
      return { success: false, message: "V zadanom texte sa nenašli žiadne platné HEX farby." };
    }

    // Get current max order
    const existing = await pb.collection("globalColors").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "-order",
      perPage: 1,
    });
    let currentOrder = existing.length > 0 ? (existing[0].order || 0) + 1 : 0;

    let imported = 0;
    for (let i = 0; i < validHexes.length; i++) {
      const hex = validHexes[i];
      const rgbObj = hexToRgb(hex);
      const rgb = rgbObj ? `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}` : "";

      const colorName = `Color ${existing.length + i + 1}`;
      const payload = {
        brand: brandId,
        name: { en: colorName, sk: `Farba ${existing.length + i + 1}` },
        role: "CUSTOM",
        hex,
        rgb,
        order: currentOrder++,
      };

      try {
        await pb.collection("globalColors").create(payload);
        imported++;
      } catch (cErr) {
        console.error("Failed to create bulk color:", cErr);
      }
    }

    revalidatePath(`/admin/brand/${brandId}/colors`);
    return {
      success: true,
      message: `Úspešne bolo naimportovaných ${imported} farieb do palety.`,
      importedCount: imported,
    };
  } catch (err: any) {
    console.error("Failed to bulk import colors:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa naimportovať farby.",
    };
  }
}
