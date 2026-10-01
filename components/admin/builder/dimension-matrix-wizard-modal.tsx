"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Printer,
  Monitor,
  Stamp,
  ArrowRight,
  ShieldAlert,
  Layers,
  FileCheck2,
  Palette,
  Type,
  BookOpen,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { DimensionMatrixConfig } from "@/lib/types/wizard";
import { generateBrandTreeAction } from "@/actions/wizard";

interface DimensionMatrixWizardModalProps {
  brandId: string;
  brandName?: string;
  onClose: () => void;
  onSuccess?: (firstPageId?: string) => void;
}

export function DimensionMatrixWizardModal({
  brandId,
  brandName = "Brand",
  onClose,
  onSuccess,
}: DimensionMatrixWizardModalProps) {
  const router = useRouter();

  // Questionnaire form states
  const [selectedMedia, setSelectedMedia] = useState<Array<"cmyk" | "rgb" | "special">>([
    "cmyk",
    "rgb",
  ]);
  const [selectedOrientations, setSelectedOrientations] = useState<Array<"horizontal" | "vertical" | "symbol">>([
    "horizontal",
    "vertical",
    "symbol",
  ]);
  const [hasClaimOption, setHasClaimOption] = useState<boolean>(true);
  const [includeColorsPage, setIncludeColorsPage] = useState<boolean>(true);
  const [includeTypographyPage, setIncludeTypographyPage] = useState<boolean>(true);
  const [includeIntroPage, setIncludeIntroPage] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Combinatorial Math Counter
  const stats = useMemo(() => {
    let pagesCount = 0;
    let modulesCount = 0;

    // Intro page
    if (includeIntroPage) {
      pagesCount += 1;
      modulesCount += 2;
    }

    // Root logo category page
    pagesCount += 1;
    modulesCount += 2;

    // Media & Orientations loop
    selectedMedia.forEach(() => {
      // Medium category page
      pagesCount += 1;
      modulesCount += 2;

      selectedOrientations.forEach((ori) => {
        // Orientation category page
        pagesCount += 1;
        modulesCount += 2;

        if (ori === "symbol" || !hasClaimOption) {
          // 2 direct leaves (light, dark)
          pagesCount += 2;
          modulesCount += 2 * 6;
        } else {
          // 2 branch subcategories (Standard, With Claim)
          pagesCount += 2;
          modulesCount += 2 * 2;
          // 4 leaves (2 light, 2 dark)
          pagesCount += 4;
          modulesCount += 4 * 6;
        }
      });
    });

    // Colors page
    if (includeColorsPage) {
      pagesCount += 1;
      modulesCount += 5;
    }

    // Typography page
    if (includeTypographyPage) {
      pagesCount += 1;
      modulesCount += 2;
    }

    return { pagesCount, modulesCount };
  }, [
    selectedMedia,
    selectedOrientations,
    hasClaimOption,
    includeIntroPage,
    includeColorsPage,
    includeTypographyPage,
  ]);

  const toggleMedia = (m: "cmyk" | "rgb" | "special") => {
    setSelectedMedia((prev) =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter((item) => item !== m) : prev) : [...prev, m]
    );
  };

  const toggleOrientation = (o: "horizontal" | "vertical" | "symbol") => {
    setSelectedOrientations((prev) =>
      prev.includes(o) ? (prev.length > 1 ? prev.filter((item) => item !== o) : prev) : [...prev, o]
    );
  };

  const handleStartGeneration = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const config: DimensionMatrixConfig = {
        media: selectedMedia,
        orientations: selectedOrientations,
        hasClaimOption,
        includeIntroPage,
        includeColorsPage,
        includeTypographyPage,
      };

      const res = await generateBrandTreeAction(brandId, config);

      if (!res.success) {
        setError(res.error || "Nepodarilo sa vygenerovať štruktúru manuálu.");
        return;
      }

      if (onSuccess) {
        onSuccess(res.firstPageId);
      } else if (res.firstPageId) {
        router.push(`/admin/brand/${brandId}/builder/${res.firstPageId}`);
      } else {
        router.refresh();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri generovaní.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border/70 rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Sprievodca štruktúrou manuálu (Dimension Matrix)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Nakonfigurujte zloženie identity a vygenerujte hotový manuál s blueprintmi za 1 sekundu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Reproduction Media */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>1. Reprodukčné médiá a farebné priestory</span>
              <span className="text-[10px] text-primary font-mono">*</span>
            </label>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "cmyk" as const,
                  label: "Tlač (CMYK)",
                  desc: "Katalógy, vizitky, obaly a printové médiá",
                  icon: Printer,
                },
                {
                  id: "rgb" as const,
                  label: "Digitál (RGB)",
                  desc: "Web, aplikácie, sociálne siete a obrazovky",
                  icon: Monitor,
                },
                {
                  id: "special" as const,
                  label: "Špeciálne & Monochróm",
                  desc: "Priama farba Pantone, razba a jednofarebné",
                  icon: Stamp,
                },
              ].map((item) => {
                const isSelected = selectedMedia.includes(item.id);
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleMedia(item.id)}
                    className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-2xs"
                        : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent
                          className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="text-xs font-bold text-foreground">{item.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border/80 bg-background"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Logo Orientations */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>2. Orientácie a kompozície loga</span>
              <span className="text-[10px] text-primary font-mono">*</span>
            </label>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "horizontal" as const,
                  label: "Horizontálne",
                  sub: "Na šírku",
                  desc: "Štandardná horizontálna kompozícia pre hlavičky",
                },
                {
                  id: "vertical" as const,
                  label: "Vertikálne",
                  sub: "Na výšku",
                  desc: "Centrovaná vertikálna kompozícia",
                },
                {
                  id: "symbol" as const,
                  label: "Symbol / Monogram",
                  sub: "Bez písma",
                  desc: "Samostatný grafický znak alebo favicon",
                },
              ].map((item) => {
                const isSelected = selectedOrientations.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleOrientation(item.id)}
                    className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-2xs"
                        : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-foreground">{item.label}</div>
                        <div className="text-[10px] font-mono text-primary">{item.sub}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border/80 bg-background"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Claim Option with Symbol Exclusion Notice */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-muted/15 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">
                  3. Verzia s claimom / sloganom (Claim Option)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Rozdelí horizontálne a vertikálne varianty na vetvy Základná a S claimom.
                </p>
              </div>
              <input
                type="checkbox"
                checked={hasClaimOption}
                onChange={(e) => setHasClaimOption(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </label>

            {/* Symbol Exclusion Rule Badge */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-neutral-900/60 p-2 rounded border border-border/40 font-mono">
              <Info className="w-3 h-3 text-primary shrink-0" />
              <span>
                Pravidlo integrity: Samostatný symbol sa z princípu generuje výhradne bez claimu.
              </span>
            </div>
          </div>

          {/* Section 4: Additional Core Chapters */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              4. Doplnkové základné kapitoly identity
            </label>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <label
                className={`p-3 rounded-lg border text-left cursor-pointer flex items-center justify-between transition-all ${
                  includeColorsPage
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-muted/20 opacity-70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <div>
                    <span className="text-xs font-bold text-foreground">Farby</span>
                    <p className="text-[10px] text-muted-foreground">Paleta, HSLuv odtiene</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeColorsPage}
                  onChange={(e) => setIncludeColorsPage(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </label>

              <label
                className={`p-3 rounded-lg border text-left cursor-pointer flex items-center justify-between transition-all ${
                  includeTypographyPage
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-muted/20 opacity-70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-primary" />
                  <div>
                    <span className="text-xs font-bold text-foreground">Typografia</span>
                    <p className="text-[10px] text-muted-foreground">Rezy, type-tester</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeTypographyPage}
                  onChange={(e) => setIncludeTypographyPage(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </label>

              <label
                className={`p-3 rounded-lg border text-left cursor-pointer flex items-center justify-between transition-all ${
                  includeIntroPage
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-muted/20 opacity-70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <div>
                    <span className="text-xs font-bold text-foreground">Úvod</span>
                    <p className="text-[10px] text-muted-foreground">Banner a poslanie</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeIntroPage}
                  onChange={(e) => setIncludeIntroPage(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 5: Combinatorial Summary Box */}
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Matematika generátora (Dimension Matrix Engine)
              </span>
              <p className="text-[11px] text-muted-foreground">
                Inkrementálny beh: existujúce stránky nebudú prepísané, vytvoria sa len chýbajúce vetvy.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-mono font-bold text-foreground">
                ~{stats.pagesCount} stránok
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                ~{stats.modulesCount} modulov
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
          <span className="text-xs text-muted-foreground font-mono">
            {brandName} · Generator
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className="px-5 py-2 text-xs font-bold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isGenerating ? "Generujem manuál..." : "Spustiť generovanie"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
