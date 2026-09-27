import { cookies } from "next/headers";
import Link from "next/link";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { ExternalLink, Palette, Type, Image as ImageIcon, LayoutGrid, Info } from "lucide-react";
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {dict.admin.brandOverview}: <span className="uppercase">{brandId}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure visual assets, global design tokens, and modular brand manual structure.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 self-start sm:self-auto text-xs">
          <Link href={`/m/${brandId}`} target="_blank">
            <span>{dict.admin.viewLiveManual}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/admin/brand/${brandId}/logos`}
          className="border rounded-2xl p-5 bg-card hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors shadow-2xs space-y-2 block"
        >
          <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm">{dict.admin.brandLogos}</h3>
          <p className="text-xs text-muted-foreground">Logotypes, marks, clearspace, and monochrome variations.</p>
        </Link>

        <Link
          href={`/admin/brand/${brandId}/colors`}
          className="border rounded-2xl p-5 bg-card hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors shadow-2xs space-y-2 block"
        >
          <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
            <Palette className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm">{dict.admin.brandColors}</h3>
          <p className="text-xs text-muted-foreground">Primary, secondary, neutral colors, and Pantone / CMYK tokens.</p>
        </Link>

        <Link
          href={`/admin/brand/${brandId}/typography`}
          className="border rounded-2xl p-5 bg-card hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors shadow-2xs space-y-2 block"
        >
          <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
            <Type className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm">{dict.admin.brandTypography}</h3>
          <p className="text-xs text-muted-foreground">Google Fonts, Adobe Typekit, headings, and body scale.</p>
        </Link>

        <Link
          href={`/admin/brand/${brandId}/builder`}
          className="border rounded-2xl p-5 bg-card hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors shadow-2xs space-y-2 block"
        >
          <div className="h-9 w-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm">{dict.admin.brandBuilder}</h3>
          <p className="text-xs text-muted-foreground">Visual drag & drop canvas with 25 modular building blocks.</p>
        </Link>
      </div>
    </div>
  );
}
