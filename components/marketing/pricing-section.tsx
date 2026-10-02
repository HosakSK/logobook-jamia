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
    <section id="cennik" className="py-24 md:py-36 border-t border-white/[0.06] relative">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
            <span>Cenové balíčky</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-gradient-white">
            {dict.marketing.pricingTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {dict.marketing.pricingSubtitle}
          </p>

          {/* Billing Switcher */}
          <div className="pt-6 flex items-center justify-center gap-4">
            <span
              onClick={() => setIsYearly(false)}
              className={`text-xs font-semibold cursor-pointer transition-colors ${
                !isYearly ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dict.marketing.billingMonthly}
            </span>

            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-13 h-7 rounded-full bg-white/[0.06] border border-white/10 p-0.5 transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Prepnúť fakturačný cyklus"
            >
              <span
                className={`block w-6 h-6 rounded-full bg-gradient-to-b from-[#d8e600] to-[#b6c400] shadow-[0_2px_8px_rgba(200,212,0,0.4)] transition-transform duration-200 ${
                  isYearly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>

            <span
              onClick={() => setIsYearly(true)}
              className={`text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors ${
                isYearly ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{dict.marketing.billingYearly}</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-[10px] border border-primary/30">
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
                className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 backdrop-blur-xl ${
                  tier.highlight
                    ? "bg-[#1f2c36] border-2 border-primary shadow-[0_16px_48px_rgba(200,212,0,0.18),inset_0_1px_0_rgba(255,255,255,0.1)] -translate-y-1.5"
                    : "bg-[#17212a]/95 border border-[#2b3b48]/80 hover:border-[#3f5566] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]"
                }`}
              >
                {/* Popular or White-Label Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#d8e600] to-[#b6c400] text-[#070b0f] text-[10px] font-black uppercase tracking-wider shadow-[0_2px_12px_rgba(200,212,0,0.4)]">
                    {tier.badge}
                  </div>
                )}

                <div>
                  {/* Title & Description */}
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground min-h-[34px] mt-1 font-light leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-white/[0.08]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-foreground tracking-tight">
                        {price} €
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {tier.priceMonthly === 0 ? dict.marketing.foreverFree : dict.marketing.perMonth}
                      </span>
                    </div>
                    {tier.priceMonthly > 0 && (
                      <div className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                        {isYearly ? dict.marketing.billedAnnually : dict.marketing.billedMonthly}
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 mb-8 text-xs">
                    <div className="text-[11px] uppercase font-bold text-muted-foreground/70 tracking-wider">
                      V balíku je zahrnuté:
                    </div>
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-foreground/90">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{f}</span>
                      </div>
                    ))}
                    {tier.notIncluded.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-muted-foreground/35 line-through">
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
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                      tier.highlight
                        ? "bg-gradient-to-b from-[#d8e600] to-[#b6c400] text-[#070b0f] hover:brightness-105 shadow-[0_4px_18px_rgba(200,212,0,0.35)]"
                        : "bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] text-foreground"
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
        <div className="mt-14 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>
            Bezpečné platby zabezpečuje Merchant of Record Lemon Squeezy s automatickým vystavením daňových dokladov (DPH).
          </span>
        </div>
      </div>
    </section>
  );
}
