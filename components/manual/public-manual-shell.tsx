"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Menu, X, BookOpen, Search, FileText } from "lucide-react";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { PublicManualSidebar } from "./public-manual-sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Locale } from "@/lib/i18n";
import { useBrandCascade } from "@/components/modules/cascade";
import { getWcagContrast } from "@/lib/utils/color-calc";

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
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const pages = snapshot?.pages || [];
  const { tokens } = useBrandCascade();
  const manualBg = tokens?.manualBgColor || "#0e161d";
  const isDarkBg = tokens?.theme
    ? tokens.theme.isDark
    : getWcagContrast(manualBg).preferredText === "white";
  const logobookSymbolSrc = isDarkBg ? "/logo/logo-symbol-dark.svg" : "/logo/logo-symbol-light.svg";

  // Helper for localized title
  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return (
      textObj[locale] ||
      textObj.sk ||
      textObj.en ||
      textObj.cs ||
      Object.values(textObj)[0] ||
      ""
    );
  };

  // Resolve target link URL
  const getPageHref = (slug: string) => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/manual/")) {
        return `/manual/${domain}/${locale}/${slug}`;
      }
    }
    return `/m/${domain}/${slug}`;
  };

  // Search filtering for the top header
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return pages.filter((p) => {
      const title = getLocalized(p.title).toLowerCase();
      const slug = p.slug.toLowerCase();
      return title.includes(q) || slug.includes(q);
    });
  }, [pages, searchQuery, locale]);

  // Click outside listener for search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close search dropdown on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNavDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      data-theme={isDarkBg ? "dark" : "light"}
      style={{
        backgroundColor: "var(--brand-manual-bg, var(--background))",
        color: "var(--foreground)",
        colorScheme: isDarkBg ? "dark" : "light",
      }}
      className={`${isDarkBg ? "dark" : "light"} min-h-screen flex flex-col text-foreground selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors`}
    >
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 h-18 border-b border-border/50 bg-card/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Title / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/manual/${domain}/${locale}`}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            {brand.headerLogoUrl ? (
              <img
                src={brand.headerLogoUrl}
                alt={brand.name}
                className="h-9 w-auto max-w-[140px] sm:max-w-[200px] object-contain"
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

        {/* Center: Search Input in Top Bar */}
        {pages.length > 0 && (
          <div
            ref={searchRef}
            className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-4"
          >
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-4 h-4">
                <Search className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              </div>
              <input
                type="text"
                placeholder={
                  locale === "sk"
                    ? "Hľadať v manuáli..."
                    : locale === "cs"
                    ? "Hledat v manuálu..."
                    : "Search manual..."
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                style={{
                  paddingLeft: "2.75rem",
                  paddingRight: "2.25rem",
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  borderColor: "var(--border)",
                }}
                className="w-full py-2 text-xs border rounded-[3px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Dropdown Results with Solid Background */}
            {searchOpen && searchQuery.trim() && (
              <div
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  borderColor: "var(--border)",
                }}
                className="absolute top-full left-0 right-0 mt-1.5 border rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto p-1.5 space-y-1"
              >
                <div
                  className="px-2.5 py-1 text-[10px] font-mono uppercase"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {locale === "sk"
                    ? `Výsledky hľadania (${searchResults.length})`
                    : locale === "cs"
                    ? `Výsledky hledání (${searchResults.length})`
                    : `Search Results (${searchResults.length})`}
                </div>
                {searchResults.length === 0 ? (
                  <div
                    className="px-3 py-4 text-center text-xs italic"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {locale === "sk"
                      ? "Nenašli sa žiadne stránky."
                      : locale === "cs"
                      ? "Nebyly nalezeny žádné stránky."
                      : "No pages found."}
                  </div>
                ) : (
                  searchResults.map((page) => (
                    <Link
                      key={page.id}
                      href={getPageHref(page.slug || page.id)}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      style={{ color: "var(--foreground)" }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors group cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {getLocalized(page.title) || page.slug}
                        </div>
                        <div
                          className="text-[10px] font-mono truncate"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          /{page.slug}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Right: Language switcher & Slide-out Navigation Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageSwitcher currentLocale={locale as Locale} />

          {pages.length > 0 && (
            <button
              type="button"
              onClick={() => setNavDrawerOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-border/60 hover:border-border hover:bg-muted/50 text-foreground flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              aria-label="Open manual navigation"
              title="Otvoriť navigáciu manuálu"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">
                {locale === "sk" ? "Kapitoly" : locale === "cs" ? "Kapitoly" : "Pages"}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Body Layout (Left static column removed for full-width content, max-w-7xl = 1280px) */}
      <div className="flex-1 flex w-full">
        <main className="flex-1 min-w-0 p-6 sm:p-10 md:p-14 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Slide-out Navigation Drawer from the RIGHT with Solid Opaque Background */}
      {navDrawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setNavDrawerOpen(false)}
          />

          {/* Drawer content sliding from the RIGHT */}
          <div
            style={{
              backgroundColor: "var(--card)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
            }}
            className="fixed inset-y-0 right-0 w-80 max-w-[85vw] border-l p-0 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200"
          >
            <div
              style={{
                backgroundColor: "var(--card)",
                borderBottomColor: "var(--border)",
                color: "var(--foreground)",
              }}
              className="p-4 border-b flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "var(--brand-color-primary, #c8d400)" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--foreground)" }}
                >
                  {locale === "sk" ? "Navigácia manuálu" : locale === "cs" ? "Navigace manuálu" : "Manual Navigation"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNavDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors"
                style={{ color: "var(--foreground)" }}
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
                onPageSelect={() => setNavDrawerOpen(false)}
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
            <div className="pt-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
              <span>Vytvorené na</span>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-foreground transition-all duration-150 group"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={logobookSymbolSrc}
                  alt="Logobook.sk"
                  className="h-5 w-5 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
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
