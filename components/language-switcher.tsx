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
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-xs"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{currentMeta.flag}</span>
        <span className="uppercase font-semibold tracking-wider">{currentLocale}</span>
        <Globe className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-md shadow-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 z-50 py-1">
          {SUPPORTED_LOCALES.map((locale) => {
            const meta = LOCALE_METADATA[locale];
            const isSelected = locale === currentLocale;
            return (
              <button
                key={locale}
                onClick={() => handleSelectLocale(locale)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{meta.flag}</span>
                  <span>{meta.nativeName}</span>
                </div>
                <span className="uppercase text-[10px] text-neutral-400">{locale}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
