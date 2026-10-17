/**
 * Helper utilities for resolving brand media, icons and favicons
 */

export function resolveBrandFaviconUrl(brand: any, pb?: any): string | null {
  if (!brand) return null;

  // 1. Expand relation (mediaAssets / assets)
  if (brand.expand?.favicon?.file && pb?.files?.getURL) {
    try {
      return pb.files.getURL(brand.expand.favicon, brand.expand.favicon.file);
    } catch {
      // ignore
    }
  }

  // 2. Direct string URL in favicon field
  if (brand.favicon && typeof brand.favicon === "string") {
    if (brand.favicon.startsWith("http://") || brand.favicon.startsWith("https://") || brand.favicon.startsWith("/")) {
      return brand.favicon;
    }
  }

  // 3. description.faviconUrl
  if (typeof brand.description === "object" && brand.description !== null && brand.description.faviconUrl) {
    return brand.description.faviconUrl;
  }

  // 4. publishedConfig.brand.faviconUrl
  if (brand.publishedConfig?.brand?.faviconUrl) {
    return brand.publishedConfig.brand.faviconUrl;
  }

  return null;
}
