"use client";

import { useState, useTransition, useEffect } from "react";
import Script from "next/script";
import { PRICING_PLANS, PricingPlan, UsageStats } from "@/lib/constants/billing";
import { requestUpgradeAction, simulateDevUpgradeAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n";
import { Check, X, HardDrive, FolderKanban, Sparkles, Loader2, ArrowRight, ExternalLink, Terminal } from "lucide-react";

interface BillingViewProps {
  stats: UsageStats;
  dict: Dictionary;
}

export function BillingView({ stats, dict }: BillingViewProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentTier = stats.tier.toUpperCase();

  // Initialize Lemon.js overlay listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window as any;
      if (w.createLemonSqueezy) {
        w.createLemonSqueezy();
      }
      if (w.LemonSqueezy?.Setup) {
        w.LemonSqueezy.Setup({
          eventHandler: (event: any) => {
            if (event?.event === "Checkout.Success") {
              setFeedback("Platba bola úspešne dokončená! Aktualizujem váš profil...");
              setTimeout(() => window.location.reload(), 2000);
            }
          },
        });
      }
    }
  }, []);

  // Storage calculations
  const isStorageUnlimited = stats.storageMaxMb >= 999999;
  const storagePercent = isStorageUnlimited
    ? 0
    : Math.min(100, Math.round((stats.storageUsedMb / stats.storageMaxMb) * 100));
  const storageRemainingMb = isStorageUnlimited
    ? "Neobmedzené"
    : Math.max(0, stats.storageMaxMb - stats.storageUsedMb).toFixed(1);

  // Brand calculations
  const isBrandsUnlimited = stats.brandsMax >= 999999;
  const brandsPercent = isBrandsUnlimited
    ? 0
    : Math.min(100, Math.round((stats.brandsUsed / stats.brandsMax) * 100));
  const brandsRemaining = isBrandsUnlimited
    ? "Neobmedzené"
    : Math.max(0, stats.brandsMax - stats.brandsUsed);

  const handleUpgrade = (plan: PricingPlan) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await requestUpgradeAction(plan.id, billingCycle);
      if (res.success && res.checkoutUrl) {
        setFeedback(res.message);
        const w = window as any;
        if (typeof window !== "undefined" && w.LemonSqueezy?.Url) {
          w.LemonSqueezy.Url.Open(res.checkoutUrl);
        } else {
          window.open(res.checkoutUrl, "_blank");
        }
      } else {
        setFeedback(res.message);
      }
    });
  };

  const handleSimulateDevUpgrade = (targetTier: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await simulateDevUpgradeAction(targetTier);
      setFeedback(res.message);
      if (res.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="p-4 text-xs bg-[#c8d400]/15 border border-[#c8d400]/30 text-[#c8d400] rounded-[3px] flex items-center justify-between gap-3 animate-in fade-in-0">
          <span>{feedback} (Lemon Squeezy integrácia pripravená)</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-foreground hover:opacity-75 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Usage Quotas Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Storage Quota */}
        <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-6 bg-[#17212a] text-[#fafbfc] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#96abbe] flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-[#c8d400]" />
              {dict.admin.storageUsage}
            </span>
            <span className="px-2 py-0.5 rounded-[3px] bg-[#070b0f] text-[10px] font-mono font-bold text-[#fafbfc] border border-[rgba(63,85,102,0.5)]">
              {currentTier}
            </span>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-[#fafbfc] font-mono">
              {stats.storageUsedMb} MB{" "}
              <span className="text-xs font-normal text-[#96abbe]">
                / {isStorageUnlimited ? "Neobmedzene" : `${stats.storageMaxMb} MB`}
              </span>
            </div>
            <p className="text-[11px] text-[#96abbe] mt-0.5">
              {isStorageUnlimited
                ? "Máte k dispozícii neobmedzený priestor pre súbory a assety."
                : `Zostáva ${storageRemainingMb} MB voľného úložiska pre logá a exporty.`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.5)] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                storagePercent >= 90 ? "bg-amber-400" : "bg-[#c8d400]"
              }`}
              style={{ width: isStorageUnlimited ? "5%" : `${storagePercent}%` }}
            />
          </div>
        </div>

        {/* Brands Project Quota */}
        <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-6 bg-[#17212a] text-[#fafbfc] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#96abbe] flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4 text-[#c8d400]" />
              {dict.admin.brandCount}
            </span>
            <span className="px-2 py-0.5 rounded-[3px] bg-[#070b0f] text-[10px] font-mono font-bold text-[#fafbfc] border border-[rgba(63,85,102,0.5)]">
              {currentTier}
            </span>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-[#fafbfc] font-mono">
              {stats.brandsUsed}{" "}
              <span className="text-xs font-normal text-[#96abbe]">
                / {isBrandsUnlimited ? "Neobmedzene" : stats.brandsMax}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isBrandsUnlimited
                ? "Môžete vytvárať neobmedzené množstvo klientskych manuálov."
                : `Využité ${stats.brandsUsed} z ${stats.brandsMax} projektov (zostáva ${brandsRemaining}).`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-900 border border-border/40 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                brandsPercent >= 90 ? "bg-amber-400" : "bg-[#c8d400]"
              }`}
              style={{ width: isBrandsUnlimited ? "5%" : `${brandsPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Pricing Table Header & Billing Cycle Switcher */}
      <div className="pt-6 border-t border-border/30 space-y-4 text-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Plány a predplatné</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Vyberte si balíček, ktorý najlepšie vyhovuje vašim potrebám alebo tímu.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="inline-flex items-center p-1 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)]">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-[3px] transition-colors ${
              billingCycle === "monthly"
                ? "bg-[#c8d400] text-[#070b0f]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mesačne
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-[3px] transition-colors flex items-center gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-[#c8d400] text-[#070b0f]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Ročne</span>
            <span className="px-1.5 py-0.2 rounded-[3px] bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              -20 %
            </span>
          </button>
        </div>
      </div>

      {/* 3. Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const displayPrice =
            billingCycle === "yearly" ? plan.priceYearlyPerMonth : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`border rounded-[3px] p-5 flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? "border-[#c8d400] bg-[#17212a] text-[#fafbfc] shadow-md ring-1 ring-[#c8d400]/40"
                  : plan.popular
                  ? "border-[#009f80] bg-[#17212a] text-[#fafbfc] shadow-xs"
                  : "border-[rgba(63,85,102,0.45)] bg-[#17212a] text-[#fafbfc] hover:border-[rgba(63,85,102,0.7)]"
              }`}
            >
              {/* Badges */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-[3px] bg-[#c8d400] text-[#070b0f] text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  Váš aktuálny plán
                </div>
              )}
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-[3px] bg-[#009f80] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Najpopulárnejší
                </div>
              )}

              <div className="space-y-4">
                {/* Plan Header */}
                <div className="border-b border-border/30 pb-4 pt-1">
                  <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-extrabold text-foreground">
                      €{displayPrice === 0 ? "0" : displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 2)}
                    </span>
                    <span className="text-xs text-muted-foreground font-sans">/ mesiac</span>
                  </div>
                  {billingCycle === "yearly" && plan.priceYearly > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Fakturované ročne €{plan.priceYearly}
                    </p>
                  )}
                </div>

                {/* Capacity Limits */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Manuály:</span>
                    <span className="font-bold font-mono text-foreground">
                      {plan.maxBrands >= 999999 ? "Neobmedzene" : plan.maxBrands}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Úložisko:</span>
                    <span className="font-bold font-mono text-foreground">
                      {plan.storageMb >= 999999
                        ? "Neobmedzene"
                        : plan.storageMb >= 1000
                        ? `${plan.storageMb / 1000} GB`
                        : `${plan.storageMb} MB`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tím (Sedadlá):</span>
                    <span className="font-bold font-mono text-foreground">
                      {plan.teamSeats >= 999999
                        ? "Neobmedzene"
                        : plan.teamSeats === 1
                        ? "1 (iba vlastník)"
                        : `${plan.teamSeats} členovia`}
                    </span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="pt-3 border-t border-border/30 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {plan.features.customDomain ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={plan.features.customDomain ? "text-foreground" : "text-muted-foreground/60"}>
                      Vlastná doména (CNAME)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.passwordProtect ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={plan.features.passwordProtect ? "text-foreground" : "text-muted-foreground/60"}>
                      Ochrana heslom
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.watermark === "custom" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={plan.features.watermark === "custom" ? "text-foreground" : "text-muted-foreground/60"}>
                      White-label (Vlastné logo)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.agencyDefaults ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={plan.features.agencyDefaults ? "text-foreground" : "text-muted-foreground/60"}>
                      Agentúrne šablóny
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.figmaTokens ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={plan.features.figmaTokens ? "text-foreground" : "text-muted-foreground/60"}>
                      Figma Tokens (`tokens.json`)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.features.offlineZip ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={plan.features.offlineZip ? "text-foreground" : "text-muted-foreground/60"}>
                      Offline HTML/ZIP Export
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {isCurrent ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full h-9 text-xs rounded-[3px] border-border/60 opacity-60"
                  >
                    Aktuálny plán
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpgrade(plan)}
                    className={`w-full h-9 text-xs font-semibold rounded-[3px] transition-colors gap-1.5 ${
                      plan.popular
                        ? "bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000]"
                        : "bg-neutral-800 text-foreground hover:bg-neutral-700"
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Zvoliť {plan.name}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Lemon Squeezy Sandbox & Dev Testing Panel */}
      <div className="border border-dashed border-[rgba(63,85,102,0.5)] rounded-[3px] p-5 bg-[#17212a] text-[#fafbfc] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#c8d400]" />
            <h3 className="text-xs font-bold text-foreground font-mono">
              Lemon Squeezy Sandbox &amp; Testovací režim
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-neutral-900 border border-border/40 text-muted-foreground">
            Testovacie odomykanie funkcií
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Pre otestovanie odomykania prémiových funkcií v aplikácii (vlastná doména, ochrana heslom, offline ZIP, neobmedzené tiery)
          môžete okamžite prepnúť svoj účet do ľubovoľného tieru bez nutnosti zadávať skutočnú platobnú kartu.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {(["FREE", "COMPANY", "FREELANCER", "AGENCY", "PLATINUM"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant={currentTier === t ? "default" : "outline"}
              size="sm"
              disabled={isPending || currentTier === t}
              onClick={() => handleSimulateDevUpgrade(t)}
              className="h-7 text-xs font-mono rounded-[2px] cursor-pointer"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {t} {currentTier === t ? "✓ (Aktuálny)" : ""}
            </Button>
          ))}
        </div>
      </div>

      {/* Embedded Lemon.js Script */}
      <Script
        src="https://assets.lemonsqueezy.com/lemon.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && (window as any).createLemonSqueezy) {
            (window as any).createLemonSqueezy();
          }
        }}
      />
    </div>
  );
}
