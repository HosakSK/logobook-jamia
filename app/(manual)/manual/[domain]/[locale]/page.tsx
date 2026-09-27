import { BookOpen, ShieldCheck, Globe, CheckCircle2, Sparkles, Layers } from "lucide-react";
import { getDictionary, getLocalizedValue, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";

export default async function LocalizedManualPage({
  params,
}: {
  params: Promise<{ domain: string; locale: string }>;
}) {
  const { domain, locale } = await params;
  const currentLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  // Multilingual mock data representing DB JSON fields (demonstrating strict fallback)
  const sampleBrandData = {
    brandName: {
      en: `${domain.toUpperCase()} Design Guidelines`,
      sk: `${domain.toUpperCase()} Dizajn Manuál`,
      cs: `${domain.toUpperCase()} Design Manuál`,
    },
    tagline: {
      en: "Official Visual Identity System & Design Standards",
      sk: "Oficiálny systém vizuálnej identity a štandardy dizajnu",
      // Note: intentionally omitted in CS to test strict fallback to default (EN)
    },
    description: {
      en: "This digital brand manual outlines the core identity elements, color systems, typography hierarchy, and logo clearspace rules. All assets are centrally governed in real-time.",
      sk: "Tento digitálny brand manuál definuje kľúčové prvky identity, farebné systémy, hierarchiu typografie a pravidlá ochrannej zóny loga. Všetky assety sú centrálne spravované v reálnom čase.",
      cs: "Tento digitální brand manuál definuje klíčové prvky identity, barevné systémy, hierarchii typografie a pravidla ochranné zóny loga. Všechny assety jsou centrálně spravovány v reálném čase.",
    },
    rulesHeadline: {
      en: "Logo Usage & Clearspace Specifications",
      sk: "Použitie loga a ochranná zóna",
      // Notice: CS missing, will fallback automatically
    },
    rulesContent: {
      en: "The logo must always be displayed with sufficient protective margins. Never alter the aspect ratio or combine with conflicting backgrounds.",
      sk: "Logo musí byť vždy zobrazené s dostatočnou ochrannou zónou. Nikdy nemeňte pomer strán ani ho nekombinujte s konfliktným pozadím.",
      cs: "Logo musí být vždy zobrazeno s dostatečnou ochrannou zónou. Nikdy neměňte poměr stran ani jej nekombinujte s konfliktním pozadím.",
    },
  };

  // Resolved localized values with strict fallback
  const brandTitle = getLocalizedValue(sampleBrandData.brandName, currentLocale, DEFAULT_LOCALE);
  const brandTagline = getLocalizedValue(sampleBrandData.tagline, currentLocale, DEFAULT_LOCALE);
  const brandDescription = getLocalizedValue(sampleBrandData.description, currentLocale, DEFAULT_LOCALE);
  const rulesTitle = getLocalizedValue(sampleBrandData.rulesHeadline, currentLocale, DEFAULT_LOCALE);
  const rulesText = getLocalizedValue(sampleBrandData.rulesContent, currentLocale, DEFAULT_LOCALE);

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl space-y-8">
      {/* Brand Hero Card */}
      <div className="border rounded-2xl p-8 sm:p-10 bg-card shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {dict.manual.overview}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{dict.manual.fallbackActive}</span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {brandTitle}
          </h1>
          <p className="text-base sm:text-lg font-medium text-foreground/80">
            {brandTagline}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {brandDescription}
          </p>
        </div>

        <div className="pt-6 border-t flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <div>
            {dict.manual.domainLabel}:{" "}
            <span className="font-mono font-semibold text-foreground">{domain}</span>
          </div>
          <div>•</div>
          <div>
            {dict.manual.currentLanguage}:{" "}
            <span className="font-semibold uppercase tracking-wider text-foreground">
              {currentLocale}
            </span>
          </div>
        </div>
      </div>

      {/* Brand Guidelines Section */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-card shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>{rulesTitle}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {rulesText}
          </p>
        </div>

        <div className="border rounded-xl p-6 bg-card shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Globe className="h-4 w-4" />
            <span>Multi-Language Fallback Engine</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Target locale: <code className="px-1.5 py-0.5 rounded bg-muted font-mono">{currentLocale}</code>. When specific texts are not yet translated in the database, the system immediately returns the verified default locale (<code className="px-1.5 py-0.5 rounded bg-muted font-mono">{DEFAULT_LOCALE}</code>) without visual regressions.
          </p>
        </div>
      </div>
    </div>
  );
}
