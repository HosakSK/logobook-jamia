"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Type,
  Settings2,
  Check,
  X,
  Sliders,
  Sparkles,
  Layers,
  ShieldCheck,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M18TypographyConfig,
  m18TypographySchema,
} from "@/lib/validations/modules/m18";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandTypographyAction } from "@/actions/typography";
import { BrandTypography } from "@/lib/types/typography";

const AVAILABLE_WEIGHTS = [
  { value: 100, label: "Thin 100" },
  { value: 200, label: "ExtraLight 200" },
  { value: 300, label: "Light 300" },
  { value: 400, label: "Regular 400" },
  { value: 500, label: "Medium 500" },
  { value: 600, label: "SemiBold 600" },
  { value: 700, label: "Bold 700" },
  { value: 800, label: "ExtraBold 800" },
  { value: 900, label: "Black 900" },
];

export default function M18TypografiaModule({
  id: moduleId,
  moduleType = "M18_Typografia",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveRadius } = useBrandCascade();
  const brandRadius = resolveRadius();
  const params = useParams();
  const brandId = (params?.brandId as string) || "";

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m18TypographySchema.safeParse(config);
    if (res.success) return res.data;
    return {
      typographyId: null,
      license: "SIL Open Font License",
      authors: "Tokotype / Google Fonts",
      selectedWeights: [300, 400, 600, 800],
      isVariableFont: false,
      showTypeTester: true,
      showGlyphSet: true,
      showHierarchyTable: true,
      hierarchy: {
        h1: { size: 48, weight: 700, lineHeight: 1.2 },
        h2: { size: 32, weight: 600, lineHeight: 1.25 },
        h3: { size: 24, weight: 500, lineHeight: 1.3 },
        body: { size: 16, weight: 400, lineHeight: 1.6 },
      },
    };
  }, [config]);

  const [cfg, setCfg] = useState<M18TypographyConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"font" | "weights" | "hierarchy">("font");

  // Loaded brand typography records
  const [brandTypography, setBrandTypography] = useState<BrandTypography[]>([]);
  const [isLoadingTypography, setIsLoadingTypography] = useState(false);

  // Type tester interactive state
  const defaultPangram = useMemo(() => {
    if (locale === "sk") return "Päť tiel chytá v hĺbke oceánu štvorku svižných rýb.";
    if (locale === "cs") return "Příliš žluťoučký kůň úpěl ďábelské ódy.";
    return "The quick brown fox jumps over the lazy dog.";
  }, [locale]);

  const [testText, setTestText] = useState(defaultPangram);
  const [testSize, setTestSize] = useState(36);
  const [testWeight, setTestWeight] = useState(400);
  const [testLetterSpacing, setTestLetterSpacing] = useState(0);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Update default pangram when locale changes if untouched
  useEffect(() => {
    setTestText(defaultPangram);
  }, [defaultPangram]);

  // Load typography records for brand
  useEffect(() => {
    if (brandId) {
      setIsLoadingTypography(true);
      getBrandTypographyAction(brandId)
        .then((res) => {
          if (res.success && res.typography) setBrandTypography(res.typography);
        })
        .catch((err) => console.error("Error loading typography:", err))
        .finally(() => setIsLoadingTypography(false));
    }
  }, [brandId]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M18TypographyConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M18 config:", err);
      }
    }
  };

  // Resolve active typography record or fallback
  const activeTypography = useMemo(() => {
    if (cfg.typographyId && brandTypography.length > 0) {
      const match = brandTypography.find((t) => t.id === cfg.typographyId);
      if (match) return match;
    }
    if (brandTypography.length > 0) {
      return brandTypography[0];
    }
    // Fallback: Plus Jakarta Sans
    return {
      id: "seed-jakarta",
      brand: brandId,
      name: "Plus Jakarta Sans",
      role: "PRIMARY" as const,
      fontSource: "GOOGLE_FONTS" as const,
      googleFontFamily: "Plus Jakarta Sans",
      fontFamilyName: "Plus Jakarta Sans",
      licenseConfirmed: true,
      licenseAllowsOfflineDistribution: true,
      settings: {
        weights: [300, 400, 600, 700, 800],
        fallback: "sans-serif",
      },
      order: 1,
      created: "",
      updated: "",
    };
  }, [cfg.typographyId, brandTypography, brandId]);

  // Compute CSS font-family name
  const targetFontFamily = useMemo(() => {
    if (activeTypography.fontFamilyName) return `"${activeTypography.fontFamilyName}", sans-serif`;
    if (activeTypography.googleFontFamily) return `"${activeTypography.googleFontFamily}", sans-serif`;
    if (activeTypography.name) return `"${activeTypography.name}", sans-serif`;
    return '"Plus Jakarta Sans", sans-serif';
  }, [activeTypography]);

  // Synchronize test weight if current weight is not in selectedWeights
  useEffect(() => {
    if (cfg.selectedWeights.length > 0 && !cfg.selectedWeights.includes(testWeight)) {
      setTestWeight(cfg.selectedWeights[0]);
    }
  }, [cfg.selectedWeights, testWeight]);

  return (
    <div className="relative group/m18 py-4 space-y-6">
      {/* Dynamic Google Fonts Link if needed */}
      {activeTypography.googleFontFamily && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(
            activeTypography.googleFontFamily
          )}:wght@100;200;300;400;500;600;700;800;900&display=swap`}
        />
      )}

      {/* Optional H3 Header */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m18:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Nastavenia typografie</span>
          </button>
        </div>
      )}

      {/* FONT HEADER SPECIMEN CARD */}
      <div
        className="bg-card border border-border/60 p-6 sm:p-8 space-y-6 shadow-sm"
        style={{ borderRadius: brandRadius, fontFamily: targetFontFamily }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-primary/10 border border-primary/30 text-primary">
                {activeTypography.role || "PRIMARY FONT"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {activeTypography.fontSource || "Google Fonts"}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {activeTypography.name}
            </h2>
          </div>

          <div className="text-left sm:text-right space-y-0.5 font-mono text-xs text-muted-foreground">
            {cfg.authors && <div>Autor: <span className="text-foreground font-semibold">{cfg.authors}</span></div>}
            {cfg.license && <div>Licencia: <span className="text-primary font-semibold">{cfg.license}</span></div>}
          </div>
        </div>

        {/* SECTION 1: GLYPH SET & WEIGHTS */}
        {cfg.showGlyphSet && (
          <div className="space-y-6 pt-2">
            {/* Pangram Display in Weights */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">
                Zvolené rezy písma:
              </span>

              <div className="space-y-3 divide-y divide-border/30">
                {cfg.selectedWeights.map((weight) => {
                  const weightDef = AVAILABLE_WEIGHTS.find((w) => w.value === weight);
                  return (
                    <div
                      key={weight}
                      className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-baseline justify-between gap-3"
                    >
                      <p
                        className="text-lg sm:text-2xl text-foreground tracking-tight leading-snug"
                        style={{ fontWeight: weight }}
                      >
                        {defaultPangram}
                      </p>
                      <span className="text-[11px] font-mono uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-[2px] border border-border/50 shrink-0 self-start md:self-baseline">
                        {weightDef?.label || `Weight ${weight}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Alphabet & Symbols */}
            <div className="space-y-3 pt-4 border-t border-border/40 font-mono text-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider block">
                Znaková sada (Glyphs):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-[3px] border border-border/50 text-foreground">
                <div className="space-y-2">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold">Lowercase:</div>
                  <div className="text-sm tracking-widest break-words leading-relaxed">
                    a b c d e f g h i j k l m n o p q r s t u v w x y z á ä č ď é í ľ ĺ ň ó ô ŕ šť ú ý ž
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold">Uppercase:</div>
                  <div className="text-sm tracking-widest break-words leading-relaxed">
                    A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Á Ä Č Ď É Í Ľ Ĺ Ň Ó Ô Ŕ ŠŤ Ú Ý Ž
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2 pt-2 border-t border-border/30">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold">Čísla a symboly:</div>
                  <div className="text-sm tracking-widest break-words leading-relaxed font-mono">
                    0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( ) _ + - = : ; &quot; &apos; ? /
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: INTERACTIVE TYPE TESTER */}
        {cfg.showTypeTester && (
          <div className="space-y-3 pt-4 border-t border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">
                  Interaktívny Type Tester
                </span>
              </div>

              {/* Controls Toolbar */}
              <div className="flex flex-wrap items-center gap-3 bg-muted/50 p-2 rounded-[3px] border border-border/50 text-xs">
                {/* Size Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    Veľkosť:
                  </span>
                  <input
                    type="range"
                    min={14}
                    max={96}
                    value={testSize}
                    onChange={(e) => setTestSize(Number(e.target.value))}
                    className="w-20 accent-primary cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] font-bold text-foreground w-8">
                    {testSize}px
                  </span>
                </div>

                {/* Weight Selector / Slider */}
                <div className="flex items-center gap-2 border-l border-border/40 pl-3">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    Rez:
                  </span>
                  {cfg.isVariableFont ? (
                    <>
                      <input
                        type="range"
                        min={100}
                        max={900}
                        step={50}
                        value={testWeight}
                        onChange={(e) => setTestWeight(Number(e.target.value))}
                        className="w-20 accent-primary cursor-pointer h-1.5"
                      />
                      <span className="font-mono text-[11px] font-bold text-foreground w-8">
                        {testWeight}
                      </span>
                    </>
                  ) : (
                    <select
                      value={testWeight}
                      onChange={(e) => setTestWeight(Number(e.target.value))}
                      className="bg-background border border-border/60 rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      {cfg.selectedWeights.map((w) => (
                        <option key={w} value={w}>
                          {AVAILABLE_WEIGHTS.find((aw) => aw.value === w)?.label || w}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Reset Text */}
                <button
                  type="button"
                  onClick={() => {
                    setTestText(defaultPangram);
                    setTestSize(36);
                    setTestWeight(400);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground border border-border/40 bg-[#0e161d]"
                  title="Obnoviť predvolený text a nastavenia"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Test Input Area */}
            <div className="relative">
              <textarea
                rows={2}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Napíšte si vlastný text..."
                className="w-full bg-[#17212a] border border-border/60 rounded-[3px] p-4 text-foreground focus:outline-none focus:border-primary transition-all resize-y min-h-[110px]"
                style={{
                  fontFamily: targetFontFamily,
                  fontSize: `${testSize}px`,
                  fontWeight: testWeight,
                  lineHeight: 1.25,
                  letterSpacing: `${testLetterSpacing}px`,
                }}
              />
            </div>
          </div>
        )}

        {/* SECTION 3: TYPOGRAPHIC HIERARCHY */}
        {cfg.showHierarchyTable && (
          <div className="space-y-4 pt-4 border-t border-border/40">
            <span className="text-[11px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">
              Typografická hierarchia & Rytmus:
            </span>

            <div className="space-y-4 bg-[#17212a] p-5 rounded-[3px] border border-border/50 divide-y divide-border/30">
              {/* H1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-bold">H1 Headline</span>
                  <span>
                    {cfg.hierarchy.h1.size}px • Weight {cfg.hierarchy.h1.weight} • Line-height {cfg.hierarchy.h1.lineHeight}
                  </span>
                </div>
                <div
                  className="text-foreground tracking-tight"
                  style={{
                    fontFamily: targetFontFamily,
                    fontSize: `${cfg.hierarchy.h1.size}px`,
                    fontWeight: cfg.hierarchy.h1.weight,
                    lineHeight: cfg.hierarchy.h1.lineHeight,
                  }}
                >
                  Hlavný nadpis stránky (H1)
                </div>
              </div>

              {/* H2 */}
              <div className="pt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-bold">H2 Subheading</span>
                  <span>
                    {cfg.hierarchy.h2.size}px • Weight {cfg.hierarchy.h2.weight} • Line-height {cfg.hierarchy.h2.lineHeight}
                  </span>
                </div>
                <div
                  className="text-foreground tracking-tight"
                  style={{
                    fontFamily: targetFontFamily,
                    fontSize: `${cfg.hierarchy.h2.size}px`,
                    fontWeight: cfg.hierarchy.h2.weight,
                    lineHeight: cfg.hierarchy.h2.lineHeight,
                  }}
                >
                  Podnadpis sekcie a kapitoly (H2)
                </div>
              </div>

              {/* H3 */}
              <div className="pt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-bold">H3 Title</span>
                  <span>
                    {cfg.hierarchy.h3.size}px • Weight {cfg.hierarchy.h3.weight} • Line-height {cfg.hierarchy.h3.lineHeight}
                  </span>
                </div>
                <div
                  className="text-foreground tracking-tight"
                  style={{
                    fontFamily: targetFontFamily,
                    fontSize: `${cfg.hierarchy.h3.size}px`,
                    fontWeight: cfg.hierarchy.h3.weight,
                    lineHeight: cfg.hierarchy.h3.lineHeight,
                  }}
                >
                  Nadpis bloku alebo karty (H3)
                </div>
              </div>

              {/* Body */}
              <div className="pt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-bold">Body Paragraph</span>
                  <span>
                    {cfg.hierarchy.body.size}px • Weight {cfg.hierarchy.body.weight} • Line-height {cfg.hierarchy.body.lineHeight}
                  </span>
                </div>
                <p
                  className="text-muted-foreground leading-relaxed max-w-3xl"
                  style={{
                    fontFamily: targetFontFamily,
                    fontSize: `${cfg.hierarchy.body.size}px`,
                    fontWeight: cfg.hierarchy.body.weight,
                    lineHeight: cfg.hierarchy.body.lineHeight,
                  }}
                >
                  Základný odsek bežného textu. Zaisťuje optimálnu čitateľnosť, vyvážený vertikálny rytmus a prirodzený tok čítania v dlhších blokoch obsahu digitálnych aj printových materiálov.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN SETTINGS MODAL (Pencil Hell Free) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-[#0e161d] border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nastavenia typografického modulu (M18)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-neutral-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border/40 bg-neutral-900/40 px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setModalTab("font")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "font"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Výber písma
              </button>
              <button
                type="button"
                onClick={() => setModalTab("weights")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "weights"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Rezy písma
              </button>
              <button
                type="button"
                onClick={() => setModalTab("hierarchy")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "hierarchy"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                3. Hierarchia a sekcie
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: FONT SELECTION */}
              {modalTab === "font" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-foreground block">
                      Zvoľte písmo z globálnej typografie značky:
                    </label>

                    {brandTypography.length === 0 ? (
                      <div className="text-muted-foreground p-3.5 bg-[#17212a] rounded border border-border/40">
                        V projekte zatiaľ nie sú vytvorené vlastné záznamy písiem. Modul používa predvolené písmo Plus Jakarta Sans.
                      </div>
                    ) : (
                      <select
                        value={cfg.typographyId || ""}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            typographyId: e.target.value || null,
                          })
                        }
                        className="w-full bg-[#17212a] border border-border/50 rounded-[2px] p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                      >
                        {brandTypography.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.role} • {t.fontSource})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-muted-foreground block">
                        Autor / Písmoliatňa:
                      </label>
                      <input
                        type="text"
                        value={cfg.authors}
                        onChange={(e) =>
                          handleSaveConfig({ ...cfg, authors: e.target.value })
                        }
                        className="w-full bg-[#17212a] border border-border/50 rounded-[2px] px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-muted-foreground block">
                        Licenčné podmienky:
                      </label>
                      <input
                        type="text"
                        value={cfg.license}
                        onChange={(e) =>
                          handleSaveConfig({ ...cfg, license: e.target.value })
                        }
                        className="w-full bg-[#17212a] border border-border/50 rounded-[2px] px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                      <input
                        type="checkbox"
                        checked={cfg.isVariableFont}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            isVariableFont: e.target.checked,
                          })
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                      />
                      <div>
                        <span className="text-foreground text-[11px] font-semibold block">
                          Písmo je variabilné (Variable Font)
                        </span>
                        <span className="text-muted-foreground text-[10px] block">
                          Umožní v Type Testeri plynulý posuvník hrúbky 100 až 900
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: WEIGHTS CHECKBOX LIST */}
              {modalTab === "weights" && (
                <div className="space-y-3">
                  <span className="font-semibold text-foreground text-xs block">
                    Vyberte hrúbky rezu (Weights), ktoré sa majú vo vzorkovníku prezentovať:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#17212a] p-3.5 rounded-[3px] border border-border/40">
                    {AVAILABLE_WEIGHTS.map((weight) => {
                      const isChecked = cfg.selectedWeights.includes(weight.value);

                      return (
                        <label
                          key={weight.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let updated = [...cfg.selectedWeights];
                              if (e.target.checked) {
                                if (!updated.includes(weight.value)) updated.push(weight.value);
                              } else {
                                updated = updated.filter((w) => w !== weight.value);
                              }
                              updated.sort((a, b) => a - b);
                              handleSaveConfig({ ...cfg, selectedWeights: updated });
                            }}
                            className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                          />
                          <span className="text-foreground text-[11px] font-mono">
                            {weight.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: HIERARCHY & DISPLAY */}
              {modalTab === "hierarchy" && (
                <div className="space-y-4">
                  {/* Toggles */}
                  <div className="space-y-2 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showGlyphSet}
                        onChange={(e) =>
                          handleSaveConfig({ ...cfg, showGlyphSet: e.target.checked })
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                      />
                      <span className="text-foreground text-[11px]">
                        Zobraziť znakovú sadu a rezy písma (Glyph Set)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showTypeTester}
                        onChange={(e) =>
                          handleSaveConfig({ ...cfg, showTypeTester: e.target.checked })
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                      />
                      <span className="text-foreground text-[11px]">
                        Zobraziť interaktívny Type Tester s posuvníkmi
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showHierarchyTable}
                        onChange={(e) =>
                          handleSaveConfig({ ...cfg, showHierarchyTable: e.target.checked })
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                      />
                      <span className="text-foreground text-[11px]">
                        Zobraziť tabuľku typografickej hierarchie (H1, H2, H3, Body)
                      </span>
                    </label>
                  </div>

                  {/* Hierarchy Inputs */}
                  {cfg.showHierarchyTable && (
                    <div className="space-y-3">
                      <span className="font-semibold text-foreground text-xs block">
                        Technické parametre hierarchie:
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                        {(["h1", "h2", "h3", "body"] as const).map((level) => {
                          const item = cfg.hierarchy[level];
                          return (
                            <div
                              key={level}
                              className="bg-[#17212a] p-2.5 rounded-[2px] border border-border/50 space-y-1.5"
                            >
                              <span className="text-primary font-bold uppercase block">
                                {level}
                              </span>
                              <div>
                                <span className="text-[10px] text-muted-foreground block">
                                  Veľkosť (px):
                                </span>
                                <input
                                  type="number"
                                  value={item.size}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleSaveConfig({
                                      ...cfg,
                                      hierarchy: {
                                        ...cfg.hierarchy,
                                        [level]: { ...item, size: val },
                                      },
                                    });
                                  }}
                                  className="w-full bg-[#0e161d] border border-border/50 rounded px-1.5 py-0.5 text-foreground"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-muted-foreground block">
                                  Line-height:
                                </span>
                                <input
                                  type="number"
                                  step={0.05}
                                  value={item.lineHeight}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleSaveConfig({
                                      ...cfg,
                                      hierarchy: {
                                        ...cfg.hierarchy,
                                        [level]: { ...item, lineHeight: val },
                                      },
                                    });
                                  }}
                                  className="w-full bg-[#0e161d] border border-border/50 rounded px-1.5 py-0.5 text-foreground"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t border-border/60 bg-[#17212a]">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-[3px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
