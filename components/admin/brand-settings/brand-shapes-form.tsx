"use client";

import { useState, useTransition, useMemo } from "react";
import { updateGlobalShapesAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import {
  Check,
  AlertCircle,
  Loader2,
  Square,
  CircleCheck,
  AlertTriangle,
  XCircle,
  Palette,
  Sparkles,
  Sun,
  Moon,
  Type,
  Grid,
  Sliders,
  Upload,
} from "lucide-react";
import { UniversalMediaPickerModal } from "@/components/admin/media/universal-media-picker-modal";
import {
  ManualThemeId,
  ManualThemeConfig,
  PRESET_THEMES,
  resolveManualTheme,
} from "@/lib/constants/themes";
import { getWcagContrast } from "@/lib/utils/color-calc";

interface BrandShapesFormProps {
  brandId: string;
  initialShapes?: {
    radiusMode?: string;
    customRadiusPx?: number;
    borderWidthPx?: number;
    semanticSuccess?: string;
    semanticWarning?: string;
    semanticDanger?: string;
    semanticInfo?: string;
    manualBgColor?: string;
    themeConfig?: ManualThemeConfig | null;
  } | null;
  brandColors?: Array<{ hex: string; role?: string; name?: string }>;
  dict: Dictionary;
}

export function BrandShapesForm({
  brandId,
  initialShapes,
  brandColors = [],
  dict,
}: BrandShapesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form states for corner radius & borders
  const rawRadius = (initialShapes?.radiusMode || "rounded").toLowerCase().trim();
  const validRadius =
    rawRadius === "sharp" || rawRadius === "pill" || rawRadius === "rounded"
      ? rawRadius
      : "rounded";

  const [radiusMode, setRadiusMode] = useState<string>(validRadius);
  const [customRadius, setCustomRadius] = useState<number>(initialShapes?.customRadiusPx ?? 3);
  const [borderWidth, setBorderWidth] = useState<number>(initialShapes?.borderWidthPx ?? 1);
  const [successColor, setSuccessColor] = useState<string>(initialShapes?.semanticSuccess || "#009f80");
  const [warningColor, setWarningColor] = useState<string>(initialShapes?.semanticWarning || "#c8d400");
  const [dangerColor, setDangerColor] = useState<string>(initialShapes?.semanticDanger || "#bb4934");
  const [infoColor, setInfoColor] = useState<string>(initialShapes?.semanticInfo || "#2b3b48");

  // Initial Theme Detection
  const initialThemeId: ManualThemeId = useMemo(() => {
    if (initialShapes?.themeConfig?.themeId) {
      return initialShapes.themeConfig.themeId;
    }
    const bg = (initialShapes?.manualBgColor || "").toLowerCase().trim();
    if (bg === "#070b0f") return "abyss";
    if (bg === "#0e161d") return "deep";
    if (bg === "#fafbfc") return "paper";
    if (bg === "#eef2f6") return "mist";
    if (bg && bg !== "#0e161d" && bg !== "#ffffff") return "custom";
    return "paper"; // default for public manual according to design rules
  }, [initialShapes]);

  const [themeId, setThemeId] = useState<ManualThemeId>(initialThemeId);

  // Custom theme colors state (7 fields)
  const initialCustom = initialShapes?.themeConfig?.custom || {};
  const [customBg, setCustomBg] = useState<string>(
    initialCustom.bgColor || initialShapes?.manualBgColor || "#fafbfc"
  );
  const [customSurface, setCustomSurface] = useState<string>(
    initialCustom.surfaceColor || "#ffffff"
  );
  const [customText, setCustomText] = useState<string>(
    initialCustom.textColor || "#0e161d"
  );
  const [customMuted, setCustomMuted] = useState<string>(
    initialCustom.mutedColor || "#64748b"
  );
  const [customBorder, setCustomBorder] = useState<string>(
    initialCustom.borderColor || "#e2e8f0"
  );
  const [customPrimary, setCustomPrimary] = useState<string>(
    initialCustom.primaryColor || "#c8d400"
  );
  const [customAccent, setCustomAccent] = useState<string>(
    initialCustom.accentColor || "#009f80"
  );

  // Heading color state
  const rawInitialHeading =
    initialShapes?.themeConfig?.headingColor ||
    initialCustom.headingColor ||
    "";

  const primaryBrandColor = useMemo(() => {
    return brandColors.find((c) => c.role?.toUpperCase() === "PRIMARY")?.hex || "#c8d400";
  }, [brandColors]);

  const secondaryBrandColor = useMemo(() => {
    return brandColors.find((c) => c.role?.toUpperCase() === "SECONDARY")?.hex || "#17212a";
  }, [brandColors]);

  const accentBrandColor = useMemo(() => {
    return brandColors.find((c) => c.role?.toUpperCase() === "ACCENT")?.hex || "#009f80";
  }, [brandColors]);

  const [headingColorMode, setHeadingColorMode] = useState<
    "inherit" | "primary" | "secondary" | "accent" | "custom"
  >(() => {
    if (!rawInitialHeading) return "inherit";
    const norm = rawInitialHeading.toLowerCase().trim();
    const p = (brandColors.find((c) => c.role?.toUpperCase() === "PRIMARY")?.hex || "").toLowerCase().trim();
    const s = (brandColors.find((c) => c.role?.toUpperCase() === "SECONDARY")?.hex || "").toLowerCase().trim();
    const a = (brandColors.find((c) => c.role?.toUpperCase() === "ACCENT")?.hex || "").toLowerCase().trim();
    if (p && norm === p) return "primary";
    if (s && norm === s) return "secondary";
    if (a && norm === a) return "accent";
    return "custom";
  });

  const [customHeadingColor, setCustomHeadingColor] = useState<string>(
    rawInitialHeading || "#fafbfc"
  );

  // Background Pattern states
  const initialPattern = initialShapes?.themeConfig?.pattern;
  const [patternEnabled, setPatternEnabled] = useState<boolean>(Boolean(initialPattern?.enabled));
  const [patternUrl, setPatternUrl] = useState<string>(initialPattern?.patternUrl || "");
  const [patternType, setPatternType] = useState<"repeat" | "cover" | "contain" | "zoom" | "single">(initialPattern?.patternType || "repeat");
  const [patternPosition, setPatternPosition] = useState<
    "center" | "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  >(initialPattern?.position || "center");
  const [marginPx, setMarginPx] = useState<number>(initialPattern?.marginPx ?? 0);
  const [zoomPercent, setZoomPercent] = useState<number>(initialPattern?.zoomPercent ?? 100);
  const [patternOpacity, setPatternOpacity] = useState<number>(initialPattern?.opacity ?? 0.15);
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(Boolean(initialPattern?.overlayGradient?.enabled));
  const [gradientDirection, setGradientDirection] = useState<
    "to-bottom" | "to-top" | "to-right" | "to-left" | "to-bottom-right" | "to-bottom-left" | "radial"
  >(initialPattern?.overlayGradient?.direction || "to-bottom");
  const [gradientSpreadPercent, setGradientSpreadPercent] = useState<number>(initialPattern?.overlayGradient?.spreadPercent ?? 70);
  const [isPatternPickerOpen, setIsPatternPickerOpen] = useState(false);

  // Effective preview radius
  const previewRadiusPx =
    radiusMode === "sharp" ? 0 : radiusMode === "pill" ? 9999 : customRadius;

  // Resolved current active theme for live preview & submit
  const currentTheme = useMemo(() => {
    const resolvedHeading =
      headingColorMode === "inherit"
        ? undefined
        : headingColorMode === "primary"
        ? primaryBrandColor
        : headingColorMode === "secondary"
        ? secondaryBrandColor
        : headingColorMode === "accent"
        ? accentBrandColor
        : customHeadingColor;

    const config: ManualThemeConfig = {
      themeId,
      headingColor: resolvedHeading,
      custom:
        themeId === "custom"
          ? {
              bgColor: customBg,
              surfaceColor: customSurface,
              textColor: customText,
              headingColor: resolvedHeading,
              mutedColor: customMuted,
              borderColor: customBorder,
              primaryColor: customPrimary,
              accentColor: customAccent,
            }
          : undefined,
    };
    return resolveManualTheme(config, customBg, brandColors);
  }, [
    themeId,
    headingColorMode,
    primaryBrandColor,
    secondaryBrandColor,
    accentBrandColor,
    customHeadingColor,
    customBg,
    customSurface,
    customText,
    customMuted,
    customBorder,
    customPrimary,
    customAccent,
    brandColors,
  ]);

  const effectivePreviewHeadingColor = useMemo(() => {
    if (headingColorMode === "inherit") return currentTheme.textColor;
    if (headingColorMode === "primary") return primaryBrandColor;
    if (headingColorMode === "secondary") return secondaryBrandColor;
    if (headingColorMode === "accent") return accentBrandColor;
    return customHeadingColor || currentTheme.textColor;
  }, [
    headingColorMode,
    currentTheme.textColor,
    primaryBrandColor,
    secondaryBrandColor,
    accentBrandColor,
    customHeadingColor,
  ]);

  // Pre-populate custom theme from brand colors
  const handlePrepopulateFromBrand = () => {
    if (!brandColors || brandColors.length === 0) return;

    let p = customPrimary;
    let a = customAccent;
    let s = customSurface;
    let bg = customBg;

    for (const c of brandColors) {
      if (!c.hex) continue;
      const role = c.role?.toUpperCase();
      if (role === "PRIMARY") p = c.hex;
      else if (role === "ACCENT") a = c.hex;
      else if (role === "SECONDARY") s = c.hex;
      else if (role === "BACKGROUND" || role === "NEUTRAL") bg = c.hex;
    }

    setCustomPrimary(p);
    setCustomAccent(a);
    if (bg) setCustomBg(bg);
    if (s) setCustomSurface(s);

    try {
      const contrast = getWcagContrast(bg);
      const isDark = contrast.preferredText === "white";
      setCustomText(isDark ? "#fafbfc" : "#0e161d");
      setCustomMuted(isDark ? "#96abbe" : "#587489");
      setCustomBorder(isDark ? "rgba(63, 85, 102, 0.45)" : "#bac8d6");
    } catch {
      // fallback
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const resolvedHeading =
      headingColorMode === "inherit"
        ? undefined
        : headingColorMode === "primary"
        ? primaryBrandColor
        : headingColorMode === "secondary"
        ? secondaryBrandColor
        : headingColorMode === "accent"
        ? accentBrandColor
        : customHeadingColor;

    const themeConfigPayload: ManualThemeConfig = {
      themeId,
      headingColor: resolvedHeading,
      custom:
        themeId === "custom"
          ? {
              bgColor: customBg,
              surfaceColor: customSurface,
              textColor: customText,
              headingColor: resolvedHeading,
              mutedColor: customMuted,
              borderColor: customBorder,
              primaryColor: customPrimary,
              accentColor: customAccent,
            }
          : undefined,
      pattern: {
        enabled: patternEnabled,
        patternUrl,
        patternType,
        zoomPercent,
        position: patternPosition,
        marginPx,
        opacity: patternOpacity,
        overlayGradient: {
          enabled: gradientEnabled,
          direction: gradientDirection,
          spreadPercent: gradientSpreadPercent,
        },
      },
    };

    const formData = new FormData(e.currentTarget);
    formData.set("radiusMode", radiusMode);
    formData.set("customRadiusPx", String(customRadius));
    formData.set("borderWidthPx", String(borderWidth));
    formData.set("manualBgColor", currentTheme.bgColor);
    formData.set("themeConfig", JSON.stringify(themeConfigPayload));

    startTransition(async () => {
      const res = await updateGlobalShapesAction(brandId, null, formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Failed to update visual shapes and theme");
      }
    });
  };

  // Helper for live preview background position CSS
  const previewBgPositionCss = useMemo(() => {
    const pos = patternPosition || "center";
    const margin = marginPx ?? 0;
    if (margin === 0) {
      switch (pos) {
        case "top-left":
          return "left top";
        case "top-center":
          return "center top";
        case "top-right":
          return "right top";
        case "bottom-left":
          return "left bottom";
        case "bottom-center":
          return "center bottom";
        case "bottom-right":
          return "right bottom";
        case "center":
        default:
          return "center center";
      }
    }
    switch (pos) {
      case "top-left":
        return `left ${margin}px top ${margin}px`;
      case "top-center":
        return `center top ${margin}px`;
      case "top-right":
        return `right ${margin}px top ${margin}px`;
      case "bottom-left":
        return `left ${margin}px bottom ${margin}px`;
      case "bottom-center":
        return `center bottom ${margin}px`;
      case "bottom-right":
        return `right ${margin}px bottom ${margin}px`;
      case "center":
      default:
        return "center center";
    }
  }, [patternPosition, marginPx]);

  // Helper for live preview gradient overlay CSS
  const previewGradientCss = useMemo(() => {
    if (!gradientEnabled) return "";
    const dir = gradientDirection || "to-bottom";
    const bg = currentTheme.bgColor;
    const spread = gradientSpreadPercent ?? 70;
    if (dir === "radial") {
      return `radial-gradient(circle at center, transparent 0%, ${bg} ${spread}%)`;
    }
    const dirMap: Record<string, string> = {
      "to-bottom": "to bottom",
      "to-top": "to top",
      "to-right": "to right",
      "to-left": "to left",
      "to-bottom-right": "to bottom right",
      "to-bottom-left": "to bottom left",
    };
    const cssDir = dirMap[dir] || "to bottom";
    return `linear-gradient(${cssDir}, ${bg} 0%, ${bg} ${Math.max(0, spread - 40)}%, transparent ${spread}%)`;
  }, [gradientEnabled, gradientDirection, gradientSpreadPercent, currentTheme.bgColor]);

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[rgba(63,85,102,0.45)] rounded-2xl bg-[#17212a] text-[#fafbfc] p-6 sm:p-8 shadow-sm space-y-8"
    >
      <div className="border-b border-[rgba(63,85,102,0.4)] pb-5">
        <h2 className="text-lg font-bold text-[#fafbfc]">
          {dict.admin.globalShapesTitle}
        </h2>
        <p className="text-xs text-[#96abbe] mt-1">
          {dict.admin.globalShapesDesc}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-xl">
          <Check className="h-4 w-4 shrink-0" />
          <span>{dict.admin.changesSaved}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LIVE PREVIEW BOX                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 rounded-2xl border border-[rgba(63,85,102,0.5)] bg-[#070b0f] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
            Živý náhľad témy manuálu a tvarov
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>Téma: {themeId.toUpperCase()}</span>
            <span>•</span>
            <span>Pozadie: {currentTheme.bgColor}</span>
            {patternEnabled && patternUrl && (
              <>
                <span>•</span>
                <span className="text-[#c8d400]">Pattern: aktívny</span>
              </>
            )}
          </div>
        </div>

        {/* Outer Manual Canvas Preview */}
        <div
          style={{
            backgroundColor: currentTheme.bgColor,
            color: currentTheme.textColor,
          }}
          className="relative overflow-hidden p-6 sm:p-8 rounded-xl border border-border/40 transition-colors shadow-inner space-y-4"
        >
          {/* Pattern Layer inside Canvas Preview */}
          {patternEnabled && patternUrl && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `url(${patternUrl})`,
                backgroundRepeat: patternType === "repeat" ? "repeat" : "no-repeat",
                backgroundSize:
                  patternType === "cover"
                    ? "cover"
                    : patternType === "contain"
                    ? "contain"
                    : patternType === "zoom" || zoomPercent
                    ? `${zoomPercent || 100}%`
                    : "auto",
                backgroundPosition: previewBgPositionCss,
                opacity: patternOpacity,
              }}
            />
          )}

          {/* Fade-out Overlay inside Canvas Preview */}
          {patternEnabled && previewGradientCss && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: previewGradientCss,
              }}
            />
          )}

          {/* Sample Card Surface */}
          <div
            style={{
              borderRadius: `${previewRadiusPx}px`,
              borderWidth: `${borderWidth}px`,
              borderColor: currentTheme.borderColor,
              backgroundColor: currentTheme.surfaceColor,
              color: currentTheme.textColor,
            }}
            className="relative z-10 p-6 transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-md"
          >
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground border border-white/10">
                  Náhľad nadpisu
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Farba: {effectivePreviewHeadingColor}
                </span>
              </div>
              <h4
                style={{ color: effectivePreviewHeadingColor }}
                className="text-lg font-black tracking-tight"
              >
                Ukážkový nadpis kapitoly (H1/H2)
              </h4>
              <p
                style={{ color: currentTheme.mutedColor }}
                className="text-xs max-w-md leading-relaxed"
              >
                Zaoblenie: {previewRadiusPx}px | Orámovanie: {borderWidth}px |
                Hierarchia textu a komponentov prispôsobená téme.
              </p>
            </div>

            {/* Buttons & Accents */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Primary CTA */}
              <button
                type="button"
                style={{
                  borderRadius: `${previewRadiusPx}px`,
                  backgroundColor: currentTheme.primaryColor,
                  color: currentTheme.isDark ? "#070b0f" : "#0e161d",
                }}
                className="px-4 py-2 text-xs font-bold shadow-sm transition-transform active:scale-95"
              >
                Stiahnuť balíček (CTA)
              </button>

              {/* Accent Badge */}
              <span
                style={{
                  borderRadius: `${previewRadiusPx}px`,
                  backgroundColor: `${currentTheme.accentColor}20`,
                  color: currentTheme.accentColor,
                  borderColor: currentTheme.accentColor,
                }}
                className="px-3 py-1.5 text-xs font-semibold border flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" /> Akcent značky
              </span>
            </div>
          </div>

          {/* Semantic Badges Preview */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
            <span
              style={{
                borderRadius: `${previewRadiusPx}px`,
                backgroundColor: `${successColor}20`,
                borderColor: successColor,
                color: successColor,
              }}
              className="px-3 py-1 text-xs font-bold border flex items-center gap-1.5"
            >
              <CircleCheck className="h-3.5 w-3.5" /> Do&apos;s
            </span>
            <span
              style={{
                borderRadius: `${previewRadiusPx}px`,
                backgroundColor: `${warningColor}20`,
                borderColor: warningColor,
                color: warningColor,
              }}
              className="px-3 py-1 text-xs font-bold border flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Notice
            </span>
            <span
              style={{
                borderRadius: `${previewRadiusPx}px`,
                backgroundColor: `${dangerColor}20`,
                borderColor: dangerColor,
                color: dangerColor,
              }}
              className="px-3 py-1 text-xs font-bold border flex items-center gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" /> Don&apos;ts
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* THEME SELECTION: 4 PRESETS + 1 CUSTOM                        */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Téma verejného brand manuálu
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vyberte si z 4 overených predvolených tém bez sterilnej bielej a
              čiernej, alebo si namiešajte vlastnú tému.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Preset 1: Abyss (Dark 1) */}
          <button
            type="button"
            onClick={() => setThemeId("abyss")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeId === "abyss"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Moon className="h-3 w-3 text-sky-400" /> Abyss
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                Tmavá 1
              </span>
            </div>
            {/* Visual mini-swatch */}
            <div className="h-10 rounded-lg p-1.5 flex items-center justify-between border border-white/10 bg-[#070b0f]">
              <div className="h-7 w-12 rounded bg-[#17212a] border border-white/10 flex items-center justify-center">
                <div className="h-2 w-4 rounded-full bg-[#c8d400]" />
              </div>
              <div className="text-[10px] font-mono text-[#fafbfc] pr-1">#070b0f</div>
            </div>
            <div className="text-[11px] text-muted-foreground leading-snug">
              Hlboký polnočný podklad so zdvihnutým povrchom.
            </div>
          </button>

          {/* Preset 2: Deep Slate (Dark 2) */}
          <button
            type="button"
            onClick={() => setThemeId("deep")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeId === "deep"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Moon className="h-3 w-3 text-indigo-400" /> Deep Slate
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                Tmavá 2
              </span>
            </div>
            {/* Visual mini-swatch */}
            <div className="h-10 rounded-lg p-1.5 flex items-center justify-between border border-white/10 bg-[#0e161d]">
              <div className="h-7 w-12 rounded bg-[#1f2c36] border border-white/10 flex items-center justify-center">
                <div className="h-2 w-4 rounded-full bg-[#009f80]" />
              </div>
              <div className="text-[10px] font-mono text-[#fafbfc] pr-1">#0e161d</div>
            </div>
            <div className="text-[11px] text-muted-foreground leading-snug">
              Grafitová bridlica s vyvýšenými panelmi.
            </div>
          </button>

          {/* Preset 3: Light Canvas (Light 1) */}
          <button
            type="button"
            onClick={() => setThemeId("paper")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeId === "paper"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Sun className="h-3 w-3 text-amber-400" /> Light Canvas
              </span>
              <span className="text-[10px] text-[#009f80] font-semibold uppercase">
                Default
              </span>
            </div>
            {/* Visual mini-swatch */}
            <div className="h-10 rounded-lg p-1.5 flex items-center justify-between border border-black/10 bg-[#fafbfc]">
              <div className="h-7 w-12 rounded bg-[#f1f4f7] border border-black/10 flex items-center justify-center">
                <div className="h-2 w-4 rounded-full bg-[#c8d400]" />
              </div>
              <div className="text-[10px] font-mono text-[#0e161d] pr-1">#fafbfc</div>
            </div>
            <div className="text-[11px] text-muted-foreground leading-snug">
              Jemný matný papier, elegantná svetlá prezentácia.
            </div>
          </button>

          {/* Preset 4: Cool Mist (Light 2) */}
          <button
            type="button"
            onClick={() => setThemeId("mist")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeId === "mist"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Sun className="h-3 w-3 text-sky-400" /> Cool Mist
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                Svetlá 2
              </span>
            </div>
            {/* Visual mini-swatch */}
            <div className="h-10 rounded-lg p-1.5 flex items-center justify-between border border-black/10 bg-[#eef2f6]">
              <div className="h-7 w-12 rounded bg-[#fafbfc] border border-black/10 flex items-center justify-center">
                <div className="h-2 w-4 rounded-full bg-[#009f80]" />
              </div>
              <div className="text-[10px] font-mono text-[#0e161d] pr-1">#eef2f6</div>
            </div>
            <div className="text-[11px] text-muted-foreground leading-snug">
              Chladná sivastá hmla so svetlými kartami.
            </div>
          </button>

          {/* Preset 5: Custom Theme */}
          <button
            type="button"
            onClick={() => setThemeId("custom")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              themeId === "custom"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Palette className="h-3 w-3 text-[#c8d400]" /> Vlastná téma
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                Custom
              </span>
            </div>
            {/* Visual mini-swatch */}
            <div className="h-10 rounded-lg p-1.5 flex items-center justify-between border border-border/40 bg-neutral-900/50">
              <div className="flex items-center gap-1">
                <div
                  style={{ backgroundColor: customBg }}
                  className="h-6 w-4 rounded-xs border border-white/20"
                />
                <div
                  style={{ backgroundColor: customSurface }}
                  className="h-6 w-4 rounded-xs border border-white/20"
                />
                <div
                  style={{ backgroundColor: customPrimary }}
                  className="h-6 w-4 rounded-xs border border-white/20"
                />
              </div>
              <span className="text-[10px] text-muted-foreground">7 farieb</span>
            </div>
            <div className="text-[11px] text-muted-foreground leading-snug">
              Úplná kontrola nad pozadím, kartami a textom.
            </div>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOM THEME DETAILED CONTROLS (EXPANDABLE)                  */}
      {/* ------------------------------------------------------------- */}
      {themeId === "custom" && (
        <div className="p-5 sm:p-6 rounded-2xl border border-[#c8d400]/30 bg-[#c8d400]/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/30 pb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-[#c8d400]" />
                Vlastné nastavenie farieb témy
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prispôsobte si jednotlivé farebné vrstvy manuálu pre dokonalý súlad so značkou.
              </p>
            </div>

            {brandColors && brandColors.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrepopulateFromBrand}
                className="self-start sm:self-auto text-xs gap-1.5 border-border/60 hover:border-[#c8d400] hover:text-[#c8d400]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#c8d400]" />
                Predvyplniť z farieb značky
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 1. Page Background */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                1. Pozadie manuálu (Plátno)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customBg.startsWith("#") && customBg.length === 7 ? customBg : "#fafbfc"}
                  onChange={(e) => setCustomBg(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
                />
                <Input
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  className="h-9 text-xs font-mono bg-background/50 border-border/60"
                />
              </div>
            </div>

            {/* 2. Card Surface */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                2. Karty a panely (Surface)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customSurface.startsWith("#") && customSurface.length === 7 ? customSurface : "#f1f4f7"}
                  onChange={(e) => setCustomSurface(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
                />
                <Input
                  value={customSurface}
                  onChange={(e) => setCustomSurface(e.target.value)}
                  className="h-9 text-xs font-mono bg-background/50 border-border/60"
                />
              </div>
            </div>

            {/* 3. Primary Text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                3. Hlavný text (Nadpisy)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customText.startsWith("#") && customText.length === 7 ? customText : "#0e161d"}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
                />
                <Input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="h-9 text-xs font-mono bg-background/50 border-border/60"
                />
              </div>
            </div>

            {/* 4. Muted Text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                4. Tlmený text (Popisy)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customMuted.startsWith("#") && customMuted.length === 7 ? customMuted : "#587489"}
                  onChange={(e) => setCustomMuted(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
                />
                <Input
                  value={customMuted}
                  onChange={(e) => setCustomMuted(e.target.value)}
                  className="h-9 text-xs font-mono bg-background/50 border-border/60"
                />
              </div>
            </div>

            {/* 5. Border Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                5. Orámovanie (Linky)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customBorder.startsWith("#") && customBorder.length === 7 ? customBorder : "#bac8d6"}
                  onChange={(e) => setCustomBorder(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
                />
                <Input
                  value={customBorder}
                  onChange={(e) => setCustomBorder(e.target.value)}
                  className="h-9 text-xs font-mono bg-background/50 border-border/60"
                />
              </div>
            </div>

            {/* 6. Primary CTA Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                6. Primárna farba (CTA Tlačidlá)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customPrimary.startsWith("#") && customPrimary.length === 7 ? customPrimary : "#c8d400"}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
                />
                <Input
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="h-9 text-xs font-mono bg-background/50 border-border/60"
                />
              </div>
            </div>

            {/* 7. Accent Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                7. Akcentová farba (Badge / Tagy)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customAccent.startsWith("#") && customAccent.length === 7 ? customAccent : "#009f80"}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
                />
                <Input
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="h-9 text-xs font-mono bg-background/50 border-border/60"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FARBA NADPISOV (HEADING COLOR)                                */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-4 border-t border-[rgba(63,85,102,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-primary" />
              Farba nadpisov v manuáli (H1 – H6)
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Určite farbu hlavných a sekčných nadpisov vo verejnom brand manuáli.
              Môžete použiť predvolenú farbu podľa témy, niektorú z farieb značky, alebo zadať vlastný odtieň.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">Aktívna farba:</span>
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: effectivePreviewHeadingColor }}
            />
            <span className="font-bold text-foreground">{effectivePreviewHeadingColor}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Option 1: Inherit from theme */}
          <button
            type="button"
            onClick={() => setHeadingColorMode("inherit")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
              headingColorMode === "inherit"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground">Podľa témy</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Auto</span>
            </div>
            <div className="h-6 rounded flex items-center gap-2 px-2 border border-white/10 bg-[#070b0f]">
              <div
                className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                style={{ backgroundColor: currentTheme.textColor }}
              />
              <span className="text-[10px] font-mono text-muted-foreground truncate">{currentTheme.textColor}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Zdedená farba textu aktívnej témy</span>
          </button>

          {/* Option 2: Primary brand color */}
          <button
            type="button"
            onClick={() => setHeadingColorMode("primary")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
              headingColorMode === "primary"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground">Primárna</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Brand</span>
            </div>
            <div className="h-6 rounded flex items-center gap-2 px-2 border border-white/10 bg-[#070b0f]">
              <div
                className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                style={{ backgroundColor: primaryBrandColor }}
              />
              <span className="text-[10px] font-mono text-foreground font-semibold truncate">{primaryBrandColor}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Hlavná primárna farba značky</span>
          </button>

          {/* Option 3: Secondary brand color */}
          <button
            type="button"
            onClick={() => setHeadingColorMode("secondary")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
              headingColorMode === "secondary"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground">Sekundárna</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Brand</span>
            </div>
            <div className="h-6 rounded flex items-center gap-2 px-2 border border-white/10 bg-[#070b0f]">
              <div
                className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                style={{ backgroundColor: secondaryBrandColor }}
              />
              <span className="text-[10px] font-mono text-foreground font-semibold truncate">{secondaryBrandColor}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Sekundárna doplnková farba</span>
          </button>

          {/* Option 4: Accent brand color */}
          <button
            type="button"
            onClick={() => setHeadingColorMode("accent")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
              headingColorMode === "accent"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground">Akcent</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Brand</span>
            </div>
            <div className="h-6 rounded flex items-center gap-2 px-2 border border-white/10 bg-[#070b0f]">
              <div
                className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                style={{ backgroundColor: accentBrandColor }}
              />
              <span className="text-[10px] font-mono text-foreground font-semibold truncate">{accentBrandColor}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Akcentná farba značky</span>
          </button>

          {/* Option 5: Custom color */}
          <button
            type="button"
            onClick={() => setHeadingColorMode("custom")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
              headingColorMode === "custom"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_18px_rgba(200,212,0,0.15)] ring-1 ring-[#c8d400]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground">Vlastná farba</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Custom</span>
            </div>
            <div className="h-6 rounded flex items-center gap-2 px-2 border border-white/10 bg-[#070b0f]">
              <div
                className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                style={{ backgroundColor: customHeadingColor }}
              />
              <span className="text-[10px] font-mono text-foreground font-semibold truncate">{customHeadingColor}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Zadajte vlastný HEX kód</span>
          </button>
        </div>

        {/* Custom Heading Color input if 'custom' is active */}
        {headingColorMode === "custom" && (
          <div className="p-4 rounded-xl border border-border/50 bg-[#070b0f] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground">
                Zadajte vlastnú farbu pre nadpisy
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Vyberte farbu pomocou palety alebo vložte presný HEX kód.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customHeadingColor.startsWith("#") ? customHeadingColor : "#fafbfc"}
                onChange={(e) => setCustomHeadingColor(e.target.value)}
                className="h-9 w-9 rounded-lg border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                value={customHeadingColor}
                onChange={(e) => setCustomHeadingColor(e.target.value)}
                placeholder="#fafbfc"
                className="w-32 h-9 text-xs rounded-lg bg-background/60 border-border/60 font-mono text-center"
              />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RADIUS MODE SELECTOR                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 pt-4 border-t border-border/30">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {dict.admin.cornerRounding}
        </Label>
        <div className="grid grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => setRadiusMode("sharp")}
            className={`p-4 sm:p-5 text-xs rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 cursor-pointer ${
              radiusMode === "sharp"
                ? "border-[#c8d400] bg-[#c8d400]/10 text-foreground font-semibold shadow-[0_0_20px_rgba(200,212,0,0.12)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40 text-muted-foreground"
            }`}
          >
            <Square className="h-5 w-5" />
            <span className="font-medium">{dict.admin.radiusSharp}</span>
          </button>

          <button
            type="button"
            onClick={() => setRadiusMode("rounded")}
            className={`p-4 sm:p-5 text-xs rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 cursor-pointer ${
              radiusMode === "rounded"
                ? "border-[#c8d400] bg-[#c8d400]/10 text-foreground font-semibold shadow-[0_0_20px_rgba(200,212,0,0.12)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40 text-muted-foreground"
            }`}
          >
            <div className="h-5 w-5 rounded-md border-2 border-current" />
            <span className="font-medium">{dict.admin.radiusRounded}</span>
          </button>

          <button
            type="button"
            onClick={() => setRadiusMode("pill")}
            className={`p-4 sm:p-5 text-xs rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 cursor-pointer ${
              radiusMode === "pill"
                ? "border-[#c8d400] bg-[#c8d400]/10 text-foreground font-semibold shadow-[0_0_20px_rgba(200,212,0,0.12)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40 text-muted-foreground"
            }`}
          >
            <div className="h-4 w-6 rounded-full border-2 border-current" />
            <span className="font-medium">{dict.admin.radiusPill}</span>
          </button>
        </div>
      </div>

      {/* Numerical Adjustments */}
      <div className="grid sm:grid-cols-2 gap-6">
        {radiusMode === "rounded" && (
          <div className="space-y-2.5">
            <Label
              htmlFor="customRadiusPx"
              className="text-xs font-semibold text-muted-foreground"
            >
              {dict.admin.customRadiusLabel}
            </Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="32"
                value={customRadius}
                onChange={(e) => setCustomRadius(Number(e.target.value))}
                className="flex-1 accent-[#c8d400] h-2 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <Input
                id="customRadiusPx"
                name="customRadiusPx"
                type="number"
                min={0}
                max={64}
                value={customRadius}
                onChange={(e) => setCustomRadius(Number(e.target.value))}
                className="w-20 h-10 text-xs rounded-xl bg-background/50 border-border/60 text-center font-mono"
              />
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <Label
            htmlFor="borderWidthPx"
            className="text-xs font-semibold text-muted-foreground"
          >
            {dict.admin.borderWidthLabel} (px)
          </Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="6"
              value={borderWidth}
              onChange={(e) => setBorderWidth(Number(e.target.value))}
              className="flex-1 accent-[#c8d400] h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <Input
              id="borderWidthPx"
              name="borderWidthPx"
              type="number"
              min={0}
              max={8}
              value={borderWidth}
              onChange={(e) => setBorderWidth(Number(e.target.value))}
              className="w-20 h-10 text-xs rounded-xl bg-background/50 border-border/60 text-center font-mono"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VZOR & TEXTÚRA POZADIA (Pattern, Zoom, Overlay Gradient)       */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-4 border-t border-border/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-primary" />
              <span>Vzor a textúra pozadia manuálu</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Pridajte do pozadia manuálu opakujúci sa SVG pattern alebo textúru s možnosťou zoomu a miznúceho prechodu.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={patternEnabled}
              onChange={(e) => setPatternEnabled(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#070b0f] border-border/70"
            />
            <span>Zapnúť pattern</span>
          </label>
        </div>

        {patternEnabled && (
          <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-4 animate-in fade-in duration-150">
            {/* Pattern Source URL & Universal Picker Button */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Zdroj vzoru (SVG alebo obrázok)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={patternUrl}
                  onChange={(e) => setPatternUrl(e.target.value)}
                  placeholder="https://... alebo /patterns/tile.svg"
                  className="h-9 text-xs rounded-lg font-mono flex-1 bg-[#070b0f]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPatternPickerOpen(true)}
                  className="h-9 text-xs gap-1.5 shrink-0"
                >
                  <Grid className="w-3.5 h-3.5 text-primary" />
                  <span>Vybrať z knižnice</span>
                </Button>
              </div>
            </div>

            {/* Pattern Type, Position & Zoom Controls */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Režim zobrazenia</Label>
                <select
                  value={patternType}
                  onChange={(e) => setPatternType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-[#070b0f] text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="repeat">Opakovanie (Repeat — kachličky)</option>
                  <option value="cover">Vyplniť plochu (Cover 100%)</option>
                  <option value="contain">Prispôsobiť (Contain / Fit)</option>
                  <option value="zoom">Vlastný Zoom / Mierka</option>
                  <option value="single">Jedno umiestnenie (Single / Vodoznak)</option>
                </select>
              </div>

              {/* Position selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Umiestnenie na obrazovke</Label>
                <select
                  value={patternPosition}
                  onChange={(e) => setPatternPosition(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-[#070b0f] text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="center">Stred (Center)</option>
                  <option value="top-left">Vľavo hore (Top Left)</option>
                  <option value="top-center">Hore na stred (Top Center)</option>
                  <option value="top-right">Vpravo hore (Top Right)</option>
                  <option value="bottom-left">Vľavo dole (Bottom Left)</option>
                  <option value="bottom-center">Dole na stred (Bottom Center)</option>
                  <option value="bottom-right">Vpravo dole (Bottom Right)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label>Mierka / Zoom</Label>
                  <span className="font-mono text-muted-foreground">{zoomPercent}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={zoomPercent}
                    onChange={(e) => setZoomPercent(Number(e.target.value))}
                    className="flex-1 accent-primary h-2 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <Input
                    type="number"
                    min="10"
                    max="300"
                    value={zoomPercent}
                    onChange={(e) => setZoomPercent(Number(e.target.value))}
                    className="w-16 h-8 text-xs rounded-md text-center font-mono bg-[#070b0f]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label>Odsadenie od okraja</Label>
                  <span className="font-mono text-muted-foreground">{marginPx}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="160"
                    step="4"
                    value={marginPx}
                    onChange={(e) => setMarginPx(Number(e.target.value))}
                    className="flex-1 accent-primary h-2 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="160"
                    value={marginPx}
                    onChange={(e) => setMarginPx(Number(e.target.value))}
                    className="w-16 h-8 text-xs rounded-md text-center font-mono bg-[#070b0f]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label>Priehľadnosť vzoru</Label>
                  <span className="font-mono text-muted-foreground">{Math.round(patternOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.8"
                  step="0.02"
                  value={patternOpacity}
                  onChange={(e) => setPatternOpacity(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-neutral-800 rounded-lg cursor-pointer mt-2"
                />
              </div>
            </div>

            {/* Gradient Fade Overlay Section */}
            <div className="pt-3 border-t border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={gradientEnabled}
                    onChange={(e) => setGradientEnabled(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-3.5 w-3.5 bg-[#070b0f] border-border/70"
                  />
                  <span>Miznúci prechod do pozadia (Gradient Overlay)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">Plynulé vynáranie z farby pozadia</span>
              </div>

              {gradientEnabled && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Smer miznutia / vynárania</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "to-bottom", label: "Zhora nadol" },
                        { id: "to-top", label: "Zdola nahor" },
                        { id: "to-right", label: "Zľava doprava" },
                        { id: "to-left", label: "Zprava doľava" },
                        { id: "to-bottom-right", label: "Z ľavého horného rohu" },
                        { id: "to-bottom-left", label: "Z pravého horného rohu" },
                        { id: "radial", label: "Kruhový (Radiálny zo stredu)" },
                      ].map((dir) => (
                        <button
                          key={dir.id}
                          type="button"
                          onClick={() => setGradientDirection(dir.id as any)}
                          className={`px-2.5 py-1.5 text-xs rounded-md border text-center transition-colors cursor-pointer ${
                            gradientDirection === dir.id
                              ? "bg-primary text-black font-bold border-primary shadow-xs"
                              : "bg-[#070b0f] text-muted-foreground hover:text-foreground border-border/60"
                          }`}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-sm">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <Label className="text-muted-foreground">Dĺžka / rozsah prechodu (Spread)</Label>
                      <span className="font-mono text-muted-foreground">{gradientSpreadPercent}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={gradientSpreadPercent}
                        onChange={(e) => setGradientSpreadPercent(Number(e.target.value))}
                        className="flex-1 accent-primary h-2 bg-neutral-800 rounded-lg cursor-pointer"
                      />
                      <Input
                        type="number"
                        min="20"
                        max="100"
                        value={gradientSpreadPercent}
                        onChange={(e) => setGradientSpreadPercent(Number(e.target.value))}
                        className="w-16 h-8 text-xs rounded-md text-center font-mono bg-[#070b0f]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Pattern Live Preview Box */}
            <div className="space-y-1.5 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-primary" />
                  <span>Živý náhľad vzoru na pozadí manuálu:</span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Farba podkladu: {currentTheme.bgColor}
                </span>
              </div>

              <div
                className="relative overflow-hidden rounded-xl border border-border/70 p-6 min-h-[160px] flex items-center justify-center shadow-inner"
                style={{
                  backgroundColor: currentTheme.bgColor,
                }}
              >
                {/* Pattern Canvas */}
                {patternUrl ? (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${patternUrl})`,
                      backgroundRepeat: patternType === "repeat" ? "repeat" : "no-repeat",
                      backgroundSize:
                        patternType === "cover"
                          ? "cover"
                          : patternType === "contain"
                          ? "contain"
                          : patternType === "zoom" || zoomPercent
                          ? `${zoomPercent || 100}%`
                          : "auto",
                      backgroundPosition: previewBgPositionCss,
                      opacity: patternOpacity,
                    }}
                  />
                ) : (
                  <div className="text-xs text-muted-foreground italic text-center z-10">
                    Zvoľte SVG vzor alebo obrázok vyššie pre zobrazenie náhľadu.
                  </div>
                )}

                {/* Gradient Fade Overlay */}
                {patternUrl && previewGradientCss && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: previewGradientCss,
                    }}
                  />
                )}

                {/* Foreground Demo Content Card */}
                {patternUrl && (
                  <div
                    className="relative z-10 px-5 py-3.5 rounded-lg border border-border/60 shadow-lg flex items-center gap-3 max-w-sm w-full"
                    style={{
                      backgroundColor: currentTheme.surfaceColor,
                      color: currentTheme.textColor,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0"
                      style={{
                        backgroundColor: currentTheme.primaryColor,
                        color: currentTheme.isDark ? "#070b0f" : "#0e161d",
                      }}
                    >
                      Aa
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-xs font-bold truncate">Obsah verejného manuálu</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        Vzor a prechod presvitajú cez podklad za týmto obsahom
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Universal Media Picker Modal for Pattern selection */}
      <UniversalMediaPickerModal
        isOpen={isPatternPickerOpen}
        onClose={() => setIsPatternPickerOpen(false)}
        brandId={brandId}
        title="Vybrať vzor alebo textúru"
        description="Vyberte vzor z knižnice vzorov značky alebo z nahraných médií."
        currentUrl={patternUrl}
        acceptedFileTypes="image/*,.svg,.png,.jpg,.jpeg,.webp"
        onSelect={(item) => {
          setPatternUrl(item.url);
          setPatternEnabled(true);
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* SEMANTIC COLORS (Do's & Don'ts)                               */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-4 border-t border-border/30 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {dict.admin.semanticColorsLabel}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Tieto farby sa používajú na systémové označenia a vizuálne akcenty v
            moduloch Do&apos;s &amp; Don&apos;ts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Success */}
          <div className="space-y-2">
            <Label
              htmlFor="semanticSuccess"
              className="text-xs font-semibold text-muted-foreground"
            >
              {dict.admin.semanticSuccess}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={successColor}
                onChange={(e) => setSuccessColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticSuccess"
                name="semanticSuccess"
                value={successColor}
                onChange={(e) => setSuccessColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="space-y-2">
            <Label
              htmlFor="semanticWarning"
              className="text-xs font-semibold text-muted-foreground"
            >
              {dict.admin.semanticWarning}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={warningColor}
                onChange={(e) => setWarningColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticWarning"
                name="semanticWarning"
                value={warningColor}
                onChange={(e) => setWarningColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>

          {/* Danger */}
          <div className="space-y-2">
            <Label
              htmlFor="semanticDanger"
              className="text-xs font-semibold text-muted-foreground"
            >
              {dict.admin.semanticDanger}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={dangerColor}
                onChange={(e) => setDangerColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticDanger"
                name="semanticDanger"
                value={dangerColor}
                onChange={(e) => setDangerColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2">
            <Label
              htmlFor="semanticInfo"
              className="text-xs font-semibold text-muted-foreground"
            >
              {dict.admin.semanticInfo}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={infoColor}
                onChange={(e) => setInfoColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticInfo"
                name="semanticInfo"
                value={infoColor}
                onChange={(e) => setInfoColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="shadow-md cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {dict.admin.saving}
            </>
          ) : (
            dict.admin.saveChanges
          )}
        </Button>
      </div>
    </form>
  );
}
