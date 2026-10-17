/**
 * Helper utilities for resolving brand media, icons and favicons
 */

/**
 * Normalizes any PocketBase URL (internal Docker, localhost, legacy sslip.io) to the public accessible URL
 */
export function toPublicPbUrl(url?: string | null): string {
  if (!url) return "";
  const publicBase = (process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pb.logobook.eu").replace(/\/$/, "");

  // If already clean public URL
  if (url.startsWith("https://pb.logobook.eu") || (process.env.NEXT_PUBLIC_POCKETBASE_URL && url.startsWith(process.env.NEXT_PUBLIC_POCKETBASE_URL))) {
    return url;
  }

  // Replace internal docker names (http://pocketbase:8080, etc.)
  if (url.includes("://pocketbase:") || url.includes("://localhost:") || url.includes("://127.0.0.1:")) {
    return url.replace(/^https?:\/\/[^/]+/, publicBase);
  }

  // Replace legacy sslip.io temporary domains
  if (url.includes("89.168.121.252.sslip.io")) {
    return url.replace(/^https?:\/\/[^/]+\.89\.168\.121\.252\.sslip\.io/, publicBase);
  }

  // If relative path starting with /api/files/
  if (url.startsWith("/api/files/")) {
    return `${publicBase}${url}`;
  }

  return url;
}

export function resolveBrandFaviconUrl(brand: any, pb?: any): string | null {
  if (!brand) return null;

  let rawUrl: string | null = null;
  const publicBase = (process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pb.logobook.eu").replace(/\/$/, "");

  // 1. Expand relation (mediaAssets / assets)
  if (brand.expand?.favicon?.file) {
    const fAsset = brand.expand.favicon;
    const collection = fAsset.collectionId || fAsset.collectionName || "mediaAssets";
    rawUrl = `${publicBase}/api/files/${collection}/${fAsset.id}/${fAsset.file}`;
  } else if (brand.favicon && typeof brand.favicon === "string") {
    // 2. Direct string URL in favicon field
    if (brand.favicon.startsWith("http://") || brand.favicon.startsWith("https://") || brand.favicon.startsWith("/")) {
      rawUrl = brand.favicon;
    }
  } else if (typeof brand.description === "object" && brand.description !== null && brand.description.faviconUrl) {
    // 3. description.faviconUrl
    rawUrl = brand.description.faviconUrl;
  } else if (brand.publishedConfig?.brand?.faviconUrl) {
    // 4. publishedConfig.brand.faviconUrl
    rawUrl = brand.publishedConfig.brand.faviconUrl;
  }

  return rawUrl ? toPublicPbUrl(rawUrl) : null;
}
