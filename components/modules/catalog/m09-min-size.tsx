"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Printer,
  Monitor,
  Columns,
  Settings2,
  FileCode,
  Check,
  X,
  Database,
  Sparkles,
  Info,
  Maximize,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M09MinSizeConfig,
  m09MinSizeSchema,
} from "@/lib/validations/modules/m09";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { BrandAsset } from "@/lib/types/asset";

export default function M09MinimalnaVelkostLogaModule({
  id: moduleId,
  moduleType = "M09_MinimalnaVelkostLoga",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { tokens, resolveRadius } = useBrandCascade();
  const brandRadius = resolveRadius();
  const params = useParams();
  const brandId = (params?.brandId as string) || "";

  // Safe parse config with defaults
  const parsedConfig = useMemo(() => {
    const res = m09MinSizeSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      mediumMode: "both" as const,
      printMm: { width: 25, height: null },
      digitalPx: { width: 80, height: null },
      ruleText: {
        en: "To ensure legibility, this logo variation must not be reproduced smaller than the specified minimum dimensions. For smaller applications, use the standalone icon/symbol.",
        sk: "Pre zachovanie čitateľnosti nie je povolené používať túto variantu loga v rozmeroch menších, než sú stanovené minimá. Pre menšie aplikácie použite samostatný symbol.",
        cs: "Pro zachování čitelnosti není povoleno používat tuto variantu loga v rozměrech menších, než jsou stanovená minima. Pro menší aplikace použijte samostatný symbol.",
      },
      svgSource: "library" as const,
      assetId: null,
      customSvgUrl: "/logo/Logobook_symbol_RGB_D.svg",
    };
  }, [config]);

  const [cfg, setCfg] = useState<M09MinSizeConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"dimensions" | "source">("dimensions");

  // Loaded brand assets
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load assets on modal open
  useEffect(() => {
    if (isSettingsModalOpen && brandId) {
      if (brandAssets.length === 0) {
        setIsLoadingAssets(true);
        getBrandAssetsAction(brandId)
          .then((res) => {
            if (res.success && res.assets) setBrandAssets(res.assets);
          })
          .catch((err) => console.error("Error loading brand assets:", err))
          .finally(() => setIsLoadingAssets(false));
      }
    }
  }, [isSettingsModalOpen, brandId, brandAssets.length]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M09MinSizeConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M09 config:", err);
      }
    }
  };

  // Inline rule text save
  const handleRuleTextSave = async (newText: string) => {
    const updatedRule = setI18nText(cfg.ruleText, newText, locale);
    const newConfig: M09MinSizeConfig = {
      ...cfg,
      ruleText: updatedRule,
    };
    await handleSaveConfig(newConfig);
  };

  // Resolve active SVG Logo URL
  const resolvedLogoUrl = useMemo(() => {
    if (cfg.customSvgUrl) return cfg.customSvgUrl;
    if (cfg.assetId && brandAssets.length > 0) {
      const match = brandAssets.find((a) => a.id === cfg.assetId);
      if (match?.preview) return match.preview;
      const svgFile = match?.files.find((f) => f.fileFormat === "SVG");
      if (svgFile?.fileUrl) return svgFile.fileUrl;
    }
    return "/logo/Logobook_symbol_RGB_D.svg";
  }, [cfg.customSvgUrl, cfg.assetId, brandAssets]);

  // Resolve rule text for current locale
  const resolvedRuleText =
    resolveI18nText(cfg.ruleText, locale) ||
    "Pre zachovanie čitateľnosti nie je povolené používať logo v menších rozmeroch než stanovené minimum.";

  // Quick mode handler
  const handleQuickMode = (mode: "print" | "digital" | "both") => {
    handleSaveConfig({
      ...cfg,
      mediumMode: mode,
    });
  };

  const showPrint = cfg.mediumMode === "print" || cfg.mediumMode === "both";
  const showDigital = cfg.mediumMode === "digital" || cfg.mediumMode === "both";

  const printWidth = cfg.printMm?.width || 25;
  const printHeight = cfg.printMm?.height;
  const digitalWidth = cfg.digitalPx?.width || 80;
  const digitalHeight = cfg.digitalPx?.height;

  return (
    <div className="relative group/m09 py-4">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m09:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          {/* Quick Medium Switcher */}
          <div className="flex items-center border-r border-white/20 pr-1 mr-1">
            <button
              type="button"
              title="Iba Tlač (mm)"
              onClick={() => handleQuickMode("print")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] transition-colors ${
                cfg.mediumMode === "print"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Tlač (mm)</span>
            </button>
            <button
              type="button"
              title="Iba Digitál (px)"
              onClick={() => handleQuickMode("digital")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] transition-colors ${
                cfg.mediumMode === "digital"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Digitál (px)</span>
            </button>
            <button
              type="button"
              title="Tlač aj Digitál vedľa seba"
              onClick={() => handleQuickMode("both")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] transition-colors ${
                cfg.mediumMode === "both"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Obidve</span>
            </button>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs transition-colors hover:opacity-90"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Nastavenia veľkostí</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div
        className="bg-card border border-border/60 p-6 sm:p-8 shadow-sm overflow-hidden space-y-6"
        style={{ borderRadius: brandRadius }}
      >
        {/* PARALLEL CARDS GRID */}
        <div
          className={`grid gap-6 ${
            cfg.mediumMode === "both" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* PRINT CARD (CMYK / mm) */}
          {showPrint && (
            <div className="bg-muted/40 border border-border/50 rounded-[3px] p-6 flex flex-col justify-between space-y-6">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                  <Printer className="w-4 h-4" />
                  <span>Tlač & Ofset (CMYK / Pantone)</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase px-2 py-0.5 rounded bg-card border border-border/60">
                  Fyzické milimetre
                </span>
              </div>

              {/* Big Hero Dimension Callout */}
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                  {printWidth} mm
                  {printHeight ? (
                    <span className="text-muted-foreground text-2xl font-normal ml-2">
                      × {printHeight} mm
                    </span>
                  ) : (
                    <span className="text-xs font-sans font-normal text-muted-foreground ml-2">
                      (šírka)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Minimálna povolená veľkosť pre ofsetovú tlač a merkantil.
                </p>
              </div>

              {/* 1:1 Live Preview Box (Physical mm simulation via CSS) */}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                    <Maximize className="w-3 h-3 text-primary" />
                    <span>Náhľad 1:1 (Reálna mierka {printWidth} mm)</span>
                  </span>
                </div>
                <div className="min-h-[90px] bg-card rounded-[3px] border border-border/60 p-4 flex items-center justify-center overflow-hidden">
                  {resolvedLogoUrl ? (
                    <img
                      src={resolvedLogoUrl}
                      alt="Print 1:1 Logo"
                      style={{
                        width: `${printWidth}mm`,
                        height: printHeight ? `${printHeight}mm` : "auto",
                        maxWidth: "100%",
                      }}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Žiadne logo</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DIGITAL CARD (RGB / px) */}
          {showDigital && (
            <div className="bg-muted/40 border border-border/50 rounded-[3px] p-6 flex flex-col justify-between space-y-6">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                  <Monitor className="w-4 h-4" />
                  <span>Digitál & Obrazovka (RGB / Web)</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase px-2 py-0.5 rounded bg-card border border-border/60">
                  Obrazovkové pixely
                </span>
              </div>

              {/* Big Hero Dimension Callout */}
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                  {digitalWidth} px
                  {digitalHeight ? (
                    <span className="text-muted-foreground text-2xl font-normal ml-2">
                      × {digitalHeight} px
                    </span>
                  ) : (
                    <span className="text-xs font-sans font-normal text-muted-foreground ml-2">
                      (šírka)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Minimálna povolená veľkosť pre webové rozhrania, bannery a aplikácie.
                </p>
              </div>

              {/* 1:1 Live Preview Box (Pixel simulation via CSS) */}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                    <Maximize className="w-3 h-3 text-primary" />
                    <span>Náhľad 1:1 (Pixelová mierka {digitalWidth} px)</span>
                  </span>
                </div>
                <div className="min-h-[90px] bg-card rounded-[3px] border border-border/50 p-4 flex items-center justify-center overflow-hidden">
                  {resolvedLogoUrl ? (
                    <img
                      src={resolvedLogoUrl}
                      alt="Digital 1:1 Logo"
                      style={{
                        width: `${digitalWidth}px`,
                        height: digitalHeight ? `${digitalHeight}px` : "auto",
                        maxWidth: "100%",
                      }}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Žiadne logo</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RULE TEXT & EXPLANATION (Direct Inline Editable in Editor) */}
        <div className="bg-muted/50 border border-border/50 p-4 rounded-[3px]">
          <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pravidlo minimálnej veľkosti a čitateľnosti</span>
          </div>

          {isEditor ? (
            <div className="text-xs text-muted-foreground leading-relaxed">
              <InlineEditableText
                value={resolvedRuleText}
                onSave={handleRuleTextSave}
                multiline
                placeholder="Zadajte text pravidla minimálnej veľkosti..."
                className="outline-none focus:ring-1 focus:ring-primary/40 p-1 rounded"
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">{resolvedRuleText}</p>
          )}
        </div>
      </div>

      {/* Settings Modal (Dimensions Inputs & Logo Picker) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            className="bg-[#0e161d] border border-white/20 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-[#fafbfc]">
                  Nastavenia minimálnej veľkosti (M09)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 bg-[#070b0f] px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setModalTab("dimensions")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "dimensions"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                1. Rozmery (mm / px)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("source")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "source"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                2. Zdroj loga
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: DIMENSIONS */}
              {modalTab === "dimensions" && (
                <div className="space-y-4">
                  {/* Medium Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#96abbe] uppercase tracking-wider text-[10px]">
                      Režim média
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, mediumMode: "print" })}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.mediumMode === "print"
                            ? "bg-primary/20 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-white/10 text-[#96abbe] hover:text-[#fafbfc]"
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Iba Tlač (mm)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, mediumMode: "digital" })}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.mediumMode === "digital"
                            ? "bg-primary/20 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-white/10 text-[#96abbe] hover:text-[#fafbfc]"
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Iba Digitál (px)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, mediumMode: "both" })}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.mediumMode === "both"
                            ? "bg-primary/20 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-white/10 text-[#96abbe] hover:text-[#fafbfc]"
                        }`}
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Obidve vedľa seba</span>
                      </button>
                    </div>
                  </div>

                  {/* Print Dimensions (mm) */}
                  {showPrint && (
                    <div className="bg-[#17212a] p-3 rounded-[3px] border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                        <Printer className="w-3.5 h-3.5" />
                        <span>Rozmery pre Tlač (milimetre - mm)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-[#96abbe]">Min. šírka (mm) *</label>
                          <input
                            type="number"
                            min="1"
                            value={cfg.printMm?.width || 25}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                printMm: {
                                  width: Number(e.target.value),
                                  height: cfg.printMm?.height || null,
                                },
                              })
                            }
                            className="w-full bg-[#070b0f] border border-white/20 rounded-[3px] px-3 py-1.5 text-[#fafbfc] font-mono text-xs focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-[#96abbe]">Min. výška (mm, voliteľné)</label>
                          <input
                            type="number"
                            min="1"
                            value={cfg.printMm?.height || ""}
                            placeholder="Automaticky"
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                printMm: {
                                  width: cfg.printMm?.width || 25,
                                  height: e.target.value ? Number(e.target.value) : null,
                                },
                              })
                            }
                            className="w-full bg-[#070b0f] border border-white/20 rounded-[3px] px-3 py-1.5 text-[#fafbfc] font-mono text-xs focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Digital Dimensions (px) */}
                  {showDigital && (
                    <div className="bg-[#17212a] p-3 rounded-[3px] border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Rozmery pre Digitál (pixely - px)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-[#96abbe]">Min. šírka (px) *</label>
                          <input
                            type="number"
                            min="1"
                            value={cfg.digitalPx?.width || 80}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                digitalPx: {
                                  width: Number(e.target.value),
                                  height: cfg.digitalPx?.height || null,
                                },
                              })
                            }
                            className="w-full bg-[#070b0f] border border-white/20 rounded-[3px] px-3 py-1.5 text-[#fafbfc] font-mono text-xs focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-[#96abbe]">Min. výška (px, voliteľné)</label>
                          <input
                            type="number"
                            min="1"
                            value={cfg.digitalPx?.height || ""}
                            placeholder="Automaticky"
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                digitalPx: {
                                  width: cfg.digitalPx?.width || 80,
                                  height: e.target.value ? Number(e.target.value) : null,
                                },
                              })
                            }
                            className="w-full bg-[#070b0f] border border-white/20 rounded-[3px] px-3 py-1.5 text-[#fafbfc] font-mono text-xs focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LOGO SOURCE */}
              {modalTab === "source" && (
                <div className="space-y-4">
                  {/* Select from Brand Assets */}
                  <div className="bg-[#17212a] p-3 rounded-[3px] border border-white/10 space-y-2">
                    <label className="font-semibold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>Knižnica surových lôg</span>
                    </label>
                    {brandAssets.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {brandAssets.map((asset) => {
                          const isSelected = cfg.assetId === asset.id;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() =>
                                handleSaveConfig({
                                  ...cfg,
                                  assetId: asset.id,
                                  customSvgUrl: asset.preview || asset.files.find((f) => f.fileFormat === "SVG")?.fileUrl || null,
                                })
                              }
                              className={`p-2 rounded-[3px] border text-left flex items-center gap-2 transition-colors ${
                                isSelected
                                  ? "bg-primary/20 border-primary text-primary"
                                  : "bg-[#070b0f] border-white/10 hover:border-white/20 text-[#96abbe] hover:text-[#fafbfc]"
                              }`}
                            >
                              {asset.preview ? (
                                <img
                                  src={asset.preview}
                                  alt=""
                                  className="w-8 h-8 object-contain shrink-0 bg-[#070b0f] rounded p-1 border border-white/10"
                                />
                              ) : (
                                <FileCode className="w-6 h-6 shrink-0 opacity-50" />
                              )}
                              <span className="font-semibold text-[11px] truncate">
                                {typeof asset.name === "object"
                                  ? resolveI18nText(asset.name, locale) || asset.id
                                  : asset.name || asset.id}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#96abbe] italic">
                        Žiadne assety v knižnici lôg.
                      </p>
                    )}
                  </div>

                  {/* Direct SVG URL input */}
                  <div className="space-y-1 bg-[#17212a] p-3 rounded-[3px] border border-white/10">
                    <label className="text-[#96abbe] text-[11px] font-medium">
                      Priama URL adresa SVG loga
                    </label>
                    <input
                      type="text"
                      value={cfg.customSvgUrl || ""}
                      placeholder="/logo/symbol.svg alebo https://..."
                      onChange={(e) =>
                        handleSaveConfig({
                          ...cfg,
                          customSvgUrl: e.target.value || null,
                        })
                      }
                      className="w-full bg-[#070b0f] border border-white/20 rounded-[3px] px-3 py-1.5 text-[#fafbfc] text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t border-white/10 bg-[#17212a]">
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
