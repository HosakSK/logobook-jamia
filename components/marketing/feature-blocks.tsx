"use client";

import { useState } from "react";
import { Locale, getDictionary } from "@/lib/i18n";
import { Type, GitBranch, Terminal, Mail, Check, Copy, Sliders, Sparkles, ArrowRight } from "lucide-react";
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
  const [copiedToken, setCopiedToken] = useState(false);

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
    <section id="funkcie" className="py-20 md:py-32 border-t border-border/80 relative">
      <div className="container mx-auto px-4 sm:px-8 max-w-6xl space-y-24 md:space-y-36">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[3px] bg-secondary border border-border text-xs font-semibold text-primary uppercase tracking-wider">
            <span>Selling Points</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {dict.marketing.featuresTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {dict.marketing.featuresSubtitle}
          </p>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 1: Live Type Tester (Widget Left, Text Right) */}
        {/* ==================================================================== */}
        <div id="ako-to-funguje" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Interactive Widget */}
          <div className="lg:col-span-7 bg-raised border border-border rounded-[3px] p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-5">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Live Type Tester</span>
                <span className="text-[10px] font-mono text-muted-foreground bg-abyss px-2 py-0.5 rounded-[3px]">
                  Plus Jakarta Sans
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono">{fontSize}px</span>
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1.5 font-medium">Veľkosť písma:</label>
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
                <label className="text-[11px] text-muted-foreground block mb-1.5 font-medium">Rez (Weight):</label>
                <div className="flex gap-1.5">
                  {[300, 600, 800].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setFontWeight(w)}
                      className={`flex-1 py-1 rounded-[3px] font-mono text-[11px] transition-colors ${
                        fontWeight === w
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {w === 300 ? "Light" : w === 600 ? "SemiBold" : "ExtraBold"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="bg-abyss border border-border p-5 rounded-[3px] min-h-[140px] flex items-center justify-center text-center">
              <input
                type="text"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                style={{ fontSize: `${fontSize}px`, fontWeight }}
                className="w-full bg-transparent text-foreground focus:outline-hidden text-center tracking-tight leading-snug"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
              Kliknite do textu vyššie a napíšte ľubovoľný vlastný text na otestovanie.
            </p>
          </div>

          {/* Text Description */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature1Badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {dict.marketing.feature1Title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature1Desc}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Automatická typografická škála (Modular Scale 1.25 Major Third)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Prepojenie na Google Fonts aj vlastné licencované WOFF2 fonty</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Pravidlá povoleného a zakázaného použitia rezov písma</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 2: Dimension Matrix / CMS Tree (Text Left, Widget Right) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Text Description */}
          <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature2Badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {dict.marketing.feature2Title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature2Desc}
            </p>
            <div className="pt-2">
              <div className="p-3.5 bg-surface/50 border border-border/80 rounded-[3px] text-xs space-y-1.5">
                <div className="font-semibold text-foreground">Žiadne manuálne písanie stoviek strán:</div>
                <div className="text-muted-foreground leading-relaxed">
                  Dimenzionálna matica z 1 logotypu automaticky odvodí farebné kombinácie, bezpečné okraje a exportuje balíčky pre web, print aj sociálne siete.
                </div>
              </div>
            </div>
          </div>

          {/* Visual Diagram */}
          <div className="lg:col-span-7 bg-raised border border-border rounded-[3px] p-6 shadow-xl order-1 lg:order-2">
            <div className="flex items-center gap-2 pb-4 border-b border-border/80 mb-5">
              <GitBranch className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Dimension Matrix Engine v CMS</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-[3px] bg-abyss border border-primary/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span>ROOT: Hlavná značka</span>
                </div>
                <span className="text-[10px] text-primary/80 uppercase">Inkrementálny beh</span>
              </div>

              <div className="pl-6 border-l-2 border-primary/30 space-y-2.5">
                <div className="p-2.5 rounded-[3px] bg-surface/60 border border-border flex items-center justify-between">
                  <span className="text-foreground font-medium">├── 01. Primárny horizontálny logotyp</span>
                  <span className="text-[10px] text-[#009f80] bg-abyss px-2 py-0.5 rounded-[3px]">Light & Dark</span>
                </div>
                <div className="p-2.5 rounded-[3px] bg-surface/60 border border-border flex items-center justify-between">
                  <span className="text-foreground font-medium">├── 02. Samostatný symbol & Favicon</span>
                  <span className="text-[10px] text-primary bg-abyss px-2 py-0.5 rounded-[3px]">SVG / PNG / ICO</span>
                </div>
                <div className="p-2.5 rounded-[3px] bg-surface/60 border border-border flex items-center justify-between">
                  <span className="text-foreground font-medium">├── 03. Ochranná zóna & Min. veľkosť</span>
                  <span className="text-[10px] text-muted-foreground bg-abyss px-2 py-0.5 rounded-[3px]">X-height</span>
                </div>
                <div className="p-2.5 rounded-[3px] bg-surface/60 border border-border flex items-center justify-between">
                  <span className="text-foreground font-medium">└── 04. Monochromatické & Zakázané verzie</span>
                  <span className="text-[10px] text-[#bb4934] bg-abyss px-2 py-0.5 rounded-[3px]">Strict Rules</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 3: AI & Token Hub (Widget Left, Text Right) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Code Tabs */}
          <div className="lg:col-span-7 bg-abyss border border-border rounded-[3px] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Integration Hub & AI Prompt</span>
              </div>
              <div className="flex gap-1">
                {(["css", "json", "ai"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTokenTab(tab)}
                    className={`px-2.5 py-1 rounded-[3px] font-mono text-[11px] transition-colors ${
                      tokenTab === tab
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "css" ? "Tailwind v4" : tab === "json" ? "Figma Tokens" : "llms.txt (AI)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Code container */}
            <div className="relative">
              <pre className="p-4 rounded-[3px] bg-surface/30 border border-border/60 font-mono text-[11px] leading-relaxed text-muted-foreground overflow-x-auto max-h-56">
                {tokenTab === "css" && (
`@theme {
  --color-brand-primary: #c8d400;
  --color-brand-teal: #009f80;
  --color-brand-abyss: #070b0f;
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --radius-brand: 3px;
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
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature3Badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {dict.marketing.feature3Title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature3Desc}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>W3C Design Tokens Community Group (DTCG) kompatibilita</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Priame verejné endpointy <code>/api/brand/[slug]/llms.txt</code></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Kopírovanie CSS custom properties do Tailwind v4 na jeden klik</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BLOCK 4: Email Signatures & Collateral (Text Left, Widget Right) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Text Description */}
          <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {dict.marketing.feature4Badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {dict.marketing.feature4Title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              {dict.marketing.feature4Desc}
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <span>Vyskúšať pre celý tím</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Interactive Signature Card */}
          <div className="lg:col-span-7 bg-raised border border-border rounded-[3px] p-6 shadow-xl order-1 lg:order-2">
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Generátor firemných e-mail podpisov</span>
              </div>
              <button
                type="button"
                onClick={handleCopySignature}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {copiedSignature ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSignature ? "Skopírované!" : "Kopírovať podpis"}</span>
              </button>
            </div>

            {/* Signature Render Box */}
            <div className="p-5 rounded-[3px] bg-white text-zinc-900 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-sm border-2 border-[#c8d400]">
                  JH
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-zinc-950">Jakub Hošák</div>
                  <div className="text-xs font-medium text-zinc-600">Lead Brand Designer • Logobook Studio</div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    jakub@logobook.sk | +421 900 000 000
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-400">
                <span>Vytvorené cez Logobook Living Guidelines</span>
                <span className="font-bold text-zinc-700">acme.logobook.sk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
