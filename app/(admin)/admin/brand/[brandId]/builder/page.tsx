import { cookies } from "next/headers";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { LayoutGrid, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{dict.admin.brandBuilder}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual Page Builder with 25 modular building blocks for brand <span className="font-mono font-semibold uppercase">{brandId}</span>.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto text-xs">
          <Eye className="h-4 w-4" /> Live Preview
        </Button>
      </div>

      <div className="border rounded-2xl p-6 bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">PageBuilder Canvas & 25 Modules ready for Sprint 2</span>
        </div>
      </div>
    </div>
  );
}
