"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Settings2,
  Check,
  X,
  Palette,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M15NeutralBackgroundsConfig,
  M15Surface,
  m15NeutralBackgroundsSchema,
} from "@/lib/validations/modules/m15";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandColorsAction } from "@/actions/colors";
import { getBrandAssetsAction } from "@/actions/assets";
import { BrandColor } from "@/lib/types/color";
import { BrandAsset } from "@/lib/types/asset";
import { getWcagContrast } from "@/lib/utils/color-calc";

export default function M15NeutralneASystemovePodkladyModule({
  id: moduleId,
  moduleType = "M15_NeutralneASystemovePodklady",
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

  // 3 Light & 3 Dark default seed surfaces (as explicitly instructed by user)
  const defaultSurfaces = useMemo<M15Surface[]>(() => [
    // 3 Light Surfaces
    {
      id: "seed-surf-light-1",
      name: { en: "Pure White (Cards & Modals)", sk: "Čistá biela (Karty a Modály)" },
      description: {
        en: "Highest elevation surface for cards, dropdowns and dialogs in light mode.",
        sk: "Najvyššia vrstva pre karty, vyskakovacie okná a modály v svetlom režime.",
      },
      colorSource: "custom",
      globalColorId: null,
      customHex: "#FFFFFF",
      textColor: "dark",
    },
    {
      id: "seed-surf-light-2",
      name: { en: "Off-White Page Background", sk: "Základné svetlé pozadie" },
      description: {
        en: "Default canvas and viewport background for light mode pages.",
        sk: "Štandardný podklad stránok a viewportu v svetlom režime.",
      },
      colorSource: "custom",
      globalColorId: null,
      customHex: "#F8F9FA",
      textColor: "dark",
    },
    {
      id: "seed-surf-light-3",
      name: { en: "Muted Section Neutral", sk: "Tlmená neutrálna (Sekcie)" },
      description: {
        en: "Subtle section contrast, alternating rows and panels.",
        sk: "Podklad pre striedavé sekcie, tabuľky a panely.",
      },
      colorSource: "custom",
      globalColorId: null,
      customHex: "#EDF0F3",
      textColor: "dark",
    },
    // 3 Dark Surfaces
    {
      id: "seed-surf-dark-1",
      name: { en: "Dark Abyss (Root Background)", sk: "Hlboká čierna (Root pozadie)" },
      description: {
        en: "Base root canvas background for dark mode applications.",
        sk: "Základné pozadie celej aplikácie v tmavom režime.",
      },
      colorSource: "custom",
      globalColorId: null,
      customHex: "#070B0F",
      textColor: "light",
    },
    {
      id: "seed-surf-dark-2",
      name: { en: "Deep Section Surface", sk: "Tmavorodé pozadie sekcií" },
      description: {
        en: "Secondary dark level for containers, hero blocks and panels.",
        sk: "Sekundárna tmavá vrstva pre kontajnery, hero bloky a panely.",
      },
      colorSource: "custom",
      globalColorId: null,
      customHex: "#0E161D",
      textColor: "light",
    },
    {
      id: "seed-surf-dark-3",
      name: { en: "Raised Dark Surface (Cards)", sk: "Vystúpená tmavá (Karty a dialógy)" },
      description: {
        en: "Elevated surface for cards, navigation and popovers in dark mode.",
        sk: "Vyvýšená plocha pre karty, menu lišty a dialógy v tmavom režime.",
      },
      colorSource: "custom",
      globalColorId: null,
      customHex: "#17212A",
      textColor: "light",
    },
  ], []);

  // Parse config safely
  const parsedConfig = useMemo(() => {
    const res = m15NeutralBackgroundsSchema.safeParse(config);
    if (res.success) {
      return {
        ...res.data,
        surfaces: res.data.surfaces.length > 0 ? res.data.surfaces : defaultSurfaces,
      };
    }
    return {
      assetIdToTest: null,
      customLogoUrl: null,
      surfaces: defaultSurfaces,
    };
  }, [config, defaultSurfaces]);

  const [cfg, setCfg] = useState<M15NeutralBackgroundsConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"surfaces" | "logo">("surfaces");

  // Track copied value feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loaded brand assets & colors
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Drag and drop state for surface reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load colors and assets for active brand
  useEffect(() => {
    if (brandId) {
      setIsLoadingData(true);
      Promise.all([getBrandColorsAction(brandId), getBrandAssetsAction(brandId)])
        .then(([colorRes, assetRes]) => {
          if (colorRes.success && colorRes.colors) setBrandColors(colorRes.colors);
          if (assetRes.success && assetRes.assets) setBrandAssets(assetRes.assets);
        })
        .catch((err) => console.error("Error loading brand data for M15:", err))
        .finally(() => setIsLoadingData(false));
    }
  }, [brandId]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M15NeutralBackgroundsConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M15 config:", err);
      }
    }
  };

  // Click-to-Copy handler (strictly without #)
  const handleCopy = async (key: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error("Failed to copy surface hex:", e);
    }
  };

  // Reordering helpers (Shift / Arrows)
  const moveSurface = (index: number, direction: "up" | "down") => {
    const list = [...cfg.surfaces];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const item = list.splice(index, 1)[0];
    list.splice(targetIndex, 0, item);
    handleSaveConfig({ ...cfg, surfaces: list });
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const list = [...cfg.surfaces];
    const item = list.splice(draggedIndex, 1)[0];
    list.splice(dropIndex, 0, item);

    setDraggedIndex(null);
    setDragOverIndex(null);
    handleSaveConfig({ ...cfg, surfaces: list });
  };

  // Resolve test logo to render on surfaces
  const activeTestLogo = useMemo(() => {
    if (cfg.assetIdToTest && brandAssets.length > 0) {
      const match = brandAssets.find((a) => a.id === cfg.assetIdToTest);
      if (match) {
        const svgFile = match.files?.find((f) => f.fileFormat === "SVG");
        const pngFile = match.files?.find((f) => f.fileFormat === "PNG");
        return {
          title: resolveI18nText(match.name, locale) || "Brand Logo",
          url: svgFile?.fileUrl || pngFile?.fileUrl || match.previewUrl || "",
          svgContent: match.svgContent || null,
        };
      }
    }
    if (cfg.customLogoUrl) {
      return {
        title: "Testovacie Logo",
        url: cfg.customLogoUrl,
        svgContent: null,
      };
    }
    // Fallback if brand has at least 1 asset
    if (brandAssets.length > 0) {
      const first = brandAssets[0];
      const svgFile = first.files?.find((f) => f.fileFormat === "SVG");
      return {
        title: resolveI18nText(first.name, locale) || "Brand Logo",
        url: svgFile?.fileUrl || first.previewUrl || "",
        svgContent: first.svgContent || null,
      };
    }
    // Default system vector fallback logo
    return {
      title: "Logobook Brand Mark",
      url: "/logo/logo-width-dark.svg",
      svgContent: null,
    };
  }, [cfg.assetIdToTest, cfg.customLogoUrl, brandAssets, locale]);

  return (
    <div className="relative group/m15 py-4 space-y-4">
      {/* Optional H3 Header */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m15:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#17212a] border border-border/80 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Správa podkladov</span>
          </button>
        </div>
      )}

      {/* SURFACES STACK / GRID */}
      <div className="space-y-3.5">
        {cfg.surfaces.map((surface, idx) => {
          // Resolve HEX
          let hex = surface.customHex || "#FFFFFF";
          if (surface.colorSource === "global" && surface.globalColorId && brandColors.length > 0) {
            const found = brandColors.find((c) => c.id === surface.globalColorId);
            if (found) hex = found.hex;
          }

          // Calculate WCAG or resolve textColor
          const wcag = getWcagContrast(hex);
          const computedTextColor =
            surface.textColor === "auto"
              ? wcag.preferredText === "white"
                ? "#ffffff"
                : "#070b0f"
              : surface.textColor === "light"
              ? "#ffffff"
              : "#070b0f";

          const isDarkSurface = wcag.preferredText === "white";
          const surfaceName = resolveI18nText(surface.name, locale) || hex;
          const surfaceDesc = surface.description ? resolveI18nText(surface.description, locale) : "";
          const isCopied = copiedKey === `surf-${surface.id}`;

          return (
            <div
              key={surface.id || `surf-${idx}`}
              className="relative p-5 sm:p-6 transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border"
              style={{
                backgroundColor: hex,
                color: computedTextColor,
                borderRadius: brandRadius,
                borderColor: isDarkSurface ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
              }}
            >
              {/* LEFT SIDE: Surface Info & Click-to-Copy HEX */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] backdrop-blur-xs border"
                    style={{
                      backgroundColor:
                        isDarkSurface ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
                      borderColor:
                        isDarkSurface ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                    }}
                  >
                    {isDarkSurface ? "Tmavý podklad / Dark Mode" : "Svetlý podklad / Light Mode"}
                  </span>
                </div>

                <h4 className="text-lg sm:text-xl font-extrabold tracking-tight drop-shadow-2xs">
                  {surfaceName}
                </h4>

                {surfaceDesc && (
                  <p className="text-xs opacity-80 leading-relaxed font-normal">
                    {surfaceDesc}
                  </p>
                )}

                {/* HEX Click-to-Copy (Strictly without #) */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(`surf-${surface.id}`, hex.replace("#", ""))}
                    className="group/copy px-3 py-1.5 rounded-[3px] border font-mono text-xs font-extrabold tracking-wider transition-all duration-150 active:scale-95 text-left flex items-center gap-2 backdrop-blur-xs shadow-2xs"
                    style={{
                      backgroundColor:
                        isDarkSurface ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
                      borderColor:
                        isDarkSurface ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)",
                    }}
                    title="Kliknutím skopíruješ HEX bez mriežky"
                  >
                    {isCopied ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Skopírované!</span>
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] opacity-75 uppercase">HEX:</span>
                        <span className="group-hover/copy:underline underline-offset-2">
                          #{hex.replace("#", "")}
                        </span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] font-mono opacity-65">
                    Luminance: {Math.round(wcag.whiteRatio > wcag.blackRatio ? (1 / wcag.whiteRatio) * 100 : (1 / wcag.blackRatio) * 100)}%
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE: Visual Logo Test on Surface */}
              <div className="md:w-64 lg:w-72 shrink-0 flex flex-col items-center md:items-end justify-center">
                <div
                  className="w-full max-w-[260px] h-24 p-3 rounded-[3px] flex items-center justify-center border transition-all"
                  style={{
                    backgroundColor:
                      isDarkSurface ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    borderColor:
                      isDarkSurface ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                  }}
                >
                  {activeTestLogo.svgContent ? (
                    <div
                      className="max-h-16 max-w-full flex items-center justify-center [&>svg]:max-h-14 [&>svg]:w-auto"
                      dangerouslySetInnerHTML={{ __html: activeTestLogo.svgContent }}
                    />
                  ) : activeTestLogo.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={
                        // If light surface and using default logobook mark, use dark logo version and vice-versa
                        activeTestLogo.url.includes("logo-width")
                          ? isDarkSurface
                            ? "/logo/logo-width-dark.svg"
                            : "/logo/logo-width-light.svg"
                          : activeTestLogo.url
                      }
                      alt={activeTestLogo.title}
                      className="max-h-14 max-w-[200px] object-contain select-none"
                    />
                  ) : (
                    <div className="text-center font-mono text-[10px] opacity-60">
                      [Logo na podklade]
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono opacity-60 mt-1.5 text-center md:text-right block">
                  Vizuálny test loga
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADMIN SETTINGS MODAL (Pencil Hell Free) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-[#0e161d] border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Správa neutrálnych a systémových podkladov (M15)
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
                onClick={() => setModalTab("surfaces")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "surfaces"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Zoznam plôch a farieb ({cfg.surfaces.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab("logo")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "logo"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Testovacie logo
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: SURFACES MANAGEMENT */}
              {modalTab === "surfaces" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">
                      Jednotlivé systémové povrchy (3 svetlé & 3 tmavé):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSurface: M15Surface = {
                          id: `surf-${Date.now()}`,
                          name: { en: "New Surface", sk: "Nový podklad" },
                          description: { en: "Description of usage...", sk: "Popis použitia..." },
                          colorSource: "custom",
                          globalColorId: null,
                          customHex: "#F1F3F5",
                          textColor: "auto",
                        };
                        handleSaveConfig({
                          ...cfg,
                          surfaces: [...cfg.surfaces, newSurface],
                        });
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-[11px] hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pridať povrch</span>
                    </button>
                  </div>

                  {/* Surface Cards in Modal */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {cfg.surfaces.map((surf, index) => {
                      const isDragging = draggedIndex === index;
                      const isOver = dragOverIndex === index;

                      return (
                        <div
                          key={surf.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`p-3.5 rounded-[3px] border bg-[#17212a] space-y-3 transition-all ${
                            isDragging
                              ? "opacity-40 border-dashed border-primary"
                              : isOver
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-border"
                          }`}
                        >
                          {/* Surface Row Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                <GripVertical className="w-4 h-4" />
                              </span>
                              <div
                                className="w-5 h-5 rounded-[2px] border border-black/30 shrink-0 shadow-2xs"
                                style={{ backgroundColor: surf.customHex }}
                              />
                              <span className="font-bold text-foreground truncate">
                                {resolveI18nText(surf.name, locale) || surf.customHex}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveSurface(index, "up")}
                                disabled={index === 0}
                                className="p-1 rounded bg-[#0e161d] border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Posunúť hore"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSurface(index, "down")}
                                disabled={index === cfg.surfaces.length - 1}
                                className="p-1 rounded bg-[#0e161d] border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Posunúť dole"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = cfg.surfaces.filter((_, i) => i !== index);
                                  handleSaveConfig({ ...cfg, surfaces: updated });
                                }}
                                className="p-1 rounded bg-[#0e161d] border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                                title="Zmazať povrch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Surface Fields Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Name Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-muted-foreground block">
                                Názov povrchu (SK / EN):
                              </label>
                              <input
                                type="text"
                                value={typeof surf.name === "object" ? surf.name.sk || surf.name.en || "" : surf.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...cfg.surfaces];
                                  updated[index] = {
                                    ...updated[index],
                                    name: { en: val, sk: val },
                                  };
                                  handleSaveConfig({ ...cfg, surfaces: updated });
                                }}
                                className="w-full bg-[#0e161d] border border-border/50 rounded-[2px] px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                            </div>

                            {/* Color Hex & Picker */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-muted-foreground block">
                                HEX kód farby:
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={surf.customHex.startsWith("#") ? surf.customHex : `#${surf.customHex}`}
                                  onChange={(e) => {
                                    const updated = [...cfg.surfaces];
                                    updated[index] = {
                                      ...updated[index],
                                      customHex: e.target.value.toUpperCase(),
                                      colorSource: "custom",
                                    };
                                    handleSaveConfig({ ...cfg, surfaces: updated });
                                  }}
                                  className="w-7 h-7 rounded border border-border/60 bg-transparent cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  value={surf.customHex}
                                  onChange={(e) => {
                                    const updated = [...cfg.surfaces];
                                    updated[index] = {
                                      ...updated[index],
                                      customHex: e.target.value,
                                      colorSource: "custom",
                                    };
                                    handleSaveConfig({ ...cfg, surfaces: updated });
                                  }}
                                  className="w-full font-mono bg-[#0e161d] border border-border/50 rounded-[2px] px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Description Input */}
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] font-mono text-muted-foreground block">
                                Účel / Popis použitia povrchu:
                              </label>
                              <input
                                type="text"
                                value={typeof surf.description === "object" ? surf.description.sk || surf.description.en || "" : surf.description || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...cfg.surfaces];
                                  updated[index] = {
                                    ...updated[index],
                                    description: { en: val, sk: val },
                                  };
                                  handleSaveConfig({ ...cfg, surfaces: updated });
                                }}
                                className="w-full bg-[#0e161d] border border-border/50 rounded-[2px] px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TEST LOGO SELECTION */}
              {modalTab === "logo" && (
                <div className="space-y-4">
                  <span className="font-semibold text-foreground text-xs block">
                    Vyberte logo pre vizuálny test na všetkých podkladoch:
                  </span>

                  {brandAssets.length === 0 ? (
                    <div className="p-4 rounded bg-[#17212a] border border-border/50 space-y-2 text-center text-muted-foreground">
                      <p>V projekte zatiaľ nie sú nahraté žiadne logá v knižnici Assetov.</p>
                      <p className="text-[11px] text-primary">
                        Modul automaticky používa predvolený vektorový symbol značky.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {brandAssets.map((asset) => {
                        const isSelected = cfg.assetIdToTest === asset.id;
                        const aName = resolveI18nText(asset.name, locale) || "Brand Logo";
                        const svgFile = asset.files?.find((f) => f.fileFormat === "SVG");

                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() =>
                              handleSaveConfig({
                                ...cfg,
                                assetIdToTest: asset.id,
                                customLogoUrl: null,
                              })
                            }
                            className={`p-3 rounded-[3px] border flex items-center gap-3 text-left transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-foreground"
                                : "border-border/50 bg-[#17212a] text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="w-12 h-10 rounded bg-[#0e161d] border border-border/40 p-1 flex items-center justify-center shrink-0">
                              {svgFile ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={svgFile.fileUrl}
                                  alt={aName}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs block truncate text-foreground">
                                {aName}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                {asset.medium} • {asset.orientation}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Option for custom logo URL */}
                  <div className="space-y-1.5 pt-3 border-t border-border/40">
                    <label className="text-[11px] font-semibold text-foreground block">
                      Alebo zadajte priamu URL adresu testovacieho SVG/PNG loga:
                    </label>
                    <input
                      type="text"
                      placeholder="https://.../logo.svg"
                      value={cfg.customLogoUrl || ""}
                      onChange={(e) =>
                        handleSaveConfig({
                          ...cfg,
                          customLogoUrl: e.target.value || null,
                          assetIdToTest: null,
                        })
                      }
                      className="w-full bg-[#0e161d] border border-border/50 rounded-[2px] px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
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
