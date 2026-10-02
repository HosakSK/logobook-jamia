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
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-36 bg-grid-subtle">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/15 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[280px] bg-[#009f80]/12 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-8 text-center max-w-5xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold uppercase tracking-wider mb-6 animate-in fade-in duration-300 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dict.marketing.badge}</span>
        </div>

        {/* Dominant Headline with subtle gradient */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground text-gradient-white leading-[1.08] mb-6">
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-b from-[#d8e600] to-[#b6c400] text-[#05080c] font-bold text-sm shadow-[0_4px_24px_rgba(200,212,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_8px_32px_rgba(200,212,0,0.45)] hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{dict.marketing.ctaDemo}</span>
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-foreground font-semibold text-sm hover:bg-white/[0.08] hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
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
        <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#090e16]/90 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden text-left backdrop-blur-xl">
          {/* Mockup Window Header */}
          <div className="h-11 bg-[#06090f]/80 border-b border-white/[0.08] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#bb4934]/90 inline-block shadow-inner" />
              <span className="w-3 h-3 rounded-full bg-[#c8d400]/90 inline-block shadow-inner" />
              <span className="w-3 h-3 rounded-full bg-[#009f80]/90 inline-block shadow-inner" />
              <span className="ml-3 font-mono text-[11px] text-muted-foreground/70 hidden sm:inline-block">
                demo.logobook.sk/manual/acme/sk
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                LIVE MANUAL v1.4
              </span>
            </div>
          </div>

          {/* Mockup Window Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Sidebar Preview */}
            <div className="md:col-span-4 bg-[#060a10]/60 border-r border-white/[0.06] p-4 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
                <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shadow-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Acme Studio</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Brand Guidelines 2026</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="px-3 py-2 rounded-lg bg-primary/15 text-primary font-semibold flex items-center gap-2 border border-primary/25 shadow-xs">
                  <Eye className="w-3.5 h-3.5" />
                  <span>01. Identita a Logo</span>
                </div>
                <div className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.03] flex items-center gap-2 transition-colors">
                  <Layers className="w-3.5 h-3.5" />
                  <span>02. Farebný systém</span>
                </div>
                <div className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.03] flex items-center gap-2 transition-colors">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>03. Typografia & Škála</span>
                </div>
                <div className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.03] flex items-center gap-2 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>04. Design Tokens & AI</span>
                </div>
              </div>

              {/* Token summary pill */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] space-y-1.5 shadow-inner">
                <div className="text-muted-foreground font-medium">Export formáty:</div>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  <span className="bg-[#05080c] px-2 py-0.5 rounded-md text-primary border border-white/[0.08]">JSON</span>
                  <span className="bg-[#05080c] px-2 py-0.5 rounded-md text-[#009f80] border border-white/[0.08]">CSS</span>
                  <span className="bg-[#05080c] px-2 py-0.5 rounded-md text-foreground/80 border border-white/[0.08]">llms.txt</span>
                </div>
              </div>
            </div>

            {/* Main Stage Preview */}
            <div className="md:col-span-8 p-6 space-y-6">
              {/* Logo with Clearspace visual lines */}
              <div className="p-6 rounded-xl bg-[#060a10]/80 border border-white/[0.06] relative overflow-hidden flex flex-col items-center justify-center shadow-inner">
                <div className="absolute top-2.5 left-3 text-[9px] font-mono text-muted-foreground/60 uppercase">
                  M03 Ochranná zóna loga
                </div>
                <div className="relative border border-dashed border-primary/40 p-7 rounded-lg my-2 bg-primary/[0.02]">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-primary bg-[#060a10] px-1.5 py-0.5 rounded-full border border-primary/30">
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
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="bg-white/[0.02] border border-white/[0.08] p-2.5 rounded-lg text-[10px] shadow-xs">
                    <div className="w-full h-8 rounded-md bg-[#05080c] border border-white/[0.08] mb-1.5 shadow-inner" />
                    <div className="font-bold text-foreground">Abyss</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#05080C</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.08] p-2.5 rounded-lg text-[10px] shadow-xs">
                    <div className="w-full h-8 rounded-md bg-[#c8d400] mb-1.5 shadow-[0_0_12px_rgba(200,212,0,0.25)]" />
                    <div className="font-bold text-foreground">Lime Accent</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#C8D400</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.08] p-2.5 rounded-lg text-[10px] shadow-xs">
                    <div className="w-full h-8 rounded-md bg-[#009f80] mb-1.5 shadow-[0_0_12px_rgba(0,159,128,0.2)]" />
                    <div className="font-bold text-foreground">Teal Brand</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#009F80</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.08] p-2.5 rounded-lg text-[10px] shadow-xs">
                    <div className="w-full h-8 rounded-md bg-[#d04f38] mb-1.5" />
                    <div className="font-bold text-foreground">Brick Red</div>
                    <div className="font-mono text-muted-foreground text-[9px]">#D04F38</div>
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
