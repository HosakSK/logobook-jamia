import Link from "next/link";
import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { VerificationBanner } from "@/components/verification-banner";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { logoutAction } from "@/actions/auth";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { FolderKanban, LogOut, Sparkles, UserCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  const user = pb.authStore.record;
  const isUnverified = user && user.verified === false;

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card p-6">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-8 w-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-black text-sm shadow-xs">
            LB
          </div>
          <span className="font-bold text-lg tracking-tight">Logobook Studio</span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 text-xs font-medium">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-foreground font-semibold"
          >
            <FolderKanban className="h-4 w-4" />
            <span>{dict.admin.activeBrands}</span>
          </Link>
          <div className="pt-4 pb-1 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Workspace
          </div>
          <Link
            href="/m/demo"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-foreground transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>{dict.common.demo} Manual</span>
          </Link>
        </nav>

        <div className="border-t pt-4 space-y-3">
          {user && (
            <div className="px-1 text-[11px] text-muted-foreground truncate">
              <span className="block font-medium text-foreground truncate">{user.email}</span>
              <span className="text-[10px] uppercase font-semibold text-neutral-400">
                Tier: {user.tier || "Free"}
              </span>
            </div>
          )}

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{dict.admin.logout}</span>
            </button>
          </form>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground font-mono">v0.0.1.8</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {dict.admin.subtitle}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={currentLocale} />
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {dict.common.home}
            </Link>
          </div>
        </header>

        {/* Soft-Blocker Verification Banner */}
        {isUnverified && user?.email && (
          <VerificationBanner email={user.email} locale={currentLocale} />
        )}

        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
