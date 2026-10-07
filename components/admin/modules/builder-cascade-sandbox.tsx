"use client";

import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Eye,
  Code,
  ShieldCheck,
  CheckCircle2,
  Bug,
  Cpu,
} from "lucide-react";
import { BrandCascadeTokens, CascadeStyleOverrides } from "@/lib/types/module";
import {
  CascadeColorPicker,
  CascadeRadiusPicker,
} from "@/components/admin/modules/cascade-controls";
import { BrandCascadeProvider } from "@/components/modules/cascade";
import { ModuleDispatcher } from "@/components/modules/dispatcher";
import { Button } from "@/components/ui/button";

interface BuilderCascadeSandboxProps {
  brandId: string;
  brandName: string;
  brandSlug: string;
  tokens: BrandCascadeTokens;
  cssVariables: Record<string, string>;
}

export function BuilderCascadeSandbox({
  brandId,
  brandName,
  brandSlug,
  tokens,
  cssVariables,
}: BuilderCascadeSandboxProps) {
  // Local state representing module.config.styleOverrides in Level 3
  const [styleOverrides, setStyleOverrides] = useState<CascadeStyleOverrides>({
    radiusMode: undefined,
    customRadiusPx: undefined,
    backgroundColor: undefined,
    textColor: undefined,
  });

  const [activeModuleType, setActiveModuleType] = useState<string>("M03_Banner");
  const [simulateCrash, setSimulateCrash] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "json">("preview");

  // Effective background color for WCAG contrast comparison
  const effectiveBgColor = styleOverrides.backgroundColor || tokens.colors.secondary;

  return (
    <BrandCascadeProvider
      tokens={tokens}
      style={cssVariables as unknown as React.CSSProperties}
      className="space-y-6"
    >
      {/* Introduction Card */}
      <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-5 bg-[#17212a] text-[#fafbfc] shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[3px] bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Trojúrovňová Kaskáda Štýlov & Technické Štandardy (WCAG + Code Splitting)
              </h2>
              <p className="text-xs text-muted-foreground">
                Dedičnosť tokenov, automatický code-splitting cez next/dynamic, Error Boundary a živé sledovanie WCAG kontrastu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Dynamic Dispatcher Aktívny
            </span>
          </div>
        </div>

        {/* Level 1 Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-xs">
          <div className="p-2 rounded-[2px] bg-neutral-900/50 border border-border/30">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
              Úroveň 1: Tvar značky
            </span>
            <span className="font-mono font-bold text-foreground">
              {tokens.radiusMode.toUpperCase()} ({tokens.radius})
            </span>
          </div>
          <div className="p-2 rounded-[2px] bg-neutral-900/50 border border-border/30">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
              Úroveň 1: Hrúbka rámika
            </span>
            <span className="font-mono font-bold text-foreground">
              {tokens.borderWidth}
            </span>
          </div>
          <div className="p-2 rounded-[2px] bg-neutral-900/50 border border-border/30">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
              Úroveň 1: Primárna farba
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="h-3.5 w-3.5 rounded-[1px] border border-white/20 inline-block"
                style={{ backgroundColor: tokens.colors.primary }}
              />
              <span className="font-mono font-bold text-foreground">
                {tokens.colors.primary}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-[2px] bg-neutral-900/50 border border-border/30">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
              Úroveň 1: Sekundárna farba
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="h-3.5 w-3.5 rounded-[1px] border border-white/20 inline-block"
                style={{ backgroundColor: tokens.colors.secondary }}
              />
              <span className="font-mono font-bold text-foreground">
                {tokens.colors.secondary}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Controls vs Live Preview */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Level 3 Override Controls & Tools */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Editor modulu (Úroveň 3: Overrides)</span>
            </div>
          </div>

          {/* Module Selector */}
          <div className="p-3 border border-[rgba(63,85,102,0.45)] rounded-[3px] bg-[#0e161d] text-[#fafbfc] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Vybrať modul na otestovanie:
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Code-split via next/dynamic
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { type: "M01_Nadpis", label: "M01 Nadpis" },
                { type: "M03_Banner", label: "M03 Banner" },
                { type: "M05_DownloadTlacidlo", label: "M05 Sťahovanie" },
                { type: "M25_KniznicaIkon", label: "M25 Ikony (Virtual)" },
              ].map((m) => (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => {
                    setActiveModuleType(m.type);
                    setSimulateCrash(false);
                  }}
                  className={`p-1.5 rounded-[2px] text-xs font-medium border text-left transition-all ${
                    activeModuleType === m.type && !simulateCrash
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Error Boundary Simulator Button */}
            <div className="pt-2 border-t border-border/30 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Test záchrannej brzdy:
              </span>
              <Button
                type="button"
                variant={simulateCrash ? "destructive" : "outline"}
                size="sm"
                onClick={() => setSimulateCrash(!simulateCrash)}
                className="h-6 px-2 text-[11px] rounded-[2px] gap-1"
              >
                <Bug className="h-3 w-3" />
                <span>{simulateCrash ? "Vypnúť simuláciu" : "Simulovať pád modulu"}</span>
              </Button>
            </div>
          </div>

          {/* Cascade Radius Control */}
          <CascadeRadiusPicker
            label="Zaoblenie rohov modulu"
            description="Predvolene dedí tvar definovaný v nastaveniach značky."
            radiusMode={styleOverrides.radiusMode}
            customRadiusPx={styleOverrides.customRadiusPx}
            inheritedRadiusMode={tokens.radiusMode}
            inheritedCustomRadiusPx={tokens.customRadiusPx}
            onChange={(mode, customPx) => {
              setStyleOverrides((prev) => ({
                ...prev,
                radiusMode: mode,
                customRadiusPx: customPx,
              }));
            }}
          />

          {/* Cascade Color Control: Background */}
          <CascadeColorPicker
            label="Farba pozadia modulu"
            description="Predvolene dedí sekundárnu farbu značky alebo podklad kontajnera."
            value={styleOverrides.backgroundColor}
            inheritedColor={tokens.colors.secondary}
            inheritedRoleName="Brand Secondary"
            palette={tokens.palette}
            onChange={(color) => {
              setStyleOverrides((prev) => ({
                ...prev,
                backgroundColor: color,
              }));
            }}
          />

          {/* Cascade Color Control: Text / Accent with live WCAG tracking */}
          <CascadeColorPicker
            label="Farba textu a akcentov (WCAG Kontrola)"
            description="Automaticky overuje WCAG 2.1 kontrast voči zvolenému pozadiu."
            value={styleOverrides.textColor}
            inheritedColor={tokens.colors.primary}
            inheritedRoleName="Brand Primary"
            palette={tokens.palette}
            compareContrastWithHex={effectiveBgColor}
            onChange={(color) => {
              setStyleOverrides((prev) => ({
                ...prev,
                textColor: color,
              }));
            }}
          />
        </div>

        {/* Right Column: Live Module Renderer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>Živý náhľad cez ModuleDispatcher</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={activeTab === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("preview")}
                className="h-6 px-2 text-[11px] rounded-[2px]"
              >
                Náhľad
              </Button>
              <Button
                variant={activeTab === "json" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("json")}
                className="h-6 px-2 text-[11px] rounded-[2px] font-mono gap-1"
              >
                <Code className="h-3 w-3" />
                <span>JSON</span>
              </Button>
            </div>
          </div>

          {activeTab === "preview" ? (
            <div className="space-y-4">
              {/* Dynamic Module Rendered through ModuleDispatcher */}
              {simulateCrash ? (
                <CrashTestModule />
              ) : (
                <ModuleDispatcher
                  module={{
                    id: "mod-test-1",
                    moduleType: activeModuleType,
                    showH3: true,
                    h3Title: {
                      sk: `Živý modul: ${activeModuleType}`,
                      en: `Live Module: ${activeModuleType}`,
                    },
                    config: {
                      styleOverrides,
                    },
                  }}
                  isEditor={true}
                  locale="sk"
                />
              )}

              {/* Technical Standards Summary Card */}
              <div className="border border-border/40 rounded-[3px] p-4 bg-neutral-900/40 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span>Splnené technické štandardy (Tiket 12_01):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                  <li>
                    <strong className="text-foreground">Module-level Code Splitting:</strong> Všetkých 25 modulov sa do <code className="font-mono text-primary">ModuleDispatcher</code> importuje dynamicky cez <code className="font-mono text-primary">next/dynamic</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">React Error Boundary:</strong> Ak modul zlyhá, systém zabráni bielej smrti a v admine zobrazí presný report chyby s možnosťou reštartu.
                  </li>
                  <li>
                    <strong className="text-foreground">WCAG 2.1 AA Kontrola:</strong> Živý výpočet luminiscencie a kontrastného pomeru v reálnom čase pri úprave farieb.
                  </li>
                  <li>
                    <strong className="text-foreground">Optimalizácia assetov:</strong> Zavedené komponenty <code className="font-mono text-primary">OptimizedAssetImage</code> a <code className="font-mono text-primary">VirtualGrid</code> s <code className="font-mono text-primary">IntersectionObserver</code>.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="border border-border/60 rounded-[3px] p-4 bg-neutral-950 font-mono text-xs text-neutral-300 overflow-x-auto space-y-2">
              <div className="text-[11px] text-muted-foreground">
                // Hodnota uložená v databáze v poli modules.config:
              </div>
              <pre className="text-primary leading-relaxed">
                {JSON.stringify(
                  {
                    moduleType: activeModuleType,
                    styleOverrides: Object.fromEntries(
                      Object.entries(styleOverrides).filter(
                        ([_, v]) => v !== undefined && v !== ""
                      )
                    ),
                    content: {
                      title: { sk: `Ukážka modulu ${activeModuleType}`, en: `Demo of ${activeModuleType}` },
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </BrandCascadeProvider>
  );
}

/**
 * Component used specifically to test and demonstrate ModuleErrorBoundary
 */
function CrashTestModule() {
  return (
    <ModuleDispatcher
      module={{
        id: "crash-test",
        moduleType: "CRASH_SIMULATION",
      }}
      isEditor={true}
    />
  );
}
