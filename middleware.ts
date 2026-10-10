import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, Locale, isValidLocale } from "@/lib/i18n";
import { extractTenantDomain } from "@/lib/domains";

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

/**
 * Helper to determine locale from path or cookies or query
 */
function resolveLocale(req: NextRequest, pathSegment?: string): { locale: Locale; isFromPath: boolean } {
  // 1. Explicit path segment (e.g. /sk, /cs, /en)
  if (pathSegment && isValidLocale(pathSegment)) {
    return { locale: pathSegment, isFromPath: true };
  }

  // 2. Query param ?locale=...
  const queryLocale = req.nextUrl.searchParams.get("locale");
  if (queryLocale && isValidLocale(queryLocale)) {
    return { locale: queryLocale, isFromPath: false };
  }

  // 3. Cookie NEXT_LOCALE
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return { locale: cookieLocale, isFromPath: false };
  }

  // 4. Default locale (en)
  return { locale: DEFAULT_LOCALE, isFromPath: false };
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const hostname = req.headers.get("host") || "";
  const hostWithoutPort = hostname.split(":")[0].toLowerCase();

  // ---------------------------------------------------------------------------
  // 1. Fast Edge Session Check for /admin
  // ---------------------------------------------------------------------------
  // Helper to test if pb_auth cookie represents an authenticated user
  const pbAuthCookie = req.cookies.get("pb_auth")?.value;
  let isAuthenticated = false;
  if (pbAuthCookie && pbAuthCookie.trim() !== "" && pbAuthCookie !== "{}") {
    try {
      let cookieVal = pbAuthCookie;
      if (cookieVal.startsWith("%")) {
        cookieVal = decodeURIComponent(cookieVal);
      }
      if (cookieVal.startsWith("%")) {
        cookieVal = decodeURIComponent(cookieVal);
      }
      const parsed = JSON.parse(cookieVal);
      if (parsed.token && typeof parsed.token === "string" && parsed.token.length > 10) {
        isAuthenticated = true;
      }
    } catch {
      // Raw token string fallback
      if (pbAuthCookie.length > 20) {
        isAuthenticated = true;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Fast Edge Session Check for /admin
  // ---------------------------------------------------------------------------
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("redirect", pathname + (url.search || ""));
      return NextResponse.redirect(redirectUrl);
    }

    // Authenticated admin user: pass through to (admin) route group
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-admin-authenticated", "true");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Public auth routes: /login, /register, /reset-password, /auth/*
  //    If user is already authenticated, redirect them directly to /admin
  // ---------------------------------------------------------------------------
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname.startsWith("/auth/")
  ) {
    if (isAuthenticated) {
      const targetRedirect = url.searchParams.get("redirect") || "/admin";
      return NextResponse.redirect(new URL(targetRedirect, req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/reset-password" || pathname.startsWith("/reset-password/")) {
    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // 3. Hostname & Subdomain Classification (Dynamic via lib/domains)
  // ---------------------------------------------------------------------------
  const domain = extractTenantDomain(hostWithoutPort);

  // ---------------------------------------------------------------------------
  // 4. Subdomain clean URL handling
  // ---------------------------------------------------------------------------
  if (domain) {
    // If request is for a static asset file with an extension (e.g. /logo/..., .svg, .png, .jpg, .ico, etc.)
    // let Next.js serve it directly from public/
    if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
      return NextResponse.next();
    }

    // Strip optional /m/ prefix if user arrives via old bookmark
    let cleanPath = pathname;
    if (cleanPath.startsWith("/m/")) {
      cleanPath = cleanPath.replace(/^\/m\//, "");
      if (cleanPath.startsWith(`${domain}/`)) {
        cleanPath = cleanPath.slice(domain.length);
      } else if (cleanPath === domain) {
        cleanPath = "/";
      }
    }

    // Rewrite clean paths directly to internal manual
    const pathSegments = cleanPath.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];
    const { locale, isFromPath } = resolveLocale(req, firstSegment);
    const restParts = isFromPath ? pathSegments.slice(1) : pathSegments;
    const restPath = restParts.length > 0 ? `/${restParts.join("/")}` : "";

    const targetUrl = new URL(`/manual/${domain}/${locale}${restPath}`, req.url);
    targetUrl.search = url.search;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-brand-domain", domain);
    requestHeaders.set("x-brand-locale", locale);

    const res = NextResponse.rewrite(targetUrl, {
      request: { headers: requestHeaders },
    });
    res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  // ---------------------------------------------------------------------------
  // 5. Legacy /m/[domain] requested on marketing site -> redirect to subdomain
  // ---------------------------------------------------------------------------
  if (pathname.startsWith("/m/")) {
    const segments = pathname.replace(/^\/m\//, "").split("/").filter(Boolean);
    const targetBrand = segments[0] || "demo";
    const restParts = segments.slice(1);
    const restPath = restParts.length > 0 ? `/${restParts.join("/")}` : "/";

    const hostRoots = (process.env.NEXT_PUBLIC_APP_DOMAIN || "logobook.eu").split(",").map(d => d.trim().toLowerCase());
    const primaryDomain = hostRoots[0] || "logobook.eu";

    if (hostWithoutPort.includes("localhost")) {
      const port = url.port ? `:${url.port}` : "";
      return NextResponse.redirect(new URL(`${url.protocol}//${targetBrand}.localhost${port}${restPath}`, req.url), 307);
    }
    return NextResponse.redirect(new URL(`https://${targetBrand}.${primaryDomain}${restPath}`, req.url), 307);
  }

  // ---------------------------------------------------------------------------
  // 6. Query param domain support: ?domain=acme or ?brand=acme
  // ---------------------------------------------------------------------------
  const queryDomain = url.searchParams.get("domain") || url.searchParams.get("brand");
  if (queryDomain && !pathname.startsWith("/manual")) {
    const pathSegments = pathname.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];
    const { locale, isFromPath } = resolveLocale(req, firstSegment);
    const restParts = isFromPath ? pathSegments.slice(1) : pathSegments;
    const restPath = restParts.length > 0 ? `/${restParts.join("/")}` : "";

    const targetUrl = new URL(`/manual/${queryDomain}/${locale}${restPath}`, req.url);
    targetUrl.search = url.search;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-brand-domain", queryDomain);
    requestHeaders.set("x-brand-locale", locale);

    const res = NextResponse.rewrite(targetUrl, {
      request: { headers: requestHeaders },
    });
    res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  return NextResponse.next();
}
