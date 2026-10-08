import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { BrandCascadeProvider } from "@/components/modules/cascade";
import { ManualLockScreen } from "@/components/manual/manual-lock-screen";
import { PublicManualShell } from "@/components/manual/public-manual-shell";
import { PublishedBrandSnapshot } from "@/actions/publish";

export default async function ManualLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string; locale?: string }>;
}) {
  const { domain, locale } = await params;
  const currentLocale: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const pb = await getServerPocketBase();
  let brandRecord: any = null;
  let brandTokens;
  let cssVariables: Record<string, string> = {};
  let headerLogoUrl: string | undefined = undefined;
  let faviconUrl: string | undefined = undefined;

  try {
    brandRecord = await pb
      .collection("brands")
      .getFirstListItem(`slug = "${domain}" || customDomain = "${domain}" || id = "${domain}"`, {
        expand: "headerLogo,favicon",
      });
  } catch {
    // Brand record not matched directly by slug
  }

  const brandName = brandRecord?.name || domain;
  const brandSlug = brandRecord?.slug || domain;
  const hideLogobookBadge = brandRecord?.hideLogobookBadge || false;

  // Resolve favicon URL
  if (brandRecord?.expand?.favicon) {
    const fAsset = brandRecord.expand.favicon;
    faviconUrl = pb.files.getURL(fAsset, fAsset.file);
  } else if (brandRecord?.favicon) {
    const fav = brandRecord.favicon;
    if (typeof fav === "string" && (fav.startsWith("http://") || fav.startsWith("https://") || fav.startsWith("/"))) {
      faviconUrl = fav;
    } else {
      try {
        const mediaRec = await pb.collection("mediaAssets").getOne(fav);
        if (mediaRec && mediaRec.file) {
          faviconUrl = pb.files.getURL(mediaRec, mediaRec.file);
        }
      } catch {
        try {
          const assetRec = await pb.collection("assets").getOne(fav);
          if (assetRec && assetRec.preview) {
            faviconUrl = pb.files.getURL(assetRec, assetRec.preview);
          }
        } catch {
          // not found
        }
      }
    }
  }

  // Resolve header logo URL from expanded relation, mediaAssets, assets, or publishedConfig
  if (brandRecord?.expand?.headerLogo) {
    const hlAsset = brandRecord.expand.headerLogo;
    headerLogoUrl = pb.files.getURL(hlAsset, hlAsset.file);
  } else if (brandRecord?.headerLogo) {
    const hl = brandRecord.headerLogo;
    if (typeof hl === "string" && (hl.startsWith("http://") || hl.startsWith("https://") || hl.startsWith("/"))) {
      headerLogoUrl = hl;
    } else {
      try {
        const mediaRec = await pb.collection("mediaAssets").getOne(hl);
        if (mediaRec && mediaRec.file) {
          headerLogoUrl = pb.files.getURL(mediaRec, mediaRec.file);
        }
      } catch {
        try {
          const assetRec = await pb.collection("assets").getOne(hl);
          if (assetRec && assetRec.preview) {
            headerLogoUrl = pb.files.getURL(assetRec, assetRec.preview);
          }
        } catch {
          // not found
        }
      }
    }
  }

  // Fallback: If no header logo set, look for the first brand asset (logo)
  if (!headerLogoUrl && brandRecord?.id) {
    try {
      const firstAsset = await pb.collection("assets").getFirstListItem(
        `brand = "${brandRecord.id}" && preview != ""`,
        { sort: "order" }
      );
      if (firstAsset && firstAsset.preview) {
        headerLogoUrl = pb.files.getURL(firstAsset, firstAsset.preview);
      }
    } catch {
      // No assets found
    }
  }

  if (brandRecord) {
    try {
      const res = await getBrandCascadeTokensAction(brandRecord.id);
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

  const publishedConfig = (brandRecord?.publishedConfig || null) as PublishedBrandSnapshot | null;
  const activeFavicon = faviconUrl || (publishedConfig?.brand as any)?.faviconUrl || "/logo/logo-symbol-dark.svg";

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
          headerLogoUrl: headerLogoUrl || (publishedConfig?.brand as any)?.headerLogoUrl,
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
