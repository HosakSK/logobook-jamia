"use client";

import { useState, useTransition } from "react";
import { updateBrandGeneralAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dictionary } from "@/lib/i18n";
import { Check, AlertCircle, Loader2, Lock, Globe, Key, EyeOff } from "lucide-react";

interface BrandGeneralFormProps {
  brand: {
    id: string;
    name: string;
    slug: string;
    customDomain?: string;
    isDomainVerified?: boolean;
    hideLogobookBadge?: boolean;
    hasPassword?: boolean;
    description?: {
      metaTitle?: string;
      metaDescription?: string;
    };
  };
  userTier: string;
  dict: Dictionary;
}

export function BrandGeneralForm({ brand, userTier, dict }: BrandGeneralFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [removePassword, setRemovePassword] = useState<boolean>(false);
  const [hasPasswordState, setHasPasswordState] = useState<boolean>(!!brand.hasPassword);

  const tier = userTier.toUpperCase();
  const canCustomDomain = tier !== "FREE";
  const canPasswordProtect = tier !== "FREE";
  const canHideBadge = tier === "AGENCY" || tier === "PLATINUM";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    if (removePassword) {
      formData.set("removePassword", "true");
    }

    startTransition(async () => {
      const res = await updateBrandGeneralAction(brand.id, null, formData);
      if (res.success) {
        setSuccess(true);
        if (removePassword) {
          setHasPasswordState(false);
          setRemovePassword(false);
        }
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Failed to update brand settings");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border/40 rounded-2xl bg-card p-6 sm:p-8 shadow-sm space-y-8">
      <div className="border-b border-border/30 pb-5">
        <h2 className="text-lg font-bold text-foreground">{dict.admin.generalSettings}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Nastavte základné parametre manuálu, URL adresu a SEO optimalizáciu.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-xl">
          <Check className="h-4 w-4 shrink-0" />
          <span>{dict.admin.changesSaved}</span>
        </div>
      )}

      {/* Basic Info: Name & Slug */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
            {dict.admin.brandNameLabel}
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={brand.name}
            required
            className="h-10 text-xs rounded-xl bg-background/50 border-border/60"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-xs font-semibold text-muted-foreground">
            {dict.admin.brandSlugLabel}
          </Label>
          <div className="flex items-center">
            <Input
              id="slug"
              name="slug"
              defaultValue={brand.slug}
              required
              className="h-10 text-xs rounded-r-none rounded-l-xl bg-background/50 border-border/60 font-mono"
            />
            <span className="h-10 px-3.5 bg-muted/60 border border-l-0 border-border/60 rounded-r-xl text-xs text-muted-foreground flex items-center font-mono">
              .logobook.sk
            </span>
          </div>
        </div>
      </div>

      {/* SEO Section */}
      <div className="pt-4 border-t border-border/30 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {dict.admin.seoFavicon}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle" className="text-xs font-semibold text-muted-foreground">
              {dict.admin.metaTitleLabel}
            </Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={brand.description?.metaTitle || ""}
              placeholder={`${brand.name} – Online Brand Manual`}
              className="h-10 text-xs rounded-xl bg-background/50 border-border/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription" className="text-xs font-semibold text-muted-foreground">
              {dict.admin.metaDescLabel}
            </Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              rows={3}
              defaultValue={brand.description?.metaDescription || ""}
              placeholder="Oficiálne pravidlá používania vizuálnej identity, logá a dizajnové prvky..."
              className="text-xs rounded-xl bg-background/50 border-border/60 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Subscription Tier Gated Features */}
      <div className="pt-4 border-t border-border/30 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {dict.admin.tierFeatures}
          </h3>
        </div>

        {/* 1. Custom Domain */}
        <div className={`p-5 sm:p-6 rounded-xl border ${canCustomDomain ? "border-border/60 bg-background/30" : "border-border/30 bg-muted/20 opacity-75"} space-y-3`}>
          <div className="flex items-center justify-between">
            <Label htmlFor="customDomain" className="text-xs font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {dict.admin.customDomainLabel}
            </Label>
            {!canCustomDomain && (
              <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Vyžaduje balíček Company
              </span>
            )}
          </div>
          <Input
            id="customDomain"
            name="customDomain"
            defaultValue={brand.customDomain || ""}
            disabled={!canCustomDomain}
            placeholder="brand.vasafirma.sk"
            className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {dict.admin.customDomainHint}
          </p>
        </div>

        {/* 2. Password Protection */}
        <div className={`p-5 sm:p-6 rounded-xl border ${canPasswordProtect ? "border-border/60 bg-background/30" : "border-border/30 bg-muted/20 opacity-75"} space-y-3`}>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              {dict.admin.passwordProtectLabel}
            </Label>
            {!canPasswordProtect ? (
              <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Vyžaduje balíček Company
              </span>
            ) : hasPasswordState ? (
              <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Aktívne zaheslované
              </span>
            ) : null}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="password"
              name="password"
              type="password"
              disabled={!canPasswordProtect}
              placeholder={hasPasswordState ? "•••••••• (Zadajte nové pre zmenu)" : "Zadajte heslo..."}
              className="h-10 text-xs rounded-xl bg-background/50 border-border/60 flex-1"
            />
            {canPasswordProtect && hasPasswordState && (
              <Button
                type="button"
                variant="destructive"
                size="default"
                onClick={() => setRemovePassword(true)}
                className={`whitespace-nowrap shrink-0 ${removePassword ? "opacity-50" : ""}`}
              >
                <EyeOff className="h-4 w-4" />
                <span>{removePassword ? "Bude odstránené po uložení" : dict.admin.removePasswordButton}</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {dict.admin.passwordProtectHint}
          </p>
        </div>

        {/* 3. Hide Logobook Badge (Whitelabel) */}
        <div className={`p-5 sm:p-6 rounded-xl border ${canHideBadge ? "border-border/60 bg-background/30" : "border-border/30 bg-muted/20 opacity-75"} flex items-center justify-between gap-6`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Label htmlFor="hideLogobookBadge" className="text-xs font-semibold cursor-pointer">
                {dict.admin.hideBadgeLabel}
              </Label>
              {!canHideBadge && (
                <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Vyžaduje balíček Agency
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dict.admin.hideBadgeHint}
            </p>
          </div>
          <input
            id="hideLogobookBadge"
            name="hideLogobookBadge"
            type="checkbox"
            value="true"
            defaultChecked={brand.hideLogobookBadge}
            disabled={!canHideBadge}
            className="h-5 w-5 rounded-md border-border/60 text-[#c8d400] focus:ring-[#c8d400] cursor-pointer shrink-0 accent-[#c8d400]"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="shadow-md"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {dict.admin.saving}
            </>
          ) : (
            dict.admin.saveChanges
          )}
        </Button>
      </div>
    </form>
  );
}
