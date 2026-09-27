import PocketBase from "pocketbase";

const pbUrl =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  process.env.POCKETBASE_INTERNAL_URL ||
  "http://pocketbase-slkwd3bakl5khufyiyd27tth.89.168.121.252.sslip.io";

/**
 * Returns a new PocketBase instance (suitable for server components / server actions)
 */
export function getPocketBase() {
  return new PocketBase(pbUrl);
}

/**
 * Shared singleton instance for client-side usage
 */
export const pb = new PocketBase(pbUrl);

/**
 * Generates direct URL for files stored in PocketBase collections
 */
export function getFileUrl(collectionNameOrId: string, recordId: string, filename?: string): string {
  if (!filename) return "";
  return `${pbUrl}/api/files/${collectionNameOrId}/${recordId}/${filename}`;
}
