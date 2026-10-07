"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Search,
  Download,
  Copy,
  Check,
  X,
  Sliders,
  Upload,
  Plus,
  Trash2,
  Settings2,
  FolderArchive,
  Layers,
  Sparkles,
  Info,
  Grid,
  FileCode,
  Tag,
  Palette,
  Loader2,
  ZoomIn,
} from "lucide-react";
import JSZip from "jszip";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M25IconLibraryConfig,
  m25IconLibrarySchema,
  M25IconItem,
  M25Layout,
  DEFAULT_M25_ICONS,
} from "@/lib/validations/modules/m25";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";

/**
 * Safely sanitizes raw SVG code to ensure proper viewBox and responsive scaling
 */
function sanitizeSvg(rawSvg: string, activeColorHex?: string): string {
  let cleaned = rawSvg.trim();
  // Strip XML prolog or DOCTYPE
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, "");
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, "");

  // Ensure svg element has width and height 100% or removes hardcoded px width/height if viewBox is present
  if (cleaned.includes("viewBox=")) {
    cleaned = cleaned.replace(/<svg\b([^>]*)\b(width|height)=["'][^"']*["']/gi, "<svg$1");
  }

  // Inject active color if not theme default
  if (activeColorHex && activeColorHex !== "theme") {
    cleaned = cleaned.replace(/currentColor/g, activeColorHex);
  }

  return cleaned.trim();
}

/**
 * Converts SVG string into a transparent PNG Blob at the specified dimension
 */
async function svgToPngBlob(svgString: string, size: number, activeColorHex?: string): Promise<Blob> {
  const preparedSvg = sanitizeSvg(svgString, activeColorHex);
  const blob = new Blob([preparedSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context is not available"));
          return;
        }
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);

        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Trigger direct file download from a Blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function M25KniznicaIkonModule({
  id: moduleId,
  moduleType = "M25_KniznicaIkon",
  showH3 = true,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveRadius, resolveColor, resolveStyles, tokens } = useBrandCascade();
  const radius = resolveRadius(config?.styleOverrides);
  const headingText = resolveI18nText(h3Title, locale) || "Knižnica ikon a piktogramov";

  // Parse config safely
  const parsedConfig: M25IconLibraryConfig = useMemo(() => {
    const res = m25IconLibrarySchema.safeParse(config);
    if (res.success) return res.data;
    return {
      layout: "grid_medium",
      enableSearch: true,
      showCategories: true,
      showColorPicker: true,
      defaultColor: "theme",
      showDownloadAllZip: true,
      downloadAllZipUrl: null,
      icons: DEFAULT_M25_ICONS,
    };
  }, [config]);

  // Client states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>(parsedConfig.defaultColor || "theme");
  const [activeIconDetail, setActiveIconDetail] = useState<M25IconItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [detailBgMode, setDetailBgMode] = useState<"dark" | "light" | "checker">("dark");
  const [isSaving, setIsSaving] = useState(false);

  // Available brand colors for the picker
  const availableColors = useMemo(() => {
    const list: { id: string; label: string; hex: string }[] = [
      { id: "theme", label: "Automatická (Téma)", hex: "currentColor" },
    ];
    if (tokens?.colors?.primary) {
      list.push({ id: tokens.colors.primary, label: "Primary", hex: tokens.colors.primary });
    }
    if (tokens?.colors?.secondary) {
      list.push({ id: tokens.colors.secondary, label: "Secondary", hex: tokens.colors.secondary });
    }
    if (tokens?.colors?.accent) {
      list.push({ id: tokens.colors.accent, label: "Accent", hex: tokens.colors.accent });
    }
    if (tokens?.colors?.neutral) {
      list.push({ id: tokens.colors.neutral, label: "Neutral", hex: tokens.colors.neutral });
    }
    // Add distinct palette colors
    if (tokens?.palette && Array.isArray(tokens.palette)) {
      tokens.palette.forEach((p) => {
        if (!list.some((item) => item.hex.toLowerCase() === p.hex.toLowerCase())) {
          list.push({ id: p.hex, label: p.name || p.role || p.hex, hex: p.hex });
        }
      });
    }
    // Standard monochrome options
    if (!list.some((c) => c.hex.toLowerCase() === "#000000")) {
      list.push({ id: "#000000", label: "Čierna", hex: "#000000" });
    }
    if (!list.some((c) => c.hex.toLowerCase() === "#ffffff")) {
      list.push({ id: "#ffffff", label: "Biela", hex: "#ffffff" });
    }
    return list;
  }, [tokens]);

  // Unique categories derived from icons list
  const categories = useMemo(() => {
    const set = new Set<string>();
    parsedConfig.icons.forEach((icon) => {
      if (icon.category && icon.category.trim().length > 0) {
        set.add(icon.category.trim());
      }
    });
    return Array.from(set);
  }, [parsedConfig.icons]);

  // Client-side search and category filtering
  const filteredIcons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parsedConfig.icons.filter((icon) => {
      // Category check
      if (selectedCategory !== "all" && icon.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;

      // Check name in current locale
      const currentName = resolveI18nText(icon.name, locale)?.toLowerCase() || "";
      if (currentName.includes(q)) return true;

      // Check name in English or any other language
      const allNames = Object.values(icon.name).join(" ").toLowerCase();
      if (allNames.includes(q)) return true;

      // Check tags
      if (icon.tags?.some((t) => t.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [parsedConfig.icons, searchQuery, selectedCategory, locale]);

  // Copy SVG to clipboard
  const handleCopySvg = useCallback((icon: M25IconItem) => {
    const cleaned = sanitizeSvg(icon.svgCode, selectedColor);
    navigator.clipboard.writeText(cleaned).then(() => {
      setCopiedId(icon.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, [selectedColor]);

  // Download single SVG
  const handleDownloadSvg = useCallback((icon: M25IconItem) => {
    const cleaned = sanitizeSvg(icon.svgCode, selectedColor);
    const blob = new Blob([cleaned], { type: "image/svg+xml;charset=utf-8" });
    const nameStr = resolveI18nText(icon.name, locale) || icon.id;
    const safeFilename = `${nameStr.toLowerCase().replace(/[^a-z0-9_-]/gi, "-")}.svg`;
    downloadBlob(blob, safeFilename);
  }, [selectedColor, locale]);

  // Download single PNG at resolution
  const handleDownloadPng = useCallback(async (icon: M25IconItem, size: number) => {
    try {
      const blob = await svgToPngBlob(icon.svgCode, size, selectedColor);
      const nameStr = resolveI18nText(icon.name, locale) || icon.id;
      const safeFilename = `${nameStr.toLowerCase().replace(/[^a-z0-9_-]/gi, "-")}-${size}px.png`;
      downloadBlob(blob, safeFilename);
    } catch (err) {
      console.error("Failed to generate PNG", err);
    }
  }, [selectedColor, locale]);

  // Download All as ZIP
  const handleDownloadAllZip = useCallback(async () => {
    if (parsedConfig.downloadAllZipUrl) {
      window.open(parsedConfig.downloadAllZipUrl, "_blank");
      return;
    }

    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder("icons");

      parsedConfig.icons.forEach((icon) => {
        const cleaned = sanitizeSvg(icon.svgCode, selectedColor);
        const nameStr = resolveI18nText(icon.name, locale) || icon.id;
        const filename = `${nameStr.toLowerCase().replace(/[^a-z0-9_-]/gi, "-")}.svg`;
        folder?.file(filename, cleaned);
      });

      zip.file(
        "README.txt",
        `Oficiálna sada vektorových ikon značky.\nPočet ikon: ${parsedConfig.icons.length}\nVygenerované prostredníctvom Logobook.sk\n`
      );

      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, "brand-icons-pack.zip");
    } catch (err) {
      console.error("Failed to generate ZIP", err);
    } finally {
      setIsZipping(false);
    }
  }, [parsedConfig.downloadAllZipUrl, parsedConfig.icons, selectedColor, locale]);

  // Determine grid column classes based on layout setting
  const gridLayoutClass = useMemo(() => {
    switch (parsedConfig.layout) {
      case "grid_small":
        return "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5";
      case "grid_large":
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4";
      case "grid_medium":
      default:
        return "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3";
    }
  }, [parsedConfig.layout]);

  // Determine icon size inside cards based on layout
  const iconSizeClass = useMemo(() => {
    switch (parsedConfig.layout) {
      case "grid_small":
        return "w-6 h-6";
      case "grid_large":
        return "w-11 h-11";
      case "grid_medium":
      default:
        return "w-8 h-8";
    }
  }, [parsedConfig.layout]);

  // Card height
  const cardHeightClass = useMemo(() => {
    switch (parsedConfig.layout) {
      case "grid_small":
        return "h-20";
      case "grid_large":
        return "h-36";
      case "grid_medium":
      default:
        return "h-28";
    }
  }, [parsedConfig.layout]);

  return (
    <section
      className="p-6 border border-border/50 transition-all duration-200 shadow-2xs space-y-6 relative group/m25"
      style={{
        borderRadius: radius,
        ...resolveStyles(config?.styleOverrides),
      }}
      aria-label="Knižnica ikon"
    >
      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/m25:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#070b0f] border border-white/20 px-2.5 py-1.5 rounded-[3px] shadow-md">
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Spravovať knižnicu ikon"
          >
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            <span>Spravovať ikony</span>
          </button>
        </div>
      )}

      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div>
          {showH3 && (
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{headingText}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                {parsedConfig.icons.length} {parsedConfig.icons.length === 1 ? "ikona" : "ikon"}
              </span>
            </h3>
          )}
          {parsedConfig.guidelinesText && (
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {resolveI18nText(parsedConfig.guidelinesText, locale)}
            </p>
          )}
        </div>

        {/* Action buttons (Admin Edit & Download All ZIP) */}
        <div className="flex items-center gap-2 shrink-0">
          {parsedConfig.showDownloadAllZip && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping || parsedConfig.icons.length === 0}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Stiahnuť všetky ikony v ZIP balíčku"
            >
              {isZipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <FolderArchive className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{isZipping ? "Pripravujem archív..." : "Stiahnuť celú sadu (ZIP)"}</span>
            </button>
          )}

          {isEditor && (
            <button
              onClick={() => setIsEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-xs cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Spravovať ikony</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Live Search & Category Tabs & Color Selector */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          {parsedConfig.enableSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hľadať ikonu podľa názvu alebo tagu..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-md bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Color Switcher Bar */}
          {parsedConfig.showColorPicker && (
            <div className="flex items-center gap-2 bg-muted/50 border border-border/40 px-2.5 py-1.5 rounded-md self-start sm:self-auto overflow-x-auto max-w-full">
              <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Palette className="w-3 h-3 text-primary" />
                Farba:
              </span>
              <div className="flex items-center gap-1.5">
                {availableColors.map((color) => {
                  const isTheme = color.id === "theme";
                  const isSelected = selectedColor === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      title={color.label}
                      className={`relative w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 border-transparent"
                          : "border-border/60 hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: isTheme ? "transparent" : color.hex,
                        backgroundImage: isTheme
                          ? "conic-gradient(from 180deg at 50% 50%, #c8d400 0deg, #009f80 120deg, #bb4934 240deg, #c8d400 360deg)"
                          : undefined,
                      }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3 h-3 ${
                            isTheme || color.hex === "#ffffff" ? "text-neutral-900" : "text-white"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        {parsedConfig.showCategories && categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Všetky ({parsedConfig.icons.length})
            </button>
            {categories.map((cat) => {
              const count = parsedConfig.icons.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Icons */}
      {filteredIcons.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 border border-dashed border-border/60 rounded-lg p-6">
          <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Žiadne ikony sa nenašli</p>
            <p className="text-xs text-muted-foreground mt-1">
              Skúste upraviť vyhľadávacie slovo alebo prepnúť kategóriu.
            </p>
          </div>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Zrušiť filtre
            </button>
          )}
        </div>
      ) : (
        <div className={gridLayoutClass}>
          {filteredIcons.map((icon) => {
            const iconName = resolveI18nText(icon.name, locale) || icon.id;
            const isCopied = copiedId === icon.id;

            return (
              <div
                key={icon.id}
                onClick={() => setActiveIconDetail(icon)}
                className={`group relative flex flex-col items-center justify-center p-3 rounded-md border border-border/40 bg-card hover:bg-accent/10 hover:border-primary/50 transition-all duration-150 cursor-pointer shadow-2xs select-none ${cardHeightClass}`}
                style={{
                  color: selectedColor !== "theme" ? selectedColor : undefined,
                }}
                title={`${iconName} (Kliknutím zobrazíte možnosti)`}
              >
                {/* SVG Visualizer */}
                <div
                  className={`${iconSizeClass} flex items-center justify-center transition-transform duration-150 group-hover:scale-110`}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeSvg(icon.svgCode, selectedColor),
                  }}
                />

                {/* Icon Name Label */}
                <span className="text-[11px] font-medium text-foreground/80 group-hover:text-foreground text-center truncate w-full mt-2 transition-colors">
                  {iconName}
                </span>

                {/* Hover Quick Action Buttons */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySvg(icon);
                    }}
                    className="p-1 rounded bg-background/90 border border-border/60 hover:bg-primary hover:text-primary-foreground text-foreground shadow-xs cursor-pointer transition-colors"
                    title="Skopírovať SVG"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info Counter */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/20">
        <span>
          Zobrazených <strong className="text-foreground">{filteredIcons.length}</strong> z{" "}
          <strong className="text-foreground">{parsedConfig.icons.length}</strong> ikon
        </span>
        <span className="hidden sm:inline">
          Kliknutím na ikonu otvoríte SVG kód a možnosti exportu (SVG / PNG).
        </span>
      </div>

      {/* Modal: Icon Detail & Export Drawer */}
      {activeIconDetail && (
        <IconDetailModal
          icon={activeIconDetail}
          locale={locale}
          selectedColor={selectedColor}
          availableColors={availableColors}
          bgMode={detailBgMode}
          onBgModeChange={setDetailBgMode}
          onColorChange={setSelectedColor}
          onCopySvg={() => handleCopySvg(activeIconDetail)}
          onDownloadSvg={() => handleDownloadSvg(activeIconDetail)}
          onDownloadPng={(size) => handleDownloadPng(activeIconDetail, size)}
          isCopied={copiedId === activeIconDetail.id}
          onClose={() => setActiveIconDetail(null)}
        />
      )}

      {/* Modal: Admin Icon Library Editor */}
      {isEditorOpen && (
        <AdminIconLibraryModal
          config={parsedConfig}
          locale={locale}
          isSaving={isSaving}
          onClose={() => setIsEditorOpen(false)}
          onSave={async (newConfig) => {
            try {
              setIsSaving(true);
              if (onConfigChange) {
                onConfigChange(newConfig);
              }
              if (moduleId) {
                await updateModuleConfigAction(moduleId, newConfig);
              }
              setIsEditorOpen(false);
            } catch (err) {
              console.error("Failed to save icon library config", err);
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}
    </section>
  );
}

/**
 * Interactive Detail Popover / Modal for single icon
 */
function IconDetailModal({
  icon,
  locale,
  selectedColor,
  availableColors,
  bgMode,
  onBgModeChange,
  onColorChange,
  onCopySvg,
  onDownloadSvg,
  onDownloadPng,
  isCopied,
  onClose,
}: {
  icon: M25IconItem;
  locale: string;
  selectedColor: string;
  availableColors: { id: string; label: string; hex: string }[];
  bgMode: "dark" | "light" | "checker";
  onBgModeChange: (mode: "dark" | "light" | "checker") => void;
  onColorChange: (color: string) => void;
  onCopySvg: () => void;
  onDownloadSvg: () => void;
  onDownloadPng: (size: number) => void;
  isCopied: boolean;
  onClose: () => void;
}) {
  const iconName = resolveI18nText(icon.name, locale) || icon.id;
  const sanitizedSvg = sanitizeSvg(icon.svgCode, selectedColor);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#0e161d] border border-[rgba(63,85,102,0.45)] rounded-[var(--brand-radius,8px)] shadow-2xl max-w-lg w-full overflow-hidden text-[#fafbfc] space-y-0"
        style={{ backgroundColor: "#0e161d" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a]"
          style={{ backgroundColor: "#17212a" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#fafbfc]">{iconName}</h4>
              <p className="text-[11px] font-mono text-[#96abbe]">{icon.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#070b0f] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Preview Area with Background Selector */}
        <div
          className="p-6 space-y-4 bg-[#0e161d]"
          style={{ backgroundColor: "#0e161d" }}
        >
          <div className="relative rounded-lg overflow-hidden border border-[rgba(63,85,102,0.45)] flex items-center justify-center h-48 select-none">
            {/* Background Layer */}
            <div
              className={`absolute inset-0 transition-colors ${
                bgMode === "dark"
                  ? "bg-[#070b0f]"
                  : bgMode === "light"
                  ? "bg-white"
                  : "bg-[#121922] bg-[radial-gradient(#202d3a_1px,transparent_1px)] [background-size:12px_12px]"
              }`}
            />

            {/* Sized SVG Icon */}
            <div
              className="relative z-10 w-24 h-24 flex items-center justify-center transition-transform hover:scale-105"
              style={{
                color: selectedColor !== "theme" ? selectedColor : bgMode === "light" ? "#111827" : "#fafbfc",
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
            />

            {/* Background Switcher Pills */}
            <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/80 p-1 rounded-md border border-white/10 text-[10px]">
              <button
                onClick={() => onBgModeChange("dark")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  bgMode === "dark" ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                }`}
              >
                Tmavé
              </button>
              <button
                onClick={() => onBgModeChange("light")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  bgMode === "light" ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                }`}
              >
                Svetlé
              </button>
              <button
                onClick={() => onBgModeChange("checker")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  bgMode === "checker" ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                }`}
              >
                Mriežka
              </button>
            </div>
          </div>

          {/* Color Switcher inside Modal */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[#96abbe] flex items-center gap-1.5 font-medium">
              <Palette className="w-3.5 h-3.5 text-primary" />
              Aktívna farba ikony:
            </span>
            <div className="flex items-center gap-1.5">
              {availableColors.map((color) => {
                const isTheme = color.id === "theme";
                const isSelected = selectedColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => onColorChange(color.id)}
                    title={color.label}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-[#0e161d] scale-110 border-transparent"
                        : "border-[rgba(63,85,102,0.45)] hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: isTheme ? "transparent" : color.hex,
                      backgroundImage: isTheme
                        ? "conic-gradient(from 180deg at 50% 50%, #c8d400 0deg, #009f80 120deg, #bb4934 240deg, #c8d400 360deg)"
                        : undefined,
                    }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3 h-3 ${
                          isTheme || color.hex === "#ffffff" ? "text-neutral-900" : "text-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags and Category */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {icon.category && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#17212a] text-[#96abbe] border border-[rgba(63,85,102,0.45)]">
                {icon.category}
              </span>
            )}
            {icon.tags?.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.45)]"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Action Buttons: Copy SVG & Download SVG */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={onCopySvg}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                isCopied
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-[#17212a] text-[#fafbfc] hover:bg-[#070b0f] border-[rgba(63,85,102,0.45)]"
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "SVG skopírované!" : "Skopírovať SVG kód"}</span>
            </button>

            <button
              onClick={onDownloadSvg}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Stiahnuť .SVG</span>
            </button>
          </div>

          {/* PNG Export Grid */}
          <div className="pt-2 border-t border-[rgba(63,85,102,0.45)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#96abbe] font-medium flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-primary" />
                Stiahnuť rastrový .PNG (Priehľadné pozadie):
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[32, 64, 128, 256].map((size) => (
                <button
                  key={size}
                  onClick={() => onDownloadPng(size)}
                  className="py-1.5 px-2 text-center rounded-md bg-[#070b0f] hover:bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.45)] text-xs font-mono font-medium transition-all cursor-pointer"
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Configuration Modal with Bulk SVG Dropzone and icons manager
 */
function AdminIconLibraryModal({
  config,
  locale,
  isSaving,
  onClose,
  onSave,
}: {
  config: M25IconLibraryConfig;
  locale: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (newConfig: M25IconLibraryConfig) => void;
}) {
  const [activeTab, setActiveTab] = useState<"bulk" | "list" | "settings">("bulk");
  const [icons, setIcons] = useState<M25IconItem[]>(config.icons || []);
  const [layout, setLayout] = useState<M25Layout>(config.layout || "grid_medium");
  const [enableSearch, setEnableSearch] = useState(config.enableSearch ?? true);
  const [showCategories, setShowCategories] = useState(config.showCategories ?? true);
  const [showColorPicker, setShowColorPicker] = useState(config.showColorPicker ?? true);
  const [showDownloadAllZip, setShowDownloadAllZip] = useState(config.showDownloadAllZip ?? true);
  const [downloadAllZipUrl, setDownloadAllZipUrl] = useState(config.downloadAllZipUrl || "");

  // Bulk dropzone state
  const [isDragging, setIsDragging] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual single icon entry state
  const [manualNameEn, setManualNameEn] = useState("");
  const [manualNameSk, setManualNameSk] = useState("");
  const [manualCategory, setManualCategory] = useState("Interface");
  const [manualSvgCode, setManualSvgCode] = useState("");

  // Process dropped or selected SVG files
  const processSvgFiles = useCallback((files: FileList | File[]) => {
    const svgFiles = Array.from(files).filter(
      (f) => f.name.endsWith(".svg") || f.type === "image/svg+xml"
    );

    if (svgFiles.length === 0) {
      setBulkStatus("Nenašli sa žiadne platné .svg súbory.");
      return;
    }

    setBulkStatus(`Spracovávam ${svgFiles.length} súborov...`);

    const newItems: M25IconItem[] = [];
    let completedCount = 0;

    svgFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text && text.includes("<svg")) {
          const rawBaseName = file.name.replace(/\.svg$/i, "");
          const formattedName = rawBaseName
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          const safeId = `icon-${rawBaseName.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}-${Date.now().toString(36).slice(-4)}`;

          newItems.push({
            id: safeId,
            name: {
              en: formattedName,
              sk: formattedName,
              cs: formattedName,
            },
            category: "General",
            style: "outline",
            tags: [rawBaseName.toLowerCase(), "vector", "icon"],
            svgCode: sanitizeSvg(text),
          });
        }

        completedCount++;
        if (completedCount === svgFiles.length) {
          setIcons((prev) => [...prev, ...newItems]);
          setBulkStatus(`Úspešne pridaných ${newItems.length} nových ikon!`);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSvgFiles(e.dataTransfer.files);
    }
  };

  // Add manually entered SVG icon
  const handleAddManualIcon = () => {
    if (!manualSvgCode.includes("<svg") || !manualNameEn.trim()) {
      alert("Zadajte prosím platný SVG kód a aspoň anglický názov ikony.");
      return;
    }

    const safeId = `icon-${manualNameEn.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}-${Date.now().toString(36).slice(-4)}`;
    const newItem: M25IconItem = {
      id: safeId,
      name: {
        en: manualNameEn.trim(),
        sk: manualNameSk.trim() || manualNameEn.trim(),
        cs: manualNameSk.trim() || manualNameEn.trim(),
      },
      category: manualCategory.trim() || "General",
      style: "outline",
      tags: [manualNameEn.toLowerCase().trim()],
      svgCode: sanitizeSvg(manualSvgCode),
    };

    setIcons((prev) => [newItem, ...prev]);
    setManualNameEn("");
    setManualNameSk("");
    setManualSvgCode("");
    setActiveTab("list");
  };

  // Delete icon
  const handleDeleteIcon = (id: string) => {
    setIcons((prev) => prev.filter((i) => i.id !== id));
  };

  // Save changes
  const handleSave = () => {
    const updated: M25IconLibraryConfig = {
      ...config,
      layout,
      enableSearch,
      showCategories,
      showColorPicker,
      showDownloadAllZip,
      downloadAllZipUrl: downloadAllZipUrl.trim() ? downloadAllZipUrl.trim() : null,
      icons,
    };
    onSave(updated);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#0e161d] border border-[rgba(63,85,102,0.45)] rounded-[var(--brand-radius,8px)] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#fafbfc]"
        style={{ backgroundColor: "#0e161d" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a]"
          style={{ backgroundColor: "#17212a" }}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-[#fafbfc]">Správa Knižnice ikon (M25)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#070b0f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="flex items-center gap-2 px-6 pt-3 border-b border-[rgba(63,85,102,0.45)] bg-[#070b0f]"
          style={{ backgroundColor: "#070b0f" }}
        >
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "bulk"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Hromadný upload (Bulk Drop)</span>
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "list"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Zoznam ikon ({icons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Nastavenia modulu</span>
          </button>
        </div>

        {/* Tab Content */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0e161d]"
          style={{ backgroundColor: "#0e161d" }}
        >
          {/* TAB 1: BULK DROP */}
          {activeTab === "bulk" && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10 scale-[0.99]"
                    : "border-[rgba(63,85,102,0.45)] hover:border-primary/60 bg-[#070b0f]/50 hover:bg-[#070b0f]"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-semibold text-[#fafbfc]">
                  Pretiahnite sem SVG ikony (Bulk Drop)
                </h4>
                <p className="text-xs text-[#96abbe] mt-1 max-w-sm">
                  Môžete naraz označiť a pretiahnuť desiatky SVG súborov. Názvy súborov budú
                  automaticky použité ako predvolené názvy a vyhľadávacie tagy.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 text-xs font-medium rounded-md bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.45)] hover:bg-[#070b0f] pointer-events-none"
                >
                  Vybrať SVG súbory z počítača
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processSvgFiles(e.target.files);
                    }
                  }}
                />
              </div>

              {bulkStatus && (
                <div className="p-3 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{bulkStatus}</span>
                </div>
              )}

              {/* Manual Add Single Icon Accordion */}
              <div className="border border-[rgba(63,85,102,0.45)] rounded-lg p-4 bg-[#17212a] space-y-3">
                <h5 className="text-xs font-semibold text-[#fafbfc] flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-primary" />
                  Alebo vložte kód jednej ikony ručne
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={manualNameEn}
                    onChange={(e) => setManualNameEn(e.target.value)}
                    placeholder="Názov (EN, napr. Calendar)"
                    className="px-3 py-1.5 text-xs rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={manualNameSk}
                    onChange={(e) => setManualNameSk(e.target.value)}
                    placeholder="Názov (SK, napr. Kalendár)"
                    className="px-3 py-1.5 text-xs rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    placeholder="Kategória (napr. Navigation)"
                    className="px-3 py-1.5 text-xs rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                  />
                </div>
                <textarea
                  value={manualSvgCode}
                  onChange={(e) => setManualSvgCode(e.target.value)}
                  placeholder="<svg viewBox='0 0 24 24'>...</svg>"
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddManualIcon}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-[#070b0f] text-[#fafbfc] hover:bg-[#17212a] border border-[rgba(63,85,102,0.45)] cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Pridať túto ikonu
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ICONS LIST */}
          {activeTab === "list" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#96abbe]">
                <span>Spolu {icons.length} ikon</span>
                <span className="text-[11px]">Názov môžete upraviť priamo v poli</span>
              </div>

              <div className="divide-y divide-[rgba(63,85,102,0.3)] max-h-[500px] overflow-y-auto pr-1">
                {icons.map((item) => {
                  return (
                    <div key={item.id} className="py-2.5 flex items-center gap-3">
                      {/* Thumbnail */}
                      <div
                        className="w-9 h-9 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] flex items-center justify-center shrink-0 p-1.5 text-[#fafbfc]"
                        dangerouslySetInnerHTML={{ __html: sanitizeSvg(item.svgCode) }}
                      />

                      {/* Inputs */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={item.name?.en || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIcons((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, name: { ...it.name, en: val } }
                                  : it
                              )
                            );
                          }}
                          placeholder="Name (EN)"
                          className="px-2 py-1 text-xs rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                        />
                        <input
                          type="text"
                          value={item.name?.sk || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIcons((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, name: { ...it.name, sk: val } }
                                  : it
                              )
                            );
                          }}
                          placeholder="Názov (SK)"
                          className="px-2 py-1 text-xs rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                        />
                        <input
                          type="text"
                          value={item.category || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIcons((prev) =>
                              prev.map((it) =>
                                it.id === item.id ? { ...it, category: val } : it
                              )
                            );
                          }}
                          placeholder="Kategória"
                          className="px-2 py-1 text-xs rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteIcon(item.id)}
                        className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        title="Vymazať ikonu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-4 max-w-lg">
              {/* Layout Density */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#fafbfc]">Hustota mriežky ikon</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "grid_small", label: "Kompaktná (Small)" },
                    { id: "grid_medium", label: "Štandardná (Medium)" },
                    { id: "grid_large", label: "Veľká (Large)" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLayout(l.id as M25Layout)}
                      className={`py-2 px-3 text-xs rounded-md border text-center transition-all cursor-pointer ${
                        layout === l.id
                          ? "bg-primary text-primary-foreground font-semibold border-primary"
                          : "bg-[#070b0f] text-[#96abbe] hover:text-[#fafbfc] border-[rgba(63,85,102,0.45)]"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2.5 text-xs text-[#fafbfc] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSearch}
                    onChange={(e) => setEnableSearch(e.target.checked)}
                    className="w-4 h-4 rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0"
                  />
                  <span>Povoliť Live Search (vyhľadávací input na webe)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#fafbfc] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCategories}
                    onChange={(e) => setShowCategories(e.target.checked)}
                    className="w-4 h-4 rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0"
                  />
                  <span>Zobraziť záložky kategórií</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#fafbfc] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showColorPicker}
                    onChange={(e) => setShowColorPicker(e.target.checked)}
                    className="w-4 h-4 rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0"
                  />
                  <span>Zobraziť prepínač farieb z katalógu</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#fafbfc] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDownloadAllZip}
                    onChange={(e) => setShowDownloadAllZip(e.target.checked)}
                    className="w-4 h-4 rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0"
                  />
                  <span>Zobraziť tlačidlo na stiahnutie celej sady v ZIP</span>
                </label>
              </div>

              {/* External ZIP URL */}
              <div className="pt-2 space-y-1.5">
                <label className="text-xs font-semibold text-[#fafbfc]">
                  Externá URL adresa pre ZIP (voliteľné)
                </label>
                <input
                  type="text"
                  value={downloadAllZipUrl}
                  onChange={(e) => setDownloadAllZipUrl(e.target.value)}
                  placeholder="https://r2.../icons_pack.zip"
                  className="w-full px-3 py-1.5 text-xs rounded border border-[rgba(63,85,102,0.45)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none"
                />
                <p className="text-[11px] text-[#96abbe]">
                  Ak necháte prázdne, ZIP archív sa vygeneruje automaticky priamo v prehliadači zo všetkých nahratých SVG ikoniek.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a]"
          style={{ backgroundColor: "#17212a" }}
        >
          <span className="text-xs text-[#96abbe] font-mono">
            {icons.length} {icons.length === 1 ? "ikona" : "ikon"} v knižnici
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium rounded-md hover:bg-[#070b0f] text-[#96abbe] hover:text-[#fafbfc] cursor-pointer"
            >
              Zrušiť
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium rounded-[var(--brand-radius,4px)] bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isSaving ? "Ukladám..." : "Uložiť zmeny"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
