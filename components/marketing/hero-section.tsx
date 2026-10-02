"use client";

import Link from "next/link";
import { Locale, getDictionary } from "@/lib/i18n";
import { ArrowRight, Sparkles, CheckCircle2, Play, Eye, FileCode2, Layers } from "lucide-react";

interface HeroSectionProps {
  currentLocale: Locale;
}

export function HeroSection({ currentLocale }: HeroSectionProps) {
  const dict = getDictionary(currentLocale);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-[#009f80]/10 blur-[110px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-8 text-center max-w-5xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[3px] bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-6 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dict.marketing.badge}</span>
        </div>

        {/* Dominant Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-6">
          {dict.marketing.heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light mb-10">
          {dict.marketing.heroSubtitle}
        </p>

        {/* CTA Buttons: Primary is "Zobraziť DEMO", Secondary is "Vytvoriť vlastný logobook" */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/m/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-[3px] bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{dict.marketing.ctaDemo}</span>
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-[3px] bg-raised border border-border hover:border-primary/50 text-foreground font-semibold text-sm hover:bg-surface transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span>{dict.marketing.ctaRegister}</span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        </div>

        {/* Value props micro-banner */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-muted-foreground mb-16">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>25 špecializovaných modulov</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>WCAG 2.1 kontrastná matica</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Exporty Figma Tokens & AI</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>White-label & Vlastná doména</span>
          </span>
        </div>

        {/* Interactive Visual Showcase Mockup */}
        <div className="relative mx-auto max-w-4xl rounded-[6px] border border-border bg-deep/90 shadow-2xl overflow-hidden text-left backdrop-blur-md">
          {/* Mockup Window Header */}
          <div className="h-10 bg-abyss border-b border-border/80 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#bb4934]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#c8d400]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#009f80]/80 inline-block" />
              <span className="ml-3 font-mono text-[11px] text-muted-foreground/70 hidden sm:inline-block">
                demo.logobook.sk/manual/acme/sk
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-primary/10 text-primary border border-primary/20">
                LIVE MANUAL v1.4
              </span>
            </div>
          </div>

          {/* Mockup Window Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Sidebar Preview */}
            <div className="md:col-span-4 bg-abyss/60 border-r border-border/60 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <div className="w-6 h-6 rounded-[3px] bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Acme Studio</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Brand Guidelines 2026</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="px-2.5 py-1.5 rounded-[3px] bg-primary/15 text-primary font-semibold flex items-center gap-2 border border-primary/25">
                  <Eye className="w-3.5 h-3.5" />
                  <span>01. Identita a Logo</span>
                </div>
                <div className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>02. Farebný systém</span>
                </div>
                <div className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>03. Typografia & Škála</span>
                </div>
                <div className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>04. Design Tokens & AI</span>
                </div>
              </div>

              {/* Token summary pill */}
              <div className="p-2.5 rounded-[3px] bg-raised border border-border/80 text-[11px] space-y-1">
                <div className="text-muted-foreground font-medium">Export formáty:</div>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  <span className="bg-abyss px-1.5 py-0.5 rounded-[3px] text-primary border border-border/40">JSON</span>
                  <span className="bg-abyss px-1.5 py-0.5 rounded-[3px] text-[#009f80] border border-border/40">CSS</span>
                  <span className="bg-abyss px-1.5 py-0.5 rounded-[3px] text-foreground/80 border border-border/40">llms.txt</span>
                </div>
              </div>
            </div>

            {/* Main Stage Preview */}
            <div className="md:col-span-8 p-6 space-y-6">
              {/* Logo with Clearspace visual lines */}
              <div className="p-5 rounded-[3px] bg-abyss border border-border relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-2 left-2 text-[9px] font-mono text-muted-foreground/60 uppercase">
                  M03 Ochranná zóna loga
                </div>
                <div className="relative border border-dashed border-primary/40 p-6 rounded-[3px] my-2 bg-raised/30">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-primary bg-abyss px-1">
                    min 1.5X
                  </span>
                  <span className="text-xl sm:text-2xl font-black tracking-widest text-foreground">
                    ACME<span className="text-primary font-light">STUDIO</span>
                  </span>
                </div>
              </div>

              {/* Color swatches preview */}
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                  M08 Primárna farebná paleta (WCAG 2.1 AAA)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[#070b0f] border border-border p-2 rounded-[3px] text-[10px]">
                    <div className="w-full h-8 rounded-[2px] bg-[#070b0f] border border-border/50 mb-1" />
                    <div className="font-bold text-foreground">Abyss</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#070B0F</div>
                  </div>
                  <div className="bg-[#17212a] border border-border p-2 rounded-[3px] text-[10px]">
                    <div className="w-full h-8 rounded-[2px] bg-[#c8d400] mb-1" />
                    <div className="font-bold text-foreground">Lime Accent</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#C8D400</div>
                  </div>
                  <div className="bg-[#17212a] border border-border p-2 rounded-[3px] text-[10px]">
                    <div className="w-full h-8 rounded-[2px] bg-[#009f80] mb-1" />
                    <div className="font-bold text-foreground">Teal Brand</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#009F80</div>
                  </div>
                  <div className="bg-[#17212a] border border-border p-2 rounded-[3px] text-[10px]">
                    <div className="w-full h-8 rounded-[2px] bg-[#bb4934] mb-1" />
                    <div className="font-bold text-foreground">Brick Red</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#BB4934</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
