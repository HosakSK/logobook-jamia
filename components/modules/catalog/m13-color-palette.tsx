"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Palette,
  Check,
  Settings2,
  X,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Columns3,
  Sliders,
  Sparkles,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M13ColorPaletteConfig,
  m13ColorPaletteSchema,
} from "@/lib/validations/modules/m13";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandColorsAction } from "@/actions/colors";
import { BrandColor } from "@/lib/types/color";
import { getWcagContrast } from "@/lib/utils/color-calc";

export default function M13PaletaFariebModule({
  id: moduleId,
  moduleType = "M13_PaletaFarieb",
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

  // Parse config safely
  const parsedConfig = useMemo(() => {
    const res = m13ColorPaletteSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      colorIds: [],
      layout: "tiles" as const,
      displaySystems: {
        hex: true,
        rgb: false,
        cmyk: true,
        pantoneC: false,
      },
    };
  }, [config]);

  const [cfg, setCfg] = useState<M13ColorPaletteConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"select" | "order" | "layout">("select");

  // Track copied value feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loaded brand colors
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load colors for active brand
  useEffect(() => {
    if (brandId) {
      setIsLoadingColors(true);
      getBrandColorsAction(brandId)
        .then((res) => {
          if (res.success && res.colors) setBrandColors(res.colors);
        })
        .catch((err) => console.error("Error loading brand colors:", err))
        .finally(() => setIsLoadingColors(false));
    }
  }, [brandId]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M13ColorPaletteConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M13 config:", err);
      }
    }
  };

  // Demo fallback colors if no colors are in global store
  const fallbackColors = useMemo<BrandColor[]>(() => {
    const primaryHex = tokens?.colors?.primary?.toUpperCase() || "#C8D400";
    return [
      {
        id: "seed-m13-primary",
        brand: brandId,
        name: { en: "Brand Primary", sk: "Primárna farba" },
        role: "PRIMARY",
        hex: primaryHex,
        rgb: "200, 212, 0",
        cmykC: 15,
        cmykM: 0,
        cmykY: 100,
        cmykK: 0,
        pantoneC: "389 C",
        pantoneU: "",
        pantoneTCX: "",
        ral: "1018",
        order: 1,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      {
        id: "seed-m13-teal",
        brand: brandId,
        name: { en: "Teal Accent", sk: "Akcentová Teal" },
        role: "ACCENT",
        hex: "#009F80",
        rgb: "0, 159, 128",
        cmykC: 85,
        cmykM: 10,
        cmykY: 60,
        cmykK: 0,
        pantoneC: "3272 C",
        pantoneU: "",
        pantoneTCX: "",
        ral: "6026",
        order: 2,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      {
        id: "seed-m13-abyss",
        brand: brandId,
        name: { en: "Deep Abyss", sk: "Hlboká čierna" },
        role: "SECONDARY",
        hex: "#0E161D",
        rgb: "14, 22, 29",
        cmykC: 70,
        cmykM: 50,
        cmykY: 40,
        cmykK: 80,
        pantoneC: "Black 6 C",
        pantoneU: "",
        pantoneTCX: "",
        ral: "9005",
        order: 3,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      {
        id: "seed-m13-light",
        brand: brandId,
        name: { en: "Neutral Light", sk: "Svetlá neutrálna" },
        role: "NEUTRAL",
        hex: "#F3F4F6",
        rgb: "243, 244, 246",
        cmykC: 5,
        cmykM: 3,
        cmykY: 3,
        cmykK: 0,
        pantoneC: "Cool Gray 1 C",
        pantoneU: "",
        pantoneTCX: "",
        ral: "9003",
        order: 4,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    ];
  }, [brandId, tokens]);

  // Resolved list of active colors to render in order
  const activeColors = useMemo<BrandColor[]>(() => {
    if (brandColors.length > 0) {
      if (cfg.colorIds && cfg.colorIds.length > 0) {
        const list: BrandColor[] = [];
        cfg.colorIds.forEach((id) => {
          const match = brandColors.find((c) => c.id === id);
          if (match) list.push(match);
        });
        if (list.length > 0) return list;
      }
      // If brand colors exist but none selected, pick up to first 4
      return brandColors.slice(0, 4);
    }
    return fallbackColors;
  }, [brandColors, cfg.colorIds, fallbackColors]);

  // Click-to-Copy handler (HEX strictly without #)
  const handleCopy = async (key: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error("Failed to copy color code:", e);
    }
  };

  // Reordering helpers (Shift / Arrows)
  const moveColor = (index: number, direction: "left" | "right") => {
    const currentIds =
      cfg.colorIds.length > 0 ? [...cfg.colorIds] : activeColors.map((c) => c.id);
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) return;

    const item = currentIds.splice(index, 1)[0];
    currentIds.splice(targetIndex, 0, item);
    handleSaveConfig({ ...cfg, colorIds: currentIds });
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

    const currentIds =
      cfg.colorIds.length > 0 ? [...cfg.colorIds] : activeColors.map((c) => c.id);
    const item = currentIds.splice(draggedIndex, 1)[0];
    currentIds.splice(dropIndex, 0, item);

    setDraggedIndex(null);
    setDragOverIndex(null);
    handleSaveConfig({ ...cfg, colorIds: currentIds });
  };

  return (
    <div className="relative group/m13 py-4">
      {/* Optional H3 Header */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m13:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#17212a] border border-border/80 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Nastavenia palety</span>
          </button>
        </div>
      )}

      {/* MODE 1: TILES LAYOUT (Classic Grid of Color Cards) */}
      {cfg.layout === "tiles" && (
        <div
          className={`grid gap-4 ${
            activeColors.length === 1
              ? "grid-cols-1 max-w-sm"
              : activeColors.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : activeColors.length === 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {activeColors.map((color, idx) => {
            const cName =
              typeof color.name === "object"
                ? resolveI18nText(color.name, locale) || color.hex
                : color.name || color.hex;

            const wcag = getWcagContrast(color.hex);
            const badgeTextColor = wcag.preferredText === "white" ? "#ffffff" : "#070b0f";

            const hasCmyk =
              color.cmykC !== undefined &&
              color.cmykC !== null &&
              color.cmykM !== undefined &&
              color.cmykM !== null;

            return (
              <div
                key={color.id || `tile-${idx}`}
                className="bg-[#0e161d] border border-border/60 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-border"
                style={{ borderRadius: brandRadius }}
              >
                {/* Swatch Top Block */}
                <div
                  className="relative w-full h-28 sm:h-32 p-3 flex flex-col justify-between select-none transition-colors duration-200"
                  style={{ backgroundColor: color.hex }}
                >
                  {color.role && (
                    <span
                      className="self-start text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[2px] backdrop-blur-xs border"
                      style={{
                        color: badgeTextColor,
                        backgroundColor:
                          badgeTextColor === "#ffffff"
                            ? "rgba(0,0,0,0.3)"
                            : "rgba(255,255,255,0.4)",
                        borderColor:
                          badgeTextColor === "#ffffff"
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.15)",
                      }}
                    >
                      {color.role}
                    </span>
                  )}
                </div>

                {/* Details Bottom Block */}
                <div className="p-3.5 space-y-2.5 text-xs">
                  <h4 className="font-bold text-foreground text-sm truncate" title={cName}>
                    {cName}
                  </h4>

                  <div className="space-y-1.5 font-mono text-[11px] pt-1 border-t border-border/30">
                    {/* HEX: Copies without # */}
                    {cfg.displaySystems.hex && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground uppercase text-[10px]">HEX</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`${color.id}-hex`, color.hex.replace("#", ""))
                          }
                          className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-right group/copy"
                          title="Kliknutím skopíruješ HEX bez mriežky"
                        >
                          {copiedKey === `${color.id}-hex` ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Skopírované!</span>
                            </span>
                          ) : (
                            <span className="group-hover/copy:underline underline-offset-2">
                              #{color.hex.replace("#", "")}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* RGB */}
                    {cfg.displaySystems.rgb && color.rgb && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground uppercase text-[10px]">RGB</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`${color.id}-rgb`, `rgb(${color.rgb})`)
                          }
                          className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-right group/copy"
                          title="Kliknutím skopíruješ RGB formát"
                        >
                          {copiedKey === `${color.id}-rgb` ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Skopírované!</span>
                            </span>
                          ) : (
                            <span className="group-hover/copy:underline underline-offset-2">
                              {color.rgb}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* CMYK */}
                    {cfg.displaySystems.cmyk && hasCmyk && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground uppercase text-[10px]">CMYK</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `${color.id}-cmyk`,
                              `cmyk(${color.cmykC}%, ${color.cmykM}%, ${color.cmykY ?? 0}%, ${color.cmykK ?? 0}%)`
                            )
                          }
                          className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-right group/copy text-[10.5px]"
                          title="Kliknutím skopíruješ CMYK"
                        >
                          {copiedKey === `${color.id}-cmyk` ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Skopírované!</span>
                            </span>
                          ) : (
                            <span className="group-hover/copy:underline underline-offset-2">
                              {color.cmykC}/{color.cmykM}/{color.cmykY ?? 0}/{color.cmykK ?? 0}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Pantone C */}
                    {cfg.displaySystems.pantoneC && color.pantoneC && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground uppercase text-[10px]">PMS</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`${color.id}-pms`, color.pantoneC || "")
                          }
                          className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-right group/copy"
                          title="Kliknutím skopíruješ Pantone Coated kód"
                        >
                          {copiedKey === `${color.id}-pms` ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Skopírované!</span>
                            </span>
                          ) : (
                            <span className="group-hover/copy:underline underline-offset-2">
                              {color.pantoneC}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: VERTICAL BARS LAYOUT (Modern Strip of Color Bands) */}
      {cfg.layout === "vertical_bars" && (
        <div
          className="flex flex-col sm:flex-row w-full overflow-hidden border border-border/60 shadow-md min-h-[220px] sm:min-h-[280px]"
          style={{ borderRadius: brandRadius }}
        >
          {activeColors.map((color, idx) => {
            const cName =
              typeof color.name === "object"
                ? resolveI18nText(color.name, locale) || color.hex
                : color.name || color.hex;

            const wcag = getWcagContrast(color.hex);
            const contrastTextColor = wcag.preferredText === "white" ? "#ffffff" : "#070b0f";

            const hasCmyk =
              color.cmykC !== undefined &&
              color.cmykC !== null &&
              color.cmykM !== undefined &&
              color.cmykM !== null;

            return (
              <div
                key={color.id || `bar-${idx}`}
                className="flex-1 min-h-[120px] sm:min-h-[280px] p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 relative group/bar hover:flex-[1.2] select-none"
                style={{
                  backgroundColor: color.hex,
                  color: contrastTextColor,
                }}
              >
                {/* Top Badge: Role or Order */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] backdrop-blur-xs border"
                    style={{
                      backgroundColor:
                        contrastTextColor === "#ffffff"
                          ? "rgba(0,0,0,0.3)"
                          : "rgba(255,255,255,0.4)",
                      borderColor:
                        contrastTextColor === "#ffffff"
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.15)",
                    }}
                  >
                    {color.role || `Color 0${idx + 1}`}
                  </span>
                </div>

                {/* Bottom Details Box */}
                <div className="mt-4 sm:mt-0 space-y-2">
                  <h4 className="font-extrabold text-base sm:text-lg truncate drop-shadow-xs">
                    {cName}
                  </h4>

                  {/* Systems inside bar with adaptive contrast background */}
                  <div className="space-y-1 font-mono text-xs">
                    {/* HEX without # */}
                    {cfg.displaySystems.hex && (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`${color.id}-hex`, color.hex.replace("#", ""))
                          }
                          className="px-2 py-0.5 rounded-[2px] backdrop-blur-xs border text-[11px] font-bold tracking-wide transition-transform active:scale-95 text-left inline-block"
                          style={{
                            backgroundColor:
                              contrastTextColor === "#ffffff"
                                ? "rgba(0,0,0,0.35)"
                                : "rgba(255,255,255,0.45)",
                            borderColor:
                              contrastTextColor === "#ffffff"
                                ? "rgba(255,255,255,0.25)"
                                : "rgba(0,0,0,0.2)",
                          }}
                          title="Kliknutím skopíruješ HEX bez mriežky"
                        >
                          {copiedKey === `${color.id}-hex` ? (
                            <span className="flex items-center gap-1 font-bold">
                              <Check className="w-3 h-3" />
                              <span>Skopírované!</span>
                            </span>
                          ) : (
                            <span>#{color.hex.replace("#", "")}</span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* CMYK */}
                    {cfg.displaySystems.cmyk && hasCmyk && (
                      <div className="text-[10px] opacity-90 drop-shadow-xs">
                        <span>C:{color.cmykC} M:{color.cmykM} Y:{color.cmykY ?? 0} K:{color.cmykK ?? 0}</span>
                      </div>
                    )}

                    {/* Pantone C */}
                    {cfg.displaySystems.pantoneC && color.pantoneC && (
                      <div className="text-[10px] opacity-90 drop-shadow-xs">
                        <span>PMS: {color.pantoneC}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nastavenia farebnej palety (M13)
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
                onClick={() => setModalTab("select")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "select"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Výber farieb
              </button>
              <button
                type="button"
                onClick={() => setModalTab("order")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "order"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Poradie (Drag & Drop)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("layout")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "layout"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                3. Rozloženie a systémy
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: MULTI-SELECT PICKER */}
              {modalTab === "select" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">
                      Vyberte farby značky, ktoré patria do tejto palety:
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Zvolených: {cfg.colorIds.length > 0 ? cfg.colorIds.length : activeColors.length}
                    </span>
                  </div>

                  {brandColors.length === 0 ? (
                    <div className="text-muted-foreground py-6 text-center italic bg-[#17212a] p-4 rounded border border-border/40 space-y-2">
                      <p>V projekte zatiaľ nie sú vytvorené vlastné farby v globálnej palete.</p>
                      <p className="text-[11px] text-primary">
                        Modul momentálne používa 4 vzorové systémové farby značky.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {brandColors.map((color) => {
                        const isSelected =
                          cfg.colorIds.length > 0
                            ? cfg.colorIds.includes(color.id)
                            : activeColors.some((c) => c.id === color.id);

                        const cName =
                          typeof color.name === "object"
                            ? resolveI18nText(color.name, locale) || color.hex
                            : color.name || color.hex;

                        return (
                          <label
                            key={color.id}
                            className={`p-2.5 rounded-[3px] border flex items-center gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                                : "border-border/50 bg-[#17212a] hover:border-border"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                let newIds =
                                  cfg.colorIds.length > 0
                                    ? [...cfg.colorIds]
                                    : activeColors.map((c) => c.id);

                                if (e.target.checked) {
                                  if (!newIds.includes(color.id)) {
                                    newIds.push(color.id);
                                  }
                                } else {
                                  newIds = newIds.filter((id) => id !== color.id);
                                }
                                handleSaveConfig({ ...cfg, colorIds: newIds });
                              }}
                              className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                            />
                            <div
                              className="w-6 h-6 rounded-[2px] border border-black/20 shrink-0 shadow-xs"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-foreground text-xs block truncate">
                                {cName}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground block">
                                {color.hex}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: REORDER (DRAG & DROP + ARROWS) */}
              {modalTab === "order" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">
                      Presúvajte položky ťahaním myšou (Drag & Drop) alebo šípkami:
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {activeColors.map((color, index) => {
                      const cName =
                        typeof color.name === "object"
                          ? resolveI18nText(color.name, locale) || color.hex
                          : color.name || color.hex;

                      const isDragging = draggedIndex === index;
                      const isOver = dragOverIndex === index;

                      return (
                        <div
                          key={color.id || `order-${index}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`p-2.5 rounded-[3px] border bg-[#17212a] flex items-center justify-between gap-3 transition-all ${
                            isDragging
                              ? "opacity-40 border-dashed border-primary"
                              : isOver
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <div
                              className="w-6 h-6 rounded-[2px] border border-black/20 shrink-0 shadow-xs"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground text-xs block truncate">
                                {cName}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                #{color.hex.replace("#", "")}
                              </span>
                            </div>
                          </div>

                          {/* Quick Arrow Shift Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveColor(index, "left")}
                              disabled={index === 0}
                              className="p-1 rounded bg-[#0e161d] border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Posunúť doľava / hore"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveColor(index, "right")}
                              disabled={index === activeColors.length - 1}
                              className="p-1 rounded bg-[#0e161d] border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Posunúť doprava / dole"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: LAYOUT & DISPLAY SYSTEMS */}
              {modalTab === "layout" && (
                <div className="space-y-4">
                  {/* Layout Selector */}
                  <div className="space-y-2">
                    <span className="font-semibold text-foreground text-xs block">
                      Štýl rozloženia palety:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, layout: "tiles" })}
                        className={`p-3 rounded-[3px] border flex flex-col items-center gap-2 text-center transition-all ${
                          cfg.layout === "tiles"
                            ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-foreground"
                            : "border-border/50 bg-[#17212a] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-xs">Dlaždice (Tiles)</span>
                        <span className="text-[10px] text-muted-foreground">
                          Klasické samostatné karty v mriežke
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSaveConfig({ ...cfg, layout: "vertical_bars" })
                        }
                        className={`p-3 rounded-[3px] border flex flex-col items-center gap-2 text-center transition-all ${
                          cfg.layout === "vertical_bars"
                            ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-foreground"
                            : "border-border/50 bg-[#17212a] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Columns3 className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-xs">Zvislé prúžky (Bars)</span>
                        <span className="text-[10px] text-muted-foreground">
                          Moderný súvislý pás vertikálnych farieb
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Display Systems Checkboxes */}
                  <div className="space-y-2.5 pt-2 border-t border-border/40">
                    <span className="font-semibold text-foreground text-xs block">
                      Zobrazené farebné priestory:
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-[#17212a] p-3.5 rounded-[3px] border border-border/40">
                      {(
                        [
                          { id: "hex", label: "HEX (Web & Digitál)" },
                          { id: "cmyk", label: "CMYK (Tlač)" },
                          { id: "rgb", label: "RGB (Obrazovky)" },
                          { id: "pantoneC", label: "Pantone Coated" },
                        ] as const
                      ).map((sys) => {
                        const isChecked = Boolean(cfg.displaySystems[sys.id]);
                        return (
                          <label
                            key={sys.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                handleSaveConfig({
                                  ...cfg,
                                  displaySystems: {
                                    ...cfg.displaySystems,
                                    [sys.id]: e.target.checked,
                                  },
                                })
                              }
                              className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                            />
                            <span className="text-foreground text-[11px]">{sys.label}</span>
                          </label>
                        );
                      })}
                    </div>
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
