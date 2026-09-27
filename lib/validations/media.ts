import { z } from "zod";
import { MEDIA_TYPES } from "@/lib/types/media";

export { MEDIA_TYPES };

export const updateMediaMetadataSchema = z.object({
  fileName: z.string().min(1, { message: "Názov súboru je povinný" }),
  fileType: z.enum(MEDIA_TYPES, { message: "Neplatný typ média" }),
  altText: z.string().optional().default(""),
  externalUrl: z.string().url({ message: "Neplatná URL adresa" }).optional().or(z.literal("")),
});

export const createExternalMediaSchema = z.object({
  fileName: z.string().min(1, { message: "Názov odkazu je povinný" }),
  externalUrl: z
    .string()
    .url({ message: "Zadajte platnú URL adresu (napr. Google Drive, Dropbox, Figma)" })
    .min(1, { message: "URL adresa je povinná" }),
  fileType: z.enum(MEDIA_TYPES).default("EXTERNAL"),
  altText: z.string().optional().default(""),
});

export type UpdateMediaMetadataInput = z.infer<typeof updateMediaMetadataSchema>;
export type CreateExternalMediaInput = z.infer<typeof createExternalMediaSchema>;

/**
 * Automatically detects the MediaType from file extension and mime type.
 */
export function detectMediaType(fileName: string, mimeType?: string): (typeof MEDIA_TYPES)[number] {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";

  if (["svg", "ico"].includes(ext) || mime.includes("svg")) {
    return "ICON";
  }

  if (
    ["jpg", "jpeg", "png", "webp", "avif", "gif", "bmp"].includes(ext) ||
    mime.startsWith("image/")
  ) {
    return "IMAGE";
  }

  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext) || mime.startsWith("video/")) {
    return "VIDEO";
  }

  if (["pat", "pattern"].includes(ext)) {
    return "PATTERN";
  }

  return "DOCUMENT";
}

/**
 * Formats bytes into human-readable size (e.g. 1.2 MB, 450 KB).
 */
export function formatBytes(bytes?: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
