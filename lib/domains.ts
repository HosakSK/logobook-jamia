/**
 * Helper to determine root marketing domains and identify tenant subdomains.
 * Supports configurable root domains via NEXT_PUBLIC_APP_DOMAIN or falls back gracefully.
 */

export function getRootDomains(): string[] {
  const configured = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (configured) {
    return configured
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }
  // Default fallback domains if not set in environment
  return ["logobook.sk", "logobook.eu", "localhost"];
}

/**
 * Checks if the given hostname is the main marketing root (or www).
 */
export function isMarketingHost(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") && !host.includes(".")) {
    return true;
  }
  if (host.endsWith(".sslip.io")) {
    return true;
  }

  const roots = getRootDomains();
  for (const root of roots) {
    if (host === root || host === `www.${root}`) {
      return true;
    }
  }
  return false;
}

/**
 * Extracts subdomain / tenant domain from hostname, or returns empty string for marketing root.
 */
export function extractTenantDomain(hostname: string): string {
  const host = hostname.split(":")[0].toLowerCase();
  if (isMarketingHost(host)) {
    return "";
  }

  const roots = getRootDomains();
  for (const root of roots) {
    if (root === "localhost") {
      if (host.endsWith(".localhost")) {
        const sub = host.slice(0, -".localhost".length);
        if (sub && sub !== "www") return sub;
      }
    } else {
      if (host.endsWith(`.${root}`)) {
        const sub = host.slice(0, -(root.length + 1));
        if (sub && sub !== "www") return sub;
      }
    }
  }

  // Otherwise, it's a completely custom domain (e.g. brand.client.com)
  return host;
}

/**
 * Client-side check if current browser window is on a subdomain or custom domain.
 */
export function isSubdomainOrCustomHost(): boolean {
  if (typeof window === "undefined") return false;
  return !isMarketingHost(window.location.hostname);
}

/**
 * Constructs absolute public URL for a brand manual (e.g. https://demo.logobook.eu).
 * In development (localhost), uses http://demo.localhost:3000 or query param.
 */
export function getBrandPublicUrl(brandSlug: string, customDomain?: string): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : "";

    if (host.includes("localhost") || host === "127.0.0.1") {
      return `${protocol}//${brandSlug}.localhost${port}`;
    }
    
    const roots = getRootDomains();
    for (const root of roots) {
      if (host.endsWith(root)) {
        return `${protocol}//${brandSlug}.${root}${port}`;
      }
    }
  }

  const primaryRoot = getRootDomains()[0] || "logobook.eu";
  if (primaryRoot === "localhost") {
    return `http://${brandSlug}.localhost:3000`;
  }
  return `https://${brandSlug}.${primaryRoot}`;
}
