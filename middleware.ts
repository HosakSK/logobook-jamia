import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const pathname = url.pathname;

  // 1. Explicit internal manual routing for Dev / Temporary domain without wildcard support:
  // e.g. visiting http://.../m/demo/page -> rewrites internally to /manual/demo/page
  if (pathname.startsWith("/m/")) {
    const parts = pathname.replace(/^\/m\//, "").split("/");
    const domainSlug = parts[0];
    const restPath = parts.slice(1).join("/");
    const targetUrl = new URL(`/manual/${domainSlug}${restPath ? `/${restPath}` : ""}`, req.url);
    targetUrl.search = url.search;
    return NextResponse.rewrite(targetUrl);
  }

  // 2. Query param support for manual testing on temporary domains: ?brand=demo or ?domain=demo
  const queryDomain = url.searchParams.get("domain") || url.searchParams.get("brand");
  if (queryDomain && !pathname.startsWith("/admin") && !pathname.startsWith("/manual")) {
    const targetUrl = new URL(`/manual/${queryDomain}${pathname === "/" ? "" : pathname}`, req.url);
    targetUrl.search = url.search;
    return NextResponse.rewrite(targetUrl);
  }

  // 3. Admin routes: directly served by (admin) route group
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // 4. Subdomain & Custom domain handling:
  // Normalize hostname (strip port if present)
  const hostWithoutPort = hostname.split(":")[0].toLowerCase();

  // Root domains that should serve the marketing site
  const isMarketingHost =
    hostWithoutPort === "logobook.sk" ||
    hostWithoutPort === "www.logobook.sk" ||
    hostWithoutPort === "localhost" ||
    hostWithoutPort.endsWith(".sslip.io"); // temporary Coolify deployment root

  if (isMarketingHost) {
    // Serve marketing routes
    return NextResponse.next();
  }

  // Subdomain on logobook.sk (e.g. acme.logobook.sk)
  if (hostWithoutPort.endsWith(".logobook.sk")) {
    const subdomain = hostWithoutPort.replace(/\.logobook\.sk$/, "");
    if (subdomain && subdomain !== "www") {
      const targetUrl = new URL(`/manual/${subdomain}${pathname}`, req.url);
      targetUrl.search = url.search;
      return NextResponse.rewrite(targetUrl);
    }
  }

  // Subdomain on local dev (e.g. acme.localhost)
  if (hostWithoutPort.endsWith(".localhost")) {
    const subdomain = hostWithoutPort.replace(/\.localhost$/, "");
    if (subdomain && subdomain !== "www") {
      const targetUrl = new URL(`/manual/${subdomain}${pathname}`, req.url);
      targetUrl.search = url.search;
      return NextResponse.rewrite(targetUrl);
    }
  }

  // 5. Custom Domain (e.g. brand.klient.sk):
  // Rewrites to the manual renderer passing the custom domain as the identifier
  const targetUrl = new URL(`/manual/${hostWithoutPort}${pathname}`, req.url);
  targetUrl.search = url.search;
  return NextResponse.rewrite(targetUrl);
}
