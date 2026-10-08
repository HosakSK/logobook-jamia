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

  const pbAuthCookie = cookieStore.get("pb_auth")?.value;
  let isAuthenticated = false;
  if (pbAuthCookie && pbAuthCookie.trim() !== "" && pbAuthCookie !== "{}") {
    try {
      let cookieVal = pbAuthCookie;
      if (cookieVal.startsWith("%")) {
        cookieVal = decodeURIComponent(cookieVal);
      }
      if (cookieVal.startsWith("%")) {
        cookieVal = decodeURIComponent(cookieVal);
      }
      const parsed = JSON.parse(cookieVal);
      if (parsed.token && typeof parsed.token === "string" && parsed.token.length > 10) {
        isAuthenticated = true;
      }
    } catch {
      if (pbAuthCookie.length > 20) {
        isAuthenticated = true;
      }
    }
  }

  return (
    <div className="dark min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary" data-theme="dark">
      <MarketingNav currentLocale={currentLocale} isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <MarketingFooter currentLocale={currentLocale} />
    </div>
  );
}
