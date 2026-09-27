import { cookies } from "next/headers";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function BrandColorsPage({
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
          <h1 className="text-2xl font-bold tracking-tight">{dict.admin.brandColors}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global color library and tokens for brand <span className="font-mono font-semibold uppercase">{brandId}</span>.
          </p>
        </div>
        <Button size="sm" className="gap-2 self-start sm:self-auto text-xs">
          <Plus className="h-4 w-4" /> Add Color
        </Button>
      </div>

      <div className="border rounded-2xl p-6 bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Color Tokens Editor ready for Sprint 2</span>
        </div>
      </div>
    </div>
  );
}
