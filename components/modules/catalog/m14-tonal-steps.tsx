"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Settings2,
  Check,
  X,
  Layers,
  ShieldCheck,
  Eye,
  RefreshCw,
  Palette,
  Search,
  Sparkles,
  Info,
  Sliders,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M14TonalStepsConfig,
  m14TonalStepsSchema,
} from "@/lib/validations/modules/m14";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandColorsAction } from "@/actions/colors";
import { BrandColor } from "@/lib/types/color";
import {
  generateTonalSteps,
  getWcagContrast,
  getContrastBetween,
  TONAL_STEP_NUMBERS,
  TonalStepItem,
} from "@/lib/utils/color-calc";

export default function M14TonalStepsModule({
  id: moduleId,
  moduleType = "M14_TonalSteps",
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
    const res = m14TonalStepsSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      baseColorIds: [],
      generationMode: "hsluv_auto" as const,
      overrides: {},
      showContrastRule: true,
      showUiExamples: true,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M14TonalStepsConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"colors" | "overrides" | "display">("colors");

  // Track copied value feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active color for UI examples preview
  const [activeUiColorId, setActiveUiColorId] = useState<string | null>(null);

  // Loaded brand colors
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(false);

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
  const handleSaveConfig = async (newConfig: M14TonalStepsConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M14 config:", err);
      }
    }
  };

  // Fallback demo colors if brand has none defined
  const fallbackColors = useMemo<BrandColor[]>(() => {
    const primaryHex = tokens?.colors?.primary?.toUpperCase() || "#C8D400";
    return [
      {
        id: "seed-m14-primary",
        brand: brandId,
        name: { en: "Brand Primary", sk: "Primárna farba" },
        role: "PRIMARY",
        hex: primaryHex,
        rgb: "200, 212, 0",
        cmykC: 15,
        cmykM: 0,
        cmykY: 100,
        cmykK: 0,
        order: 1,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      {
        id: "seed-m14-teal",
        brand: brandId,
        name: { en: "Teal Accent", sk: "Akcentová Teal" },
        role: "ACCENT",
        hex: "#009F80",
        rgb: "0, 159, 128",
        cmykC: 85,
        cmykM: 10,
        cmykY: 60,
        cmykK: 0,
        order: 2,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    ];
  }, [brandId, tokens]);

  // Active base colors to render
  const activeBaseColors = useMemo<BrandColor[]>(() => {
    if (brandColors.length > 0) {
      if (cfg.baseColorIds && cfg.baseColorIds.length > 0) {
        const list: BrandColor[] = [];
        cfg.baseColorIds.forEach((id) => {
          const match = brandColors.find((c) => c.id === id);
          if (match) list.push(match);
        });
        if (list.length > 0) return list;
      }
      return brandColors.slice(0, 2);
    }
    return fallbackColors;
  }, [brandColors, cfg.baseColorIds, fallbackColors]);

  // Set default active color for UI preview if not set
  useEffect(() => {
    if (!activeUiColorId && activeBaseColors.length > 0) {
      setActiveUiColorId(activeBaseColors[0].id);
    }
  }, [activeUiColorId, activeBaseColors]);

  // Calculate tonal steps matrix for all active base colors (with overrides applied)
  const tonalMatrix = useMemo(() => {
    return activeBaseColors.map((base) => {
      const generated = generateTonalSteps(base.hex);
      const colorOverrides = cfg.overrides[base.id] || {};

      const steps: TonalStepItem[] = generated.map((item) => {
        const overrideHex = colorOverrides[item.step.toString()];
        return {
          step: item.step,
          hex: (overrideHex || item.hex).toUpperCase(),
          lightness: item.lightness,
        };
      });

      return {
        baseColor: base,
        steps,
      };
    });
  }, [activeBaseColors, cfg.overrides]);

  // Click-to-Copy handler (strictly without #)
  const handleCopy = async (key: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error("Failed to copy tonal step code:", e);
    }
  };

  // Active UI preview color & its steps
  const activeUiMatrixItem = useMemo(() => {
    const found = tonalMatrix.find((m) => m.baseColor.id === activeUiColorId);
    return found || tonalMatrix[0];
  }, [tonalMatrix, activeUiColorId]);

  // Steps map for easy lookup: 50 -> hex, 100 -> hex, etc.
  const uiSteps = useMemo(() => {
    const map: Record<number, string> = {};
    if (activeUiMatrixItem) {
      activeUiMatrixItem.steps.forEach((s) => {
        map[s.step] = s.hex;
      });
    }
    return map;
  }, [activeUiMatrixItem]);

  // WCAG contrast ratios for educational block (4 steps: 100 vs 500, 8 steps: 100 vs 900)
  const contrastPair4 = useMemo(() => {
    const step100 = uiSteps[100] || "#E9F381";
    const step500 = uiSteps[500] || "#7A8200";
    return {
      bg: step100,
      text: step500,
      res: getContrastBetween(step500, step100),
    };
  }, [uiSteps]);

  const contrastPair8 = useMemo(() => {
    const step900 = uiSteps[900] || "#23250A";
    const step100 = uiSteps[100] || "#E9F381";
    return {
      bg: step900,
      text: step100,
      res: getContrastBetween(step100, step900),
    };
  }, [uiSteps]);

  return (
    <div className="relative group/m14 py-4 space-y-6">
      {/* Optional H3 Header */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m14:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Nastavenia odtieňov</span>
          </button>
        </div>
      )}

      {/* SECTION 1: TONAL STEPS MATRIX */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">Digitálna škála odtieňov (HSLuv)</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {cfg.generationMode === "manual_override" ? "Hybridný režim (s úpravami)" : "Automatický výpočet"}
          </span>
        </div>

        <div
          className={`grid gap-4 ${
            tonalMatrix.length === 1
              ? "grid-cols-1"
              : tonalMatrix.length === 2
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {tonalMatrix.map(({ baseColor, steps }) => {
            const bName =
              typeof baseColor.name === "object"
                ? resolveI18nText(baseColor.name, locale) || baseColor.hex
                : baseColor.name || baseColor.hex;

            return (
              <div
                key={baseColor.id}
                className="bg-card border border-border/60 shadow-sm p-4 space-y-3"
                style={{ borderRadius: brandRadius }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-4 h-4 rounded-[2px] border border-black/20 shrink-0"
                      style={{ backgroundColor: baseColor.hex }}
                    />
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {bName}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] bg-[#17212a] border border-border/40 text-muted-foreground shrink-0">
                    #{baseColor.hex.replace("#", "")}
                  </span>
                </div>

                {/* 10 Tonal Step Tiles (Vertical column or horizontal grid) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {steps.map((item) => {
                    const wcag = getWcagContrast(item.hex);
                    const textColor = wcag.preferredText === "white" ? "#ffffff" : "#070b0f";
                    const isCopied = copiedKey === `${baseColor.id}-${item.step}`;

                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() =>
                          handleCopy(`${baseColor.id}-${item.step}`, item.hex.replace("#", ""))
                        }
                        className="group/step p-2.5 rounded-[2px] flex flex-col justify-between h-18 text-left transition-all duration-150 cursor-pointer relative hover:scale-[1.02] border border-black/10 active:scale-95 shadow-2xs"
                        style={{
                          backgroundColor: item.hex,
                          color: textColor,
                        }}
                        title={`Krok ${item.step}: #${item.hex.replace("#", "")} (Kliknutím skopíruješ bez mriežky)`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-[10px] font-extrabold tracking-wider opacity-85">
                            {item.step}
                          </span>
                        </div>

                        <div className="font-mono text-[11px] font-bold">
                          {isCopied ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-extrabold">
                              <Check className="w-2.5 h-2.5" />
                              <span>Skopírované!</span>
                            </span>
                          ) : (
                            <span className="opacity-95 group-hover/step:underline underline-offset-2">
                              #{item.hex.replace("#", "")}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: EDUCATIONAL CONTRAST RULE (4 STEPS RULE) */}
      {cfg.showContrastRule && (
        <div
          className="bg-[#0e161d] border border-border/60 p-4 sm:p-5 space-y-4"
          style={{ borderRadius: brandRadius }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <h4 className="font-bold text-sm text-foreground">
                Pravidlo 4 krokov (WCAG 2.1 Bezpečný kontrast)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold shrink-0">
              A11Y Best Practice
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Pre dodržanie bezpečnej čitateľnosti a prístupnosti podľa normy WCAG 2.1 odporúčame kombinovať odtiene, ktoré sú v škále vzdialené <strong>aspoň o 4 stupne</strong> (napr. svetlý podklad <code className="text-primary font-mono font-bold">100</code> s textom <code className="text-primary font-mono font-bold">500</code> alebo viac).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Pair A: Step 100 & 500 (Delta 4) */}
            <div
              className="p-3.5 rounded-[3px] border border-black/10 flex items-center justify-between transition-colors shadow-xs"
              style={{
                backgroundColor: contrastPair4.bg,
                color: contrastPair4.text,
              }}
            >
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider block opacity-75">
                  Krok 100 (Pozadie) + Krok 500 (Text)
                </span>
                <span className="text-sm font-extrabold tracking-tight block">
                  Delta 4 kroky
                </span>
              </div>
              <div
                className="px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold border backdrop-blur-xs"
                style={{
                  backgroundColor: "rgba(0,0,0,0.15)",
                  borderColor: "rgba(0,0,0,0.2)",
                }}
              >
                {contrastPair4.res.ratio}:1 ({contrastPair4.res.score})
              </div>
            </div>

            {/* Pair B: Step 900 & 100 (Delta 8) */}
            <div
              className="p-3.5 rounded-[3px] border border-black/10 flex items-center justify-between transition-colors shadow-xs"
              style={{
                backgroundColor: contrastPair8.bg,
                color: contrastPair8.text,
              }}
            >
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider block opacity-75">
                  Krok 900 (Pozadie) + Krok 100 (Text)
                </span>
                <span className="text-sm font-extrabold tracking-tight block">
                  Delta 8 krokov
                </span>
              </div>
              <div
                className="px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold border backdrop-blur-xs"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                {contrastPair8.res.ratio}:1 ({contrastPair8.res.score})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LIVE UI EXAMPLES */}
      {cfg.showUiExamples && (
        <div
          className="bg-[#0e161d] border border-border/60 p-4 sm:p-6 space-y-5"
          style={{ borderRadius: brandRadius }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm text-foreground">
                Reálne UI komponenty v praxi
              </h4>
            </div>

            {/* Switcher if multiple colors are in matrix */}
            {tonalMatrix.length > 1 && (
              <div className="flex items-center gap-1.5 bg-[#17212a] p-1 rounded-[3px] border border-border/60 text-xs">
                <span className="text-muted-foreground text-[10px] uppercase font-mono px-1.5">
                  Farba:
                </span>
                {tonalMatrix.map(({ baseColor }) => {
                  const bName =
                    typeof baseColor.name === "object"
                      ? resolveI18nText(baseColor.name, locale) || baseColor.hex
                      : baseColor.name || baseColor.hex;

                  const isSelected = activeUiColorId === baseColor.id;

                  return (
                    <button
                      key={baseColor.id}
                      type="button"
                      onClick={() => setActiveUiColorId(baseColor.id)}
                      className={`px-2 py-0.5 rounded-[2px] flex items-center gap-1.5 font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: baseColor.hex }}
                      />
                      <span>{bName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive UI Component Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start text-xs">
            {/* Component 1: Solid Action Button */}
            <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                1. Solid Button (Krok 500)
              </span>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[3px] font-bold text-xs shadow-md transition-all duration-150 hover:brightness-110 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: uiSteps[500] || "#7A8200",
                  color: getWcagContrast(uiSteps[500] || "#7A8200").preferredText === "white" ? "#ffffff" : "#070b0f",
                }}
              >
                <span>Potvrdiť akciu</span>
                <Check className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-muted-foreground font-mono text-center">
                bg: #{uiSteps[500]?.replace("#", "")}
              </span>
            </div>

            {/* Component 2: Soft / Tint Button */}
            <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                2. Soft Button (Krok 100 & 700)
              </span>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[3px] font-bold text-xs border transition-all duration-150 hover:brightness-95 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: uiSteps[100] || "#E9F381",
                  color: uiSteps[800] || uiSteps[700] || "#34370E",
                  borderColor: uiSteps[300] || "#B9C400",
                }}
              >
                <span>Sekundárna voľba</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-muted-foreground font-mono text-center">
                bg: 100, text: 700
              </span>
            </div>

            {/* Component 3: Outline / Ghost Button */}
            <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                3. Outline Button (Krok 500)
              </span>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[3px] font-bold text-xs border transition-all duration-150 hover:bg-neutral-800/40 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  borderColor: uiSteps[500] || "#7A8200",
                  color: uiSteps[500] || "#7A8200",
                }}
              >
                <span>Zobraziť detail</span>
              </button>
              <span className="text-[10px] text-muted-foreground font-mono text-center">
                border: #{uiSteps[500]?.replace("#", "")}
              </span>
            </div>

            {/* Component 4: Interactive Input with Step 500 Focus Ring */}
            <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
                4. Input & Focus Ring (Krok 500)
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Vyhľadávať v UI..."
                  readOnly
                  value="Focus ring ukážka"
                  className="w-full pl-8 pr-3 py-2 bg-[#0e161d] rounded-[3px] text-xs text-foreground outline-none transition-shadow"
                  style={{
                    border: `1.5px solid ${uiSteps[500] || "#7A8200"}`,
                    boxShadow: `0 0 0 2px ${uiSteps[500]}33`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono text-center">
                focus-ring: #{uiSteps[500]?.replace("#", "")}
              </span>
            </div>
          </div>
        </div>
      )}

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
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nastavenia tonálnych odtieňov (M14)
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
                onClick={() => setModalTab("colors")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "colors"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Výber základných farieb
              </button>
              <button
                type="button"
                onClick={() => setModalTab("overrides")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "overrides"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Ručné úpravy (Hybrid)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("display")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "display"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                3. Nastavenia zobrazenia
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: BASE COLORS SELECT */}
              {modalTab === "colors" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">
                      Vyberte farby značky, pre ktoré sa vygenerujú odtiene:
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Zvolených: {cfg.baseColorIds.length > 0 ? cfg.baseColorIds.length : activeBaseColors.length}
                    </span>
                  </div>

                  {brandColors.length === 0 ? (
                    <div className="text-muted-foreground py-6 text-center italic bg-[#17212a] p-4 rounded border border-border/40 space-y-2">
                      <p>V projekte zatiaľ nie sú vytvorené vlastné farby v globálnej palete.</p>
                      <p className="text-[11px] text-primary">
                        Modul momentálne generuje odtiene z predvolených systémových farieb.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {brandColors.map((color) => {
                        const isSelected =
                          cfg.baseColorIds.length > 0
                            ? cfg.baseColorIds.includes(color.id)
                            : activeBaseColors.some((c) => c.id === color.id);

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
                                  cfg.baseColorIds.length > 0
                                    ? [...cfg.baseColorIds]
                                    : activeBaseColors.map((c) => c.id);

                                if (e.target.checked) {
                                  if (!newIds.includes(color.id)) {
                                    newIds.push(color.id);
                                  }
                                } else {
                                  newIds = newIds.filter((id) => id !== color.id);
                                }
                                handleSaveConfig({ ...cfg, baseColorIds: newIds });
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

              {/* TAB 2: MANUAL OVERRIDES (HYBRID MODE) */}
              {modalTab === "overrides" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">
                      Manuálna úprava vygenerovaných HEX kódov:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveConfig({
                          ...cfg,
                          generationMode: "hsluv_auto",
                          overrides: {},
                        })
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#17212a] border border-border/50 text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
                      title="Zmazať všetky ručné úpravy a obnoviť čistý HSLuv výpočet"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Obnoviť HSLuv automatiku</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {tonalMatrix.map(({ baseColor, steps }) => {
                      const bName =
                        typeof baseColor.name === "object"
                          ? resolveI18nText(baseColor.name, locale) || baseColor.hex
                          : baseColor.name || baseColor.hex;

                      return (
                        <div
                          key={baseColor.id}
                          className="bg-[#17212a] p-3.5 rounded-[3px] border border-border/50 space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                            <span className="font-bold text-foreground text-xs">
                              {bName}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {baseColor.hex}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {steps.map((s) => (
                              <div key={s.step} className="space-y-1">
                                <span className="font-mono text-[10px] text-muted-foreground block">
                                  Krok {s.step}:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-4 h-4 rounded-[2px] border border-black/20 shrink-0"
                                    style={{ backgroundColor: s.hex }}
                                  />
                                  <input
                                    type="text"
                                    value={s.hex}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updatedOverrides = { ...cfg.overrides };
                                      if (!updatedOverrides[baseColor.id]) {
                                        updatedOverrides[baseColor.id] = {};
                                      }
                                      updatedOverrides[baseColor.id][s.step.toString()] = val;

                                      handleSaveConfig({
                                        ...cfg,
                                        generationMode: "manual_override",
                                        overrides: updatedOverrides,
                                      });
                                    }}
                                    className="w-full font-mono text-[10px] bg-[#0e161d] border border-border/50 rounded-[2px] px-1.5 py-0.5 text-foreground focus:border-primary focus:outline-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: DISPLAY SETTINGS */}
              {modalTab === "display" && (
                <div className="space-y-3 bg-[#17212a] p-4 rounded-[3px] border border-border/40">
                  <span className="font-semibold text-foreground text-xs block">
                    Zobrazenie doplnkových sekcií modulu:
                  </span>
                  <div className="space-y-3 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showContrastRule}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            showContrastRule: e.target.checked,
                          })
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                      />
                      <div>
                        <span className="text-foreground text-[11px] font-medium block">
                          Zobraziť edukačný WCAG blok (Pravidlo 4 krokov)
                        </span>
                        <span className="text-muted-foreground text-[10px] block">
                          Vysvetľovač bezpečného kontrastu s live výpočtom pomeru
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.showUiExamples}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            showUiExamples: e.target.checked,
                          })
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                      />
                      <div>
                        <span className="text-foreground text-[11px] font-medium block">
                          Zobraziť reálne UI ukážky (Live Components)
                        </span>
                        <span className="text-muted-foreground text-[10px] block">
                          Ukážka tlačidiel, kariet a inputu oživených vo vygenerovanej škále
                        </span>
                      </div>
                    </label>
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
