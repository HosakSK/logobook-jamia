import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getCachedBrandBySlug, getCachedBrandTokens } from "@/lib/manual/brand-cache";
import { BrandCascadeProvider } from "@/components/modules/cascade";
import { ManualLockScreen } from "@/components/manual/manual-lock-screen";
import { PublicManualShell } from "@/components/manual/public-manual-shell";
import { PublishedBrandSnapshot } from "@/actions/publish";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; locale?: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  try {
    const brandRecord = await getCachedBrandBySlug(domain);

    let favUrl = "";
    if (brandRecord?.publishedConfig?.brand?.faviconUrl) {
      favUrl = brandRecord.publishedConfig.brand.faviconUrl;
    } else if (brandRecord?.expand?.favicon) {
      const f = brandRecord.expand.favicon;
      const pb = await getServerPocketBase();
      favUrl = pb.files.getURL(f, f.file);
    } else if (brandRecord?.favicon && typeof brandRecord.favicon === "string" && brandRecord.favicon.startsWith("http")) {
      favUrl = brandRecord.favicon;
    } else if (typeof brandRecord?.description === "object" && brandRecord.description?.faviconUrl) {
      favUrl = brandRecord.description.faviconUrl;
    }

    if (favUrl) {
      return {
        icons: {
          icon: [{ url: favUrl }],
          shortcut: [{ url: favUrl }],
          apple: [{ url: favUrl }],
        },
      };
    }
  } catch {
    // fallback
  }

  return {};
}

export default async function ManualLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string; locale?: string }>;
}) {
  const { domain, locale } = await params;
  const currentLocale: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const brandRecord = await getCachedBrandBySlug(domain);
  let brandTokens;
  let cssVariables: Record<string, string> = {};
  let headerLogoUrl: string | undefined = undefined;
  let faviconUrl: string | undefined = undefined;

  const brandName = brandRecord?.name || domain;
  const brandSlug = brandRecord?.slug || domain;
  const hideLogobookBadge = brandRecord?.hideLogobookBadge || false;

  // Fast-path: Check publishedConfig first before any extra DB calls
  if (brandRecord?.publishedConfig?.brand?.faviconUrl) {
    faviconUrl = brandRecord.publishedConfig.brand.faviconUrl;
  }
  if (brandRecord?.publishedConfig?.brand?.headerLogoUrl) {
    headerLogoUrl = brandRecord.publishedConfig.brand.headerLogoUrl;
  }

  // Fallback: Resolve favicon URL if not resolved via published fast-path
  if (!faviconUrl && brandRecord) {
    if (brandRecord.expand?.favicon) {
      const fAsset = brandRecord.expand.favicon;
      const pb = await getServerPocketBase();
      faviconUrl = pb.files.getURL(fAsset, fAsset.file);
    } else if (brandRecord.favicon) {
      const fav = brandRecord.favicon;
      if (typeof fav === "string" && (fav.startsWith("http://") || fav.startsWith("https://") || fav.startsWith("/"))) {
        faviconUrl = fav;
      }
    } else if (typeof brandRecord.description === "object" && brandRecord.description?.faviconUrl) {
      faviconUrl = brandRecord.description.faviconUrl;
    }
  }

  // Fallback: Resolve header logo URL if not resolved via published fast-path
  if (!headerLogoUrl && brandRecord) {
    if (brandRecord.expand?.headerLogo) {
      const hlAsset = brandRecord.expand.headerLogo;
      const pb = await getServerPocketBase();
      headerLogoUrl = pb.files.getURL(hlAsset, hlAsset.file);
    } else if (brandRecord.headerLogo) {
      const hl = brandRecord.headerLogo;
      if (typeof hl === "string" && (hl.startsWith("http://") || hl.startsWith("https://") || hl.startsWith("/"))) {
        headerLogoUrl = hl;
      }
    } else if (typeof brandRecord.description === "object" && brandRecord.description?.headerLogoUrl) {
      headerLogoUrl = brandRecord.description.headerLogoUrl;
    }
  }

  if (brandRecord) {
    try {
      const res = await getCachedBrandTokens(brandRecord.id, brandRecord.publishedConfig);
      if (res.success) {
        brandTokens = res.tokens;
        cssVariables = res.cssVariables;
      }
    } catch {
      // cascade fallback
    }
  }

  // ---------------------------------------------------------------------------
  // 17.01 Password Protection Gate
  // ---------------------------------------------------------------------------
  if (brandRecord?.passwordHash && brandRecord.passwordHash.trim() !== "") {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`manual_auth_${brandSlug}`)?.value;

    if (authCookie !== "authorized") {
      // Locked: Render focused Lock Screen inside cascade context (with brand branding)
      return (
        <BrandCascadeProvider
          tokens={brandTokens}
          style={cssVariables as unknown as React.CSSProperties}
          className="min-h-screen bg-background"
        >
          <ManualLockScreen
            brandSlug={brandSlug}
            brandName={brandName}
            headerLogoUrl={headerLogoUrl}
            locale={currentLocale}
          />
        </BrandCascadeProvider>
      );
    }
  }

  // Helper: Sanitize legacy PB URLs (e.g. sslip.io temporary domains)
  const sanitizePbUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.includes("89.168.121.252.sslip.io")) {
      const activePb = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pb.logobook.eu";
      return url.replace(/https?:\/\/[^/]+\.89\.168\.121\.252\.sslip\.io/, activePb);
    }
    return url;
  };

  const publishedConfig = (brandRecord?.publishedConfig || null) as PublishedBrandSnapshot | null;
  const rawFavicon = faviconUrl || (publishedConfig?.brand as any)?.faviconUrl || "/logo/logo-symbol-dark.svg";
  const activeFavicon = sanitizePbUrl(rawFavicon) || "/logo/logo-symbol-dark.svg";

  const rawHeaderLogoUrl = headerLogoUrl || (publishedConfig?.brand as any)?.headerLogoUrl;
  const activeHeaderLogoUrl = sanitizePbUrl(rawHeaderLogoUrl);

  return (
    <BrandCascadeProvider
      tokens={brandTokens}
      style={cssVariables as unknown as React.CSSProperties}
      className="min-h-screen bg-background"
    >
      {activeFavicon && (
        <head>
          <link rel="icon" href={activeFavicon} />
          <link rel="apple-touch-icon" href={activeFavicon} />
        </head>
      )}
      <PublicManualShell
        brand={{
          id: brandRecord?.id || domain,
          name: brandName,
          slug: brandSlug,
          headerLogoUrl: activeHeaderLogoUrl,
          headerLogoHeight: typeof brandRecord?.description === "object" && typeof brandRecord?.description?.headerLogoHeight === "number"
            ? brandRecord.description.headerLogoHeight
            : ((publishedConfig?.brand as any)?.headerLogoHeight ?? 40),
          showHeaderBrandName: typeof brandRecord?.description === "object" && typeof brandRecord?.description?.showHeaderBrandName === "boolean"
            ? brandRecord.description.showHeaderBrandName
            : ((publishedConfig?.brand as any)?.showHeaderBrandName ?? true),
          hideLogobookBadge,
        }}
        snapshot={publishedConfig}
        domain={domain}
        locale={currentLocale}
      >
        {children}
      </PublicManualShell>
    </BrandCascadeProvider>
  );
}
