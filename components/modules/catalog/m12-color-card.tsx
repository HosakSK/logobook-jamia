"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Palette,
  Check,
  Settings2,
  ShieldCheck,
  Sliders,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M12ColorCardConfig,
  m12ColorCardSchema,
} from "@/lib/validations/modules/m12";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandColorsAction } from "@/actions/colors";
import { BrandColor } from "@/lib/types/color";
import { getWcagContrast } from "@/lib/utils/color-calc";

export default function M12KartaFarbyModule({
  id: moduleId,
  moduleType = "M12_KartaFarby",
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
    const res = m12ColorCardSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      globalColorId: null,
      displaySystems: {
        hex: true,
        rgb: true,
        cmyk: true,
        pantoneC: true,
        pantoneU: false,
        pantoneTcx: false,
        ral: true,
        wcag: true,
      },
    };
  }, [config]);

  const [cfg, setCfg] = useState<M12ColorCardConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"colors" | "systems">("colors");

  // Track which field was recently copied for feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Loaded brand colors
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(false);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load colors for the brand
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
  const handleSaveConfig = async (newConfig: M12ColorCardConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M12 config:", err);
      }
    }
  };

  // Determine active color record
  const activeColor = useMemo(() => {
    if (cfg.globalColorId && brandColors.length > 0) {
      const match = brandColors.find((c) => c.id === cfg.globalColorId);
      if (match) return match;
    }
    if (brandColors.length > 0) {
      return brandColors[0];
    }
    // Fallback seed from brand cascade tokens
    return {
      id: "seed-primary",
      brand: brandId,
      name: { en: "Brand Primary Color", sk: "Primárna farba značky" },
      role: "PRIMARY" as const,
      hex: tokens?.colors?.primary?.toUpperCase() || "#C8D400",
      rgb: "200, 212, 0",
      cmykC: 15,
      cmykM: 0,
      cmykY: 100,
      cmykK: 0,
      pantoneC: "389 C",
      pantoneU: "",
      pantoneTCX: "",
      ral: "1018",
    };
  }, [cfg.globalColorId, brandColors, brandId, tokens]);

  // Calculate WCAG contrast
  const wcagResult = useMemo(() => {
    return getWcagContrast(activeColor.hex);
  }, [activeColor.hex]);

  // Swatch text color for optimal contrast (White or Dark Abyss)
  const swatchTextColor = wcagResult.preferredText === "white" ? "#ffffff" : "#070b0f";
  const wcagScore = wcagResult.preferredText === "white" ? wcagResult.whiteScore : wcagResult.blackScore;
  const wcagRatio = wcagResult.preferredText === "white" ? wcagResult.whiteRatio : wcagResult.blackRatio;

  // Click-to-copy handler
  const handleCopy = async (fieldKey: string, formattedValue: string) => {
    if (!formattedValue) return;
    try {
      await navigator.clipboard.writeText(formattedValue);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error("Failed to copy value:", e);
    }
  };

  // Color name
  const colorName =
    typeof activeColor.name === "object"
      ? resolveI18nText(activeColor.name, locale) || activeColor.hex
      : activeColor.name || activeColor.hex;

  // CMYK formatted string
  const hasCmyk =
    activeColor.cmykC !== undefined &&
    activeColor.cmykC !== null &&
    activeColor.cmykM !== undefined &&
    activeColor.cmykM !== null;

  const cmykDisplay = hasCmyk
    ? `C: ${activeColor.cmykC}%  M: ${activeColor.cmykM}%  Y: ${activeColor.cmykY ?? 0}%  K: ${activeColor.cmykK ?? 0}%`
    : "";
  const cmykCopyValue = hasCmyk
    ? `cmyk(${activeColor.cmykC}%, ${activeColor.cmykM}%, ${activeColor.cmykY ?? 0}%, ${activeColor.cmykK ?? 0}%)`
    : "";

  return (
    <div className="relative group/m12 py-4">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m12:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Vybrať farbu a systémy</span>
          </button>
        </div>
      )}

      {/* MAIN COLOR CARD (Visual Swatch + Technical Table) */}
      <div
        className="bg-card border border-border/60 shadow-md overflow-hidden transition-all duration-200"
        style={{ borderRadius: brandRadius }}
      >
        {/* UPPER SWATCH (Dominant Color Block) */}
        <div
          className="relative w-full p-6 sm:p-8 min-h-[160px] sm:min-h-[190px] flex flex-col justify-between select-none transition-colors duration-300"
          style={{ backgroundColor: activeColor.hex, color: swatchTextColor }}
        >
          {/* Top Swatch Row: Role & WCAG Badge */}
          <div className="flex items-start justify-between gap-4">
            <span
              className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] border"
              style={{
                backgroundColor: swatchTextColor === "#ffffff" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)",
                borderColor: swatchTextColor === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
              }}
            >
              {activeColor.role || "BRAND COLOR"}
            </span>

            {/* WCAG Accessibility Badge */}
            {cfg.displaySystems.wcag && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-mono font-bold border shadow-xs"
                style={{
                  backgroundColor: swatchTextColor === "#ffffff" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
                  borderColor: swatchTextColor === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                }}
                title={`WCAG 2.1 Contrast Ratio: ${wcagRatio}:1 voči ${wcagResult.preferredText === "white" ? "bielemu" : "čiernemu"} textu`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>WCAG {wcagScore} ({wcagRatio}:1)</span>
              </div>
            )}
          </div>

          {/* Bottom Swatch Row: Color Name */}
          <div className="mt-6">
            <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight drop-shadow-xs">
              {colorName}
            </h4>
          </div>
        </div>

        {/* LOWER TECHNICAL COLOR SYSTEMS (Click-to-Copy, No Icon Hell) */}
        <div className="p-5 sm:p-6 divide-y divide-border/30 text-xs">
          {/* HEX (Copies without hash as explicitly instructed) */}
          {cfg.displaySystems.hex && (
            <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground uppercase text-[11px] font-semibold">
                HEX
              </span>
              <button
                type="button"
                onClick={() => handleCopy("hex", activeColor.hex.replace("#", ""))}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group/copy text-right relative"
                title="Kliknutím skopíruješ hodnotu bez mriežky"
              >
                {copiedField === "hex" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" />
                    <span>Skopírované!</span>
                  </span>
                ) : (
                  <span className="group-hover/copy:underline decoration-primary underline-offset-4">
                    #{activeColor.hex.replace("#", "")}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* RGB */}
          {cfg.displaySystems.rgb && activeColor.rgb && (
            <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground uppercase text-[11px] font-semibold">
                RGB
              </span>
              <button
                type="button"
                onClick={() => handleCopy("rgb", `rgb(${activeColor.rgb})`)}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group/copy text-right"
                title="Kliknutím skopíruješ rgb(...) formát"
              >
                {copiedField === "rgb" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" />
                    <span>Skopírované!</span>
                  </span>
                ) : (
                  <span className="group-hover/copy:underline decoration-primary underline-offset-4">
                    {activeColor.rgb}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* CMYK */}
          {cfg.displaySystems.cmyk && hasCmyk && (
            <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground uppercase text-[11px] font-semibold">
                CMYK
              </span>
              <button
                type="button"
                onClick={() => handleCopy("cmyk", cmykCopyValue)}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group/copy text-right"
                title="Kliknutím skopíruješ cmyk(...) formát"
              >
                {copiedField === "cmyk" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" />
                    <span>Skopírované!</span>
                  </span>
                ) : (
                  <span className="group-hover/copy:underline decoration-primary underline-offset-4">
                    {cmykDisplay}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* PANTONE COATED */}
          {cfg.displaySystems.pantoneC && activeColor.pantoneC && (
            <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground uppercase text-[11px] font-semibold">
                Pantone Coated
              </span>
              <button
                type="button"
                onClick={() => handleCopy("pantoneC", `Pantone ${activeColor.pantoneC}`)}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group/copy text-right"
                title="Kliknutím skopíruješ Pantone kód"
              >
                {copiedField === "pantoneC" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" />
                    <span>Skopírované!</span>
                  </span>
                ) : (
                  <span className="group-hover/copy:underline decoration-primary underline-offset-4">
                    Pantone {activeColor.pantoneC}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* PANTONE UNCOATED */}
          {cfg.displaySystems.pantoneU && activeColor.pantoneU && (
            <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground uppercase text-[11px] font-semibold">
                Pantone Uncoated
              </span>
              <button
                type="button"
                onClick={() => handleCopy("pantoneU", `Pantone ${activeColor.pantoneU}`)}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group/copy text-right"
                title="Kliknutím skopíruješ Pantone kód"
              >
                {copiedField === "pantoneU" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" />
                    <span>Skopírované!</span>
                  </span>
                ) : (
                  <span className="group-hover/copy:underline decoration-primary underline-offset-4">
                    Pantone {activeColor.pantoneU}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* PANTONE TCX (Textile) */}
          {cfg.displaySystems.pantoneTcx && activeColor.pantoneTCX && (
            <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground uppercase text-[11px] font-semibold">
                Pantone TCX
              </span>
              <button
                type="button"
                onClick={() => handleCopy("pantoneTcx", `Pantone ${activeColor.pantoneTCX}`)}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group/copy text-right"
                title="Kliknutím skopíruješ Pantone TCX kód"
              >
                {copiedField === "pantoneTcx" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" />
                    <span>Skopírované!</span>
                  </span>
                ) : (
                  <span className="group-hover/copy:underline decoration-primary underline-offset-4">
                    Pantone {activeColor.pantoneTCX}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* RAL */}
          {cfg.displaySystems.ral && activeColor.ral && (
            <div className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground uppercase text-[11px] font-semibold">
                RAL Classic
              </span>
              <button
                type="button"
                onClick={() => handleCopy("ral", `RAL ${activeColor.ral}`)}
                className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group/copy text-right"
                title="Kliknutím skopíruješ RAL kód"
              >
                {copiedField === "ral" ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" />
                    <span>Skopírované!</span>
                  </span>
                ) : (
                  <span className="group-hover/copy:underline decoration-primary underline-offset-4">
                    RAL {activeColor.ral}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="dark fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 text-[#fafbfc]" data-theme="dark">
          <div
            className="bg-[#0e161d] border border-[rgba(63,85,102,0.65)] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#fafbfc] rounded-xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a] text-[#fafbfc]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-[#fafbfc]">
                  Nastavenia karty farby (M12)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[rgba(63,85,102,0.45)] bg-[#17212a] px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setModalTab("colors")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "colors"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                1. Výber farby z palety
              </button>
              <button
                type="button"
                onClick={() => setModalTab("systems")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "systems"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                2. Zobrazené systémy
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs bg-[#0e161d] text-[#fafbfc]">
              {/* TAB 1: SELECT COLOR */}
              {modalTab === "colors" && (
                <div className="space-y-3">
                  <span className="font-semibold text-[#fafbfc] text-xs block">
                    Zvoľte farbu z globálnej palety značky:
                  </span>

                  {brandColors.length === 0 ? (
                    <div className="text-[#96abbe] py-6 text-center italic bg-[#17212a] p-4 rounded border border-[rgba(63,85,102,0.45)]">
                      V projekte zatiaľ nie sú vytvorené žiadne vlastné farby v globálnej palete.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {brandColors.map((c) => {
                        const isSelected = activeColor.id === c.id;
                        const cName =
                          typeof c.name === "object"
                            ? resolveI18nText(c.name, locale) || c.hex
                            : c.name || c.hex;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              handleSaveConfig({
                                ...cfg,
                                globalColorId: c.id,
                              })
                            }
                            className={`p-2.5 rounded-[4px] border flex items-center gap-3 text-left transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 ring-1 ring-primary/30 text-[#fafbfc]"
                                : "border-[rgba(63,85,102,0.45)] bg-[#17212a] hover:bg-[#1e2c38] text-[#fafbfc]"
                            }`}
                          >
                            <div
                              className="w-7 h-7 rounded-[2px] border border-black/20 shrink-0 shadow-xs"
                              style={{ backgroundColor: c.hex }}
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-[#fafbfc] text-xs block truncate">
                                {cName}
                              </span>
                              <span className="font-mono text-[10px] text-[#96abbe] block">
                                {c.hex}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DISPLAY SYSTEMS */}
              {modalTab === "systems" && (
                <div className="space-y-3 bg-[#17212a] p-4 rounded-[4px] border border-[rgba(63,85,102,0.45)]">
                  <span className="font-semibold text-[#fafbfc] text-xs block">
                    Vyberte farebné priestory, ktoré sa majú zobraziť:
                  </span>
                  <div className="space-y-2.5 pt-1">
                    {(
                      [
                        { id: "hex", label: "HEX (Web & Digitál)" },
                        { id: "rgb", label: "RGB (Obrazovky & UI)" },
                        { id: "cmyk", label: "CMYK (Ofsetová tlač)" },
                        { id: "pantoneC", label: "Pantone Coated (Natieraný papier)" },
                        { id: "pantoneU", label: "Pantone Uncoated (Nenatieraný papier)" },
                        { id: "pantoneTcx", label: "Pantone TCX (Textil & Oblečenie)" },
                        { id: "ral", label: "RAL Classic (Priemyselné nátery)" },
                        { id: "wcag", label: "WCAG 2.1 Odznak prístupnosti kontrastu" },
                      ] as const
                    ).map((sys) => {
                      const isChecked = Boolean(cfg.displaySystems[sys.id]);
                      return (
                        <label key={sys.id} className="flex items-center gap-2.5 cursor-pointer">
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
                            className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#070b0f] border-[rgba(63,85,102,0.6)]"
                          />
                          <span className="text-[#fafbfc] text-[11px]">{sys.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a]">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-[4px] bg-primary text-[#070b0f] font-semibold text-xs hover:brightness-110 transition-all cursor-pointer"
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
