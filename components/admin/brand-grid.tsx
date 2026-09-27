"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrandStore } from "@/lib/store/brand-store";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import {
  ExternalLink,
  Search,
  FolderKanban,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
  Globe,
  Shield,
  Layers,
} from "lucide-react";

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  isDomainVerified?: boolean;
  status: "LIVE" | "DEV" | "ARCHIVED" | string;
  role: "OWNER" | "EDITOR" | "VIEWER" | string;
  description?: string;
  updated?: string;
}

interface BrandGridProps {
  brands: BrandItem[];
  locale?: Locale;
}

export function BrandGrid({ brands, locale = DEFAULT_LOCALE }: BrandGridProps) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const { setActiveBrand, activeBrand } = useBrandStore();
  const [search, setSearch] = useState("");

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      (b.customDomain && b.customDomain.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectBrand = (brand: BrandItem) => {
    setActiveBrand({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
    });
    router.push(`/admin/brand/${brand.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Row */}
      {brands.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.admin.searchPlaceholder}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground font-light">
            {dict.admin.brandCount}: <strong className="text-foreground font-semibold">{filteredBrands.length}</strong> / {brands.length}
          </div>
        </div>
      )}

      {/* Grid of Brand Cards */}
      {filteredBrands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBrands.map((brand) => {
            const isSelected = activeBrand?.id === brand.id;
            const isOwner = brand.role === "OWNER";
            const isLive = brand.status === "LIVE";
            const initials = brand.name.slice(0, 2).toUpperCase();

            return (
              <div
                key={brand.id}
                className={`card-dark p-5 rounded-[3px] space-y-4 hover:border-primary/50 transition-all flex flex-col justify-between group ${
                  isSelected ? "border-primary/40 ring-1 ring-primary/30" : ""
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Avatar monogram, Status Badge, Role */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[3px] bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-sm shadow-xs">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-foreground leading-tight group-hover:text-primary transition-colors">
                          {brand.name}
                        </h3>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {brand.slug}.logobook.sk
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#009f80]/15 text-[#009f80] border border-[#009f80]/30 px-2 py-0.5 rounded-[3px]">
                          <CheckCircle2 className="h-3 w-3" />
                          {dict.admin.statusLive}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#c8d400]/15 text-[#c8d400] border border-[#c8d400]/30 px-2 py-0.5 rounded-[3px]">
                          <Clock className="h-3 w-3" />
                          {dict.admin.statusDev}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {isOwner ? dict.admin.roleOwner : dict.admin.roleEditor}
                      </span>
                    </div>
                  </div>

                  {/* Custom domain if verified */}
                  {brand.customDomain && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-[11px] text-foreground">
                        {brand.customDomain}
                      </span>
                    </div>
                  )}

                  {/* Description snippet */}
                  {brand.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 font-light leading-relaxed">
                      {brand.description}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <Link
                    href={`/m/${brand.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{dict.admin.viewManual}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "secondary"}
                    onClick={() => handleSelectBrand(brand)}
                    className="gap-1 text-xs"
                  >
                    <span>{dict.admin.editBrand}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : brands.length > 0 ? (
        /* Search has no matches */
        <div className="card-dark p-12 text-center rounded-[3px] space-y-3">
          <p className="text-sm text-muted-foreground">
            No brand manuals matched &ldquo;{search}&rdquo;.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
            Clear search filter
          </Button>
        </div>
      ) : (
        /* Empty State: Zero brands in workspace */
        <div className="card-dark p-12 text-center rounded-[3px] space-y-4 max-w-xl mx-auto my-8">
          <div className="h-14 w-14 rounded-[3px] bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center">
            <Layers className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-foreground">
              {dict.admin.emptyTitle}
            </h3>
            <p className="text-xs text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
              {dict.admin.emptyDesc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
