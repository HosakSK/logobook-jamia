import { cookies } from "next/headers";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <div className="dark min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary" data-theme="dark">
      <MarketingNav currentLocale={currentLocale} />
      <main className="flex-1">{children}</main>
      <MarketingFooter currentLocale={currentLocale} />
    </div>
  );
}
