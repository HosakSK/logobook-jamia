"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import { BrandAsset, BrandAssetFile } from "@/lib/types/asset";
import {
  createAssetSchema,
  updateAssetSchema,
  addAssetFileSchema,
  AssetMedium,
  AssetOrientation,
  AssetBackground,
  AssetFileFormat,
} from "@/lib/validations/asset";

/**
 * Fetches all assets for a given brand project with their attached files.
 */
export async function getBrandAssetsAction(
  brandId: string
): Promise<{ success: boolean; assets: BrandAsset[]; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, assets: [], error: "Unauthorized" };
    }

    const assetRecords = await pb.collection("assets").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "order",
    });

    if (assetRecords.length === 0) {
      return { success: true, assets: [] };
    }

    // Query assetFiles for these assets
    const assetIdsFilter = assetRecords.map((a: any) => `asset = "${a.id}"`).join(" || ");
    const fileRecords = await pb.collection("assetFiles").getFullList({
      filter: assetIdsFilter,
      sort: "order",
    });

    // Map files by asset ID
    const filesByAsset: Record<string, BrandAssetFile[]> = {};
    for (const fileRec of fileRecords) {
      const assetId = fileRec.asset;
      if (!filesByAsset[assetId]) {
        filesByAsset[assetId] = [];
      }
      filesByAsset[assetId].push({
        id: fileRec.id,
        asset: fileRec.asset,
        file: fileRec.file,
        fileUrl: pb.files.getURL(fileRec, fileRec.file),
        fileFormat: fileRec.fileFormat as AssetFileFormat,
        order: fileRec.order,
        created: fileRec.created,
      });
    }

    // Assemble BrandAsset list
    const assets: BrandAsset[] = assetRecords.map((rec: any) => {
      let previewUrl = "";
      if (rec.preview) {
        previewUrl = pb.files.getURL(rec, rec.preview);
      }

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

      return {
        id: rec.id,
        brand: rec.brand,
        name: parsedName,
        medium: rec.medium as AssetMedium,
        orientation: rec.orientation as AssetOrientation,
        hasClaim: Boolean(rec.hasClaim),
        background: rec.background as AssetBackground,
        svgContent: rec.svgContent || "",
        preview: rec.preview || "",
        previewUrl,
        clearanceZone: rec.clearanceZone || {},
        minSize: rec.minSize || {},
        order: rec.order || 0,
        files: filesByAsset[rec.id] || [],
        created: rec.created,
        updated: rec.updated,
      };
    });

    return { success: true, assets };
  } catch (err: any) {
    console.error("Failed to fetch brand assets:", err);
    return {
      success: false,
      assets: [],
      error: err.message || "Nepodarilo sa načítať knižnicu lôg.",
    };
  }
}

/**
 * Uploads a new logo asset, saves SVG content, and optionally creates initial SVG file in assetFiles (R2).
 */
export async function uploadBrandAssetAction(
  brandId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; assetId?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized. Prihláste sa znova." };
    }

    const name = (formData.get("name") as string) || "";
    const nameSk = (formData.get("nameSk") as string) || "";
    const nameCs = (formData.get("nameCs") as string) || "";
    const medium = formData.get("medium") as AssetMedium;
    const orientation = formData.get("orientation") as AssetOrientation;
    const hasClaim = formData.get("hasClaim") === "true";
    const background = formData.get("background") as AssetBackground;
    const svgContent = (formData.get("svgContent") as string) || "";

    const parsed = createAssetSchema.safeParse({
      name,
      nameSk,
      nameCs,
      medium,
      orientation,
      hasClaim,
      background,
      svgContent,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Neplatné vstupné údaje";
      return { success: false, message: firstError };
    }

    // Build i18n name object
    const nameObj: Record<string, string> = {
      en: name.trim(),
      sk: (nameSk || name).trim(),
      cs: (nameCs || nameSk || name).trim(),
    };

    // Prepare asset record data
    const assetData = new FormData();
    assetData.append("brand", brandId);
    assetData.append("name", JSON.stringify(nameObj));
    assetData.append("medium", medium);
    assetData.append("orientation", orientation);
    assetData.append("hasClaim", orientation === "SYMBOL" ? "false" : String(hasClaim));
    assetData.append("background", background);
    assetData.append("svgContent", svgContent.trim());

    // Check if thumbnail preview image was generated
    const previewFile = formData.get("previewFile");
    if (previewFile instanceof File && previewFile.size > 0) {
      assetData.append("preview", previewFile);
    }

    const createdAsset = await pb.collection("assets").create(assetData);

    // Save initial SVG file to assetFiles (stored directly on Cloudflare R2)
    const svgFile = formData.get("svgFile");
    if (svgFile instanceof File && svgFile.size > 0) {
      try {
        const fileData = new FormData();
        fileData.append("asset", createdAsset.id);
        fileData.append("fileFormat", "SVG");
        fileData.append("file", svgFile);
        await pb.collection("assetFiles").create(fileData);
      } catch (fileErr) {
        console.error("Failed to store SVG in assetFiles:", fileErr);
      }
    } else if (svgContent) {
      // Create SVG blob from text content if physical file wasn't provided
      try {
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const generatedFile = new File(
          [blob],
          `${name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "logo"}.svg`,
          { type: "image/svg+xml" }
        );
        const fileData = new FormData();
        fileData.append("asset", createdAsset.id);
        fileData.append("fileFormat", "SVG");
        fileData.append("file", generatedFile);
        await pb.collection("assetFiles").create(fileData);
      } catch (blobErr) {
        console.error("Failed to auto-create SVG file in assetFiles:", blobErr);
      }
    }

    revalidatePath(`/admin/brand/${brandId}/logos`);
    return {
      success: true,
      message: `Logo „${name}“ bolo úspešne nahrané a uložené do knižnice.`,
      assetId: createdAsset.id,
    };
  } catch (err: any) {
    console.error("Failed to upload brand asset:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa nahrať logo.",
    };
  }
}

/**
 * Updates metadata of an existing logo asset.
 */
export async function updateBrandAssetAction(
  assetId: string,
  brandId: string,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    const name = (formData.get("name") as string) || "";
    const nameSk = (formData.get("nameSk") as string) || "";
    const nameCs = (formData.get("nameCs") as string) || "";
    const medium = formData.get("medium") as AssetMedium;
    const orientation = formData.get("orientation") as AssetOrientation;
    const hasClaim = formData.get("hasClaim") === "true";
    const background = formData.get("background") as AssetBackground;

    const parsed = updateAssetSchema.safeParse({
      name,
      nameSk,
      nameCs,
      medium,
      orientation,
      hasClaim,
      background,
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

    const updatePayload: Record<string, any> = {
      name: nameObj,
      medium,
      orientation,
      hasClaim: orientation === "SYMBOL" ? false : hasClaim,
      background,
    };

    await pb.collection("assets").update(assetId, updatePayload);

    revalidatePath(`/admin/brand/${brandId}/logos`);
    return { success: true, message: "Parametre loga boli úspešne upravené." };
  } catch (err: any) {
    console.error("Failed to update brand asset:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa aktualizovať logo.",
    };
  }
}

/**
 * Deletes an asset and cascades deletion to all attached assetFiles (removing files from Cloudflare R2).
 */
export async function deleteBrandAssetAction(
  assetId: string,
  brandId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    // Query attached files to delete them (PocketBase handles S3 file deletion)
    const attachedFiles = await pb.collection("assetFiles").getFullList({
      filter: `asset = "${assetId}"`,
      fields: "id",
    });

    for (const f of attachedFiles) {
      try {
        await pb.collection("assetFiles").delete(f.id);
      } catch (fErr) {
        console.warn(`Could not delete assetFile ${f.id}:`, fErr);
      }
    }

    await pb.collection("assets").delete(assetId);

    revalidatePath(`/admin/brand/${brandId}/logos`);
    return { success: true, message: "Logo a všetky priradené formáty boli úspešne odstránené." };
  } catch (err: any) {
    console.error("Failed to delete brand asset:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa vymazať logo.",
    };
  }
}

/**
 * Uploads an additional file format (PDF, EPS, AI, PNG, ZIP, etc.) for a specific asset.
 */
export async function uploadAssetFileAction(
  assetId: string,
  brandId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; file?: BrandAssetFile }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    const fileFormat = formData.get("fileFormat") as AssetFileFormat;
    const file = formData.get("file");

    const parsed = addAssetFileSchema.safeParse({ fileFormat });
    if (!parsed.success) {
      return { success: false, message: "Vyberte platný formát súboru." };
    }

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Vyberte platný súbor na nahratie." };
    }

    const fileData = new FormData();
    fileData.append("asset", assetId);
    fileData.append("fileFormat", fileFormat);
    fileData.append("file", file);

    const createdRec = await pb.collection("assetFiles").create(fileData);

    revalidatePath(`/admin/brand/${brandId}/logos`);
    return {
      success: true,
      message: `Formát ${fileFormat} bol úspešne priradený k logu.`,
      file: {
        id: createdRec.id,
        asset: createdRec.asset,
        file: createdRec.file,
        fileUrl: pb.files.getURL(createdRec, createdRec.file),
        fileFormat: createdRec.fileFormat as AssetFileFormat,
        created: createdRec.created,
      },
    };
  } catch (err: any) {
    console.error("Failed to upload asset file:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa nahrať súbor formátu.",
    };
  }
}

/**
 * Deletes a specific file format from assetFiles and Cloudflare R2.
 */
export async function deleteAssetFileAction(
  fileId: string,
  brandId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, message: "Unauthorized" };
    }

    await pb.collection("assetFiles").delete(fileId);

    revalidatePath(`/admin/brand/${brandId}/logos`);
    return { success: true, message: "Súbor formátu bol úspešne vymazaný." };
  } catch (err: any) {
    console.error("Failed to delete asset file:", err);
    return {
      success: false,
      message: err.message || "Nepodarilo sa odstrániť súbor.",
    };
  }
}
