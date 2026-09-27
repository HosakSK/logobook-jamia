import Link from "next/link";
import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { BookOpen } from "lucide-react";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-xl">
            <div className="h-8 w-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <span>Logobook<span className="text-neutral-400 font-normal">.sk</span></span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              {dict.common.admin}
            </Link>
            <LanguageSwitcher currentLocale={currentLocale} />
            <ThemeToggle />
            <Button asChild size="sm" variant="default" className="text-xs">
              <Link href="/login">{dict.common.login}</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} {dict.marketing.footerRights}</p>
        </div>
      </footer>
    </div>
  );
}
