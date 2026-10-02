"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, BookOpen, ExternalLink, Globe, Moon, Sun } from "lucide-react";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { PublicManualSidebar } from "./public-manual-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Locale } from "@/lib/i18n";

interface PublicManualShellProps {
  children: React.ReactNode;
  brand: {
    id: string;
    name: string;
    slug: string;
    headerLogoUrl?: string;
    hideLogobookBadge?: boolean;
  };
  snapshot: PublishedBrandSnapshot | null;
  domain: string;
  locale: string;
  currentPageSlug?: string;
}

export function PublicManualShell({
  children,
  brand,
  snapshot,
  domain,
  locale,
  currentPageSlug,
}: PublicManualShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pages = snapshot?.pages || [];

  return (
    <div
      style={{ backgroundColor: "var(--brand-manual-bg, var(--background))" }}
      className="min-h-screen flex flex-col text-foreground selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors"
    >
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 h-18 border-b border-border/50 bg-card/90 backdrop-blur-md px-5 sm:px-8 flex items-center justify-between">
        {/* Left: Mobile hamburger + Brand Title / Logo */}
        <div className="flex items-center gap-3.5">
          {pages.length > 0 && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
              aria-label="Open manual navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link
            href={`/manual/${domain}/${locale}`}
            className="flex items-center gap-3.5 hover:opacity-90 transition-opacity"
          >
            {brand.headerLogoUrl ? (
              <img
                src={brand.headerLogoUrl}
                alt={brand.name}
                className="h-9 w-auto max-w-[150px] sm:max-w-[200px] object-contain"
              />
            ) : (
              <div
                className="h-9 w-9 text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs rounded-xl"
                style={{
                  backgroundColor: "var(--brand-color-primary, #c8d400)",
                }}
              >
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="hidden sm:block">
              <span className="font-bold tracking-tight text-sm sm:text-base uppercase">
                {brand.name}
              </span>
              <span className="text-xs text-muted-foreground ml-2.5 border-l border-border/60 pl-2.5 font-medium">
                Brand Manual
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Language switcher & Theme toggle */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale as Locale} />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Fixed Sidebar */}
        {pages.length > 0 && (
          <div className="hidden md:block w-72 shrink-0 border-r border-border/50 bg-card/20 sticky top-18 h-[calc(100vh-4.5rem)]">
            <PublicManualSidebar
              pages={pages}
              currentPageSlug={currentPageSlug}
              domain={domain}
              locale={locale}
            />
          </div>
        )}

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 p-6 sm:p-10 md:p-14 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Drawer / Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border p-0 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Navigácia manuálu
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-[2px] text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <PublicManualSidebar
                pages={pages}
                currentPageSlug={currentPageSlug}
                domain={domain}
                locale={locale}
                onPageSelect={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Public Footer */}
      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground bg-card/20">
        <div className="container mx-auto px-4 space-y-1.5">
          <p>© {new Date().getFullYear()} {brand.name}. Všetky práva vyhradené.</p>
          {!brand.hideLogobookBadge && (
            <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
              <span>Vytvorené na</span>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-semibold text-foreground/85 hover:text-foreground transition-all duration-150 group"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/logo/logo-symbol-dark.svg"
                  alt="Logobook.sk"
                  className="h-3.5 w-3.5 object-contain opacity-85 group-hover:opacity-100 transition-opacity dark:block hidden"
                />
                <img
                  src="/logo/logo-symbol-light.svg"
                  alt="Logobook.sk"
                  className="h-3.5 w-3.5 object-contain opacity-85 group-hover:opacity-100 transition-opacity dark:hidden block"
                />
                <span className="hover:underline">Logobook.sk</span>
              </Link>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
