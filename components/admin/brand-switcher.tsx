"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBrandStore, ActiveBrand } from "@/lib/store/brand-store";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import { ChevronsUpDown, Check, Plus, ExternalLink, Sparkles } from "lucide-react";

interface BrandSwitcherProps {
  availableBrands?: ActiveBrand[];
  locale?: Locale;
}

export function BrandSwitcher({
  availableBrands = [
    { id: "demo", slug: "demo", name: "Logobook Global Design System" },
  ],
  locale = DEFAULT_LOCALE,
}: BrandSwitcherProps) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const { activeBrand, setActiveBrand } = useBrandStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (brand: ActiveBrand) => {
    setActiveBrand(brand);
    setIsOpen(false);
    router.push(`/admin/brand/${brand.id}`);
  };

  const currentBrand = activeBrand || availableBrands[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[3px] border border-border bg-card hover:bg-elevated transition-colors text-left shadow-2xs cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="h-6 w-6 rounded-[3px] bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
            {currentBrand.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-foreground truncate">
              {currentBrand.name}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {currentBrand.slug}.logobook.sk
            </div>
          </div>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-[3px] shadow-lg bg-surface border border-border z-50 py-1.5 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {dict.admin.brandsListTitle}
          </div>

          <div className="py-1">
            {availableBrands.map((brand) => {
              const isSelected = activeBrand?.id === brand.id;
              return (
                <button
                  key={brand.id}
                  onClick={() => handleSelect(brand)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-elevated text-primary font-semibold"
                      : "text-muted-foreground hover:bg-elevated/60 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="h-5 w-5 rounded-[3px] bg-secondary border border-border flex items-center justify-center font-bold text-[9px]">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{brand.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border pt-1.5 mt-1 px-1">
            <Link
              href={`/m/${currentBrand.slug}`}
              target="_blank"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-elevated rounded-[3px] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{dict.admin.viewLiveManual}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
