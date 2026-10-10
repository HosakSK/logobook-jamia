import { cookies } from "next/headers";
import Link from "next/link";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { getBrandPublicUrl } from "@/lib/domains";
import { ExternalLink, Palette, Type, Image as ImageIcon, LayoutGrid, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function BrandOverviewPage({
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
  let customDomain = "";
  try {
    const brand = await pb.collection("brands").getOne(brandId);
    if (brand?.name) brandName = brand.name;
    if (brand?.slug) brandSlug = brand.slug;
    if (brand?.customDomain) customDomain = brand.customDomain;
  } catch {
    try {
      const brand = await pb.collection("brands").getFirstListItem(`slug = "${brandId}"`);
      if (brand?.name) brandName = brand.name;
      if (brand?.slug) brandSlug = brand.slug;
    } catch {
      // fallback to brandId
    }
  }

  const sections = [
    {
      href: `/admin/brand/${brandId}/logos`,
      icon: ImageIcon,
      title: dict.admin.brandLogos,
      desc: "Logotypy, symboly, ochranná zóna a monochromatické varianty.",
    },
    {
      href: `/admin/brand/${brandId}/colors`,
      icon: Palette,
      title: dict.admin.brandColors,
      desc: "Primárne, sekundárne farby a definície Pantone, CMYK a RGB.",
    },
    {
      href: `/admin/brand/${brandId}/typography`,
      icon: Type,
      title: dict.admin.brandTypography,
      desc: "Webfonty, hierarchia nadpisov, rez a veľkostná typografická škála.",
    },
    {
      href: `/admin/brand/${brandId}/builder`,
      icon: LayoutGrid,
      title: dict.admin.brandBuilder,
      desc: "Vizuálny Page Builder a správa modulárneho stromu stránok.",
    },
    {
      href: `/admin/brand/${brandId}/settings`,
      icon: Settings,
      title: dict.admin.brandSettings,
      desc: "Domény, heslo portálu, SEO, favicon a globálne štýly tvarov.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#fafbfc]">
            {dict.admin.brandOverview}: <span className="text-[#c8d400]">{brandName}</span>
          </h1>
          <p className="text-sm text-[#96abbe] mt-1">
            Konfigurácia vizuálnych assetov, dizajnových tokenov a štruktúry brand manuálu.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 self-start sm:self-auto text-xs rounded-[3px] bg-[#17212a] text-[#fafbfc] border-[rgba(63,85,102,0.6)] hover:bg-[#1f2c36] hover:text-[#fafbfc]">
          <a href={getBrandPublicUrl(brandSlug, customDomain)} target="_blank" rel="noopener noreferrer">
            <span>{dict.admin.viewLiveManual}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-5 bg-[#17212a] hover:bg-[#1f2c36] transition-colors shadow-2xs space-y-2.5 block group"
            >
              <div className="h-9 w-9 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] flex items-center justify-center text-[#c8d400] group-hover:border-[#c8d400]/40 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-[#fafbfc] group-hover:text-[#c8d400] transition-colors">
                {sec.title}
              </h3>
              <p className="text-xs text-[#96abbe] leading-relaxed">{sec.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
