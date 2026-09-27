import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { ArrowRight, BookOpen, Layers, ShieldCheck, Zap } from "lucide-react";

export default async function MarketingPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {dict.marketing.badge}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">
          {dict.marketing.heroTitle}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          {dict.marketing.heroSubtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/admin">
              {dict.marketing.ctaAdmin} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/m/demo">
              {dict.marketing.ctaDemo}
            </Link>
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {dict.marketing.featuresTitle}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {dict.marketing.featuresSubtitle}
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base">{dict.marketing.feature1Title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dict.marketing.feature1Desc}
            </p>
          </div>

          <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base">{dict.marketing.feature2Title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dict.marketing.feature2Desc}
            </p>
          </div>

          <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base">{dict.marketing.feature3Title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dict.marketing.feature3Desc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
