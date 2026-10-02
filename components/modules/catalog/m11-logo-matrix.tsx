"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Filter,
  Layers,
  Copy,
  Check,
  Download,
  ExternalLink,
  Settings2,
  FileCode,
  Sparkles,
  Info,
  RotateCcw,
  Sliders,
  X,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M11LogoMatrixConfig,
  m11LogoMatrixSchema,
  M11FilterAxis,
} from "@/lib/validations/modules/m11";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { BrandAsset } from "@/lib/types/asset";

interface MatrixLogoItem {
  id: string;
  name: string;
  svgUrl: string;
  mockupImageUrl?: string;
  backgroundColor: string;
  medium: "cmyk" | "pantone" | "mono" | "wb" | "rgb" | "universal";
  orientation: "horizontal" | "vertical" | "symbol";
  hasClaim: boolean;
  backgroundType: "light" | "dark" | "brand" | "monochrome";
  formats: Array<{
    format: "SVG" | "PDF" | "EPS" | "AI" | "PNG" | "JPG";
    url: string;
  }>;
}

// Format badges
const FORMAT_PILLS: Record<string, { label: string; colorClass: string }> = {
  SVG: { label: "SVG", colorClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  PDF: { label: "PDF", colorClass: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  EPS: { label: "EPS", colorClass: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  AI: { label: "AI", colorClass: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  PNG: { label: "PNG", colorClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  JPG: { label: "JPG", colorClass: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30" },
};

// 6 default demo logos if brand has none
const DEMO_LOGOS: MatrixLogoItem[] = [
  {
    id: "demo-1",
    name: "Primárne horizontálne logo (RGB)",
    svgUrl: "/logo/Logobook_logo_width_RGB_D.svg",
    mockupImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80",
    backgroundColor: "#fafbfc",
    medium: "rgb",
    orientation: "horizontal",
    hasClaim: false,
    backgroundType: "light",
    formats: [
      { format: "SVG", url: "/logo/Logobook_logo_width_RGB_D.svg" },
      { format: "PNG", url: "#" },
      { format: "PDF", url: "#" },
    ],
  },
  {
    id: "demo-2",
    name: "Horizontálne inverzné logo (RGB)",
    svgUrl: "/logo/Logobook_logo_width_RGB_W.svg",
    mockupImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    backgroundColor: "#070b0f",
    medium: "rgb",
    orientation: "horizontal",
    hasClaim: false,
    backgroundType: "dark",
    formats: [
      { format: "SVG", url: "/logo/Logobook_logo_width_RGB_W.svg" },
      { format: "PNG", url: "#" },
    ],
  },
  {
    id: "demo-3",
    name: "Tlačové ofsetové logo (CMYK)",
    svgUrl: "/logo/Logobook_logo_width_RGB_D.svg",
    mockupImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
    backgroundColor: "#fafbfc",
    medium: "cmyk",
    orientation: "horizontal",
    hasClaim: false,
    backgroundType: "light",
    formats: [
      { format: "PDF", url: "#" },
      { format: "EPS", url: "#" },
    ],
  },
  {
    id: "demo-4",
    name: "Vertikálna kompozícia loga",
    svgUrl: "/logo/Logobook_symbol_RGB_D.svg",
    mockupImageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    backgroundColor: "#fafbfc",
    medium: "universal",
    orientation: "vertical",
    hasClaim: false,
    backgroundType: "light",
    formats: [
      { format: "SVG", url: "/logo/Logobook_symbol_RGB_D.svg" },
      { format: "PNG", url: "#" },
      { format: "PDF", url: "#" },
    ],
  },
  {
    id: "demo-5",
    name: "Samostatný symbol / Ikona",
    svgUrl: "/logo/Logobook_symbol_RGB_D.svg",
    mockupImageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    backgroundColor: "#c8d400",
    medium: "universal",
    orientation: "symbol",
    hasClaim: false,
    backgroundType: "brand",
    formats: [
      { format: "SVG", url: "/logo/Logobook_symbol_RGB_D.svg" },
      { format: "PNG", url: "#" },
    ],
  },
  {
    id: "demo-6",
    name: "Logo s claimom / Sloganom",
    svgUrl: "/logo/Logobook_logo_width_RGB_D.svg",
    mockupImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    backgroundColor: "#fafbfc",
    medium: "rgb",
    orientation: "horizontal",
    hasClaim: true,
    backgroundType: "light",
    formats: [
      { format: "SVG", url: "/logo/Logobook_logo_width_RGB_D.svg" },
      { format: "PNG", url: "#" },
      { format: "PDF", url: "#" },
    ],
  },
];

export default function M11MaticaLogotypovModule({
  id: moduleId,
  moduleType = "M11_MaticaLogotypov",
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
    const res = m11LogoMatrixSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      dataSource: "auto" as const,
      allowedFilters: ["medium", "orientation", "claim", "background"] as M11FilterAxis[],
      defaultView: {
        medium: "all" as const,
        orientation: "all" as const,
        claim: "all" as const,
        background: "all" as const,
      },
      columns: 3,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M11LogoMatrixConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Active Filter state
  const [mediumFilter, setMediumFilter] = useState<string>(parsedConfig.defaultView.medium);
  const [orientationFilter, setOrientationFilter] = useState<string>(parsedConfig.defaultView.orientation);
  const [claimFilter, setClaimFilter] = useState<string>(parsedConfig.defaultView.claim);
  const [backgroundFilter, setBackgroundFilter] = useState<string>(parsedConfig.defaultView.background);

  // Copy SVG state tracking per card ID
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Loaded brand assets
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load brand assets
  useEffect(() => {
    if (brandId) {
      setIsLoadingAssets(true);
      getBrandAssetsAction(brandId)
        .then((res) => {
          if (res.success && res.assets) setBrandAssets(res.assets);
        })
        .catch((err) => console.error("Error loading brand assets for matrix:", err))
        .finally(() => setIsLoadingAssets(false));
    }
  }, [brandId]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M11LogoMatrixConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M11 config:", err);
      }
    }
  };

  // Build matrix logo list from brand assets (or fallback to demo items)
  const allLogos = useMemo<MatrixLogoItem[]>(() => {
    if (brandAssets.length === 0) return DEMO_LOGOS;

    const medMap: Record<string, string> = {
      DIGITAL_RGB: "rgb",
      PRINT_CMYK: "cmyk",
      PRINT_PANTONE: "pantone",
      PRINT_MONOCHROME: "mono",
      PRINT_WB: "wb",
      UNIVERSAL: "universal",
    };
    const oriMap: Record<string, "horizontal" | "vertical" | "symbol"> = {
      HORIZONTAL: "horizontal",
      VERTICAL: "vertical",
      SYMBOL: "symbol",
    };
    const bgMap: Record<string, "light" | "dark"> = {
      LIGHT: "light",
      DARK: "dark",
      BRAND: "dark",
      MONOCHROME: "dark",
      INVERSE: "dark",
      TRANSPARENT: "light",
    };

    return brandAssets.map((asset) => {
      const bg = bgMap[asset.background] || "light";
      const svgUrl =
        asset.previewUrl ||
        asset.files.find((f) => f.fileFormat === "SVG")?.fileUrl ||
        "/logo/Logobook_symbol_RGB_D.svg";

      const formats: MatrixLogoItem["formats"] = asset.files.map((f) => ({
        format: (f.fileFormat as any) || "SVG",
        url: f.fileUrl || "",
      }));

      const name =
        typeof asset.name === "object"
          ? resolveI18nText(asset.name, locale) || "Logo"
          : asset.name || "Logo";

      return {
        id: asset.id,
        name,
        svgUrl,
        backgroundColor: bg === "dark" ? "#0e161d" : "#fafbfc",
        medium: (medMap[asset.medium] as any) || "universal",
        orientation: oriMap[asset.orientation] || "horizontal",
        hasClaim: asset.hasClaim ?? false,
        backgroundType: bg,
        formats: formats.length > 0 ? formats : [{ format: "SVG", url: svgUrl }],
      };
    });
  }, [brandAssets, locale, tokens]);

  // Filtered logo list
  const filteredLogos = useMemo(() => {
    return allLogos.filter((logo) => {
      if (mediumFilter !== "all" && logo.medium !== mediumFilter && logo.medium !== "universal") {
        return false;
      }
      if (orientationFilter !== "all" && logo.orientation !== orientationFilter) {
        return false;
      }
      if (claimFilter !== "all") {
        if (claimFilter === "with_claim" && !logo.hasClaim) return false;
        if (claimFilter === "no_claim" && logo.hasClaim) return false;
      }
      if (backgroundFilter !== "all" && logo.backgroundType !== backgroundFilter) {
        return false;
      }
      return true;
    });
  }, [allLogos, mediumFilter, orientationFilter, claimFilter, backgroundFilter]);

  // Check if any filter is active
  const isAnyFilterActive =
    mediumFilter !== "all" ||
    orientationFilter !== "all" ||
    claimFilter !== "all" ||
    backgroundFilter !== "all";

  // Reset filters
  const handleResetFilters = () => {
    setMediumFilter("all");
    setOrientationFilter("all");
    setClaimFilter("all");
    setBackgroundFilter("all");
  };

  // Copy SVG to clipboard
  const handleCopySvg = async (item: MatrixLogoItem) => {
    if (!item.svgUrl) return;
    try {
      const res = await fetch(item.svgUrl);
      if (res.ok) {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (e) {
      console.error("Failed to copy SVG:", e);
    }
  };

  // Grid columns class resolver
  const gridColsClass = useMemo(() => {
    switch (cfg.columns) {
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      case 3:
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  }, [cfg.columns]);

  return (
    <div className="relative group/m11 py-4 space-y-6">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-2">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m11:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#17212a] border border-border/80 rounded-[3px] p-1 shadow-xl text-xs whitespace-nowrap">
          {/* Columns Selector */}
          <div className="flex items-center border-r border-border/50 pr-1 mr-1">
            <span className="text-[10px] text-muted-foreground px-1 font-mono uppercase">Stĺpce:</span>
            {[2, 3, 4].map((col) => (
              <button
                key={col}
                type="button"
                title={`${col} stĺpce`}
                onClick={() => handleSaveConfig({ ...cfg, columns: col })}
                className={`px-1.5 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors ${
                  cfg.columns === col
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                }`}
              >
                {col}
              </button>
            ))}
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary/20 hover:bg-primary/30 text-primary font-semibold text-xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Nastavenia filtrov</span>
          </button>
        </div>
      )}

      {/* Admin Information Banner */}
      {isEditor && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-[3px] bg-[#17212a] border border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>
              <strong>Dynamická matica logotypov (M11):</strong> Automaticky agreguje logá z
              modulov M07 a knižnice surových lôg značky.
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-neutral-900 px-2 py-0.5 rounded border border-border/40">
            {allLogos.length} logotypov v databáze
          </span>
        </div>
      )}

      {/* FILTER BAR CONTAINER */}
      <div
        className="bg-[#0e161d] border border-border/60 p-4 sm:p-5 shadow-xs space-y-3.5"
        style={{ borderRadius: brandRadius }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filter matice logotypov</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-muted-foreground">
              Zobrazených <strong>{filteredLogos.length}</strong> z {allLogos.length} variantov
            </span>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset filtrov</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Axes Groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Axis 1: Medium */}
          {cfg.allowedFilters.includes("medium") && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold block">
                Médium:
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "Všetky" },
                  { id: "cmyk", label: "CMYK (Tlač)" },
                  { id: "pantone", label: "Pantone (Tlač)" },
                  { id: "mono", label: "Monochróm (Tlač)" },
                  { id: "wb", label: "Čiernobiela / WB (Tlač)" },
                  { id: "rgb", label: "RGB (Digitál)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMediumFilter(item.id)}
                    className={`px-2 py-1 rounded-[2px] text-[11px] transition-colors ${
                      mediumFilter === item.id
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-[#17212a] text-muted-foreground hover:text-foreground hover:bg-[#1f2c36]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Axis 2: Orientation */}
          {cfg.allowedFilters.includes("orientation") && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold block">
                Orientácia:
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "Všetky" },
                  { id: "horizontal", label: "Na šírku (width)" },
                  { id: "vertical", label: "Na výšku (height)" },
                  { id: "symbol", label: "Symbol" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOrientationFilter(item.id)}
                    className={`px-2 py-1 rounded-[2px] text-[11px] transition-colors ${
                      orientationFilter === item.id
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-[#17212a] text-muted-foreground hover:text-foreground hover:bg-[#1f2c36]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Axis 3: Slogan / Claim */}
          {cfg.allowedFilters.includes("claim") && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold block">
                Slogan / Claim:
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "Všetky" },
                  { id: "with_claim", label: "S claimom" },
                  { id: "no_claim", label: "Bez claimu" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setClaimFilter(item.id)}
                    className={`px-2 py-1 rounded-[2px] text-[11px] transition-colors ${
                      claimFilter === item.id
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-[#17212a] text-muted-foreground hover:text-foreground hover:bg-[#1f2c36]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Axis 4: Background */}
          {cfg.allowedFilters.includes("background") && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold block">
                Podklad:
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "Všetky" },
                  { id: "light", label: "Svetlý podklad" },
                  { id: "dark", label: "Tmavý podklad" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBackgroundFilter(item.id)}
                    className={`px-2 py-1 rounded-[2px] text-[11px] transition-colors ${
                      backgroundFilter === item.id
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "bg-[#17212a] text-muted-foreground hover:text-foreground hover:bg-[#1f2c36]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CARDS GRID */}
      {filteredLogos.length === 0 ? (
        <div
          className="border-2 border-dashed border-border/60 p-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2"
          style={{ borderRadius: brandRadius }}
        >
          <Info className="w-6 h-6 opacity-40 text-primary" />
          <span>Žiadne logotypy nevyhovujú aktuálne zvoleným filtrom.</span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-2 px-3 py-1.5 rounded bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90"
          >
            Obnoviť filtre
          </button>
        </div>
      ) : (
        <div className={`grid gap-5 sm:gap-6 ${gridColsClass}`}>
          {filteredLogos.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-[#0e161d] border border-border/60 p-4 shadow-sm flex flex-col justify-between space-y-4 group/card hover:border-border transition-all duration-200"
                style={{ borderRadius: brandRadius }}
              >
                {/* Visual Preview Box with Hover Reveal */}
                <div
                  className="relative w-full aspect-4/3 rounded-[3px] border border-border/40 overflow-hidden flex items-center justify-center select-none group/box transition-all"
                  style={{ backgroundColor: item.backgroundColor }}
                >
                  {/* Base SVG Vector */}
                  <img
                    src={item.svgUrl}
                    alt={item.name}
                    className="max-w-[70%] max-h-[70%] object-contain transition-transform duration-300 group-hover/box:scale-105"
                  />

                  {/* Mockup Overlay if available (fades out on hover) */}
                  {item.mockupImageUrl && (
                    <img
                      src={item.mockupImageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 group-hover/box:opacity-0 pointer-events-none"
                    />
                  )}

                  {/* Copy SVG Action Pill (only for real SVG items) */}
                  {item.svgUrl && !item.svgUrl.includes(".png") && !item.svgUrl.includes(".webp") && (
                    <button
                      type="button"
                      onClick={() => handleCopySvg(item)}
                      className="absolute bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-[2px] bg-[#070b0f]/80 hover:bg-black text-foreground border border-border/60 text-[10px] font-medium backdrop-blur-xs transition-colors shadow-sm"
                      title="Kopírovať SVG kód"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-primary" />
                          <span className="text-primary font-bold">Skopírované!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-muted-foreground" />
                          <span>Kopírovať SVG</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Info & Metadata */}
                <div className="space-y-2">
                  <span className="font-semibold text-foreground text-xs block truncate" title={item.name}>
                    {item.name}
                  </span>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono text-muted-foreground uppercase">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-border/40">
                      {item.medium}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-border/40">
                      {item.orientation}
                    </span>
                    {item.hasClaim && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-border/40">
                        Claim
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-border/40">
                      {item.backgroundType}
                    </span>
                  </div>
                </div>

                {/* Formats Download Bar */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1">
                  <span className="text-[10px] text-muted-foreground font-mono">Formáty:</span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {item.formats.map((fmt, idx) => {
                      const pill = FORMAT_PILLS[fmt.format] || {
                        label: fmt.format,
                        colorClass: "bg-neutral-800 text-foreground border-border",
                      };
                      return (
                        <a
                          key={idx}
                          href={fmt.url || "#"}
                          download
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-opacity hover:opacity-80 ${pill.colorClass}`}
                          title={`Stiahnuť ${fmt.format}`}
                        >
                          {pill.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div
            className="bg-[#0e161d] border border-border/80 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nastavenia matice logotypov (M11)
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

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Allowed Filters Toggles */}
              <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-3">
                <span className="font-semibold text-foreground text-xs block">
                  Zobrazené filtre v hornej lište
                </span>
                <div className="space-y-2">
                  {(
                    [
                      { id: "medium", label: "Médium (CMYK / RGB)" },
                      { id: "orientation", label: "Orientácia (Šírka / Výška / Symbol)" },
                      { id: "claim", label: "Slogan / Claim (S claimom / Bez claimu)" },
                      { id: "background", label: "Podklad (Svetlý / Tmavý / Brand)" },
                    ] as const
                  ).map((f) => {
                    const isChecked = cfg.allowedFilters.includes(f.id);
                    return (
                      <label key={f.id} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...cfg.allowedFilters, f.id]
                              : cfg.allowedFilters.filter((x) => x !== f.id);
                            handleSaveConfig({ ...cfg, allowedFilters: updated });
                          }}
                          className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                        />
                        <span className="text-foreground text-[11px]">{f.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Columns Selector */}
              <div className="bg-[#17212a] p-4 rounded-[3px] border border-border/40 space-y-2">
                <span className="font-semibold text-foreground text-xs block">
                  Počet stĺpcov mriežky na desktope
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleSaveConfig({ ...cfg, columns: col })}
                      className={`p-2 rounded border text-center transition-colors ${
                        cfg.columns === col
                          ? "bg-primary text-primary-foreground font-bold border-primary"
                          : "bg-[#0e161d] border-border/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {col} stĺpce
                    </button>
                  ))}
                </div>
              </div>
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
