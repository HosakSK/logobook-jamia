"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBrandStore, ActiveBrand } from "@/lib/store/brand-store";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import { getBrandPublicUrl } from "@/lib/domains";
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
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="h-6 w-6 rounded-md bg-primary text-black flex items-center justify-center font-bold text-[10px] shrink-0 shadow-[0_0_10px_rgba(200,212,0,0.15)]">
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
        <div className="absolute left-0 mt-1.5 w-64 rounded-xl shadow-2xl bg-[#1f2c36]/98 backdrop-blur-2xl border border-[#2b3b48] z-50 p-1.5 animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {dict.admin.brandsListTitle}
          </div>

          <div className="py-1 space-y-0.5">
            {availableBrands.map((brand) => {
              const isSelected = activeBrand?.id === brand.id;
              return (
                <button
                  key={brand.id}
                  onClick={() => handleSelect(brand)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="h-5 w-5 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-bold text-[9px] text-foreground">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{brand.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/[0.08] pt-1.5 mt-1">
            <a
              href={getBrandPublicUrl(currentBrand.slug)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{dict.admin.viewLiveManual}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
