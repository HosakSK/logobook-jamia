"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import JSZip from "jszip";
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Settings2,
  FolderArchive,
  Plus,
  Trash2,
  FileCode,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Loader2,
  X,
  Layers,
  Database,
  Info,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M07AssetViewerConfig,
  M07FormatItem,
  m07AssetViewerSchema,
  DEFAULT_FORMAT_DESCRIPTIONS,
} from "@/lib/validations/modules/m07";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { getBrandMediaAction } from "@/actions/media";
import { BrandAsset } from "@/lib/types/asset";
import { MediaAsset } from "@/lib/types/media";

// Format visual badges configuration
const FORMAT_BADGES: Record<string, { label: string; colorClass: string }> = {
  SVG: { label: ".SVG", colorClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  PDF: { label: ".PDF", colorClass: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  EPS: { label: ".EPS", colorClass: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  AI: { label: ".AI", colorClass: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  PNG: { label: ".PNG", colorClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  JPG: { label: ".JPG", colorClass: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30" },
};

export default function M07ZobrazenieLogaModule({
  id: moduleId,
  moduleType = "M07_ZobrazenieLoga",
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

  // Safe parse config with sensible defaults
  const parsedConfig = useMemo(() => {
    const res = m07AssetViewerSchema.safeParse(config);
    if (res.success && res.data.formats && res.data.formats.length > 0) {
      return res.data;
    }
    // Seed initial demo data if empty
    return {
      sourceMode: "library" as const,
      assetId: null,
      meta: {
        medium: "universal" as const,
        orientation: "horizontal" as const,
        hasClaim: false,
        backgroundType: "light" as const,
      },
      directPreview: {
        svgUrl: "/logo/Logobook_symbol_RGB_D.svg",
        mockupImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        backgroundColor: "transparent",
        showCopySvg: true,
      },
      formats: [
        {
          id: "fmt-1",
          format: "SVG" as const,
          storageType: "LOGOBOOK_R2" as const,
          url: "/logo/Logobook_symbol_RGB_D.svg",
          fileName: "logo-vector.svg",
        },
        {
          id: "fmt-2",
          format: "PDF" as const,
          storageType: "LOGOBOOK_R2" as const,
          url: "#",
          fileName: "logo-print.pdf",
        },
        {
          id: "fmt-3",
          format: "PNG" as const,
          storageType: "LOGOBOOK_R2" as const,
          url: "#",
          fileName: "logo-transparent.png",
        },
        {
          id: "fmt-4",
          format: "EPS" as const,
          storageType: "EXTERNAL_LINK" as const,
          url: "https://drive.google.com",
          fileName: "logo-cmyk.eps",
        },
      ],
      downloadAll: {
        enabled: true,
        mode: "zip_client" as const,
        url: "",
      },
    };
  }, [config]);

  const [cfg, setCfg] = useState<M07AssetViewerConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"preview" | "formats" | "meta">("preview");

  // Copy SVG state
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Data loaded for modal
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [brandMedia, setBrandMedia] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load assets and media when modal opens
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
  const handleSaveConfig = async (newConfig: M07AssetViewerConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M07 config:", err);
      }
    }
  };

  // Copy SVG to clipboard
  const handleCopySvg = async () => {
    if (!cfg.directPreview.svgUrl) return;
    try {
      const res = await fetch(cfg.directPreview.svgUrl);
      if (res.ok) {
        const svgContent = await res.text();
        await navigator.clipboard.writeText(svgContent);
        setCopiedSvg(true);
        setTimeout(() => setCopiedSvg(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy SVG content:", err);
    }
  };

  // Client-side ZIP Download
  const handleDownloadAllZip = async () => {
    if (cfg.downloadAll.mode === "external_link" && cfg.downloadAll.url) {
      window.open(cfg.downloadAll.url, "_blank");
      return;
    }

    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder("logo_assets") || zip;

      // Add each valid URL file into zip
      const fetchPromises = cfg.formats
        .filter((f) => f.url && f.url !== "#" && f.storageType === "LOGOBOOK_R2")
        .map(async (f) => {
          try {
            const resp = await fetch(f.url);
            if (!resp.ok) return;
            const blob = await resp.blob();
            const fileName = f.fileName || `logo_${f.format.toLowerCase()}.${f.format.toLowerCase()}`;
            folder.file(fileName, blob);
          } catch (e) {
            console.error(`Failed to fetch file for zip: ${f.url}`, e);
          }
        });

      await Promise.all(fetchPromises);

      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `logo_package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error creating ZIP package:", err);
    } finally {
      setIsZipping(false);
    }
  };

  // Quick auto-assign from a selected Brand Asset (Bulk assignment)
  const handleSelectBrandAsset = (selectedAsset: BrandAsset) => {
    // Determine medium mapping
    const medMap: Record<string, "cmyk" | "rgb" | "universal"> = {
      DIGITAL_RGB: "rgb",
      PRINT_CMYK: "cmyk",
      UNIVERSAL: "universal",
    };
    // Orientation mapping
    const oriMap: Record<string, "horizontal" | "vertical" | "symbol"> = {
      HORIZONTAL: "horizontal",
      VERTICAL: "vertical",
      SYMBOL: "symbol",
    };
    // Background mapping
    const bgMap: Record<string, "light" | "dark" | "brand" | "monochrome"> = {
      LIGHT: "light",
      DARK: "dark",
      BRAND: "brand",
      MONOCHROME: "monochrome",
    };

    // Auto-map attached files to formats
    const mappedFormats: M07FormatItem[] = selectedAsset.files.map((file, idx) => ({
      id: `asset-file-${file.id || idx}`,
      format: (file.fileFormat as any) || "SVG",
      storageType: "LOGOBOOK_R2",
      url: file.fileUrl || "",
      fileName: file.file || `logo_${file.fileFormat?.toLowerCase()}`,
    }));

    const newConfig: M07AssetViewerConfig = {
      ...cfg,
      sourceMode: "library",
      assetId: selectedAsset.id,
      meta: {
        medium: medMap[selectedAsset.medium] || "universal",
        orientation: oriMap[selectedAsset.orientation] || "horizontal",
        hasClaim: selectedAsset.hasClaim ?? false,
        backgroundType: bgMap[selectedAsset.background] || "light",
      },
      directPreview: {
        ...cfg.directPreview,
        svgUrl: selectedAsset.previewUrl || selectedAsset.files.find((f) => f.fileFormat === "SVG")?.fileUrl || cfg.directPreview.svgUrl,
      },
      formats: mappedFormats.length > 0 ? mappedFormats : cfg.formats,
    };

    handleSaveConfig(newConfig);
  };

  // Quick auto-match from uploaded media assets by extension
  const handleAutoAssignMedia = () => {
    if (brandMedia.length === 0) return;

    const formatExtensions: Record<string, string[]> = {
      SVG: [".svg"],
      PDF: [".pdf"],
      EPS: [".eps"],
      AI: [".ai"],
      PNG: [".png"],
      JPG: [".jpg", ".jpeg"],
    };

    const newFormats: M07FormatItem[] = [...cfg.formats];

    Object.entries(formatExtensions).forEach(([fmt, exts]) => {
      const match = brandMedia.find((m) =>
        exts.some((ext) => m.fileName.toLowerCase().endsWith(ext))
      );
      if (match) {
        const existingIdx = newFormats.findIndex((f) => f.format === fmt);
        const item: M07FormatItem = {
          id: `auto-${fmt.toLowerCase()}`,
          format: fmt as any,
          storageType: "LOGOBOOK_R2",
          url: match.fileUrl || "",
          fileName: match.fileName,
          fileSize: match.fileSize,
        };
        if (existingIdx >= 0) {
          newFormats[existingIdx] = item;
        } else {
          newFormats.push(item);
        }
      }
    });

    handleSaveConfig({
      ...cfg,
      formats: newFormats,
    });
  };

  return (
    <div className="relative group/m07 py-4">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m07:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Nastavenia loga a formátov</span>
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border/60 p-6 shadow-sm overflow-hidden"
        style={{ borderRadius: brandRadius }}
      >
        {/* LEFT COLUMN: Logo Preview & Interactive Mockup Reveal (40% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div
            className="relative w-full aspect-4/3 rounded-[3px] border border-border/40 overflow-hidden group/preview select-none flex items-center justify-center transition-all duration-200"
            style={{ backgroundColor: cfg.directPreview.backgroundColor || "transparent" }}
          >
            {/* SVG Vector Layer (Base) */}
            {cfg.directPreview.svgUrl ? (
              <img
                src={cfg.directPreview.svgUrl}
                alt="Logo Vector"
                className="max-w-[70%] max-h-[70%] object-contain transition-transform duration-300 group-hover/preview:scale-105"
              />
            ) : (
              <div className="text-center p-6 text-muted-foreground text-xs flex flex-col items-center gap-2">
                <FileCode className="w-8 h-8 opacity-40 text-primary" />
                <span>Žiadne SVG logo nebolo nahrané.</span>
              </div>
            )}

            {/* Mockup Image Layer (Fades out on hover) */}
            {cfg.directPreview.mockupImageUrl && (
              <img
                src={cfg.directPreview.mockupImageUrl}
                alt="Logo Mockup"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 group-hover/preview:opacity-0 pointer-events-none"
              />
            )}

            {/* Copy SVG Action Button */}
            {cfg.directPreview.showCopySvg && cfg.directPreview.svgUrl && (
              <button
                type="button"
                onClick={handleCopySvg}
                className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2 py-1 rounded-[3px] bg-[#070b0f] hover:bg-[#17212a] text-[#fafbfc] border border-white/20 text-[11px] font-medium transition-all shadow-sm"
                title="Kopírovať SVG kód do schránky"
              >
                {copiedSvg ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary font-bold">Skopírované!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white/70" />
                    <span>Kopírovať SVG</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Metadata Badges for M11 Grid Integration */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="px-2 py-0.5 rounded-[var(--brand-radius,3px)] bg-muted border border-border/40 uppercase">
              {cfg.meta.medium}
            </span>
            <span className="px-2 py-0.5 rounded-[var(--brand-radius,3px)] bg-muted border border-border/40 uppercase">
              {cfg.meta.orientation}
            </span>
            {cfg.meta.hasClaim && (
              <span className="px-2 py-0.5 rounded-[var(--brand-radius,3px)] bg-muted border border-border/40 uppercase">
                Claim / Slogan
              </span>
            )}
            <span className="px-2 py-0.5 rounded-[var(--brand-radius,3px)] bg-muted border border-border/40 uppercase">
              {cfg.meta.backgroundType}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Educational Download Table & ZIP CTA (60% / 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Format Rows */}
          <div className="divide-y divide-border/30">
            {cfg.formats.map((fmt) => {
              const badge = FORMAT_BADGES[fmt.format] || {
                label: `.${fmt.format}`,
                colorClass: "bg-muted text-foreground border-border",
              };
              const description =
                resolveI18nText(fmt.customDescription, locale) ||
                DEFAULT_FORMAT_DESCRIPTIONS[fmt.format]?.[locale] ||
                DEFAULT_FORMAT_DESCRIPTIONS[fmt.format]?.["en"] ||
                "Vektorový alebo rastrový formát pre všestranné použitie.";

              return (
                <div
                  key={fmt.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 transition-colors hover:bg-neutral-900/30 px-2 rounded-[2px]"
                >
                  {/* Left: Badge & Description */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`px-2 py-1 rounded-[3px] text-xs font-mono font-bold border shrink-0 ${badge.colorClass}`}
                    >
                      {badge.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground/90 font-medium leading-snug line-clamp-2">
                        {description}
                      </p>
                      {fmt.fileName && (
                        <span className="text-[10px] font-mono text-muted-foreground truncate block mt-0.5">
                          {fmt.fileName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Download Action */}
                  <div className="shrink-0">
                    {fmt.storageType === "EXTERNAL_LINK" ? (
                      <a
                        href={fmt.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 text-xs font-medium transition-colors"
                        title="Otvoriť externé úložisko"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Drive</span>
                      </a>
                    ) : (
                      <a
                        href={fmt.url || "#"}
                        download={fmt.fileName || true}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 text-xs font-medium transition-colors"
                        title="Stiahnuť súbor"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden sm:inline">Stiahnuť</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom ZIP / External All Download Button */}
          {cfg.downloadAll.enabled && (
            <div className="pt-2 border-t border-border/40 flex justify-end">
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[3px] bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Balím ZIP archív...</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-4 h-4" />
                    <span>
                      {cfg.downloadAll.mode === "external_link"
                        ? "Otvoriť kompletný Logo Pack"
                        : "Stiahnuť všetko (ZIP balík)"}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Settings Modal (Tabs: Preview, Formats & Bulk, Meta for M11) */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-150"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        >
          <div
            className="bg-[#0e161d] border border-[rgba(63,85,102,0.65)] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#fafbfc]"
            style={{ backgroundColor: "#0e161d", borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a]"
              style={{ backgroundColor: "#17212a" }}
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-[#fafbfc]">
                  Nastavenia modulu M07 (Asset Viewer & Formáty)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-[#1f2c36] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div
              className="flex border-b border-[rgba(63,85,102,0.45)] bg-[#17212a] px-5 pt-2 gap-2"
              style={{ backgroundColor: "#17212a" }}
            >
              <button
                type="button"
                onClick={() => setModalTab("preview")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "preview"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                1. Vizuálny náhľad (Preview)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("formats")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "formats"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                2. Formáty a sťahovanie (Download)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("meta")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "meta"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                3. Metadáta pre maticu M11
              </button>
            </div>

            {/* Modal Content */}
            <div
              className="p-5 overflow-y-auto space-y-4 text-xs bg-[#0e161d]"
              style={{ backgroundColor: "#0e161d" }}
            >
              {/* TAB 1: PREVIEW SETTINGS */}
              {modalTab === "preview" && (
                <div className="space-y-4">
                  {/* Select from Brand Assets (Quick Assignment) */}
                  <div className="bg-[#17212a] p-3 rounded-[3px] border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        <span>Prepojiť s knižnicou logotypov (Rýchle priradenie)</span>
                      </label>
                      {isLoadingAssets && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </div>
                    {brandAssets.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {brandAssets.map((asset) => {
                          const isSelected = cfg.assetId === asset.id;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => handleSelectBrandAsset(asset)}
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
                                <Layers className="w-6 h-6 shrink-0 opacity-50" />
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-[11px] block truncate">
                                  {typeof asset.name === "object"
                                    ? resolveI18nText(asset.name, locale) || asset.id
                                    : asset.name || asset.id}
                                </span>
                                <span className="text-[9px] text-muted-foreground block truncate">
                                  {asset.files.length} formátov
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        V knižnici surových lôg zatiaľ nie sú nahrané žiadne assety.
                      </p>
                    )}
                  </div>

                  {/* Direct URLs */}
                  <div className="space-y-3 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[11px] font-medium">
                        URL adresa vektorového SVG loga
                      </label>
                      <input
                        type="text"
                        value={cfg.directPreview.svgUrl || ""}
                        placeholder="/logo/symbol.svg alebo https://..."
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            directPreview: { ...cfg.directPreview, svgUrl: e.target.value },
                          })
                        }
                        className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-1.5 text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[11px] font-medium">
                        URL adresa mockup obrázka (odhalí sa pri hoveri)
                      </label>
                      <input
                        type="text"
                        value={cfg.directPreview.mockupImageUrl || ""}
                        placeholder="https://.../mockup.jpg"
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            directPreview: { ...cfg.directPreview, mockupImageUrl: e.target.value },
                          })
                        }
                        className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-1.5 text-foreground text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[11px] font-medium">
                          Farba pozadia pod SVG
                        </label>
                        <select
                          value={cfg.directPreview.backgroundColor || "transparent"}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              directPreview: {
                                ...cfg.directPreview,
                                backgroundColor: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-1.5 text-foreground text-xs focus:outline-none focus:border-primary"
                        >
                          <option value="transparent">Priehľadné (Transparent)</option>
                          <option value="#ffffff">Svetlé (#ffffff)</option>
                          <option value="#070b0f">Tmavé (#070b0f)</option>
                          <option value={tokens?.colors?.primary || "#c8d400"}>
                            Brand Primary ({tokens?.colors?.primary || "Lime"})
                          </option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfg.directPreview.showCopySvg}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                directPreview: {
                                  ...cfg.directPreview,
                                  showCopySvg: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5 bg-[#0e161d] border-border/70"
                          />
                          <span className="text-foreground text-[11px]">
                            Zobraziť tlačidlo „Kopírovať SVG“
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FORMATS & BULK ASSIGN */}
              {modalTab === "formats" && (
                <div className="space-y-4">
                  {/* Quick Auto-Match from Media */}
                  <div className="flex items-center justify-between bg-[#17212a] p-3 rounded-[3px] border border-border/50">
                    <div>
                      <span className="font-semibold text-foreground text-xs block">
                        Rýchle priradenie z Media Knižnice
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Automaticky priradí súbory podľa prípony (.svg, .pdf, .eps, .ai, .png, .jpg)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoAssignMedia}
                      className="px-3 py-1.5 rounded-[2px] bg-primary/20 hover:bg-primary/30 text-primary font-semibold text-xs transition-colors shrink-0"
                    >
                      Automaticky spárovať
                    </button>
                  </div>

                  {/* Formats List Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Zoznam súborov na stiahnutie
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newFmt: M07FormatItem = {
                            id: `fmt-${Date.now()}`,
                            format: "PNG",
                            storageType: "LOGOBOOK_R2",
                            url: "",
                            fileName: "logo.png",
                          };
                          handleSaveConfig({
                            ...cfg,
                            formats: [...cfg.formats, newFmt],
                          });
                        }}
                        className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Pridať formát</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {cfg.formats.map((fmt, idx) => (
                        <div
                          key={fmt.id || idx}
                          className="bg-[#17212a] p-2.5 rounded-[3px] border border-border/40 flex items-center gap-2"
                        >
                          {/* Format Selector */}
                          <select
                            value={fmt.format}
                            onChange={(e) => {
                              const updated = [...cfg.formats];
                              updated[idx] = { ...fmt, format: e.target.value as any };
                              handleSaveConfig({ ...cfg, formats: updated });
                            }}
                            className="bg-[#0e161d] border border-border/70 rounded px-2 py-1 text-xs text-foreground font-mono"
                          >
                            <option value="SVG">SVG</option>
                            <option value="PDF">PDF</option>
                            <option value="EPS">EPS</option>
                            <option value="AI">AI</option>
                            <option value="PNG">PNG</option>
                            <option value="JPG">JPG</option>
                          </select>

                          {/* Storage Type */}
                          <select
                            value={fmt.storageType}
                            onChange={(e) => {
                              const updated = [...cfg.formats];
                              updated[idx] = { ...fmt, storageType: e.target.value as any };
                              handleSaveConfig({ ...cfg, formats: updated });
                            }}
                            className="bg-[#0e161d] border border-border/70 rounded px-2 py-1 text-xs text-foreground"
                          >
                            <option value="LOGOBOOK_R2">R2 Úložisko</option>
                            <option value="EXTERNAL_LINK">Externý Link (Drive)</option>
                          </select>

                          {/* URL input */}
                          <input
                            type="text"
                            value={fmt.url || ""}
                            placeholder="URL súboru..."
                            onChange={(e) => {
                              const updated = [...cfg.formats];
                              updated[idx] = { ...fmt, url: e.target.value };
                              handleSaveConfig({ ...cfg, formats: updated });
                            }}
                            className="flex-1 bg-[#0e161d] border border-border/70 rounded px-2 py-1 text-xs text-foreground"
                          />

                          {/* Delete Format Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = cfg.formats.filter((_, i) => i !== idx);
                              handleSaveConfig({ ...cfg, formats: updated });
                            }}
                            className="text-muted-foreground hover:text-rose-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Download All ZIP Settings */}
                  <div className="bg-[#17212a] p-3 rounded-[3px] border border-border/50 space-y-2">
                    <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block">
                      Hromadné sťahovanie (Tlačidlo „Stiahnuť všetko“)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cfg.downloadAll.enabled}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              downloadAll: { ...cfg.downloadAll, enabled: e.target.checked },
                            })
                          }
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5 bg-[#0e161d] border-border/70"
                        />
                        <span className="text-foreground text-[11px]">Zapnúť tlačidlo</span>
                      </label>

                      <select
                        value={cfg.downloadAll.mode}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            downloadAll: { ...cfg.downloadAll, mode: e.target.value as any },
                          })
                        }
                        className="bg-[#0e161d] border border-border/70 rounded px-2.5 py-1 text-xs text-foreground"
                      >
                        <option value="zip_client">Klientsky ZIP balík (JSZip)</option>
                        <option value="external_link">Externý Google Drive / Cloud Link</option>
                      </select>
                    </div>

                    {cfg.downloadAll.mode === "external_link" && (
                      <input
                        type="url"
                        value={cfg.downloadAll.url || ""}
                        placeholder="https://drive.google.com/drive/folders/..."
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            downloadAll: { ...cfg.downloadAll, url: e.target.value },
                          })
                        }
                        className="w-full bg-[#0e161d] border border-border/70 rounded px-3 py-1.5 text-foreground text-xs"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: METADATA FOR M11 MATRIX */}
              {modalTab === "meta" && (
                <div className="space-y-4 bg-[#17212a] p-4 rounded-[3px] border border-border/40">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Info className="w-4 h-4" />
                    <span>Metadáta pre filtračnú maticu logotypov (M11)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tieto parametre umožnia modulu M11 a vyhľadávaniu presne filtrovať logá podľa
                    farebného priestoru, orientácie a typu pozadia.
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[11px] font-medium">Médium</label>
                      <select
                        value={cfg.meta.medium}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            meta: { ...cfg.meta, medium: e.target.value as any },
                          })
                        }
                        className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-1.5 text-foreground text-xs"
                      >
                        <option value="universal">Univerzálne</option>
                        <option value="rgb">Digitál (RGB)</option>
                        <option value="cmyk">Tlač (CMYK)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[11px] font-medium">Orientácia</label>
                      <select
                        value={cfg.meta.orientation}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            meta: { ...cfg.meta, orientation: e.target.value as any },
                          })
                        }
                        className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-1.5 text-foreground text-xs"
                      >
                        <option value="horizontal">Horizontálne</option>
                        <option value="vertical">Vertikálne</option>
                        <option value="symbol">Symbol / Ikona</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[11px] font-medium">Pozadie</label>
                      <select
                        value={cfg.meta.backgroundType}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            meta: { ...cfg.meta, backgroundType: e.target.value as any },
                          })
                        }
                        className="w-full bg-[#0e161d] border border-border/70 rounded-[3px] px-3 py-1.5 text-foreground text-xs"
                      >
                        <option value="light">Svetlé pozadie</option>
                        <option value="dark">Tmavé pozadie</option>
                        <option value="brand">Brandové pozadie</option>
                        <option value="monochrome">Monochromatické</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cfg.meta.hasClaim}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              meta: { ...cfg.meta, hasClaim: e.target.checked },
                            })
                          }
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5 bg-[#0e161d] border-border/70"
                        />
                        <span className="text-foreground text-[11px]">Obsahuje slogan (Claim)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-end px-5 py-3 border-t border-border/60 bg-[#17212a]"
              style={{ backgroundColor: "#17212a" }}
            >
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
