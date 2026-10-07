"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Square,
  Circle,
  Layers,
  Settings2,
  FileCode,
  Image as ImageIcon,
  Check,
  X,
  Sliders,
  Database,
  ArrowLeftRight,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M08ClearanceZoneConfig,
  m08ClearanceZoneSchema,
} from "@/lib/validations/modules/m08";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { getBrandMediaAction } from "@/actions/media";
import { BrandAsset } from "@/lib/types/asset";
import { MediaAsset } from "@/lib/types/media";

export default function M08OchrannaZonaLogaModule({
  id: moduleId,
  moduleType = "M08_OchrannaZonaLoga",
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

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m08ClearanceZoneSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      svgSource: "library" as const,
      assetId: null,
      customSvgUrl: "/logo/Logobook_symbol_RGB_D.svg",
      customDiagramUrl: null,
      zones: {
        rectangular: {
          enabled: true,
          dimension: "width" as const,
          percentage: 15,
        },
        circular: {
          enabled: false,
          radiusPercentage: 20,
        },
      },
      ruleText: {
        en: "The clearance zone represents the mandatory minimum safe space surrounding the logo, defined as a percentage of its dimension. No typography, graphical elements, or page borders may encroach into this protective perimeter.",
        sk: "Ochranná zóna predstavuje povinný minimálny prázdny priestor okolo loga, definovaný ako percento z jeho rozmeru. Žiadne texty, grafické prvky ani okraje strany nesmú zasahovať do tohto vymedzeného priestoru.",
        cs: "Ochranná zóna představuje povinný minimální prázdný prostor kolem loga, definovaný jako procento z jeho rozměru. Žádné texty, grafické prvky ani okraje strany nesmí zasahovat do tohoto vymezeného prostoru.",
      },
    };
  }, [config]);

  const [cfg, setCfg] = useState<M08ClearanceZoneConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"zones" | "source" | "diagram">("zones");

  // Loaded brand assets and media
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [brandMedia, setBrandMedia] = useState<MediaAsset[]>([]);
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

      if (brandMedia.length === 0) {
        getBrandMediaAction(brandId)
          .then((res) => {
            if (res.success && res.media) setBrandMedia(res.media);
          })
          .catch((err) => console.error("Error loading brand media:", err));
      }
    }
  }, [isSettingsModalOpen, brandId, brandAssets.length, brandMedia.length]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M08ClearanceZoneConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M08 config:", err);
      }
    }
  };

  // Inline text rule save handler
  const handleRuleTextSave = async (newText: string) => {
    const updatedRule = setI18nText(cfg.ruleText, newText, locale);
    const newConfig: M08ClearanceZoneConfig = {
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
    "Ochranná zóna loga je definovaná ako percento z jeho rozmeru.";

  // Quick mode handler
  const handleQuickMode = (mode: "rect" | "circle" | "both" | "custom") => {
    if (mode === "custom") {
      handleSaveConfig({
        ...cfg,
        customDiagramUrl: cfg.customDiagramUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      });
      return;
    }

    handleSaveConfig({
      ...cfg,
      customDiagramUrl: null,
      zones: {
        rectangular: {
          ...cfg.zones.rectangular,
          enabled: mode === "rect" || mode === "both",
        },
        circular: {
          ...cfg.zones.circular,
          enabled: mode === "circle" || mode === "both",
        },
      },
    });
  };

  // Dimensions for generative overlay
  const rectPct = cfg.zones.rectangular.percentage;
  const circPct = cfg.zones.circular.radiusPercentage;

  // Scale padding around logo based on percentage
  const rectOffsetPx = Math.max(12, Math.round(rectPct * 2.2));
  const circleDiameterPx = Math.max(160, 160 + circPct * 4);

  return (
    <div className="relative group/m08 py-4">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m08:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          {/* Quick Mode Buttons */}
          <div className="flex items-center border-r border-white/20 pr-1 mr-1">
            <button
              type="button"
              title="Obdĺžniková zóna"
              onClick={() => handleQuickMode("rect")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] transition-colors ${
                cfg.zones.rectangular.enabled && !cfg.zones.circular.enabled && !cfg.customDiagramUrl
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Obdĺžnik</span>
            </button>
            <button
              type="button"
              title="Kruhová zóna"
              onClick={() => handleQuickMode("circle")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] transition-colors ${
                cfg.zones.circular.enabled && !cfg.zones.rectangular.enabled && !cfg.customDiagramUrl
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Kruh</span>
            </button>
            <button
              type="button"
              title="Obidve zóny"
              onClick={() => handleQuickMode("both")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] transition-colors ${
                cfg.zones.rectangular.enabled && cfg.zones.circular.enabled && !cfg.customDiagramUrl
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Obidve</span>
            </button>
            <button
              type="button"
              title="Vlastný diagram"
              onClick={() => handleQuickMode("custom")}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] transition-colors ${
                cfg.customDiagramUrl
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Diagram</span>
            </button>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs transition-colors hover:opacity-90"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Nastavenia percent</span>
          </button>
        </div>
      )}

      {/* Main Clearance Zone Card Container */}
      <div
        className="bg-card border border-border/60 p-6 sm:p-10 shadow-sm overflow-hidden space-y-6"
        style={{ borderRadius: brandRadius }}
      >
        {/* VISUAL DIAGRAM AREA */}
        <div className="relative w-full min-h-[300px] sm:min-h-[360px] bg-neutral-900/40 rounded-[3px] border border-border/40 flex items-center justify-center overflow-hidden p-8 select-none">
          {cfg.customDiagramUrl ? (
            /* Custom Diagram Fallback Image */
            <div className="relative max-w-full max-h-[320px] flex items-center justify-center">
              <img
                src={cfg.customDiagramUrl}
                alt="Logo Clearance Zone Diagram"
                className="max-h-[300px] w-auto object-contain rounded"
              />
            </div>
          ) : (
            /* Generative Mathematical Clearance Zone */
            <div className="relative flex items-center justify-center">
              {/* Circular Clearance Zone Layer */}
              {cfg.zones.circular.enabled && (
                <div
                  className="absolute rounded-full border-2 border-dashed border-sky-400/80 bg-sky-400/5 flex items-start justify-center transition-all duration-300 pointer-events-none"
                  style={{
                    width: `${circleDiameterPx}px`,
                    height: `${circleDiameterPx}px`,
                  }}
                >
                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-[#0e161d] px-1.5 py-0.5 rounded border border-sky-400/50 -translate-y-1/2 shadow-xs">
                    R = +{circPct}%
                  </span>
                </div>
              )}

              {/* Rectangular Clearance Zone Layer */}
              {cfg.zones.rectangular.enabled && (
                <div
                  className="absolute border-2 border-dashed border-primary/80 bg-primary/5 transition-all duration-300 pointer-events-none"
                  style={{
                    inset: `-${rectOffsetPx}px`,
                    borderRadius: "2px",
                  }}
                >
                  {/* Top Measurement Callout (Percentage of width/height) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#0e161d] px-2 py-0.5 rounded border border-primary/50 text-[10px] font-mono font-bold text-primary shadow-xs">
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>
                      {rectPct}% ({cfg.zones.rectangular.dimension === "width" ? "šírka" : "výška"})
                    </span>
                  </div>

                  {/* Right Edge Measurement Callout */}
                  <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-[#0e161d] px-1.5 py-0.5 rounded border border-primary/50 text-[10px] font-mono font-bold text-primary shadow-xs">
                    <ArrowUpDown className="w-3 h-3" />
                    <span>{rectPct}%</span>
                  </div>

                  {/* Corner Accent Marks */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-primary" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-primary" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-primary" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-primary" />
                </div>
              )}

              {/* Core SVG Logo */}
              <div className="relative z-10 p-4 flex items-center justify-center">
                {resolvedLogoUrl ? (
                  <img
                    src={resolvedLogoUrl}
                    alt="Logo"
                    className="max-h-24 sm:max-h-28 max-w-[220px] object-contain"
                  />
                ) : (
                  <div className="text-center p-4 text-muted-foreground text-xs">
                    <span>Žiadne logo</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RULE TEXT & EXPLANATION (Direct Inline Editable in Editor) */}
        <div className="bg-muted/40 border border-border/50 p-4 rounded-[3px]">
          <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pravidlo ochrannej zóny</span>
          </div>

          {isEditor ? (
            <div className="text-xs text-muted-foreground leading-relaxed">
              <InlineEditableText
                value={resolvedRuleText}
                onSave={handleRuleTextSave}
                multiline
                placeholder="Zadajte text pravidla ochrannej zóny..."
                className="outline-none focus:ring-1 focus:ring-primary/40 p-1 rounded"
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">{resolvedRuleText}</p>
          )}
        </div>
      </div>

      {/* Settings Modal (Percentages & Sliders, Logo Source, Custom Diagram) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div
            className="bg-[#0e161d] border border-border/80 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nastavenia ochrannej zóny (M08)
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
                onClick={() => setModalTab("zones")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "zones"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Kótovanie v %
              </button>
              <button
                type="button"
                onClick={() => setModalTab("source")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "source"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Zdroj loga
              </button>
              <button
                type="button"
                onClick={() => setModalTab("diagram")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "diagram"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                3. Vlastný diagram
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: PERCENTAGES & SLIDERS */}
              {modalTab === "zones" && (
                <div className="space-y-4">
                  {/* Rectangular Zone Configuration */}
                  <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground text-xs">
                        <input
                          type="checkbox"
                          checked={cfg.zones.rectangular.enabled}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              customDiagramUrl: null,
                              zones: {
                                ...cfg.zones,
                                rectangular: {
                                  ...cfg.zones.rectangular,
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                          className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                        />
                        <span>Obdĺžniková ochranná zóna</span>
                      </label>
                      <span className="text-primary font-mono font-bold text-xs bg-primary/10 px-2 py-0.5 rounded">
                        {cfg.zones.rectangular.percentage} %
                      </span>
                    </div>

                    {cfg.zones.rectangular.enabled && (
                      <div className="space-y-3 pt-2">
                        {/* Percentage Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Rozmer ochrannej zóny:</span>
                            <span className="font-mono text-foreground">{cfg.zones.rectangular.percentage} %</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={cfg.zones.rectangular.percentage}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                zones: {
                                  ...cfg.zones,
                                  rectangular: {
                                    ...cfg.zones.rectangular,
                                    percentage: Number(e.target.value),
                                  },
                                },
                              })
                            }
                            className="w-full accent-primary cursor-pointer"
                          />
                        </div>

                        {/* Dimension Reference */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-muted-foreground">Vzťažná veličina pre %:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveConfig({
                                  ...cfg,
                                  zones: {
                                    ...cfg.zones,
                                    rectangular: {
                                      ...cfg.zones.rectangular,
                                      dimension: "width",
                                    },
                                  },
                                })
                              }
                              className={`px-2 py-0.5 rounded-[2px] border ${
                                cfg.zones.rectangular.dimension === "width"
                                  ? "bg-primary text-primary-foreground font-bold border-primary"
                                  : "bg-[#0e161d] text-muted-foreground border-border/50"
                              }`}
                            >
                              Šírka loga
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveConfig({
                                  ...cfg,
                                  zones: {
                                    ...cfg.zones,
                                    rectangular: {
                                      ...cfg.zones.rectangular,
                                      dimension: "height",
                                    },
                                  },
                                })
                              }
                              className={`px-2 py-0.5 rounded-[2px] border ${
                                cfg.zones.rectangular.dimension === "height"
                                  ? "bg-primary text-primary-foreground font-bold border-primary"
                                  : "bg-[#0e161d] text-muted-foreground border-border/50"
                              }`}
                            >
                              Výška loga
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Circular Zone Configuration */}
                  <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground text-xs">
                        <input
                          type="checkbox"
                          checked={cfg.zones.circular.enabled}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              customDiagramUrl: null,
                              zones: {
                                ...cfg.zones,
                                circular: {
                                  ...cfg.zones.circular,
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                          className="rounded text-sky-400 focus:ring-sky-400 h-4 w-4 bg-[#0e161d] border-border/70"
                        />
                        <span>Kruhová ochranná zóna (avatary a pečiatky)</span>
                      </label>
                      <span className="text-sky-400 font-mono font-bold text-xs bg-sky-400/10 px-2 py-0.5 rounded">
                        +{cfg.zones.circular.radiusPercentage} %
                      </span>
                    </div>

                    {cfg.zones.circular.enabled && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Prídavok k polomeru:</span>
                          <span className="font-mono text-foreground">+{cfg.zones.circular.radiusPercentage} %</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={cfg.zones.circular.radiusPercentage}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              zones: {
                                ...cfg.zones,
                                circular: {
                                  ...cfg.zones.circular,
                                  radiusPercentage: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LOGO SOURCE */}
              {modalTab === "source" && (
                <div className="space-y-4">
                  {/* Select from Brand Assets */}
                  <div className="bg-[#17212a] p-3 rounded-[3px] border border-border/50 space-y-2">
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
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-[#0e161d] border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {asset.preview ? (
                                <img
                                  src={asset.preview}
                                  alt=""
                                  className="w-8 h-8 object-contain shrink-0 bg-neutral-900 rounded p-1"
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
                      <p className="text-[11px] text-muted-foreground italic">
                        Žiadne assety v knižnici lôg.
                      </p>
                    )}
                  </div>

                  {/* Direct SVG URL input */}
                  <div className="space-y-1 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                    <label className="text-muted-foreground text-[11px] font-medium">
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
                      className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-1.5 text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOM DIAGRAM FALLBACK */}
              {modalTab === "diagram" && (
                <div className="space-y-4 bg-[#17212a] p-4 rounded-[3px] border border-border/40">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>Vlastný statický diagram z Illustratora (Úniková cesta)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ak máte vopred pripravený presný technický výkres s kótami exportovaný z Illustratora, zadajte sem jeho URL. Generatívne vrstvy sa automaticky potlačia.
                  </p>

                  <div className="space-y-2 pt-1">
                    <input
                      type="url"
                      value={cfg.customDiagramUrl || ""}
                      placeholder="https://.../clearance-diagram.png"
                      onChange={(e) =>
                        handleSaveConfig({
                          ...cfg,
                          customDiagramUrl: e.target.value || null,
                        })
                      }
                      className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary"
                    />

                    {cfg.customDiagramUrl && (
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, customDiagramUrl: null })}
                        className="text-xs text-rose-400 hover:underline pt-1 block"
                      >
                        Odstrániť vlastný diagram a vrátiť generatívne kótovanie
                      </button>
                    )}
                  </div>
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
