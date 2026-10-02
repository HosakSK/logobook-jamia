"use client";

import { useState } from "react";
import Link from "next/link";
import { Locale, getDictionary } from "@/lib/i18n";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface PricingSectionProps {
  currentLocale: Locale;
}

export function PricingSection({ currentLocale }: PricingSectionProps) {
  const dict = getDictionary(currentLocale);
  const [isYearly, setIsYearly] = useState(true);

  const tiers = [
    {
      id: "free",
      name: dict.marketing.freeTierTitle,
      description: dict.marketing.freeTierDesc,
      priceMonthly: 0,
      priceYearly: 0,
      highlight: false,
      badge: null,
      features: [
        "1 základný demo manuál",
        "Základné moduly (Logo, Farby, Písmo)",
        "Verejný prístup cez odkaz",
        "Vodoznak Logobook",
        "Komunitná podpora",
      ],
      notIncluded: [
        "Vlastná doména a CNAME",
        "Ochrana heslom",
        "Design Tokens & AI export",
        "White-label branding",
      ],
      ctaText: "Začať zadarmo",
      href: "/register",
    },
    {
      id: "company",
      name: dict.marketing.companyTierTitle,
      description: dict.marketing.companyTierDesc,
      priceMonthly: 29,
      priceYearly: 23,
      highlight: false,
      badge: null,
      features: [
        "1 kompletná firemná identita",
        "Vlastná subdoména alebo CNAME doména",
        "Ochrana heslom a privátny mód",
        "Všetkých 25 modulov značky",
        "Generátor e-mailových podpisov",
        "Bez vodoznaku Logobook",
        "E-mailová podpora",
      ],
      notIncluded: [
        "Viacero klientskych značiek",
        "100% White-label štúdia",
      ],
      ctaText: "Vybrať Company",
      href: `/register?plan=company&cycle=${isYearly ? "yearly" : "monthly"}`,
    },
    {
      id: "freelancer",
      name: dict.marketing.freelancerTierTitle,
      description: dict.marketing.freelancerTierDesc,
      priceMonthly: 49,
      priceYearly: 39,
      highlight: true,
      badge: dict.marketing.popularBadge,
      features: [
        "Až 5 aktívnych brand manuálov",
        "No-code PageBuilder a voľné rozloženie",
        "Exporty Design Tokens (Figma, JSON, CSS)",
        "AI Context Generator (llms.txt a ai.md)",
        "Offline HTML a ZIP export",
        "Vlastné domény pre každý brand",
        "Ochrana heslom pre klientov",
        "Prioritná e-mailová podpora",
      ],
      notIncluded: [
        "100% White-label štúdia",
      ],
      ctaText: "Vybrať Freelancer",
      href: `/register?plan=freelancer&cycle=${isYearly ? "yearly" : "monthly"}`,
    },
    {
      id: "agency",
      name: dict.marketing.agencyTierTitle,
      description: dict.marketing.agencyTierDesc,
      priceMonthly: 99,
      priceYearly: 79,
      highlight: false,
      badge: dict.marketing.whiteLabelBadge,
      features: [
        "100% White-Label (vlastné logo štúdia)",
        "Neobmedzený počet značiek a klientov",
        "Neobmedzené cloud úložisko assetov",
        "Tímová spolupráca (dizajnéri a klienti)",
        "Všetky Design Tokens & AI exporty",
        "Klientsky Offline HTML & ZIP engine",
        "Vlastné agentúrne šablóny manuálov",
        "VIP prioritná podpora 24/7",
      ],
      notIncluded: [],
      ctaText: "Začať ako Agentúra",
      href: `/register?plan=agency&cycle=${isYearly ? "yearly" : "monthly"}`,
    },
  ];

  return (
    <section id="cennik" className="py-20 md:py-32 border-t border-border/80 relative">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[3px] bg-secondary border border-border text-xs font-semibold text-primary uppercase tracking-wider">
            <span>Cenové balíčky</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {dict.marketing.pricingTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {dict.marketing.pricingSubtitle}
          </p>

          {/* Billing Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              onClick={() => setIsYearly(false)}
              className={`text-xs font-semibold cursor-pointer transition-colors ${
                !isYearly ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {dict.marketing.billingMonthly}
            </span>

            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-12 h-6 rounded-full bg-surface border border-border p-0.5 transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Prepnúť fakturačný cyklus"
            >
              <span
                className={`block w-5 h-5 rounded-full bg-primary transition-transform ${
                  isYearly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>

            <span
              onClick={() => setIsYearly(true)}
              className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                isYearly ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              <span>{dict.marketing.billingYearly}</span>
              <span className="px-1.5 py-0.5 rounded-[3px] bg-primary/20 text-primary font-bold text-[10px]">
                {dict.marketing.saveDiscount}
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const price = isYearly ? tier.priceYearly : tier.priceMonthly;

            return (
              <div
                key={tier.id}
                className={`relative rounded-[3px] p-6 flex flex-col justify-between transition-all duration-200 ${
                  tier.highlight
                    ? "bg-raised border-2 border-primary shadow-xl shadow-primary/10 -translate-y-1"
                    : "bg-raised/70 border border-border hover:border-border/90"
                }`}
              >
                {/* Popular or White-Label Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-[3px] bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                    {tier.badge}
                  </div>
                )}

                <div>
                  {/* Title & Description */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground min-h-[32px] mt-1 font-light leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-border/80">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground tracking-tight">
                        {price} €
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {tier.priceMonthly === 0 ? dict.marketing.foreverFree : dict.marketing.perMonth}
                      </span>
                    </div>
                    {tier.priceMonthly > 0 && (
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {isYearly ? dict.marketing.billedAnnually : dict.marketing.billedMonthly}
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 mb-8 text-xs">
                    <div className="text-[11px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                      V balíku je zahrnuté:
                    </div>
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-foreground/90">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{f}</span>
                      </div>
                    ))}
                    {tier.notIncluded.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-muted-foreground/40 line-through">
                        <span className="w-3.5 h-3.5 shrink-0 text-center leading-none">—</span>
                        <span className="leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <Link
                    href={tier.href}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold transition-all ${
                      tier.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                        : "bg-surface border border-border hover:bg-surface/80 text-foreground"
                    }`}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Lemon Squeezy trust badge */}
        <div className="mt-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>
            Bezpečné platby zabezpečuje Merchant of Record Lemon Squeezy s automatickým vystavením daňových dokladov (DPH).
          </span>
        </div>
      </div>
    </section>
  );
}
