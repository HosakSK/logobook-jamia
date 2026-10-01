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

  try {
    brandRecord = await pb
      .collection("brands")
      .getFirstListItem(`slug = "${domain}" || customDomain = "${domain}" || id = "${domain}"`);
  } catch {
    // Brand record not matched directly by slug
  }

  const brandName = brandRecord?.name || domain;
  const brandSlug = brandRecord?.slug || domain;
  const hideLogobookBadge = brandRecord?.hideLogobookBadge || false;

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
            locale={currentLocale}
          />
        </BrandCascadeProvider>
      );
    }
  }

  const publishedConfig = (brandRecord?.publishedConfig || null) as PublishedBrandSnapshot | null;

  return (
    <BrandCascadeProvider
      tokens={brandTokens}
      style={cssVariables as unknown as React.CSSProperties}
      className="min-h-screen bg-background"
    >
      <PublicManualShell
        brand={{
          id: brandRecord?.id || domain,
          name: brandName,
          slug: brandSlug,
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
