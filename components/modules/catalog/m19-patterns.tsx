"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Grid,
  Settings2,
  Check,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Download,
  Maximize2,
  RotateCcw,
  Sparkles,
  Repeat,
  Square,
  ZoomIn,
  Loader2,
  Archive,
  Image as ImageIcon,
} from "lucide-react";
import JSZip from "jszip";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M19PatternsConfig,
  M19PatternItem,
  M19Preview,
  m19PatternsConfigSchema,
} from "@/lib/validations/modules/m19";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";

// Default SVG Geometric Pattern Data URI (Scalable seamless diamond motif)
const DEFAULT_SVG_PATTERN = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='%23C8D400' stroke-width='1.5' stroke-opacity='0.4'/><circle cx='30' cy='30' r='3' fill='%23009F80' fill-opacity='0.8'/><path d='M0 0 L15 15 M45 45 L60 60 M60 0 L45 15 M15 45 L0 60' stroke='%23ffffff' stroke-width='0.75' stroke-opacity='0.15'/></svg>`;

export default function M19PatternyModule({
  id: moduleId,
  moduleType = "M19_Patterny",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveRadius } = useBrandCascade();
  const brandRadius = resolveRadius();

  // Default seed items
  const defaultItems = useMemo<M19PatternItem[]>(() => [
    {
      id: "pattern-seed-1",
      title: {
        en: "Primary Geometric Motif & Pattern",
        sk: "Základný geometrický motív a pattern",
      },
      description: {
        en: "Seamless vector background texture and isolated brand graphic element for digital and print surfaces.",
        sk: "Bezšvíková vektorová textúra a samostatný grafický prvok pre digitálne plochy a tlačové aplikácie.",
      },
      previews: [
        {
          id: "prev-1",
          type: "pattern_viewer",
          url: DEFAULT_SVG_PATTERN,
          label: { en: "Live Pattern / Motif", sk: "Živý vzor / Motív" },
          defaultScale: 1.0,
          defaultRepeat: true,
        },
      ],
      downloads: [
        {
          format: "SVG",
          url: DEFAULT_SVG_PATTERN,
          label: { en: "Vector Tile (.SVG)", sk: "Vektorová dlaždica (.SVG)" },
        },
        {
          format: "PNG",
          url: DEFAULT_SVG_PATTERN,
          label: { en: "Hi-Res Tile (.PNG)", sk: "Rastrová dlaždica (.PNG)" },
        },
      ],
      showDownloadAllZip: true,
    },
  ], []);

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m19PatternsConfigSchema.safeParse(config);
    if (res.success) {
      return {
        ...res.data,
        items: res.data.items.length > 0 ? res.data.items : defaultItems,
      };
    }
    return {
      layout: "grid" as const,
      columns: 2,
      items: defaultItems,
    };
  }, [config, defaultItems]);

  const [cfg, setCfg] = useState<M19PatternsConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"patterns" | "layout">("patterns");

  // Track active preview tab for each pattern: itemId -> previewId
  const [activePreviewTabs, setActivePreviewTabs] = useState<Record<string, string>>({});

  // Interactive zoom and repeat states per pattern item:
  // itemId -> { scale: number, repeat: boolean }
  const [viewerControls, setViewerControls] = useState<
    Record<string, { scale: number; repeat: boolean }>
  >({});

  // Lightbox state for static mockup inspection
  const [activeLightboxImg, setActiveLightboxImg] = useState<{ url: string; title: string } | null>(null);

  // ZIP download loading state per item
  const [isZipping, setIsZipping] = useState<string | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M19PatternsConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M19 config:", err);
      }
    }
  };

  // Reorder items
  const moveItem = (index: number, direction: "up" | "down") => {
    const list = [...cfg.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const item = list.splice(index, 1)[0];
    list.splice(targetIndex, 0, item);
    handleSaveConfig({ ...cfg, items: list });
  };

  // Handle client-side ZIP download
  const handleDownloadAllZip = async (item: M19PatternItem) => {
    if (!item.downloads || item.downloads.length === 0) return;
    try {
      setIsZipping(item.id);
      const zip = new JSZip();
      const safeTitle = resolveI18nText(item.title, locale) || "brand-pattern";
      const folderName = safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const folder = zip.folder(folderName) || zip;

      for (let i = 0; i < item.downloads.length; i++) {
        const dl = item.downloads[i];
        const ext = dl.format.toLowerCase();
        const fileName = `${folderName}-tile.${ext}`;

        if (dl.url.startsWith("data:")) {
          // Data URI
          const base64Data = dl.url.split(",")[1];
          if (dl.url.includes("image/svg+xml")) {
            const decodedSvg = decodeURIComponent(dl.url.split(",")[1]);
            folder.file(fileName, decodedSvg);
          } else if (base64Data) {
            folder.file(fileName, base64Data, { base64: true });
          }
        } else {
          try {
            const resp = await fetch(dl.url);
            const blob = await resp.blob();
            folder.file(fileName, blob);
          } catch {
            // fallback text link
            folder.file(`${fileName}.url`, dl.url);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName}-package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate pattern ZIP:", err);
    } finally {
      setIsZipping(null);
    }
  };

  return (
    <div className="relative group/m19 py-4 space-y-4">
      {/* Optional H3 Header */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m19:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Správa vzorov</span>
          </button>
        </div>
      )}

      {/* PATTERNS GRID / STACK */}
      <div
        className={`gap-6 ${
          cfg.layout === "stack"
            ? "flex flex-col space-y-6"
            : cfg.columns === 1
            ? "grid grid-cols-1"
            : cfg.columns === 3
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid grid-cols-1 md:grid-cols-2"
        }`}
      >
        {cfg.items.map((item, idx) => {
          const itemTitle = resolveI18nText(item.title, locale) || "Brand Pattern";
          const itemDesc = item.description ? resolveI18nText(item.description, locale) : "";

          // Active preview tab for this item
          const activeTabId =
            activePreviewTabs[item.id] ||
            (item.previews.length > 0 ? item.previews[0].id : "");
          const activePreview =
            item.previews.find((p) => p.id === activeTabId) || item.previews[0];

          // Current scale and repeat for viewer
          const currentControls = viewerControls[item.id] || {
            scale: activePreview?.defaultScale ?? 1.0,
            repeat: activePreview?.defaultRepeat ?? true,
          };

          const isViewer = activePreview?.type !== "static_image";

          return (
            <div
              key={item.id || `pattern-${idx}`}
              className="bg-card border border-border/60 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-border"
              style={{ borderRadius: brandRadius }}
            >
              {/* UPPER PRESENTATION BOX */}
              <div className="relative border-b border-border/50 bg-muted/40 flex flex-col">
                {/* Top Bar: Tabs & Interactive Tiler Controls */}
                <div className="px-4 py-2.5 bg-muted/50 border-b border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Previews Tabs */}
                  {item.previews.length > 1 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {item.previews.map((prev) => {
                        const isTabActive = prev.id === activeTabId;
                        const label = resolveI18nText(prev.label, locale) || "Náhľad";

                        return (
                          <button
                            key={prev.id}
                            type="button"
                            onClick={() =>
                              setActivePreviewTabs((prevTabs) => ({
                                ...prevTabs,
                                [item.id]: prev.id,
                              }))
                            }
                            className={`px-2.5 py-1 rounded-[2px] font-semibold text-xs transition-colors cursor-pointer ${
                              isTabActive
                                ? "bg-primary text-primary-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground bg-muted/60"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {isViewer ? "Interaktívny prehliadač vzoru" : "Aplikácia v praxi"}
                    </span>
                  )}

                  {/* Viewer Controls Bar (Repeat Toggle + Zoom Slider) */}
                  {isViewer && (
                    <div className="flex items-center gap-3 ml-auto text-xs bg-card px-2.5 py-1 rounded-[3px] border border-border/60">
                      {/* Repeat / No-Repeat Toggle (User explicit request) */}
                      <button
                        type="button"
                        onClick={() =>
                          setViewerControls((prev) => ({
                            ...prev,
                            [item.id]: {
                              scale: currentControls.scale,
                              repeat: !currentControls.repeat,
                            },
                          }))
                        }
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[11px] font-semibold transition-colors cursor-pointer ${
                          currentControls.repeat
                            ? "bg-primary/20 text-primary border border-primary/40"
                            : "bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                        }`}
                        title={
                          currentControls.repeat
                            ? "Zapnuté bezšvíkové opakovanie v ploche (Kliknutím prepneš na 1 motív)"
                            : "Zobrazený jeden samostatný motív (Kliknutím zapneš opakovanie)"
                        }
                      >
                        {currentControls.repeat ? (
                          <>
                            <Repeat className="w-3 h-3" />
                            <span>Opakovať</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3 h-3" />
                            <span>1 Motív</span>
                          </>
                        )}
                      </button>

                      {/* Zoom / Scale Slider */}
                      <div className="flex items-center gap-1.5">
                        <ZoomIn className="w-3 h-3 text-muted-foreground" />
                        <input
                          type="range"
                          min={0.3}
                          max={2.5}
                          step={0.05}
                          value={currentControls.scale}
                          onChange={(e) =>
                            setViewerControls((prev) => ({
                              ...prev,
                              [item.id]: {
                                repeat: currentControls.repeat,
                                scale: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-16 accent-primary cursor-pointer h-1.5"
                          title="Priblíženie / zmena mierky vzoru"
                        />
                        <span className="font-mono text-[10px] text-foreground w-9 text-right font-bold">
                          {Math.round(currentControls.scale * 100)}%
                        </span>
                      </div>

                      {/* Reset Scale */}
                      <button
                        type="button"
                        onClick={() =>
                          setViewerControls((prev) => ({
                            ...prev,
                            [item.id]: {
                              repeat: activePreview?.defaultRepeat ?? true,
                              scale: activePreview?.defaultScale ?? 1.0,
                            },
                          }))
                        }
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Obnoviť predvolenú mierku"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Presentation Surface Area */}
                <div className="relative w-full h-64 sm:h-72 flex items-center justify-center overflow-hidden select-none">
                  {isViewer ? (
                    // SEAMLESS OR SINGLE MOTIF TILER SURFACE
                    <div
                      className="w-full h-full transition-all duration-150"
                      style={{
                        backgroundImage: `url(${activePreview?.url || DEFAULT_SVG_PATTERN})`,
                        backgroundRepeat: currentControls.repeat ? "repeat" : "no-repeat",
                        backgroundPosition: "center",
                        backgroundSize: currentControls.repeat
                          ? `${currentControls.scale * 60}px ${currentControls.scale * 60}px`
                          : `${currentControls.scale * 140}px ${currentControls.scale * 140}px`,
                      }}
                    />
                  ) : (
                    // STATIC MOCKUP WITH LIGHTBOX TRIGGER
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setActiveLightboxImg({
                          url: activePreview.url,
                          title: itemTitle,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setActiveLightboxImg({
                            url: activePreview.url,
                            title: itemTitle,
                          });
                        }
                      }}
                      className="group/img w-full h-full relative cursor-zoom-in flex items-center justify-center bg-black/40 overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePreview.url}
                        alt={itemTitle}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 rounded-full bg-black/80 text-white">
                          <Maximize2 className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* LOWER INFO & DOWNLOADS ZONE */}
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                    {itemTitle}
                  </h4>
                  {itemDesc && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {itemDesc}
                    </p>
                  )}
                </div>

                {/* Downloads Buttons Bar */}
                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Single Format Download Links */}
                  <div className="flex flex-wrap items-center gap-2">
                    {item.downloads.map((dl, dIdx) => (
                      <a
                        key={dIdx}
                        href={dl.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-[3px] bg-card border border-border/60 hover:border-primary hover:bg-muted/50 text-foreground font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>{resolveI18nText(dl.label, locale) || `.${dl.format}`}</span>
                      </a>
                    ))}
                  </div>

                  {/* Client-side Download All ZIP */}
                  {item.showDownloadAllZip && item.downloads.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDownloadAllZip(item)}
                      disabled={isZipping === item.id}
                      className="px-3 py-1.5 rounded-[3px] bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isZipping === item.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Pripravujem .ZIP...</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Stiahnuť balíček (.ZIP)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN LIGHTBOX FOR STATIC MOCKUPS */}
      {activeLightboxImg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-200"
          onClick={() => setActiveLightboxImg(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxImg.url}
              alt={activeLightboxImg.title}
              className="max-h-[80vh] max-w-full rounded-[3px] object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center justify-between w-full text-xs text-white">
              <span className="font-semibold">{activeLightboxImg.title}</span>
              <button
                type="button"
                onClick={() => setActiveLightboxImg(null)}
                className="px-3 py-1 rounded-[2px] bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
              >
                Zavrieť (ESC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN SETTINGS MODAL (Pencil Hell Free) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-[#0e161d] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#fafbfc]"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-[#fafbfc]">
                  Nastavenia vzorov a patternov (M19)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 bg-[#070b0f] px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setModalTab("patterns")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "patterns"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                1. Položky vzorov ({cfg.items.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab("layout")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "layout"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                2. Rozloženie kariet
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: PATTERNS LIST */}
              {modalTab === "patterns" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#fafbfc] text-xs">
                      Zoznam firemných vzorov a textúr:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: M19PatternItem = {
                          id: `pattern-${Date.now()}`,
                          title: { en: "New Pattern Motif", sk: "Nový vzor" },
                          description: { en: "Description...", sk: "Popis..." },
                          previews: [
                            {
                              id: `prev-${Date.now()}`,
                              type: "pattern_viewer",
                              url: DEFAULT_SVG_PATTERN,
                              label: { en: "Live Pattern", sk: "Živý vzor" },
                              defaultScale: 1.0,
                              defaultRepeat: true,
                            },
                          ],
                          downloads: [
                            {
                              format: "SVG",
                              url: DEFAULT_SVG_PATTERN,
                              label: { en: "Download .SVG", sk: "Stiahnuť .SVG" },
                            },
                          ],
                          showDownloadAllZip: true,
                        };
                        handleSaveConfig({
                          ...cfg,
                          items: [...cfg.items, newItem],
                        });
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-[11px] hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pridať vzor</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {cfg.items.map((pattern, index) => (
                      <div
                        key={pattern.id}
                        className="p-3.5 rounded-[3px] border border-white/10 bg-[#17212a] space-y-3"
                      >
                        {/* Pattern Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <span className="font-bold text-[#fafbfc] truncate">
                            {resolveI18nText(pattern.title, locale) || "Vzor"}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveItem(index, "up")}
                              disabled={index === 0}
                              className="p-1 rounded bg-[#070b0f] border border-white/15 text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Posunúť hore"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(index, "down")}
                              disabled={index === cfg.items.length - 1}
                              className="p-1 rounded bg-[#070b0f] border border-white/15 text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Posunúť dole"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = cfg.items.filter((_, i) => i !== index);
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="p-1 rounded bg-[#070b0f] border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                              title="Zmazať vzor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Názov vzoru:
                            </label>
                            <input
                              type="text"
                              value={typeof pattern.title === "object" ? pattern.title.sk || pattern.title.en || "" : pattern.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = {
                                  ...updated[index],
                                  title: { en: val, sk: val },
                                };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              URL adresa hlavného SVG vzoru / dlaždice:
                            </label>
                            <input
                              type="text"
                              value={pattern.previews[0]?.url || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                if (updated[index].previews.length > 0) {
                                  updated[index].previews[0].url = val;
                                }
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Popis vzoru:
                            </label>
                            <input
                              type="text"
                              value={typeof pattern.description === "object" ? pattern.description.sk || pattern.description.en || "" : pattern.description || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = {
                                  ...updated[index],
                                  description: { en: val, sk: val },
                                };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: LAYOUT */}
              {modalTab === "layout" && (
                <div className="space-y-4 bg-[#17212a] p-4 rounded-[3px] border border-white/10">
                  <div className="space-y-2">
                    <span className="font-semibold text-[#fafbfc] text-xs block">
                      Spôsob zobrazenia:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, layout: "grid" })}
                        className={`p-3 rounded border text-left transition-all ${
                          cfg.layout === "grid"
                            ? "border-primary bg-primary/10 text-[#fafbfc] ring-1 ring-primary/40"
                            : "border-white/10 text-[#96abbe] hover:text-[#fafbfc] bg-[#070b0f]"
                        }`}
                      >
                        <span className="font-bold text-xs block">Mriežka (Grid)</span>
                        <span className="text-[10px] text-[#96abbe]">
                          Karty vzorov vedľa seba v stĺpcoch
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, layout: "stack" })}
                        className={`p-3 rounded border text-left transition-all ${
                          cfg.layout === "stack"
                            ? "border-primary bg-primary/10 text-[#fafbfc] ring-1 ring-primary/40"
                            : "border-white/10 text-[#96abbe] hover:text-[#fafbfc] bg-[#070b0f]"
                        }`}
                      >
                        <span className="font-bold text-xs block">Zoznam (Stack)</span>
                        <span className="text-[10px] text-[#96abbe]">
                          Široké karty pod sebou
                        </span>
                      </button>
                    </div>
                  </div>

                  {cfg.layout === "grid" && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <span className="text-xs font-semibold text-[#fafbfc] block">
                        Počet stĺpcov na veľkých obrazovkách:
                      </span>
                      <div className="flex items-center gap-3">
                        {[1, 2, 3].map((cols) => (
                          <button
                            key={cols}
                            type="button"
                            onClick={() => handleSaveConfig({ ...cfg, columns: cols })}
                            className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${
                              cfg.columns === cols
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-[#070b0f] border-white/15 text-[#96abbe] hover:text-[#fafbfc]"
                            }`}
                          >
                            {cols} {cols === 1 ? "stĺpec" : cols < 5 ? "stĺpce" : "stĺpcov"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
