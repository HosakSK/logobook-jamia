import { cookies } from "next/headers";
import Link from "next/link";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { ExternalLink, Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { BuilderCascadeSandbox } from "@/components/admin/modules";

export default async function BrandBuilderPage({
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
  let brandName = brandId;
  let brandSlug = brandId;

  try {
    const brand = await pb.collection("brands").getOne(brandId);
    if (brand?.name) brandName = brand.name;
    if (brand?.slug) brandSlug = brand.slug;
  } catch {
    // fallback
  }

  // Load cascade tokens for this brand
  const cascadeRes = await getBrandCascadeTokensAction(brandId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Link href={`/admin/brand/${brandId}`}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Späť na prehľad
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{dict.admin.brandBuilder}:</span>
            <span className="text-primary">{brandName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modulárny Page Builder s kaskádovou dedičnosťou štýlov a podporou 25 stavebných blokov (M01 – M25).
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-2 self-start sm:self-auto text-xs rounded-[3px]">
          <Link href={`/m/${brandSlug}`} target="_blank">
            <span>{dict.admin.viewLiveManual}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Interactive Cascade Sandbox */}
      <BuilderCascadeSandbox
        brandId={brandId}
        brandName={brandName}
        brandSlug={brandSlug}
        tokens={cascadeRes.tokens}
        cssVariables={cascadeRes.cssVariables}
      />
    </div>
  );
}
