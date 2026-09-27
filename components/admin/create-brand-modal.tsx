"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrandStore } from "@/lib/store/brand-store";
import { createBrandAction } from "@/actions/brand";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import { Plus, Lock, X, Loader2, Sparkles, AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface CreateBrandModalProps {
  userTier?: string;
  ownedBrandsCount: number;
  maxBrands: number;
  locale?: Locale;
}

export function CreateBrandModal({
  userTier = "FREE",
  ownedBrandsCount,
  maxBrands,
  locale = DEFAULT_LOCALE,
}: CreateBrandModalProps) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const { setActiveBrand } = useBrandStore();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLimitReached = ownedBrandsCount >= maxBrands;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugTouched) {
      // Auto-generate kebab slug
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("slug", slug);
      if (description) formData.set("description", description);

      const res = await createBrandAction(null, formData);

      if (res.success && res.brand) {
        // Set new active brand in Zustand store
        setActiveBrand({
          id: res.brand.id,
          slug: res.brand.slug,
          name: res.brand.name,
        });
        setIsOpen(false);
        router.push(`/admin/brand/${res.brand.id}`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create brand");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        size="sm"
        className="gap-2 text-xs font-semibold shadow-xs"
        variant={isLimitReached ? "secondary" : "default"}
      >
        {isLimitReached ? (
          <>
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{dict.admin.newBrand}</span>
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            <span>{dict.admin.newBrand}</span>
          </>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#070b0f]/80 backdrop-blur-xs transition-opacity animate-in fade-in-50"
            onClick={() => !loading && setIsOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-lg bg-[#2b3b48] border border-[rgba(63,85,102,0.6)] rounded-[3px] shadow-2xl p-6 z-10 space-y-6 text-[#fafbfc] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-[3px] bg-primary text-primary-foreground flex items-center justify-center">
                  {isLimitReached ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {isLimitReached
                      ? dict.admin.planLimitTitle
                      : dict.admin.createBrandModalTitle}
                  </h3>
                  <p className="text-xs text-[#96abbe] font-light">
                    {isLimitReached
                      ? `${userTier} Plan (${ownedBrandsCount}/${maxBrands} brands)`
                      : dict.admin.createBrandModalDesc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !loading && setIsOpen(false)}
                className="p-1 rounded-[3px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLimitReached ? (
              /* Up-sell Plan Limit Screen */
              <div className="space-y-5 py-2">
                <div className="p-4 rounded-[3px] bg-[#17212a] border border-border/60 text-xs space-y-2">
                  <p className="text-[#fafbfc] font-medium leading-relaxed">
                    {dict.admin.planLimitDesc}
                  </p>
                  <p className="text-muted-foreground">
                    Current plan: <strong className="text-foreground">{userTier}</strong> ({ownedBrandsCount}/{maxBrands} slots occupied).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    {dict.common.cancel}
                  </Button>
                  <Button asChild size="sm" className="gap-1.5 font-bold">
                    <Link href="/admin/billing" onClick={() => setIsOpen(false)}>
                      <span>{dict.admin.upgradePlan}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              /* Brand Creation Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-[3px] bg-[#bb4934]/15 border border-[#bb4934]/40 text-[#fafbfc] text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#bb4934]" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {dict.admin.brandNameLabel} <span className="text-primary">*</span>
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={dict.admin.brandNamePlaceholder}
                    disabled={loading}
                    maxLength={60}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {dict.admin.brandSlugLabel} <span className="text-primary">*</span>
                  </label>
                  <Input
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                    placeholder={dict.admin.brandSlugPlaceholder}
                    disabled={loading}
                    maxLength={40}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {dict.admin.brandSlugPreview}{" "}
                    <span className="font-mono text-primary font-medium">
                      {slug || "your-brand"}.logobook.sk
                    </span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {dict.admin.brandDescLabel}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={dict.admin.brandDescPlaceholder}
                    disabled={loading}
                    rows={3}
                    maxLength={300}
                    className="w-full rounded-[3px] border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    onClick={() => setIsOpen(false)}
                  >
                    {dict.common.cancel}
                  </Button>
                  <Button type="submit" size="sm" disabled={loading || !name.trim() || !slug.trim()}>
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {dict.admin.creatingBrand}
                      </span>
                    ) : (
                      dict.admin.createBrandButton
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
