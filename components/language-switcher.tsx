"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LOCALE_METADATA, SUPPORTED_LOCALES, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LanguageSwitcherProps {
  currentLocale?: Locale;
  className?: string;
}

export function LanguageSwitcher({ currentLocale = DEFAULT_LOCALE, className = "" }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocale = (newLocale: Locale) => {
    setIsOpen(false);

    // 1. Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // 2. Check if current pathname has locale segment (e.g. /manual/demo/en or /m/demo/en)
    const segments = pathname.split("/");
    const localeIndex = segments.findIndex((seg) => SUPPORTED_LOCALES.includes(seg as Locale));

    let newPath = pathname;
    if (localeIndex !== -1) {
      segments[localeIndex] = newLocale;
      newPath = segments.join("/");
    }

    // 3. Update query param if present
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", newLocale);

    router.push(`${newPath}?${params.toString()}`);
    router.refresh();
  };

  const currentMeta = LOCALE_METADATA[currentLocale] || LOCALE_METADATA[DEFAULT_LOCALE];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-white transition-all cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{currentMeta.flag}</span>
        <span className="uppercase font-semibold tracking-wider font-mono text-[11px]">{currentLocale}</span>
        <Globe className="w-3.5 h-3.5 text-muted-foreground/70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl shadow-2xl bg-[#0e1520]/95 backdrop-blur-2xl border border-white/[0.08] z-50 p-1 animate-in fade-in-50 zoom-in-95">
          <div className="space-y-0.5">
            {SUPPORTED_LOCALES.map((locale) => {
              const meta = LOCALE_METADATA[locale];
              const isSelected = locale === currentLocale;
              return (
                <button
                  key={locale}
                  onClick={() => handleSelectLocale(locale)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{meta.flag}</span>
                    <span className="text-xs">{meta.nativeName}</span>
                  </div>
                  <span className="uppercase text-[10px] font-mono text-muted-foreground/60">{locale}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
