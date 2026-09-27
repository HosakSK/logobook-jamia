/**
 * Logobook.sk Internationalization (i18n) Engine & Fallback Resolver
 * Single-Tenancy multi-language support (EN default, SK, CS)
 */

export const SUPPORTED_LOCALES = ["en", "sk", "cs"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_METADATA: Record<Locale, { label: string; nativeName: string; flag: string }> = {
  en: { label: "English", nativeName: "English", flag: "🇬🇧" },
  sk: { label: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  cs: { label: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
};

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * UI Dictionaries for all 3 supported languages
 */
export const DICTIONARIES = {
  en: {
    common: {
      brand: "Logobook",
      login: "Sign In",
      logout: "Sign Out",
      admin: "Admin",
      manual: "Brand Manual",
      home: "Home",
      theme: "Theme",
      language: "Language",
      save: "Save",
      cancel: "Cancel",
      search: "Search...",
      back: "Back",
      loading: "Loading...",
      demo: "Demo",
    },
    nav: {
      features: "Features",
      demoManual: "Live Demo",
      docs: "Documentation",
      signIn: "Sign In",
      dashboard: "Dashboard",
    },
    marketing: {
      badge: "Next-Gen Brand Manual Platform",
      heroTitle: "The Modern Living Brand Manual for Agile Teams",
      heroSubtitle:
        "Centralize, govern, and distribute your brand assets, design tokens, logos, and guidelines with zero friction and enterprise-grade multi-tenancy.",
      ctaDemo: "Explore Demo Manual",
      ctaAdmin: "Open Admin Studio",
      featuresTitle: "Engineered for speed, scale & brand consistency",
      featuresSubtitle:
        "Single-instance multi-tenancy, real-time fallback translations, and automated edge routing.",
      feature1Title: "Multi-Tenant Edge Routing",
      feature1Desc:
        "Each client or brand gets their own isolated subdomain or custom CNAME domain powered by Next.js edge rewrites.",
      feature2Title: "Strict i18n Fallback",
      feature2Desc:
        "Multilingual content with instant automatic fallback ensuring no missing translation ever breaks your manual layout.",
      feature3Title: "Enterprise Asset Storage",
      feature3Desc:
        "Store high-resolution vector logos, typography palettes, and brand guidelines safely in S3-compatible cloud storage.",
      readyTitle: "Ready to launch your brand manual?",
      readySubtitle: "Experience the fastest and cleanest brand guideline system available.",
      footerRights: "Logobook.sk — All rights reserved.",
    },
    login: {
      title: "Welcome back",
      subtitle: "Sign in to manage your brand manuals, team, and assets.",
      emailLabel: "Email address",
      emailPlaceholder: "name@company.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      rememberMe: "Remember me for 30 days",
      forgotPassword: "Forgot password?",
      submitButton: "Sign In",
      submitting: "Signing in...",
      backToHome: "← Back to Homepage",
      securityNotice: "Protected by PocketBase Edge session validation.",
      demoCredentialsNotice: "Default superuser: jakub@jamia.sk",
      invalidCredentials: "Invalid email or password. Please try again.",
    },
    admin: {
      title: "Logobook Studio",
      subtitle: "Multi-tenant Brand Portal Administration",
      activeBrands: "Active Brands",
      managedAssets: "Managed Assets",
      storageQuota: "Storage Quota",
      languageStatus: "Translation Status",
      brandsListTitle: "Your Brand Manuals",
      viewManual: "View Manual",
      editBrand: "Edit Brand",
      newBrand: "Create Brand",
      statusLive: "Live",
      statusDraft: "Draft",
      demoBrandName: "Logobook Global Design System",
      demoBrandSlug: "demo",
      completionBadgeTitle: "Translation Coverage",
      completionBadgeNote: "Strict fallback active for missing locales.",
      logout: "Sign Out",
      unauthorizedNotice: "Admin area requires an authenticated session.",
    },
    manual: {
      brandManual: "Brand Manual",
      overview: "Overview",
      logos: "Logos & Symbols",
      colors: "Color Palette",
      typography: "Typography",
      downloads: "Asset Downloads",
      currentLanguage: "Current Language",
      fallbackActive: "Strict translation fallback active",
      allRightsReserved: "Brand guidelines are proprietary.",
      domainLabel: "Brand identifier",
      switchLanguage: "Change Language",
    },
  },
  sk: {
    common: {
      brand: "Logobook",
      login: "Prihlásiť sa",
      logout: "Odhlásiť sa",
      admin: "Admin",
      manual: "Brand Manuál",
      home: "Domov",
      theme: "Motív",
      language: "Jazyk",
      save: "Uložiť",
      cancel: "Zrušiť",
      search: "Hľadať...",
      back: "Späť",
      loading: "Načítavam...",
      demo: "Demo",
    },
    nav: {
      features: "Funkcie",
      demoManual: "Živé Demo",
      docs: "Dokumentácia",
      signIn: "Prihlásiť sa",
      dashboard: "Nástenka",
    },
    marketing: {
      badge: "Platforma novej generácie pre brand manuály",
      heroTitle: "Moderný online brand manuál pre agilné tímy",
      heroSubtitle:
        "Centralizujte, spravujte a distribuujte vizuálnu identitu, dizajn manuály, logá a pravidlá bez trenia s podnikovou multi-tenanciou.",
      ctaDemo: "Preskúmať Demo Manuál",
      ctaAdmin: "Otvoriť Admin Štúdio",
      featuresTitle: "Navrhnuté pre rýchlosť, škálovateľnosť a konzistenciu",
      featuresSubtitle:
        "Single-database architektúra, preklady v reálnom čase s prísnym fallbackom a bleskový edge routing.",
      feature1Title: "Multi-tenant Edge Routing",
      feature1Desc:
        "Každý klient alebo značka má vlastnú subdoménu alebo vlastnú CNAME doménu riadenú Next.js middleware prepisom.",
      feature2Title: "Prísny Jazykový Fallback",
      feature2Desc:
        "Viacjazyčný obsah s okamžitým automatickým fallbackom zabezpečuje, že chýbajúci preklad nikdy nepokazí vzhľad manuálu.",
      feature3Title: "Enterprise Úložisko Assetov",
      feature3Desc:
        "Bezpečné ukladanie vektorových logotypov vo vysokom rozlíšení, farebných tokenov a typografie v S3 cloude.",
      readyTitle: "Pripravení spustiť svoj vlastný brand manuál?",
      readySubtitle: "Vyskúšajte najrýchlejší a najprehľadnejší systém pre vizuálnu identitu na trhu.",
      footerRights: "Logobook.sk — Všetky práva vyhradené.",
    },
    login: {
      title: "Vitajte späť",
      subtitle: "Prihláste sa pre správu vašich brand manuálov, tímu a assetov.",
      emailLabel: "E-mailová adresa",
      emailPlaceholder: "meno@firma.sk",
      passwordLabel: "Heslo",
      passwordPlaceholder: "••••••••",
      rememberMe: "Zapamätať prihlásenie na 30 dní",
      forgotPassword: "Zabudli ste heslo?",
      submitButton: "Prihlásiť sa",
      submitting: "Prihlasujem...",
      backToHome: "← Späť na domovskú stránku",
      securityNotice: "Chránené bezpečným overením PocketBase session na Edge.",
      demoCredentialsNotice: "Východiskový superuser: jakub@jamia.sk",
      invalidCredentials: "Nesprávny e-mail alebo heslo. Skúste to znova.",
    },
    admin: {
      title: "Logobook Studio",
      subtitle: "Administrácia multi-tenant brand portálov",
      activeBrands: "Aktívne značky",
      managedAssets: "Spravované assety",
      storageQuota: "Využitie úložiska",
      languageStatus: "Stav prekladov",
      brandsListTitle: "Vaše brand manuály",
      viewManual: "Zobraziť manuál",
      editBrand: "Upraviť značku",
      newBrand: "Vytvoriť značku",
      statusLive: "Publikované",
      statusDraft: "Koncept",
      demoBrandName: "Logobook Globálny Dizajn Systém",
      demoBrandSlug: "demo",
      completionBadgeTitle: "Pokrytie prekladov",
      completionBadgeNote: "Pre chýbajúce jazyky je aktívny prísny fallback.",
      logout: "Odhlásiť sa",
      unauthorizedNotice: "Admin zóna vyžaduje overené prihlásenie.",
    },
    manual: {
      brandManual: "Brand Manuál",
      overview: "Prehľad",
      logos: "Logá a symboly",
      colors: "Farebná paleta",
      typography: "Typografia",
      downloads: "Stiahnutie podkladov",
      currentLanguage: "Aktuálny jazyk",
      fallbackActive: "Aktívny striktný jazykový fallback",
      allRightsReserved: "Pravidlá značky sú chránené autorským právom.",
      domainLabel: "Identifikátor značky",
      switchLanguage: "Zmeniť jazyk",
    },
  },
  cs: {
    common: {
      brand: "Logobook",
      login: "Přihlásit se",
      logout: "Odhlásit se",
      admin: "Admin",
      manual: "Brand Manuál",
      home: "Domů",
      theme: "Motiv",
      language: "Jazyk",
      save: "Uložit",
      cancel: "Zrušit",
      search: "Hledat...",
      back: "Zpět",
      loading: "Načítám...",
      demo: "Demo",
    },
    nav: {
      features: "Funkce",
      demoManual: "Živé Demo",
      docs: "Dokumentace",
      signIn: "Přihlásit se",
      dashboard: "Nástěnka",
    },
    marketing: {
      badge: "Platforma nové generace pro brand manuály",
      heroTitle: "Moderní online brand manuál pro agilní týmy",
      heroSubtitle:
        "Centralizujte, spravujte a distribuujte vizuální identitu, design manuály, loga a pravidla bez tření s podnikovou multi-tenancí.",
      ctaDemo: "Prozkoumat Demo Manuál",
      ctaAdmin: "Otevřít Admin Studio",
      featuresTitle: "Navrženo pro rychlost, škálovatelnost a konzistenci",
      featuresSubtitle:
        "Single-database architektura, překlady v reálném čase s přísným fallbackem a bleskový edge routing.",
      feature1Title: "Multi-tenant Edge Routing",
      feature1Desc:
        "Každý klient nebo značka má vlastní subdoménu nebo vlastní CNAME doménu řízenou Next.js middleware přepisem.",
      feature2Title: "Přísný Jazykový Fallback",
      feature2Desc:
        "Vícejazyčný obsah s okamžitým automatickým fallbackem zajišťuje, že chybějící překlad nikdy nepokazí vzhled manuálu.",
      feature3Title: "Enterprise Úložiště Assetů",
      feature3Desc:
        "Bezpečné ukládání vektorových logotypů ve vysokém rozlišení, barevných tokenů a typografie v S3 cloudu.",
      readyTitle: "Připraveni spustit svůj vlastní brand manuál?",
      readySubtitle: "Vyzkoušejte nejrychlejší a nejpřehlednější systém pro vizuální identitu na trhu.",
      footerRights: "Logobook.sk — Všechna práva vyhrazena.",
    },
    login: {
      title: "Vítejte zpět",
      subtitle: "Přihlaste se pro správu vašich brand manuálů, týmu a assetů.",
      emailLabel: "E-mailová adresa",
      emailPlaceholder: "jmeno@firma.cz",
      passwordLabel: "Heslo",
      passwordPlaceholder: "••••••••",
      rememberMe: "Zapamatovat přihlášení na 30 dní",
      forgotPassword: "Zapomněli jste heslo?",
      submitButton: "Přihlásit se",
      submitting: "Přihlašuji...",
      backToHome: "← Zpět na domovskou stránku",
      securityNotice: "Chráněno bezpečným ověřením PocketBase session na Edge.",
      demoCredentialsNotice: "Výchozí superuser: jakub@jamia.sk",
      invalidCredentials: "Nesprávný e-mail nebo heslo. Zkuste to znovu.",
    },
    admin: {
      title: "Logobook Studio",
      subtitle: "Administrace multi-tenant brand portálů",
      activeBrands: "Aktivní značky",
      managedAssets: "Spravované assety",
      storageQuota: "Využití úložiště",
      languageStatus: "Stav překladů",
      brandsListTitle: "Vaše brand manuály",
      viewManual: "Zobrazit manuál",
      editBrand: "Upravit značku",
      newBrand: "Vytvořit značku",
      statusLive: "Publikováno",
      statusDraft: "Koncept",
      demoBrandName: "Logobook Globální Design Systém",
      demoBrandSlug: "demo",
      completionBadgeTitle: "Pokrytí překladů",
      completionBadgeNote: "Pro chybějící jazyky je aktivní přísný fallback.",
      logout: "Odhlásit se",
      unauthorizedNotice: "Admin zóna vyžaduje ověřené přihlášení.",
    },
    manual: {
      brandManual: "Brand Manuál",
      overview: "Přehled",
      logos: "Loga a symboly",
      colors: "Barevná paleta",
      typography: "Typografie",
      downloads: "Stažení podkladů",
      currentLanguage: "Aktuální jazyk",
      fallbackActive: "Aktivní striktní jazykový fallback",
      allRightsReserved: "Pravidla značky jsou chráněna autorským právem.",
      domainLabel: "Identifikátor značky",
      switchLanguage: "Změnit jazyk",
    },
  },
} as const;

export type Dictionary = typeof DICTIONARIES.en;

/**
 * Returns dictionary for given locale with strict fallback to default (EN)
 */
export function getDictionary(locale: string = DEFAULT_LOCALE): Dictionary {
  if (locale === "sk") return DICTIONARIES.sk as unknown as Dictionary;
  if (locale === "cs") return DICTIONARIES.cs as unknown as Dictionary;
  return DICTIONARIES.en;
}

/**
 * Strict Localized Value Resolver for Database JSON fields.
 * Guarantees that no empty string or missing field causes a visual crash.
 * Fallback priority: targetLocale -> defaultLocale -> en -> sk -> cs -> first non-empty value.
 */
export function getLocalizedValue(
  value: unknown,
  targetLocale: string = DEFAULT_LOCALE,
  defaultLocale: string = DEFAULT_LOCALE
): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    // If stored as JSON string in PocketBase
    if (value.startsWith("{") && value.endsWith("}")) {
      try {
        const parsed = JSON.parse(value);
        return getLocalizedValue(parsed, targetLocale, defaultLocale);
      } catch {
        return value;
      }
    }
    return value;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    // 1. Target locale
    const targetVal = record[targetLocale];
    if (typeof targetVal === "string" && targetVal.trim() !== "") {
      return targetVal;
    }

    // 2. Default locale
    const defaultVal = record[defaultLocale];
    if (typeof defaultVal === "string" && defaultVal.trim() !== "") {
      return defaultVal;
    }

    // 3. Fallback to English
    const enVal = record["en"];
    if (typeof enVal === "string" && enVal.trim() !== "") {
      return enVal;
    }

    // 4. Fallback to Slovak
    const skVal = record["sk"];
    if (typeof skVal === "string" && skVal.trim() !== "") {
      return skVal;
    }

    // 5. Fallback to Czech
    const csVal = record["cs"];
    if (typeof csVal === "string" && csVal.trim() !== "") {
      return csVal;
    }

    // 6. First non-empty string in the object
    for (const key of Object.keys(record)) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim() !== "") {
        return candidate;
      }
    }
  }

  return String(value);
}

/**
 * Admin Badge Completion Calculator
 * Computes translation coverage percentage for a brand's dataset
 */
export interface LocaleCompletionResult {
  locale: Locale;
  totalFields: number;
  translatedFields: number;
  percentage: number;
  badgeText: string;
  variant: "success" | "warning" | "destructive";
}

export function calculateLocaleCompletion(
  items: Array<Record<string, unknown>>,
  targetLocale: Locale,
  defaultLocale: Locale = DEFAULT_LOCALE,
  translatableFields: string[] = ["name", "title", "description", "content", "tagline"]
): LocaleCompletionResult {
  let totalFields = 0;
  let translatedFields = 0;

  for (const item of items) {
    for (const field of translatableFields) {
      if (item[field] !== undefined) {
        totalFields++;
        const val = item[field];
        if (typeof val === "object" && val !== null) {
          const rec = val as Record<string, unknown>;
          if (rec[targetLocale] && String(rec[targetLocale]).trim() !== "") {
            translatedFields++;
          }
        } else if (typeof val === "string" && targetLocale === defaultLocale && val.trim() !== "") {
          translatedFields++;
        }
      }
    }
  }

  // If no items, default to 100% for defaultLocale, 0% for others
  const percentage = totalFields > 0 ? Math.round((translatedFields / totalFields) * 100) : targetLocale === defaultLocale ? 100 : 0;

  let variant: "success" | "warning" | "destructive" = "destructive";
  if (percentage === 100) {
    variant = "success";
  } else if (percentage >= 50) {
    variant = "warning";
  }

  return {
    locale: targetLocale,
    totalFields,
    translatedFields,
    percentage,
    badgeText: `${targetLocale.toUpperCase()} (${percentage}%)`,
    variant,
  };
}
