import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { getFileUrl } from "@/lib/pocketbase";
import { BrandGeneralForm } from "@/components/admin/brand-settings/brand-general-form";
import { BrandFaviconForm } from "@/components/admin/brand-settings/brand-favicon-form";
import { BrandHeaderLogoForm } from "@/components/admin/brand-settings/brand-header-logo-form";
import { BrandShapesForm } from "@/components/admin/brand-settings/brand-shapes-form";
import { BrandDangerZone } from "@/components/admin/brand-settings/brand-danger-zone";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft, Users, ArrowRight } from "lucide-react";

export default async function BrandSettingsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  const user = pb.authStore.record;
  const userTier = (user?.tier as string)?.toUpperCase() || "FREE";

  let brand: any = null;
  try {
    brand = await pb.collection("brands").getOne(brandId, { expand: "favicon,headerLogo" });
  } catch {
    try {
      brand = await pb.collection("brands").getFirstListItem(`slug = "${brandId}"`, { expand: "favicon,headerLogo" });
    } catch {
      notFound();
    }
  }

  // Check if current user is owner
  const isOwner = brand.user === user?.id;

  // Resolve Favicon URL
  let faviconUrl: string | null = null;
  if (brand.expand?.favicon) {
    const favAsset = brand.expand.favicon;
    faviconUrl = getFileUrl(favAsset.collectionId || "mediaAssets", favAsset.id, favAsset.file);
  } else if (brand.favicon) {
    if (typeof brand.favicon === "string" && (brand.favicon.startsWith("http://") || brand.favicon.startsWith("https://") || brand.favicon.startsWith("/"))) {
      faviconUrl = brand.favicon;
    } else {
      try {
        const assetRec = await pb.collection("assets").getOne(brand.favicon);
        if (assetRec) {
          faviconUrl = assetRec.svgContent ? `/api/assets/${assetRec.id}/svg` : (assetRec.preview ? getFileUrl("assets", assetRec.id, assetRec.preview) : null);
        }
      } catch {
        // fallback
      }
    }
  }

  // Fallback to description.faviconUrl
  if (!faviconUrl && typeof brand.description === "object" && brand.description?.faviconUrl) {
    faviconUrl = brand.description.faviconUrl;
  }

  // Resolve Header Logo URL
  let headerLogoUrl: string | null = null;
  if (brand.expand?.headerLogo) {
    const hlAsset = brand.expand.headerLogo;
    headerLogoUrl = getFileUrl(hlAsset.collectionId || "mediaAssets", hlAsset.id, hlAsset.file);
  } else if (brand.headerLogo) {
    // Check if brand.headerLogo points to an asset in assets collection or is a URL
    if (typeof brand.headerLogo === "string" && (brand.headerLogo.startsWith("http://") || brand.headerLogo.startsWith("https://") || brand.headerLogo.startsWith("/"))) {
      headerLogoUrl = brand.headerLogo;
    } else {
      try {
        const assetRec = await pb.collection("assets").getOne(brand.headerLogo);
        if (assetRec) {
          headerLogoUrl = assetRec.svgContent ? `/api/assets/${assetRec.id}/svg` : (assetRec.preview ? getFileUrl("assets", assetRec.id, assetRec.preview) : null);
        }
      } catch {
        // fallback
      }
    }
  }

  // Fallback to description.headerLogoUrl
  if (!headerLogoUrl && typeof brand.description === "object" && brand.description?.headerLogoUrl) {
    headerLogoUrl = brand.description.headerLogoUrl;
  }

  // Fetch Global Shapes record
  let globalShapes: any = null;
  try {
    globalShapes = await pb.collection("globalShapes").getFirstListItem(`brand = "${brand.id}"`);
  } catch {
    // defaults will be used
  }

  // Fetch Global Colors for pre-populating custom themes
  let brandColors: Array<{ hex: string; role?: string; name?: string }> = [];
  try {
    const colList = await pb.collection("globalColors").getFullList({
      filter: `brand = "${brand.id}"`,
      sort: "order",
    });
    brandColors = colList.map((c: any) => ({
      hex: c.hex,
      role: c.role,
      name: typeof c.name === "object" ? c.name?.sk || c.name?.en : c.name,
    }));
  } catch {
    // defaults
  }

  const serializedBrand = {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    customDomain: brand.customDomain || "",
    isDomainVerified: brand.isDomainVerified || false,
    hideLogobookBadge: brand.hideLogobookBadge || false,
    hasPassword: !!brand.passwordHash,
    description: typeof brand.description === "object" ? brand.description : {},
  };

  const serializedShapes = globalShapes
    ? {
        radiusMode: globalShapes.radiusMode || "rounded",
        customRadiusPx: globalShapes.customRadiusPx ?? 3,
        borderWidthPx: globalShapes.borderWidthPx ?? 1,
        semanticSuccess: globalShapes.semanticSuccess || "#009f80",
        semanticWarning: globalShapes.semanticWarning || "#c8d400",
        semanticDanger: globalShapes.semanticDanger || "#bb4934",
        semanticInfo: globalShapes.semanticInfo || "#2b3b48",
        manualBgColor: globalShapes.manualBgColor || "#0e161d",
        themeConfig: globalShapes.themeConfig || null,
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/admin/brand/${brandId}`}
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{dict.admin.brandOverview}</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {dict.admin.brandSettings}: <span className="text-primary">{brand.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Spravujte nastavenia projektu, domény, SEO a globálny vizuálny štýl manuálu.
          </p>
        </div>

        <Button asChild variant="outline" size="default" className="self-start sm:self-auto shrink-0 shadow-xs">
          <Link href={`/m/${brand.slug || brandId}`} target="_blank">
            <span>{dict.admin.viewLiveManual}</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Team Collaborators Link Card */}
      <div className="border border-border/50 rounded-2xl p-6 sm:p-7 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-neutral-900/80 border border-border/70 flex items-center justify-center text-[#c8d400] shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <span>{dict.admin.teamTitle}</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dict.admin.teamSubtitle}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="default" className="self-start sm:self-auto shrink-0 shadow-xs">
          <Link href={`/admin/brand/${brandId}/settings/team`}>
            <span>{dict.admin.manageTeam}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* 1. General Settings (Name, Slug, SEO, Tier features) */}
      <BrandGeneralForm brand={serializedBrand} userTier={userTier} dict={dict} />

      {/* 2. Header Logo in Top Bar */}
      <BrandHeaderLogoForm
        brandId={brand.id}
        initialHeaderLogoUrl={headerLogoUrl}
        initialHeaderLogoHeight={typeof brand.description === "object" && typeof brand.description?.headerLogoHeight === "number" ? brand.description.headerLogoHeight : 40}
        initialShowHeaderBrandName={typeof brand.description === "object" && typeof brand.description?.showHeaderBrandName === "boolean" ? brand.description.showHeaderBrandName : true}
        brandName={brand.name}
        dict={dict}
      />

      {/* 3. Favicon Upload */}
      <BrandFaviconForm brandId={brand.id} initialFaviconUrl={faviconUrl} dict={dict} />

      {/* 3. Global Shapes & Theme (Corner radius, border width, theme & background) */}
      <BrandShapesForm
        brandId={brand.id}
        initialShapes={serializedShapes}
        brandColors={brandColors}
        dict={dict}
      />

      {/* 4. Danger Zone (Delete Brand) - Only for Owner */}
      {isOwner && (
        <BrandDangerZone brandId={brand.id} brandName={brand.name} dict={dict} />
      )}
    </div>
  );
}
