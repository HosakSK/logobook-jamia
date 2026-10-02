"use client";

import { useState } from "react";
import { Locale, getDictionary } from "@/lib/i18n";
import { Type, GitBranch, Terminal, Mail, Check, Copy, Sliders, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FeatureBlocksProps {
  currentLocale: Locale;
}

export function FeatureBlocks({ currentLocale }: FeatureBlocksProps) {
  const dict = getDictionary(currentLocale);

  // Type tester local state
  const [sampleText, setSampleText] = useState("Kreativita bez hraníc pre modernú identitu.");
  const [fontSize, setFontSize] = useState(26);
  const [fontWeight, setFontWeight] = useState(600);

  // Token tab state
  const [tokenTab, setTokenTab] = useState<"css" | "json" | "ai">("css");

  // Signature copy state
  const [copiedSignature, setCopiedSignature] = useState(false);

  const handleCopySignature = () => {
    navigator.clipboard.writeText(
      `Jakub Hošák | Lead Brand Designer\nLogobook Studio\njakub@logobook.sk | https://logobook.sk`
    );
    setCopiedSignature(true);
    setTimeout(() => setCopiedSignature(false), 2000);
  };

  return (
    <section id="funkcie" className="py-24 md:py-36 border-t border-white/[0.06] relative">
      <div className="container mx-auto px-4 sm:px-8 max-w-6xl space-y-28 md:space-y-40">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
            <span>Selling Points</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-gradient-white">
            {dict.marketing.featuresTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {dict.marketing.featuresSubtitle}
          </p>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 1: Live Type Tester (Widget Left, Text Right) */}
        {/* ==================================================================== */}
        <div id="ako-to-funguje" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Interactive Widget */}
          <div className="lg:col-span-7 bg-[#17212a]/90 border border-[#2b3b48]/80 rounded-2xl p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <Type className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Live Type Tester</span>
                <span className="text-[10px] font-mono text-muted-foreground bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                  Plus Jakarta Sans
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-[11px] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.06]">
                  <Sliders className="w-3.5 h-3.5 text-primary" />
                  <span>{fontSize}px</span>
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 text-xs">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-2 font-medium">Veľkosť písma:</label>
                <input
                  type="range"
                  min="16"
                  max="44"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-2 font-medium">Rez (Weight):</label>
                <div className="flex gap-2">
                  {[300, 600, 800].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setFontWeight(w)}
                      className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                        fontWeight === w
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"
                      }`}
                    >
                      {w === 300 ? "Light" : w === 600 ? "SemiBold" : "ExtraBold"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="bg-[#060a10] border border-white/[0.08] p-6 rounded-xl min-h-[140px] flex items-center justify-center text-center shadow-inner">
              <input
                type="text"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                style={{ fontSize: `${fontSize}px`, fontWeight }}
                className="w-full bg-transparent text-foreground focus:outline-hidden text-center tracking-tight leading-snug selection:bg-primary/20 selection:text-primary"
              />
            </div>
            <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
              Kliknite do textu vyššie a napíšte ľubovoľný vlastný text na otestovanie.
            </p>
          </div>

          {/* Text Description */}
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature1Badge}
            </span>
            <h3 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {dict.marketing.feature1Title}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature1Desc}
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground pt-2">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>Automatická typografická škála (Modular Scale 1.25 Major Third)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>Prepojenie na Google Fonts aj vlastné licencované WOFF2 fonty</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>Pravidlá povoleného a zakázaného použitia rezov písma</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 2: Dimension Matrix / CMS Tree (Text Left, Widget Right) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Description */}
          <div className="lg:col-span-5 space-y-5 order-2 lg:order-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature2Badge}
            </span>
            <h3 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {dict.marketing.feature2Title}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature2Desc}
            </p>
            <div className="pt-2">
              <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs space-y-1.5 shadow-sm">
                <div className="font-semibold text-foreground">Žiadne manuálne písanie stoviek strán:</div>
                <div className="text-muted-foreground leading-relaxed">
                  Dimenzionálna matica z 1 logotypu automaticky odvodí farebné kombinácie, bezpečné okraje a exportuje balíčky pre web, print aj sociálne siete.
                </div>
              </div>
            </div>
          </div>

          {/* Visual Diagram */}
          <div className="lg:col-span-7 bg-[#17212a]/90 border border-[#2b3b48]/80 rounded-2xl p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl order-1 lg:order-2">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.08] mb-6">
              <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                <GitBranch className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">Dimension Matrix Engine v CMS</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-[#070b0f] border border-primary/30 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span>ROOT: Hlavná značka</span>
                </div>
                <span className="text-[10px] text-primary/90 uppercase px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  Inkrementálny beh
                </span>
              </div>

              <div className="pl-6 border-l-2 border-primary/30 space-y-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <span className="text-foreground font-medium">├── 01. Primárny horizontálny logotyp</span>
                  <span className="text-[10px] text-[#009f80] bg-[#009f80]/10 border border-[#009f80]/30 px-2.5 py-0.5 rounded-full">
                    Light & Dark
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <span className="text-foreground font-medium">├── 02. Samostatný symbol & Favicon</span>
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/30 px-2.5 py-0.5 rounded-full">
                    SVG / PNG / ICO
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <span className="text-foreground font-medium">├── 03. Ochranná zóna & Min. veľkosť</span>
                  <span className="text-[10px] text-muted-foreground bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                    X-height
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <span className="text-foreground font-medium">└── 04. Monochromatické & Zakázané verzie</span>
                  <span className="text-[10px] text-[#d04f38] bg-[#d04f38]/10 border border-[#d04f38]/30 px-2.5 py-0.5 rounded-full">
                    Strict Rules
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 3: AI & Token Hub (Widget Left, Text Right) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Code Tabs */}
          <div className="lg:col-span-7 bg-[#17212a]/90 border border-[#2b3b48]/80 rounded-2xl p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <Terminal className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Integration Hub & AI Prompt</span>
              </div>
              <div className="flex gap-1.5">
                {(["css", "json", "ai"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTokenTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                      tokenTab === tab
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"
                    }`}
                  >
                    {tab === "css" ? "Tailwind v4" : tab === "json" ? "Figma Tokens" : "llms.txt (AI)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Code container */}
            <div className="relative">
              <pre className="p-5 rounded-xl bg-[#070b0f] border border-white/[0.08] font-mono text-[11px] leading-relaxed text-muted-foreground overflow-x-auto max-h-56 shadow-inner">
                {tokenTab === "css" && (
`@theme {
  --color-brand-primary: #c8d400;
  --color-brand-teal: #009f80;
  --color-brand-abyss: #070b0f;
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --radius-brand: 8px;
}`
                )}
                {tokenTab === "json" && (
`{
  "color": {
    "primary": { "value": "#c8d400", "type": "color" },
    "teal": { "value": "#009f80", "type": "color" },
    "abyss": { "value": "#070b0f", "type": "color" }
  },
  "typography": {
    "fontFamily": { "value": "Plus Jakarta Sans", "type": "fontFamilies" }
  }
}`
                )}
                {tokenTab === "ai" && (
`# Brand Identity System Prompt for LLMs
Brand: Acme Studio
Primary Accent: #c8d400 (Lime)
Teal Brand: #009f80
Abyss Dark: #070b0f
Rules:
- Never stretch the logo or invert brand colors.
- Maintain minimum 1.5X clearspace around logo.`
                )}
              </pre>
            </div>
          </div>

          {/* Text Description */}
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature3Badge}
            </span>
            <h3 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {dict.marketing.feature3Title}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature3Desc}
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground pt-2">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>W3C Design Tokens Community Group (DTCG) kompatibilita</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>Priame verejné endpointy <code>/api/brand/[slug]/llms.txt</code></span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>Kopírovanie CSS custom properties do Tailwind v4 na jeden klik</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 4: Email Signatures & Collateral (Text Left, Widget Right) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Description */}
          <div className="lg:col-span-5 space-y-5 order-2 lg:order-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature4Badge}
            </span>
            <h3 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {dict.marketing.feature4Title}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature4Desc}
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/90 group"
              >
                <span>Vyskúšať pre celý tím</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Interactive Signature Card */}
          <div className="lg:col-span-7 bg-[#17212a]/90 border border-[#2b3b48]/80 rounded-2xl p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl order-1 lg:order-2">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Generátor firemných e-mail podpisov</span>
              </div>
              <button
                type="button"
                onClick={handleCopySignature}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                {copiedSignature ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSignature ? "Skopírované!" : "Kopírovať podpis"}</span>
              </button>
            </div>

            {/* Signature Render Box */}
            <div className="p-6 rounded-xl bg-white text-zinc-900 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-sm border-2 border-[#c8d400] shadow-sm">
                  JH
                </div>
                <div className="space-y-0.5">
                  <div className="text-base font-bold text-zinc-950">Jakub Hošák</div>
                  <div className="text-xs font-semibold text-zinc-600">Lead Brand Designer • Logobook Studio</div>
                  <div className="text-[11px] text-zinc-500 font-mono pt-1">
                    jakub@logobook.sk | +421 900 000 000
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Vytvorené cez Logobook Living Guidelines</span>
                <span className="font-bold text-zinc-800">acme.logobook.sk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
