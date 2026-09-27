import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { BookOpen } from "lucide-react";

export default async function ManualLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string; locale?: string }>;
}) {
  const { domain, locale } = await params;
  const currentLocale: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      {/* Brand Manual Header */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
              {domain.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-bold tracking-tight text-base sm:text-lg uppercase">
              {domain}
            </span>
            <span className="text-xs text-muted-foreground border-l pl-3 hidden sm:inline-block">
              {dict.manual.brandManual}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={currentLocale} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Manual Content */}
      <main className="flex-1">{children}</main>

      {/* Manual Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4 space-y-2">
          <p>{dict.manual.allRightsReserved}</p>
          <p>
            Powered by{" "}
            <Link
              href="/"
              className="font-medium underline hover:text-foreground transition-colors"
            >
              Logobook.sk
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
