"use client";

import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import { UserDropdown } from "@/components/admin/user-dropdown";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import { Menu } from "lucide-react";

interface AdminTopbarProps {
  user?: {
    email: string;
    name?: string;
    tier?: string;
    verified?: boolean;
  } | null;
  locale?: Locale;
  onMenuToggle?: () => void;
}

export function AdminTopbar({
  user,
  locale = DEFAULT_LOCALE,
  onMenuToggle,
}: AdminTopbarProps) {
  return (
    <header className="h-16 border-b border-[#2b3b48]/60 bg-[#0e161d]/90 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Left: Mobile hamburger + Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Breadcrumbs locale={locale} />
      </div>

      {/* Right: LanguageSwitcher & UserProfile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher currentLocale={locale} />
        <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />
        <UserDropdown user={user} locale={locale} />
      </div>
    </header>
  );
}
