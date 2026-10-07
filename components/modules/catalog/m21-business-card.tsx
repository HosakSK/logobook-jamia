"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  RotateCw,
  Eye,
  EyeOff,
  Download,
  Settings2,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  FileCode,
  Layers,
  Sparkles,
  Info,
  Sliders,
  Maximize2,
  ExternalLink,
  Printer,
  FileText,
  Loader2,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M21BusinessCardConfig,
  m21BusinessCardSchema,
  M21DownloadItem,
  M21DownloadFormat,
  M21ProductType,
  M21DimensionStandard,
} from "@/lib/validations/modules/m21";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { uploadMediaAction } from "@/actions/media";
import { BrandAsset } from "@/lib/types/asset";

/**
 * Standard dimension presets (in mm)
 */
const DIMENSION_PRESETS: Record<
  M21DimensionStandard,
  { width: number; height: number; bleed: number; safeZone: number; label: string }
> = {
  eu_90_50: {
    width: 90,
    height: 50,
    bleed: 2,
    safeZone: 4,
    label: "EU Štandardná vizitka (90 × 50 mm)",
  },
  eu_85_55: {
    width: 85,
    height: 55,
    bleed: 2,
    safeZone: 4,
    label: "EU Kreditková vizitka (85 × 55 mm)",
  },
  us_89_51: {
    width: 89,
    height: 51,
    bleed: 3,
    safeZone: 4,
    label: "US / Severná Amerika (3.5 × 2 in / 89 × 51 mm)",
  },
  dl_210_99: {
    width: 210,
    height: 99,
    bleed: 3,
    safeZone: 5,
    label: "Leták DL (210 × 99 mm)",
  },
  a6_148_105: {
    width: 148,
    height: 105,
    bleed: 3,
    safeZone: 5,
    label: "Leták / Pohľadnica A6 (148 × 105 mm)",
  },
  a5_210_148: {
    width: 210,
    height: 148,
    bleed: 3,
    safeZone: 5,
    label: "Leták A5 (210 × 148 mm)",
  },
  a4_210_297: {
    width: 210,
    height: 297,
    bleed: 3,
    safeZone: 5,
    label: "Leták / Katalóg A4 (210 × 297 mm)",
  },
  custom: {
    width: 90,
    height: 50,
    bleed: 2,
    safeZone: 4,
    label: "Vlastné rozmery (Custom format)",
  },
};

/**
 * Format badge styles (No trademarked icons, purely typographic badges)
 */
function FormatBadge({ format }: { format: M21DownloadFormat }) {
  switch (format) {
    case "PDF":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40">
          PDF
        </span>
      );
    case "INDD":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-pink-500/20 text-pink-400 border border-pink-500/40">
          INDD
        </span>
      );
    case "IDML":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-teal-500/20 text-teal-400 border border-teal-500/40">
          IDML
        </span>
      );
    case "AI":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
          AI
        </span>
      );
    case "EPS":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          EPS
        </span>
      );
    case "ZIP":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/40">
          ZIP
        </span>
      );
    case "PSD":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40">
          PSD
        </span>
      );
    default:
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-black text-[10px] tracking-wider bg-neutral-800 text-neutral-300 border border-border">
          {format}
        </span>
      );
  }
}

/**
 * Fallback vector artwork for business card front/back if images are not yet uploaded
 */
function BusinessCardMockupFallback({
  side,
  productType,
  isDark = true,
}: {
  side: "face" | "back";
  productType: M21ProductType;
  isDark?: boolean;
}) {
  const logoSymbol = isDark ? "/logo/logo-symbol-light.svg" : "/logo/logo-symbol-dark.svg";

  if (side === "face") {
    return (
      <div
        className={`w-full h-full p-6 flex flex-col justify-between select-none relative overflow-hidden ${
          isDark ? "bg-[#111922] text-white" : "bg-white text-[#0e161d]"
        }`}
      >
        {/* Subtle geometric background line */}
        <div
          className={`absolute -right-10 -bottom-10 w-44 h-44 rounded-full border pointer-events-none ${
            isDark ? "border-white/5" : "border-black/5"
          }`}
        />
        <div className="flex items-center justify-between z-10">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {productType === "business_card" ? "Corporate Identity" : "Print Collateral"}
          </span>
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>

        <div className="flex items-center gap-3 z-10">
          <img
            src={logoSymbol}
            alt="Logo Symbol"
            className="w-10 h-10 object-contain drop-shadow-xs"
          />
          <div>
            <span
              className={`text-base font-bold tracking-tight block ${
                isDark ? "text-white" : "text-[#0e161d]"
              }`}
            >
              Logobook
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest block">
              Design Systems
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground z-10">
          <span>www.logobook.sk</span>
          <span>Bratislava, SK</span>
        </div>
      </div>
    );
  }

  // Back side
  return (
    <div
      className={`w-full h-full p-6 flex flex-col justify-between select-none relative overflow-hidden ${
        isDark ? "bg-[#0a0f14] text-white" : "bg-[#f1f4f7] text-[#0e161d]"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-3 ${
          isDark ? "border-white/10" : "border-black/10"
        }`}
      >
        <div>
          <span
            className={`text-xs font-bold tracking-tight block ${
              isDark ? "text-white" : "text-[#0e161d]"
            }`}
          >
            Alexandr Horváth
          </span>
          <span className="text-[10px] text-primary tracking-wide block font-semibold">
            Brand Identity Designer
          </span>
        </div>
        <img
          src={logoSymbol}
          alt="Symbol"
          className="w-6 h-6 object-contain opacity-80"
        />
      </div>

      <div
        className={`space-y-1 text-[11px] font-mono ${
          isDark ? "text-neutral-300" : "text-neutral-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">M:</span>
          <span>+421 900 123 456</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">E:</span>
          <span>alex@logobook.sk</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">W:</span>
          <span>logobook.sk</span>
        </div>
      </div>

      <div
        className={`flex items-center justify-between text-[9px] font-mono pt-2 border-t ${
          isDark ? "border-white/5 text-muted-foreground" : "border-black/5 text-muted-foreground"
        }`}
      >
        <span>Verified Corporate Template</span>
        <span>CMYK 4/4</span>
      </div>
    </div>
  );
}

export default function M21FiremnaVizitkaModule({
  id: moduleId,
  moduleType = "M21_FiremnaVizitka",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { tokens, resolveRadius, resolveStyles } = useBrandCascade();
  const brandRadius = resolveRadius();
  const isManualDark = tokens.theme?.isDark ?? true;
  const params = useParams();
  const brandId = (params?.brandId as string) || "";

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m21BusinessCardSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      productType: "business_card" as const,
      customProductTitle: undefined,
      previews: {
        face: "",
        back: "",
        orientation: "landscape" as const,
      },
      dimensions: {
        standard: "eu_90_50" as const,
        width: 90,
        height: 50,
        bleed: 2,
        safeZone: 4,
      },
      technicalOverlay: {
        mode: "generated" as const,
        customSvgUrl: null,
        showByDefault: false,
      },
      paperSpecs: {
        recommendedPaper: {
          en: "350g/m² Silk Coated Cardstock with Matte Laminate",
          sk: "350g/m² Krieda matná s matnou Soft-touch lamináciou",
          cs: "350g/m² Křída matná s matnou Soft-touch laminací",
        },
        finishing: {
          en: "Spot UV Varnish on brand logo / icon",
          sk: "Parciálny 3D UV lak na logu / symbole",
          cs: "Parciální 3D UV lak na logu / symbolu",
        },
        colorMode: "CMYK (ISO Coated v2 / Fogra 39)",
      },
      downloads: [],
    };
  }, [config]);

  const [cfg, setCfg] = useState<M21BusinessCardConfig>(parsedConfig);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTechnicalGuides, setShowTechnicalGuides] = useState(
    parsedConfig.technicalOverlay.showByDefault
  );
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"previews" | "dimensions" | "downloads">("previews");
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [uploadingTarget, setUploadingTarget] = useState<"face" | "back" | "custom_svg" | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadModeRef = useRef<"face" | "back" | "custom_svg" | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
    setShowTechnicalGuides(parsedConfig.technicalOverlay.showByDefault);
  }, [parsedConfig]);

  // Load brand assets for image picker
  useEffect(() => {
    if (brandId && isEditor) {
      getBrandAssetsAction(brandId)
        .then((res) => {
          if (res?.success && res.assets) {
            setBrandAssets(res.assets);
          }
        })
        .catch((err) => console.error("Failed to load brand assets in M21:", err));
    }
  }, [brandId, isEditor]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M21BusinessCardConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M21 config:", err);
      }
    }
  };

  // Handle direct file upload
  const handleFileUpload = async (target: "face" | "back" | "custom_svg", file: File) => {
    setUploadingTarget(target);
    try {
      if (brandId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("fileType", target === "custom_svg" ? "ICON" : "IMAGE");
        const res = await uploadMediaAction(brandId, formData);
        if (res.success && res.asset?.fileUrl) {
          if (target === "face" || target === "back") {
            handleSaveConfig({
              ...cfg,
              previews: {
                ...cfg.previews,
                [target]: res.asset.fileUrl,
              },
            });
          } else if (target === "custom_svg") {
            handleSaveConfig({
              ...cfg,
              technicalOverlay: {
                ...cfg.technicalOverlay,
                mode: "custom_svg",
                customSvgUrl: res.asset.fileUrl,
              },
            });
          }
          return;
        }
      }

      // Offline / fallback to local Data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          if (target === "face" || target === "back") {
            handleSaveConfig({
              ...cfg,
              previews: {
                ...cfg.previews,
                [target]: dataUrl,
              },
            });
          } else if (target === "custom_svg") {
            handleSaveConfig({
              ...cfg,
              technicalOverlay: {
                ...cfg.technicalOverlay,
                mode: "custom_svg",
                customSvgUrl: dataUrl,
              },
            });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload image in M21:", err);
    } finally {
      setUploadingTarget(null);
    }
  };

  // Aspect ratio calculation
  const cardAspectRatio = useMemo(() => {
    const w = cfg.dimensions.width || 90;
    const h = cfg.dimensions.height || 50;
    return `${w} / ${h}`;
  }, [cfg.dimensions.width, cfg.dimensions.height]);

  // Gross dimensions (with bleed)
  const grossWidth = cfg.dimensions.width + 2 * cfg.dimensions.bleed;
  const grossHeight = cfg.dimensions.height + 2 * cfg.dimensions.bleed;

  // Title of product type
  const productHeading = useMemo(() => {
    if (cfg.customProductTitle) {
      const custom = resolveI18nText(cfg.customProductTitle, locale);
      if (custom) return custom;
    }
    switch (cfg.productType) {
      case "flyer":
        return locale === "sk" ? "Firemný leták" : locale === "cs" ? "Firemní leták" : "Corporate Flyer";
      case "postcard":
        return locale === "sk" ? "Pohľadnica / Karta" : locale === "cs" ? "Pohlednice / Karta" : "Postcard / Insert Card";
      case "custom":
        return locale === "sk" ? "Tlačový produkt" : locale === "cs" ? "Tiskový produkt" : "Print Product";
      case "business_card":
      default:
        return locale === "sk" ? "Firemná vizitka" : locale === "cs" ? "Firemní vizitka" : "Business Card";
    }
  }, [cfg.productType, cfg.customProductTitle, locale]);

  return (
    <div
      className="relative group/m21 transition-all duration-200"
      style={{
        borderRadius: brandRadius,
        ...resolveStyles(cfg.styleOverrides),
      }}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadModeRef.current) {
            handleFileUpload(uploadModeRef.current, file);
          }
          e.target.value = "";
        }}
      />

      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/m21:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#070b0f] border border-white/20 px-2.5 py-1.5 rounded-[3px] shadow-md">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            title="Konfigurovať vizitku a tlačové podklady"
          >
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            <span>Nastavenia vizitky & tlače</span>
          </button>
        </div>
      )}

      {/* Optional H3 Title */}
      {showH3 && (
        <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {resolveI18nText(h3Title, locale) || productHeading}
          </h3>
        </div>
      )}

      {/* Main 2-Column Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: INTERACTIVE 3D VISUALIZER (~60%)            */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-5">
          {/* Card Presentation Stage */}
          <div className="w-full bg-muted/30 border border-border/50 rounded-xl p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-inner min-h-[320px] sm:min-h-[400px]">
            {/* Stage background grid */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: isManualDark
                  ? "radial-gradient(circle, rgba(255, 255, 255, 0.12) 1px, transparent 1px)"
                  : "radial-gradient(circle, rgba(14, 22, 29, 0.12) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* 3D Perspective Flip Box */}
            <div
              className="relative w-full max-w-[440px] cursor-pointer select-none transition-transform duration-200 hover:scale-[1.01]"
              style={{
                perspective: "1200px",
                aspectRatio: cardAspectRatio,
              }}
              onClick={() => {
                if (cfg.previews.back) {
                  setIsFlipped((prev) => !prev);
                }
              }}
            >
              {/* Flip Inner Container */}
              <div
                className="relative w-full h-full rounded-md shadow-2xl transition-transform duration-700"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  borderRadius: brandRadius,
                }}
              >
                {/* 1. FRONT FACE */}
                <div
                  className="absolute inset-0 w-full h-full overflow-hidden border border-border/60 rounded-md shadow-xl bg-card"
                  style={{
                    backfaceVisibility: "hidden",
                    borderRadius: brandRadius,
                  }}
                >
                  {cfg.previews.face ? (
                    <img
                      src={cfg.previews.face}
                      alt="Front Face"
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <BusinessCardMockupFallback
                      side="face"
                      productType={cfg.productType}
                      isDark={isManualDark}
                    />
                  )}

                  {/* Technical Line Overlay (Front) */}
                  {showTechnicalGuides && (
                    <div className="absolute inset-0 pointer-events-none z-30">
                      {cfg.technicalOverlay.mode === "custom_svg" &&
                      cfg.technicalOverlay.customSvgUrl ? (
                        <img
                          src={cfg.technicalOverlay.customSvgUrl}
                          alt="Technical Overlay"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          {/* Outer dashed line: Bleed boundary */}
                          <div className="absolute inset-1 border border-dashed border-rose-500/70" />
                          {/* Inner dashed line: Safe text boundary */}
                          <div className="absolute inset-4 border border-dotted border-emerald-400/80" />
                          {/* Crop corner crosses */}
                          <div className="absolute top-1 left-1 text-[8px] font-mono text-rose-400 bg-black/60 px-1 rounded-br">
                            BLEED +{cfg.dimensions.bleed}mm
                          </div>
                          <div className="absolute bottom-1 right-1 text-[8px] font-mono text-emerald-400 bg-black/60 px-1 rounded-tl">
                            SAFE ZONE {cfg.dimensions.safeZone}mm
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. BACK FACE */}
                <div
                  className="absolute inset-0 w-full h-full overflow-hidden border border-border/60 rounded-md shadow-xl bg-card"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderRadius: brandRadius,
                  }}
                >
                  {cfg.previews.back ? (
                    <img
                      src={cfg.previews.back}
                      alt="Back Face"
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <BusinessCardMockupFallback
                      side="back"
                      productType={cfg.productType}
                      isDark={isManualDark}
                    />
                  )}

                  {/* Technical Line Overlay (Back) */}
                  {showTechnicalGuides && (
                    <div className="absolute inset-0 pointer-events-none z-30">
                      {cfg.technicalOverlay.mode === "custom_svg" &&
                      cfg.technicalOverlay.customSvgUrl ? (
                        <img
                          src={cfg.technicalOverlay.customSvgUrl}
                          alt="Technical Overlay"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          <div className="absolute inset-1 border border-dashed border-rose-500/70" />
                          <div className="absolute inset-4 border border-dotted border-emerald-400/80" />
                          <div className="absolute top-1 left-1 text-[8px] font-mono text-rose-400 bg-black/60 px-1 rounded-br">
                            BLEED +{cfg.dimensions.bleed}mm
                          </div>
                          <div className="absolute bottom-1 right-1 text-[8px] font-mono text-emerald-400 bg-black/60 px-1 rounded-tl">
                            SAFE ZONE {cfg.dimensions.safeZone}mm
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Click to flip hint */}
            <span className="text-[10px] font-mono text-muted-foreground mt-4 block">
              Tip: Kliknite na vizitku alebo použite prepínač nižšie pre otočenie strán
            </span>
          </div>

          {/* Visualizer Controls Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-card border border-border/60 px-4 py-2.5 rounded-lg shadow-xs">
            {/* Front / Back Flip Switch */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded border border-border/40">
              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  !isFlipped
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Predná strana
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  isFlipped
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Zadná strana
              </button>
            </div>

            {/* Technical Lines Overlay Toggle */}
            <button
              type="button"
              onClick={() => setShowTechnicalGuides((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                showTechnicalGuides
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/40"
                  : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {showTechnicalGuides ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                  <span>Skryť orez & spadávku</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Zobraziť spadávku a orez</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: TECHNICAL SPECIFICATIONS & DOWNLOADS (~40%)*/}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Product Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                {productHeading}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Tlačové špecifikácie
              </span>
            </div>
            <h4 className="text-xl font-bold text-foreground tracking-tight">
              {productHeading}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Normované technické kóty a pripravené otvorené dáta pre tlačiareň a grafické štúdio.
            </p>
          </div>

          {/* Technical Dimensions Table */}
          <div className="bg-card border border-border/60 rounded-lg overflow-hidden divide-y divide-border/40">
            {/* Trim Size */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Čistý formát (Trim Size)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Finálny rozmer po orezaní
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-primary">
                {cfg.dimensions.width} × {cfg.dimensions.height} mm
              </span>
            </div>

            {/* Bleed / Spadávka */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Spadávka (Bleed)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Presah grafiky na orez
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-rose-500">
                +{cfg.dimensions.bleed} mm (Hrubý: {grossWidth} × {grossHeight} mm)
              </span>
            </div>

            {/* Safe Zone */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Bezpečná zóna textu
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Minimálny odstup písma od rezu
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-500">
                {cfg.dimensions.safeZone} mm
              </span>
            </div>

            {/* Color Mode */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Farebný priestor
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Tlačový farebný profil
                </span>
              </div>
              <span className="font-mono text-xs text-foreground font-medium">
                {cfg.paperSpecs.colorMode}
              </span>
            </div>

            {/* Recommended Paper */}
            <div className="p-3.5 space-y-1">
              <span className="text-xs font-bold text-foreground block">
                Odporúčaný papier
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {resolveI18nText(cfg.paperSpecs.recommendedPaper, locale)}
              </p>
            </div>

            {/* Finishing */}
            {resolveI18nText(cfg.paperSpecs.finishing, locale) && (
              <div className="p-3.5 space-y-1">
                <span className="text-xs font-bold text-foreground block">
                  Zušľachtenie & povrchová úprava
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {resolveI18nText(cfg.paperSpecs.finishing, locale)}
                </p>
              </div>
            )}
          </div>

          {/* Downloads Section (Multiple Files Supported) */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono block">
              Súbory a šablóny na stiahnutie:
            </span>

            {cfg.downloads.length === 0 ? (
              <div className="p-4 bg-card border border-border/60 rounded text-center text-xs text-muted-foreground">
                Zatiaľ neboli priložené žiadne šablóny na stiahnutie.
              </div>
            ) : (
              <div className="space-y-2">
                {cfg.downloads.map((dl) => {
                  const labelText = resolveI18nText(dl.label, locale);
                  return (
                    <a
                      key={dl.id}
                      href={dl.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/dl flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 border border-border/60 hover:border-primary/50 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <FormatBadge format={dl.format} />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground group-hover/dl:text-primary transition-colors truncate block">
                            {labelText}
                          </span>
                          {dl.fileSize && (
                            <span className="text-[10px] font-mono text-muted-foreground block">
                              Veľkosť: {dl.fileSize}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium">
                        <Download className="w-4 h-4" />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADMIN SETTINGS MODAL / SHEET                             */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
          <div
            className="w-full max-w-3xl bg-[#0e161d] border border-white/15 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#fafbfc]"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-[#fafbfc] text-sm tracking-tight">
                  Nastavenia vizitky a tlačovín (M21)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-white/10 bg-[#070b0f] px-5 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTab("previews")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "previews"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Náhľady & Vodiace čiary</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("dimensions")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "dimensions"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Rozmery & Papier</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("downloads")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "downloads"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Súbory na stiahnutie ({cfg.downloads.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: PREVIEWS & TECHNICAL OVERLAY */}
              {modalTab === "previews" && (
                <div className="space-y-6">
                  {/* Front & Back Images */}
                  <div className="bg-[#17212a] border border-white/10 rounded p-4 space-y-4">
                    <h4 className="font-semibold text-[#fafbfc] text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Grafické náhľady strán (JPG / PNG)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Front Face */}
                      <div className="space-y-2 bg-[#070b0f] p-3 rounded border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#fafbfc]">
                            Predná strana (Face)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              uploadModeRef.current = "face";
                              fileInputRef.current?.click();
                            }}
                            className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                          >
                            {uploadingTarget === "face" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            <span>Nahrať JPG/PNG</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="https://... URL obrázka prednej strany"
                          value={cfg.previews.face}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              previews: { ...cfg.previews, face: e.target.value },
                            })
                          }
                          className="w-full bg-[#17212a] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* Back Face */}
                      <div className="space-y-2 bg-[#070b0f] p-3 rounded border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#fafbfc]">
                            Zadná strana (Back)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              uploadModeRef.current = "back";
                              fileInputRef.current?.click();
                            }}
                            className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                          >
                            {uploadingTarget === "back" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            <span>Nahrať JPG/PNG</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="https://... URL obrázka zadnej strany"
                          value={cfg.previews.back || ""}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              previews: { ...cfg.previews, back: e.target.value },
                            })
                          }
                          className="w-full bg-[#17212a] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Technical Overlay Configuration */}
                  <div className="bg-[#17212a] border border-white/10 rounded p-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-primary" />
                        <span>Vodiace orezové čiary (Spadávka a bezpečné zóny)</span>
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Môžete použiť automaticky prepočítané vodiace čiary, alebo nahrať vlastný SVG
                        výkres (dieline) s technickými čiarami výseku a orezu.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Mode selector */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveConfig({
                              ...cfg,
                              technicalOverlay: {
                                ...cfg.technicalOverlay,
                                mode: "generated",
                              },
                            })
                          }
                          className={`p-3 rounded border text-left transition-all ${
                            cfg.technicalOverlay.mode === "generated"
                              ? "border-primary bg-primary/10 text-[#fafbfc] ring-1 ring-primary/40"
                              : "border-white/10 text-[#96abbe] hover:text-[#fafbfc] bg-[#070b0f]"
                          }`}
                        >
                          <span className="font-bold text-xs block">
                            Automaticky generované čiary
                          </span>
                          <span className="text-[10px] text-[#96abbe]">
                            Podľa zadaných hodnôt mm spadávky a bezpečnej zóny
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSaveConfig({
                              ...cfg,
                              technicalOverlay: {
                                ...cfg.technicalOverlay,
                                mode: "custom_svg",
                              },
                            })
                          }
                          className={`p-3 rounded border text-left transition-all ${
                            cfg.technicalOverlay.mode === "custom_svg"
                              ? "border-primary bg-primary/10 text-[#fafbfc] ring-1 ring-primary/40"
                              : "border-white/10 text-[#96abbe] hover:text-[#fafbfc] bg-[#070b0f]"
                          }`}
                        >
                          <span className="font-bold text-xs block">
                            Vlastné technické SVG čiary
                          </span>
                          <span className="text-[10px] text-[#96abbe]">
                            Nahratie vlastného vektorového súboru dieline
                          </span>
                        </button>
                      </div>

                      {/* Custom SVG upload if mode is custom_svg */}
                      {cfg.technicalOverlay.mode === "custom_svg" && (
                        <div className="p-3 bg-[#070b0f] border border-white/15 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#fafbfc]">
                              Súbor vlastných SVG vodiacich čiar:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                uploadModeRef.current = "custom_svg";
                                fileInputRef.current?.click();
                              }}
                              className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              {uploadingTarget === "custom_svg" ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              <span>Nahrať SVG súbor</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="https://... URL adresa vlastného SVG výkresu"
                            value={cfg.technicalOverlay.customSvgUrl || ""}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                technicalOverlay: {
                                  ...cfg.technicalOverlay,
                                  customSvgUrl: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-[#17212a] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Default active toggle */}
                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-white/10 cursor-pointer">
                        <span className="text-xs text-[#fafbfc] font-medium">
                          Zobraziť technické čiary predvolene zapnuté pri načítaní stránky
                        </span>
                        <input
                          type="checkbox"
                          checked={cfg.technicalOverlay.showByDefault}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              technicalOverlay: {
                                ...cfg.technicalOverlay,
                                showByDefault: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-white/20 bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DIMENSIONS & PAPER SPECS */}
              {modalTab === "dimensions" && (
                <div className="space-y-6">
                  {/* Product Type & Presets */}
                  <div className="bg-[#17212a] border border-white/10 rounded p-4 space-y-4">
                    <h4 className="font-semibold text-[#fafbfc] text-xs flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-primary" />
                      <span>Typ tlačového produktu & Normovaný štandard</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Product Type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#fafbfc] block">
                          Druh tlačoviny:
                        </label>
                        <select
                          value={cfg.productType}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              productType: e.target.value as M21ProductType,
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                        >
                          <option value="business_card">Vizitka (Business Card)</option>
                          <option value="flyer">Leták (Flyer / Folder)</option>
                          <option value="postcard">Pohľadnica / Karta (Postcard)</option>
                          <option value="custom">Vlastný formát tlačoviny (Custom)</option>
                        </select>
                      </div>

                      {/* Dimension Standard Preset */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#fafbfc] block">
                          Formátový preset:
                        </label>
                        <select
                          value={cfg.dimensions.standard}
                          onChange={(e) => {
                            const std = e.target.value as M21DimensionStandard;
                            const preset = DIMENSION_PRESETS[std];
                            handleSaveConfig({
                              ...cfg,
                              dimensions: {
                                standard: std,
                                width: preset ? preset.width : cfg.dimensions.width,
                                height: preset ? preset.height : cfg.dimensions.height,
                                bleed: preset ? preset.bleed : cfg.dimensions.bleed,
                                safeZone: preset ? preset.safeZone : cfg.dimensions.safeZone,
                              },
                            });
                          }}
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                        >
                          <option value="eu_90_50">EU Vizitka: 90 × 50 mm</option>
                          <option value="eu_85_55">EU Kreditka: 85 × 55 mm</option>
                          <option value="us_89_51">US Vizitka: 89 × 51 mm (3.5 × 2")</option>
                          <option value="dl_210_99">Leták DL: 210 × 99 mm</option>
                          <option value="a6_148_105">Leták A6: 148 × 105 mm</option>
                          <option value="a5_210_148">Leták A5: 210 × 148 mm</option>
                          <option value="a4_210_297">Leták A4: 210 × 297 mm</option>
                          <option value="custom">Vlastné rozmery...</option>
                        </select>
                      </div>

                      {/* Custom Title if product is custom */}
                      {cfg.productType === "custom" && (
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-[#fafbfc] block">
                            Vlastný názov produktu:
                          </label>
                          <input
                            type="text"
                            placeholder="napr. Darčekový poukaz DL alebo Visačka"
                            value={
                              typeof cfg.customProductTitle === "object"
                                ? cfg.customProductTitle.sk || cfg.customProductTitle.en || ""
                                : cfg.customProductTitle || ""
                            }
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                customProductTitle: {
                                  en: e.target.value,
                                  sk: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-[#070b0f] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Numeric Dimension Inputs (in mm) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          Šírka (mm):
                        </label>
                        <input
                          type="number"
                          value={cfg.dimensions.width}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              dimensions: {
                                ...cfg.dimensions,
                                standard: "custom",
                                width: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          Výška (mm):
                        </label>
                        <input
                          type="number"
                          value={cfg.dimensions.height}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              dimensions: {
                                ...cfg.dimensions,
                                standard: "custom",
                                height: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          Spadávka / Bleed (mm):
                        </label>
                        <input
                          type="number"
                          value={cfg.dimensions.bleed}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              dimensions: {
                                ...cfg.dimensions,
                                bleed: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          Bezpečná zóna (mm):
                        </label>
                        <input
                          type="number"
                          value={cfg.dimensions.safeZone}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              dimensions: {
                                ...cfg.dimensions,
                                safeZone: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Paper Specs & Color Profile */}
                  <div className="bg-[#17212a] border border-white/10 rounded p-4 space-y-4">
                    <h4 className="font-semibold text-[#fafbfc] text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Odporúčaný papier a profil tlače</span>
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#fafbfc] block">
                          Odporúčaný papier / gramáž:
                        </label>
                        <input
                          type="text"
                          value={
                            typeof cfg.paperSpecs.recommendedPaper === "object"
                              ? cfg.paperSpecs.recommendedPaper.sk ||
                                cfg.paperSpecs.recommendedPaper.en ||
                                ""
                              : cfg.paperSpecs.recommendedPaper || ""
                          }
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              paperSpecs: {
                                ...cfg.paperSpecs,
                                recommendedPaper: {
                                  en: e.target.value,
                                  sk: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#fafbfc] block">
                          Zušľachtenie & laminácia (voliteľné):
                        </label>
                        <input
                          type="text"
                          value={
                            typeof cfg.paperSpecs.finishing === "object"
                              ? cfg.paperSpecs.finishing.sk || cfg.paperSpecs.finishing.en || ""
                              : cfg.paperSpecs.finishing || ""
                          }
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              paperSpecs: {
                                ...cfg.paperSpecs,
                                finishing: {
                                  en: e.target.value,
                                  sk: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#fafbfc] block">
                          Farebný profil (Color Mode):
                        </label>
                        <input
                          type="text"
                          value={cfg.paperSpecs.colorMode}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              paperSpecs: {
                                ...cfg.paperSpecs,
                                colorMode: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DOWNLOADS MANAGER */}
              {modalTab === "downloads" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs">
                        Tlačové šablóny a otvorené dáta
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Poskytnite tlačiarni a grafickému štúdiu hotové tlačové PDF a otvorené súbory
                        InDesign alebo Illustrator.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newDl: M21DownloadItem = {
                          id: `dl-${Date.now()}`,
                          format: "PDF",
                          url: "",
                          label: {
                            en: "New Print Template",
                            sk: "Nová tlačová šablóna",
                          },
                          fileSize: "1.0 MB",
                        };
                        handleSaveConfig({
                          ...cfg,
                          downloads: [...cfg.downloads, newDl],
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pridať súbor</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cfg.downloads.map((dl, index) => (
                      <div
                        key={dl.id}
                        className="bg-[#17212a] border border-white/10 rounded p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#fafbfc]">
                              Súbor #{index + 1}
                            </span>
                            <FormatBadge format={dl.format} />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = cfg.downloads.filter((_, i) => i !== index);
                              handleSaveConfig({ ...cfg, downloads: updated });
                            }}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Zmazať šablónu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Format Selector */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Formát súboru:
                            </label>
                            <select
                              value={dl.format}
                              onChange={(e) => {
                                const updated = [...cfg.downloads];
                                updated[index] = {
                                  ...updated[index],
                                  format: e.target.value as M21DownloadFormat,
                                };
                                handleSaveConfig({ ...cfg, downloads: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            >
                              <option value="PDF">PDF (Print-ready)</option>
                              <option value="INDD">INDD (Adobe InDesign Package)</option>
                              <option value="IDML">IDML (InDesign Markup)</option>
                              <option value="AI">AI (Adobe Illustrator)</option>
                              <option value="EPS">EPS (Vector)</option>
                              <option value="ZIP">ZIP (Kompletný balíček)</option>
                              <option value="PSD">PSD (Photoshop)</option>
                            </select>
                          </div>

                          {/* Label */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Názov tlačidla:
                            </label>
                            <input
                              type="text"
                              value={
                                typeof dl.label === "object"
                                  ? dl.label.sk || dl.label.en || ""
                                  : dl.label
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.downloads];
                                updated[index] = {
                                  ...updated[index],
                                  label: { en: val, sk: val },
                                };
                                handleSaveConfig({ ...cfg, downloads: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* URL */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              URL adresa na stiahnutie:
                            </label>
                            <input
                              type="text"
                              placeholder="https://r2.../card-template.zip"
                              value={dl.url}
                              onChange={(e) => {
                                const updated = [...cfg.downloads];
                                updated[index] = {
                                  ...updated[index],
                                  url: e.target.value,
                                };
                                handleSaveConfig({ ...cfg, downloads: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* File Size */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Veľkosť (voliteľné):
                            </label>
                            <input
                              type="text"
                              placeholder="napr. 4.2 MB"
                              value={dl.fileSize || ""}
                              onChange={(e) => {
                                const updated = [...cfg.downloads];
                                updated[index] = {
                                  ...updated[index],
                                  fileSize: e.target.value,
                                };
                                handleSaveConfig({ ...cfg, downloads: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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
