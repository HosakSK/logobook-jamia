import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, Locale, isValidLocale } from "@/lib/i18n";

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
  if (pathname.startsWith("/admin")) {
    const pbAuthCookie = req.cookies.get("pb_auth")?.value;
    
    // Check if cookie exists and has non-empty token
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
  // ---------------------------------------------------------------------------
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // 3. Dev / Temporary domain path routing: /m/[domain]/[locale?]/...
  //    e.g. /m/jamia or /m/jamia/sk or /m/demo/cs/colors
  // ---------------------------------------------------------------------------
  if (pathname.startsWith("/m/")) {
    const segments = pathname.replace(/^\/m\//, "").split("/").filter(Boolean);
    const domainSlug = segments[0] || "demo";
    const secondSegment = segments[1];

    const { locale, isFromPath } = resolveLocale(req, secondSegment);
    const restParts = isFromPath ? segments.slice(2) : segments.slice(1);
    const restPath = restParts.length > 0 ? `/${restParts.join("/")}` : "";

    const targetUrl = new URL(`/manual/${domainSlug}/${locale}${restPath}`, req.url);
    targetUrl.search = url.search;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-brand-domain", domainSlug);
    requestHeaders.set("x-brand-locale", locale);

    const res = NextResponse.rewrite(targetUrl, {
      request: { headers: requestHeaders },
    });
    res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  // ---------------------------------------------------------------------------
  // 4. Query param domain support: ?domain=acme or ?brand=acme
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

  // ---------------------------------------------------------------------------
  // 5. Hostname & Subdomain Classification
  // ---------------------------------------------------------------------------
  const isMarketingHost =
    hostWithoutPort === "logobook.sk" ||
    hostWithoutPort === "www.logobook.sk" ||
    hostWithoutPort === "localhost" ||
    hostWithoutPort.endsWith(".sslip.io"); // Coolify temp domain root

  if (isMarketingHost) {
    // Marketing site
    return NextResponse.next();
  }

  // Subdomain on logobook.sk (e.g. demo.logobook.sk or brand.logobook.sk)
  let domain = "";
  if (hostWithoutPort.endsWith(".logobook.sk")) {
    const subdomain = hostWithoutPort.replace(/\.logobook\.sk$/, "");
    if (subdomain && subdomain !== "www") {
      domain = subdomain;
    }
  } else if (hostWithoutPort.endsWith(".localhost")) {
    const subdomain = hostWithoutPort.replace(/\.localhost$/, "");
    if (subdomain && subdomain !== "www") {
      domain = subdomain;
    }
  } else {
    // Custom domain (e.g. brand.klient.sk or custom.com)
    domain = hostWithoutPort;
  }

  if (domain) {
    const pathSegments = pathname.split("/").filter(Boolean);
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

  return NextResponse.next();
}
