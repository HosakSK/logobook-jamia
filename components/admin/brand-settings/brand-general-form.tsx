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
  const canHideBadge = tier === "FREELANCER" || tier === "AGENCY" || tier === "PLATINUM";

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
    <form onSubmit={handleSubmit} className="border border-border/40 rounded-[3px] bg-card p-6 shadow-xs space-y-6">
      <div className="border-b border-border/30 pb-4">
        <h2 className="text-base font-bold text-foreground">{dict.admin.generalSettings}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Nastavte základné parametre manuálu, URL adresu a SEO optimalizáciu.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-[3px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-[3px]">
          <Check className="h-4 w-4 shrink-0" />
          <span>{dict.admin.changesSaved}</span>
        </div>
      )}

      {/* Basic Info: Name & Slug */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold">
            {dict.admin.brandNameLabel}
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={brand.name}
            required
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug" className="text-xs font-semibold">
            {dict.admin.brandSlugLabel}
          </Label>
          <div className="flex items-center">
            <Input
              id="slug"
              name="slug"
              defaultValue={brand.slug}
              required
              className="h-9 text-xs rounded-r-none rounded-l-[3px] bg-background/50 border-border/60 font-mono"
            />
            <span className="h-9 px-3 bg-muted/60 border border-l-0 border-border/60 rounded-r-[3px] text-xs text-muted-foreground flex items-center font-mono">
              .logobook.sk
            </span>
          </div>
        </div>
      </div>

      {/* SEO Section */}
      <div className="pt-2 border-t border-border/30 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {dict.admin.seoFavicon}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="metaTitle" className="text-xs font-semibold">
              {dict.admin.metaTitleLabel}
            </Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={brand.description?.metaTitle || ""}
              placeholder={`${brand.name} – Online Brand Manual`}
              className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="metaDescription" className="text-xs font-semibold">
              {dict.admin.metaDescLabel}
            </Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              defaultValue={brand.description?.metaDescription || ""}
              placeholder="Oficiálne pravidlá používania vizuálnej identity, logá a dizajnové prvky..."
              className="text-xs rounded-[3px] bg-background/50 border-border/60"
            />
          </div>
        </div>
      </div>

      {/* Subscription Tier Gated Features */}
      <div className="pt-2 border-t border-border/30 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {dict.admin.tierFeatures}
          </h3>
        </div>

        {/* 1. Custom Domain */}
        <div className={`p-4 rounded-[3px] border ${canCustomDomain ? "border-border/60 bg-background/30" : "border-border/30 bg-muted/20 opacity-75"} space-y-2`}>
          <div className="flex items-center justify-between">
            <Label htmlFor="customDomain" className="text-xs font-semibold flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              {dict.admin.customDomainLabel}
            </Label>
            {!canCustomDomain && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[3px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Vyžaduje balíček Company
              </span>
            )}
          </div>
          <Input
            id="customDomain"
            name="customDomain"
            defaultValue={brand.customDomain || ""}
            disabled={!canCustomDomain}
            placeholder="brand.vasafirma.sk"
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60 font-mono"
          />
          <p className="text-[11px] text-muted-foreground">
            {dict.admin.customDomainHint}
          </p>
        </div>

        {/* 2. Password Protection */}
        <div className={`p-4 rounded-[3px] border ${canPasswordProtect ? "border-border/60 bg-background/30" : "border-border/30 bg-muted/20 opacity-75"} space-y-2`}>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-primary" />
              {dict.admin.passwordProtectLabel}
            </Label>
            {!canPasswordProtect ? (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[3px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Vyžaduje balíček Company
              </span>
            ) : hasPasswordState ? (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[3px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Aktívne zaheslované
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Input
              id="password"
              name="password"
              type="password"
              disabled={!canPasswordProtect}
              placeholder={hasPasswordState ? "•••••••• (Zadajte nové pre zmenu)" : "Zadajte heslo..."}
              className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
            />
            {canPasswordProtect && hasPasswordState && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setRemovePassword(true)}
                className={`h-9 px-3 text-xs rounded-[3px] whitespace-nowrap ${removePassword ? "opacity-50" : ""}`}
              >
                <EyeOff className="h-3.5 w-3.5 mr-1" />
                {removePassword ? "Bude odstránené po uložení" : dict.admin.removePasswordButton}
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {dict.admin.passwordProtectHint}
          </p>
        </div>

        {/* 3. Hide Logobook Badge (Whitelabel) */}
        <div className={`p-4 rounded-[3px] border ${canHideBadge ? "border-border/60 bg-background/30" : "border-border/30 bg-muted/20 opacity-75"} flex items-center justify-between gap-4`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="hideLogobookBadge" className="text-xs font-semibold cursor-pointer">
                {dict.admin.hideBadgeLabel}
              </Label>
              {!canHideBadge && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[3px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Vyžaduje balíček Freelancer
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
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
            className="h-4 w-4 rounded-[3px] border-border/60 text-[#c8d400] focus:ring-[#c8d400] cursor-pointer"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="h-9 px-5 bg-[#c8d400] text-[#070b0f] font-semibold hover:bg-[#b5c000] rounded-[3px] text-xs transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
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
