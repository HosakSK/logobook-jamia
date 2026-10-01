"use client";

import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Eye,
  Code,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { BrandCascadeTokens, CascadeStyleOverrides } from "@/lib/types/module";
import {
  CascadeColorPicker,
  CascadeRadiusPicker,
} from "@/components/admin/modules/cascade-controls";
import {
  BrandCascadeProvider,
  useBrandCascade,
} from "@/components/modules/cascade";
import { computeBrandRadiusValue } from "@/lib/utils/cascade";
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

  const [activeTab, setActiveTab] = useState<"preview" | "json">("preview");

  return (
    <BrandCascadeProvider
      tokens={tokens}
      style={cssVariables as unknown as React.CSSProperties}
      className="space-y-6"
    >
      {/* Introduction Card */}
      <div className="border border-border/60 rounded-[3px] p-5 bg-card/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[3px] bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Trojúrovňová Kaskáda Štýlov (Level 1 → Level 2 → Level 3)
              </h2>
              <p className="text-xs text-muted-foreground">
                Architektúra dedičnosti zabezpečuje jednotu identity a flexibilitu pre moduly M01 - M25.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Token Engine Aktívny
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
        {/* Left Column: Level 3 Override Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Editor modulu (Úroveň 3: Overrides)</span>
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

          {/* Cascade Color Control: Accent / Button */}
          <CascadeColorPicker
            label="Akcentová farba / Tlačidlo"
            description="Predvolene dedí primárnu farbu značky."
            value={styleOverrides.textColor}
            inheritedColor={tokens.colors.primary}
            inheritedRoleName="Brand Primary"
            palette={tokens.palette}
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
              <span>Živý náhľad modulu v manuáli</span>
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
            <ModuleInteractivePreview
              overrides={styleOverrides}
              brandName={brandName}
              tokens={tokens}
            />
          ) : (
            <div className="border border-border/60 rounded-[3px] p-4 bg-neutral-950 font-mono text-xs text-neutral-300 overflow-x-auto space-y-2">
              <div className="text-[11px] text-muted-foreground">
                // Hodnota uložená v databáze v poli modules.config:
              </div>
              <pre className="text-primary leading-relaxed">
                {JSON.stringify(
                  {
                    moduleType: "M03_Banner",
                    styleOverrides: Object.fromEntries(
                      Object.entries(styleOverrides).filter(
                        ([_, v]) => v !== undefined && v !== ""
                      )
                    ),
                    content: {
                      title: { sk: "Vitajte v našom manuáli", en: "Welcome to our brand book" },
                      subtitle: { sk: "Oficiálna vizuálna identita", en: "Official visual guidelines" },
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
 * Interactive Mock Module Component rendering via BrandCascadeContext
 */
function ModuleInteractivePreview({
  overrides,
  brandName,
  tokens,
}: {
  overrides: CascadeStyleOverrides;
  brandName: string;
  tokens: BrandCascadeTokens;
}) {
  const { resolveRadius, resolveColor } = useBrandCascade();

  // Resolve radius through 3-tier cascade
  const effectiveRadius = resolveRadius(overrides);

  // Resolve colors through 3-tier cascade
  const effectiveBg = resolveColor(overrides.backgroundColor, "secondary");
  const effectiveAccent = resolveColor(overrides.textColor, "primary");

  const isRadiusOverridden = overrides.radiusMode && overrides.radiusMode !== "inherit";
  const isBgOverridden = Boolean(overrides.backgroundColor);
  const isAccentOverridden = Boolean(overrides.textColor);

  return (
    <div className="space-y-4">
      {/* Sample Module: M03 Banner / Card */}
      <div
        className="p-6 border transition-all duration-200 shadow-sm relative overflow-hidden"
        style={{
          borderRadius: effectiveRadius,
          backgroundColor: effectiveBg,
          borderColor: "rgba(255, 255, 255, 0.12)",
          borderWidth: tokens.borderWidth,
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
              style={{
                borderRadius: effectiveRadius,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#fafbfc",
              }}
            >
              Ukážkový modul (M03_Banner)
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              {isRadiusOverridden && (
                <span className="px-1.5 py-0.5 rounded-[2px] bg-amber-500/20 text-amber-300 font-mono">
                  Radius Override: {effectiveRadius}
                </span>
              )}
              {isBgOverridden && (
                <span className="px-1.5 py-0.5 rounded-[2px] bg-amber-500/20 text-amber-300 font-mono">
                  Bg Override
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black tracking-tight text-white">
              Vizuálna identita {brandName}
            </h3>
            <p className="text-xs text-neutral-300/80 leading-relaxed max-w-md">
              Tento obsahový blok automaticky dedí globálne zaoblenie rohov a farebnú paletu. Ak je aktívny lokálny override (Úroveň 3), okamžite prebíja globálne pravidlá.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold text-neutral-950 transition-all shadow-xs flex items-center gap-1.5 hover:opacity-90"
              style={{
                borderRadius: effectiveRadius,
                backgroundColor: effectiveAccent,
              }}
            >
              <span>Stiahnuť vektorové podklady</span>
            </button>
            <button
              type="button"
              className="px-3 py-2 text-xs font-medium text-neutral-300 border border-neutral-700 hover:bg-neutral-800/60 transition-all"
              style={{
                borderRadius: effectiveRadius,
              }}
            >
              Čítať pravidlá
            </button>
          </div>
        </div>
      </div>

      {/* Verification explanation card */}
      <div className="border border-border/40 rounded-[3px] p-4 bg-neutral-900/40 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Princíp Trojúrovňovej Kaskády:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
          <li>
            <strong className="text-foreground">Úroveň 1 (Global):</strong> Tvar rohov a farebná paleta značky je uložená centrálne.
          </li>
          <li>
            <strong className="text-foreground">Úroveň 2 (Modul Default):</strong> Modul automaticky aplikuje <code className="font-mono text-primary">rounded-[var(--brand-radius)]</code> a dedí globálnu identitu bez zásahu dizajnéra.
          </li>
          <li>
            <strong className="text-foreground">Úroveň 3 (Local Override):</strong> Po kliknutí na <em>„Odpojiť“</em> sa hodnota zapíše do <code className="font-mono text-primary">module.config.styleOverrides</code> a prebije predvolený štýl.
          </li>
        </ul>
      </div>
    </div>
  );
}
