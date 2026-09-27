import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { LocaleBadge } from "@/components/locale-badge";
import {
  getDictionary,
  DEFAULT_LOCALE,
  isValidLocale,
  Locale,
  calculateLocaleCompletion,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";
import { Plus, FolderKanban, ExternalLink, Globe2, ShieldCheck, HardDrive } from "lucide-react";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  // Mock sample dataset to demonstrate LocaleBadge calculation on live brand manuals
  const demoBrandFields = [
    {
      name: { en: "Logobook Global Design System", sk: "Logobook Globálny Dizajn Systém", cs: "Logobook Globální Design Systém" },
      tagline: { en: "Living Brand Manual", sk: "Živý brand manuál", cs: "Živý brand manuál" },
      description: {
        en: "Official identity guidelines and digital assets",
        sk: "Oficiálne smernice vizuálnej identity a digitálne podklady",
        cs: "Oficiální směrnice vizuální identity a digitální podklady",
      },
    },
    {
      title: { en: "Primary Logo Guidelines", sk: "Pravidlá pre primárne logo", cs: "Pravidla pro primární logo" },
      content: { en: "Clearspace must equal 50% of symbol height.", sk: "Ochranná zóna musí byť 50% výšky symbolu." },
    },
  ];

  const completionEN = calculateLocaleCompletion(demoBrandFields, "en", "en");
  const completionSK = calculateLocaleCompletion(demoBrandFields, "sk", "en");
  const completionCS = calculateLocaleCompletion(demoBrandFields, "cs", "en");

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{dict.admin.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dict.admin.brandsListTitle}
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto text-xs">
          <Plus className="h-4 w-4" /> {dict.admin.newBrand}
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-xl p-5 bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{dict.admin.activeBrands}</span>
            <FolderKanban className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">1</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            1 {dict.admin.statusLive}
          </span>
        </div>

        <div className="border rounded-xl p-5 bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{dict.admin.storageQuota}</span>
            <HardDrive className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">12.4 MB</div>
          <span className="text-[11px] text-muted-foreground">
            500 MB limit (Tier: Free)
          </span>
        </div>

        <div className="border rounded-xl p-5 bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{dict.admin.languageStatus}</span>
            <Globe2 className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <LocaleBadge status={completionEN} />
            <LocaleBadge status={completionSK} />
            <LocaleBadge status={completionCS} />
          </div>
          <span className="text-[11px] text-muted-foreground block pt-0.5">
            {dict.admin.completionBadgeNote}
          </span>
        </div>
      </div>

      {/* Active Brand Cards List */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight">
          {dict.admin.activeBrands}
        </h2>

        <div className="border rounded-2xl p-6 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{dict.admin.demoBrandName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {dict.admin.statusLive}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono font-medium text-foreground">demo</span> • Domain: <span className="font-mono font-medium text-foreground">demo.logobook.sk</span>
            </p>
            {/* Translation Coverage Badges */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium">{dict.admin.completionBadgeTitle}:</span>
              <LocaleBadge status={completionEN} showDetails />
              <LocaleBadge status={completionSK} showDetails />
              <LocaleBadge status={completionCS} showDetails />
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
              <Link href="/m/demo">
                <span>{dict.admin.viewManual}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" className="text-xs">
              {dict.admin.editBrand}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
