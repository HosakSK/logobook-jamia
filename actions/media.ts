"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import { MediaAsset, MediaType } from "@/lib/types/media";
import {
  detectMediaType,
  updateMediaMetadataSchema,
  createExternalMediaSchema,
} from "@/lib/validations/media";

/**
 * Fetches all media assets for a given brand project, sorted by order.
 */
export async function getBrandMediaAction(
  brandId: string
): Promise<{ success: boolean; media: MediaAsset[]; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, media: [], error: "Unauthorized" };
    }

    const records = await pb.collection("mediaAssets").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "order",
    });

    const media: MediaAsset[] = records.map((rec: any, idx: number) => {
      let fileUrl = "";
      let thumbnailUrl = "";

      if (rec.file) {
        fileUrl = pb.files.getURL(rec, rec.file);
        if (rec.fileType === "IMAGE" || rec.fileType === "ICON" || rec.fileType === "PATTERN") {
          thumbnailUrl = pb.files.getURL(rec, rec.file, { thumb: "300x300" });
        }
      }

      return {
        id: rec.id,
        brand: rec.brand,
        file: rec.file || "",
        fileUrl: fileUrl || rec.externalUrl || "",
        thumbnailUrl: thumbnailUrl || fileUrl || "",
        fileName: rec.fileName || "Bez názvu",
        fileType: (rec.fileType as MediaType) || "DOCUMENT",
        altText: rec.altText || "",
        externalUrl: rec.externalUrl || "",
        fileSize: typeof rec.fileSize === "number" ? rec.fileSize : undefined,
        mimeType: rec.mimeType || "",
        order: typeof rec.order === "number" ? rec.order : idx,
        created: rec.created || "",
        updated: rec.updated || "",
      };
    });

    return { success: true, media };
  } catch (err: any) {
    console.error("Failed to fetch brand media:", err);
    return {
      success: false,
      media: [],
      error: err.message || "Nepodarilo sa načítať mediálne súbory.",
    };
  }
}

/**
 * Uploads a physical file to Cloudflare R2 via PocketBase mediaAssets collection.
 */
export async function uploadMediaAction(
  brandId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; asset?: MediaAsset }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized. Prihláste sa znova." };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, message: "Nebol vybraný žiadny súbor na nahratie." };
    }

    const rawFileName = (formData.get("fileName") as string) || file.name;
    const customType = formData.get("fileType") as MediaType | null;
    const fileType = customType || detectMediaType(rawFileName, file.type);
    const altText = ((formData.get("altText") as string) || "").trim();

    // Query highest order
    const existing = await pb.collection("mediaAssets").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "-order",
      perPage: 1,
    });
    const nextOrder = existing.length > 0 ? (existing[0].order || 0) + 1 : 0;

    const pbFormData = new FormData();
    pbFormData.append("brand", brandId);
    pbFormData.append("file", file);
    pbFormData.append("fileName", rawFileName);
    pbFormData.append("fileType", fileType);
    pbFormData.append("fileSize", String(file.size));
    pbFormData.append("mimeType", file.type || "application/octet-stream");
    pbFormData.append("altText", altText);
    pbFormData.append("order", String(nextOrder));

    const created = await pb.collection("mediaAssets").create(pbFormData);

    const fileUrl = pb.files.getURL(created, created.file);
    const thumbnailUrl =
      created.fileType === "IMAGE" || created.fileType === "ICON" || created.fileType === "PATTERN"
        ? pb.files.getURL(created, created.file, { thumb: "300x300" })
        : fileUrl;

    const asset: MediaAsset = {
      id: created.id,
      brand: created.brand,
      file: created.file,
      fileUrl,
      thumbnailUrl,
      fileName: created.fileName,
      fileType: created.fileType as MediaType,
      altText: created.altText || "",
      fileSize: created.fileSize,
      mimeType: created.mimeType,
      order: created.order,
      created: created.created || "",
      updated: created.updated || "",
    };

    revalidatePath(`/admin/brand/${brandId}/media`);
    return {
      success: true,
      message: `Súbor "${rawFileName}" bol úspešne nahraný.`,
      asset,
    };
  } catch (err: any) {
    console.error("Failed to upload media:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa nahrať súbor. Skontrolujte kvótu úložiska.",
    };
  }
}

/**
 * Creates an external link entry (Google Drive, Dropbox, Figma) without consuming local R2 storage quota.
 */
export async function createExternalMediaAction(
  brandId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; assetId?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized. Prihláste sa znova." };
    }

    const fileName = ((formData.get("fileName") as string) || "").trim();
    const externalUrl = ((formData.get("externalUrl") as string) || "").trim();
    const fileType = (formData.get("fileType") as MediaType) || "EXTERNAL";
    const altText = ((formData.get("altText") as string) || "").trim();

    const parsed = createExternalMediaSchema.safeParse({
      fileName,
      externalUrl,
      fileType,
      altText,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Neplatné vstupné údaje";
      return { success: false, message: firstError };
    }

    // Query highest order
    const existing = await pb.collection("mediaAssets").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "-order",
      perPage: 1,
    });
    const nextOrder = existing.length > 0 ? (existing[0].order || 0) + 1 : 0;

    const payload = {
      brand: brandId,
      fileName,
      externalUrl,
      fileType,
      altText,
      order: nextOrder,
    };

    const created = await pb.collection("mediaAssets").create(payload);

    revalidatePath(`/admin/brand/${brandId}/media`);
    return {
      success: true,
      message: "Externý odkaz bol úspešne pridaný do knižnice.",
      assetId: created.id,
    };
  } catch (err: any) {
    console.error("Failed to create external media:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa pridať externý odkaz.",
    };
  }
}

/**
 * Updates metadata (fileName, altText, fileType, externalUrl) of an existing media item.
 */
export async function updateMediaMetadataAction(
  brandId: string,
  assetId: string,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    const fileName = ((formData.get("fileName") as string) || "").trim();
    const fileType = formData.get("fileType") as MediaType;
    const altText = ((formData.get("altText") as string) || "").trim();
    const externalUrl = ((formData.get("externalUrl") as string) || "").trim();

    const parsed = updateMediaMetadataSchema.safeParse({
      fileName,
      fileType,
      altText,
      externalUrl,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Neplatné vstupné údaje";
      return { success: false, message: firstError };
    }

    const payload: Record<string, any> = {
      fileName,
      fileType,
      altText,
    };
    if (externalUrl) {
      payload.externalUrl = externalUrl;
    }

    await pb.collection("mediaAssets").update(assetId, payload);

    revalidatePath(`/admin/brand/${brandId}/media`);
    return { success: true, message: "Metadáta súboru boli úspešne aktualizované." };
  } catch (err: any) {
    console.error("Failed to update media metadata:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa aktualizovať metadáta.",
    };
  }
}

/**
 * Bulk deletes multiple media assets ensuring they belong to the specified brand.
 * PocketBase automatically cleans up S3/R2 files on record deletion.
 */
export async function bulkDeleteMediaAction(
  brandId: string,
  assetIds: string[]
): Promise<{ success: boolean; message: string; deletedCount: number }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized", deletedCount: 0 };
    }

    if (!assetIds || assetIds.length === 0) {
      return { success: false, message: "Neboli vybrané žiadne položky na zmazanie.", deletedCount: 0 };
    }

    let deleted = 0;
    for (const id of assetIds) {
      try {
        const item = await pb.collection("mediaAssets").getOne(id);
        if (item && item.brand === brandId) {
          await pb.collection("mediaAssets").delete(id);
          deleted++;
        }
      } catch (dErr) {
        console.warn(`Could not delete media asset ${id}:`, dErr);
      }
    }

    revalidatePath(`/admin/brand/${brandId}/media`);
    return {
      success: true,
      message: `Úspešne odstránených ${deleted} ${deleted === 1 ? "súbor" : deleted >= 2 && deleted <= 4 ? "súbory" : "súborov"}.`,
      deletedCount: deleted,
    };
  } catch (err: any) {
    console.error("Failed to bulk delete media:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa vymazať vybrané súbory.",
      deletedCount: 0,
    };
  }
}

/**
 * Reorders media items according to the provided list of IDs.
 */
export async function reorderMediaAction(
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
        await pb.collection("mediaAssets").update(id, { order: i });
      } catch (uErr) {
        console.warn(`Could not update order for media ${id}:`, uErr);
      }
    }

    revalidatePath(`/admin/brand/${brandId}/media`);
    return { success: true, message: "Poradie súborov bolo aktualizované." };
  } catch (err: any) {
    console.error("Failed to reorder media:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa preusporiadať súbory.",
    };
  }
}
