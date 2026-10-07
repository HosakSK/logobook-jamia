"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  LayoutGrid,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Check,
  Settings2,
  Sparkles,
  MessageSquare,
  MessageSquareOff,
  Eye,
  Loader2,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M10ImageGalleryConfig,
  M10ImageItem,
  m10ImageGallerySchema,
} from "@/lib/validations/modules/m10";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandMediaAction } from "@/actions/media";
import { MediaAsset } from "@/lib/types/media";

export default function M10ObrazokGaleriaModule({
  id: moduleId,
  moduleType = "M10_ObrazokGaleria",
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

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m10ImageGallerySchema.safeParse(config);
    if (res.success) return res.data;
    return {
      columns: 3,
      aspectRatio: "16/9" as const,
      showCaptions: true,
      lightbox: {
        enabled: true,
        backdrop: "frosted_glass" as const,
      },
      images: [
        {
          id: "mockup-1",
          url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
          caption: {
            en: "Apparel & merchandise application on black cotton t-shirt",
            sk: "Aplikácia loga na prémiových bavlnených tričkách",
          },
        },
        {
          id: "mockup-2",
          url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1000&q=80",
          caption: {
            en: "Outdoor architectural signage and building facade branding",
            sk: "Exteriérové architektonické značenie a fasáda budovy",
          },
        },
        {
          id: "mockup-3",
          url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80",
          caption: {
            en: "Corporate stationery, business cards and envelope branding",
            sk: "Firemné tlačoviny, vizitky a korešpondenčné obálky",
          },
        },
      ],
    };
  }, [config]);

  const [cfg, setCfg] = useState<M10ImageGalleryConfig>(parsedConfig);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"list" | "media" | "url" | "settings">("list");

  // Media Library state for bulk picking
  const [brandMedia, setBrandMedia] = useState<MediaAsset[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlCaption, setUrlCaption] = useState("");

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load media when modal opens
  useEffect(() => {
    if (isManageModalOpen && brandId && brandMedia.length === 0) {
      setIsLoadingMedia(true);
      getBrandMediaAction(brandId)
        .then((res) => {
          if (res.success && res.media) {
            setBrandMedia(res.media);
          }
        })
        .catch((err) => console.error("Error loading brand media:", err))
        .finally(() => setIsLoadingMedia(false));
    }
  }, [isManageModalOpen, brandId, brandMedia.length]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M10ImageGalleryConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M10 config:", err);
      }
    }
  };

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === "Escape") {
        setActiveLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev > 0 ? prev - 1 : cfg.images.length - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev < cfg.images.length - 1 ? prev + 1 : 0) : null
        );
      }
    },
    [activeLightboxIndex, cfg.images.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Direct Inline Caption Save
  const handleInlineCaptionSave = async (imageId: string, newText: string) => {
    const updatedImages = cfg.images.map((img) => {
      if (img.id === imageId) {
        const updatedCaption = setI18nText(img.caption, newText, locale);
        return { ...img, caption: updatedCaption };
      }
      return img;
    });
    await handleSaveConfig({ ...cfg, images: updatedImages });
  };

  // Bulk add selected media
  const handleAddSelectedMedia = () => {
    if (selectedMediaIds.length === 0) return;
    const selectedAssets = brandMedia.filter((m) => selectedMediaIds.includes(m.id));

    const newImageItems: M10ImageItem[] = selectedAssets.map((asset) => ({
      id: `media-${asset.id}-${Date.now()}`,
      url: asset.fileUrl || "",
      assetId: asset.id,
      caption: {
        en: asset.fileName.replace(/\.[^/.]+$/, ""),
        sk: asset.fileName.replace(/\.[^/.]+$/, ""),
      },
    }));

    handleSaveConfig({
      ...cfg,
      images: [...cfg.images, ...newImageItems],
    });
    setSelectedMediaIds([]);
    setModalTab("list");
  };

  // Add via URL
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const newItem: M10ImageItem = {
      id: `url-${Date.now()}`,
      url: urlInput.trim(),
      caption: urlCaption.trim()
        ? {
            en: urlCaption.trim(),
            sk: urlCaption.trim(),
          }
        : undefined,
    };
    handleSaveConfig({
      ...cfg,
      images: [...cfg.images, newItem],
    });
    setUrlInput("");
    setUrlCaption("");
    setModalTab("list");
  };

  // Reorder images
  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cfg.images.length) return;
    const items = [...cfg.images];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    handleSaveConfig({ ...cfg, images: items });
  };

  // Delete image
  const handleDeleteImage = (index: number) => {
    const items = cfg.images.filter((_, i) => i !== index);
    handleSaveConfig({ ...cfg, images: items });
  };

  // Grid columns class resolver
  const gridColsClass = useMemo(() => {
    switch (cfg.columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      case 3:
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  }, [cfg.columns]);

  // Aspect ratio class resolver
  const aspectRatioClass = useMemo(() => {
    switch (cfg.aspectRatio) {
      case "1/1":
        return "aspect-square";
      case "4/3":
        return "aspect-4/3";
      case "original":
        return "aspect-auto";
      case "16/9":
      default:
        return "aspect-16/9";
    }
  }, [cfg.aspectRatio]);

  return (
    <div className="relative group/m10 py-4">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m10:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs whitespace-nowrap">
          {/* Columns Selector */}
          <div className="flex items-center border-r border-white/20 pr-1 mr-1">
            <span className="text-[10px] text-white/60 px-1 font-mono uppercase">Stĺpce:</span>
            {[1, 2, 3, 4].map((col) => (
              <button
                key={col}
                type="button"
                title={`${col} stĺpce`}
                onClick={() => handleSaveConfig({ ...cfg, columns: col })}
                className={`px-1.5 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors ${
                  cfg.columns === col
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {col}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center border-r border-white/20 pr-1 mr-1">
            {(
              [
                { id: "16/9", label: "16:9" },
                { id: "4/3", label: "4:3" },
                { id: "1/1", label: "1:1" },
                { id: "original", label: "Orig" },
              ] as const
            ).map((ar) => (
              <button
                key={ar.id}
                type="button"
                title={`Pomer strán: ${ar.label}`}
                onClick={() => handleSaveConfig({ ...cfg, aspectRatio: ar.id })}
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono transition-colors ${
                  cfg.aspectRatio === ar.id
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>

          {/* Show/Hide Captions Toggle */}
          <div className="flex items-center border-r border-white/20 pr-1 mr-1">
            <button
              type="button"
              title={cfg.showCaptions ? "Skryť popisky fotiek" : "Zobraziť popisky fotiek"}
              onClick={() => handleSaveConfig({ ...cfg, showCaptions: !cfg.showCaptions })}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] transition-colors text-[11px] ${
                cfg.showCaptions
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {cfg.showCaptions ? (
                <>
                  <MessageSquare className="w-3 h-3" />
                  <span>Popisky</span>
                </>
              ) : (
                <>
                  <MessageSquareOff className="w-3 h-3" />
                  <span>Bez popiskov</span>
                </>
              )}
            </button>
          </div>

          {/* Gallery Manager Modal Button */}
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs transition-colors hover:opacity-90"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Spravovať galériu ({cfg.images.length})</span>
          </button>
        </div>
      )}

      {/* Main Responsive Grid Layout */}
      {cfg.images.length === 0 ? (
        <div
          className="border-2 border-dashed border-border/60 p-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2"
          style={{ borderRadius: brandRadius }}
        >
          <ImageIcon className="w-8 h-8 opacity-40 text-primary" />
          <span>V galérii zatiaľ nie sú žiadne obrázky.</span>
          {isEditor && (
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="mt-2 px-3 py-1.5 rounded bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90"
            >
              Pridať obrázky
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-4 sm:gap-6 ${gridColsClass}`}>
          {cfg.images.map((item, idx) => {
            const captionText = resolveI18nText(item.caption, locale) || "";
            return (
              <div key={item.id || idx} className="flex flex-col space-y-2 group/card">
                {/* Image Container */}
                <div
                  onClick={() => {
                    if (cfg.lightbox.enabled) {
                      setActiveLightboxIndex(idx);
                    }
                  }}
                  className={`relative w-full overflow-hidden bg-card border border-border/60 shadow-xs transition-all duration-300 ${aspectRatioClass} ${
                    cfg.lightbox.enabled ? "cursor-zoom-in group-hover/card:border-primary/60" : ""
                  }`}
                  style={{ borderRadius: brandRadius }}
                >
                  <img
                    src={item.url}
                    alt={captionText || "Mockup preview"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-103"
                    loading="lazy"
                  />

                  {/* Subtle Lightbox Hover Pill */}
                  {cfg.lightbox.enabled && (
                    <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 absolute top-2.5 right-2.5 p-1.5 rounded-[3px] bg-[#070b0f] text-white border border-white/20 shadow-md">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Caption (Visible only if showCaptions is true) */}
                {cfg.showCaptions && (
                  <div className="px-0.5">
                    {isEditor ? (
                      <InlineEditableText
                        value={captionText}
                        onSave={(newText) => handleInlineCaptionSave(item.id, newText)}
                        placeholder="Zadajte popis obrázka..."
                        className="text-xs text-muted-foreground italic leading-relaxed outline-none focus:ring-1 focus:ring-primary/40 rounded px-1"
                      />
                    ) : (
                      captionText && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {captionText}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX */}
      {activeLightboxIndex !== null && cfg.images[activeLightboxIndex] && (
        <div
          onClick={() => setActiveLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 select-none animate-in fade-in duration-200 bg-black/95"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
        >
          {/* Top Bar: Counter & Close */}
          <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-50 text-[#fafbfc]">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#070b0f] border border-white/20 text-[#fafbfc]">
              {activeLightboxIndex + 1} / {cfg.images.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex(null);
              }}
              className="p-2 rounded bg-[#070b0f] hover:bg-white/10 text-[#fafbfc] border border-white/20 transition-colors"
              title="Zavrieť (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Previous Arrow */}
          {cfg.images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex((prev) =>
                  prev !== null ? (prev > 0 ? prev - 1 : cfg.images.length - 1) : null
                );
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-[#070b0f] hover:bg-white/10 text-[#fafbfc] border border-white/20 transition-transform active:scale-90"
              title="Predchádzajúci (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main Fullscreen Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-full max-h-[80vh] flex flex-col items-center justify-center"
          >
            <img
              src={cfg.images[activeLightboxIndex].url}
              alt=""
              className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded"
            />

            {/* Bottom Caption Bar */}
            {resolveI18nText(cfg.images[activeLightboxIndex].caption, locale) && (
              <div className="mt-3 px-4 py-2 rounded bg-[#070b0f] border border-white/20 text-center max-w-xl">
                <p className="text-xs sm:text-sm text-[#fafbfc] font-medium">
                  {resolveI18nText(cfg.images[activeLightboxIndex].caption, locale)}
                </p>
              </div>
            )}
          </div>

          {/* Next Arrow */}
          {cfg.images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex((prev) =>
                  prev !== null ? (prev < cfg.images.length - 1 ? prev + 1 : 0) : null
                );
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-[#070b0f] hover:bg-white/10 text-[#fafbfc] border border-white/20 transition-transform active:scale-90"
              title="Nasledujúci (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* GALLERY MANAGER MODAL (Add from Media, URL, Reorder, Captions) */}
      {isManageModalOpen && (
        <div
          className="dark fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 text-[#fafbfc]"
          data-theme="dark"
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
                  Správa Mockup Galérie (M10)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
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
                onClick={() => setModalTab("list")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "list"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                Zoznam obrázkov ({cfg.images.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab("media")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "media"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                + Hromadne z Media knižnice
              </button>
              <button
                type="button"
                onClick={() => setModalTab("url")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "url"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                + Pridať cez URL
              </button>
              <button
                type="button"
                onClick={() => setModalTab("settings")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  modalTab === "settings"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                Nastavenia Lightboxu
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="p-5 overflow-y-auto space-y-4 text-xs bg-[#0e161d]"
              style={{ backgroundColor: "#0e161d" }}
            >
              {/* TAB 1: LIST & REORDER */}
              {modalTab === "list" && (
                <div className="space-y-3">
                  {cfg.images.length === 0 ? (
                    <p className="text-[#96abbe] text-center py-6 italic">
                      Zatiaľ nemáte pridané žiadne obrázky.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {cfg.images.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-[#17212a] p-3 rounded-[3px] border border-white/10 flex items-center gap-3"
                        >
                          {/* Thumbnail */}
                          <img
                            src={item.url}
                            alt=""
                            className="w-14 h-10 object-cover rounded-[2px] border border-white/10 shrink-0"
                          />

                          {/* Caption Input */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              value={resolveI18nText(item.caption, locale) || ""}
                              placeholder="Popis obrázka (caption)..."
                              onChange={(e) => {
                                const updated = [...cfg.images];
                                const updatedCap = setI18nText(item.caption, e.target.value, locale);
                                updated[idx] = { ...item, caption: updatedCap };
                                handleSaveConfig({ ...cfg, images: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/20 rounded px-2.5 py-1 text-xs text-[#fafbfc] focus:outline-none focus:border-primary"
                            />
                            <span className="text-[10px] text-[#96abbe] truncate block font-mono">
                              {item.url}
                            </span>
                          </div>

                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, "up")}
                              className="p-1 rounded bg-[#070b0f] border border-white/10 hover:border-white/20 text-[#fafbfc] disabled:opacity-30"
                              title="Posunúť nahor"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === cfg.images.length - 1}
                              onClick={() => handleMoveImage(idx, "down")}
                              className="p-1 rounded bg-[#070b0f] border border-white/10 hover:border-white/20 text-[#fafbfc] disabled:opacity-30"
                              title="Posunúť nadol"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(idx)}
                            className="p-1.5 rounded hover:bg-rose-500/20 text-[#96abbe] hover:text-rose-400 transition-colors shrink-0"
                            title="Odstrániť obrázok"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BULK PICK FROM MEDIA */}
              {modalTab === "media" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#fafbfc] text-xs block">
                        Knižnica fotografií a mockupov značky
                      </span>
                      <span className="text-[11px] text-[#96abbe] block">
                        Zakliknite viacero obrázkov naraz pre hromadné vloženie
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={selectedMediaIds.length === 0}
                      onClick={handleAddSelectedMedia}
                      className="px-3.5 py-1.5 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs transition-opacity disabled:opacity-40 hover:opacity-90"
                    >
                      Pridať vybrané ({selectedMediaIds.length})
                    </button>
                  </div>

                  {isLoadingMedia ? (
                    <div className="text-center py-10 text-[#96abbe] flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Načítavam médiá značky...</span>
                    </div>
                  ) : brandMedia.length === 0 ? (
                    <p className="text-[#96abbe] text-center py-8 italic">
                      V Media knižnici zatiaľ nie sú nahrané žiadne fotografie.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                      {brandMedia.map((m) => {
                        const isSelected = selectedMediaIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMediaIds((prev) =>
                                prev.includes(m.id)
                                  ? prev.filter((id) => id !== m.id)
                                  : [...prev, m.id]
                              );
                            }}
                            className={`relative aspect-4/3 rounded-[3px] border overflow-hidden cursor-pointer group/media transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/40"
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            <img
                              src={m.thumbnailUrl || m.fileUrl}
                              alt={m.fileName}
                              className="w-full h-full object-cover"
                            />
                            {/* Checkbox overlay */}
                            <div
                              className={`absolute top-1.5 right-1.5 p-1 rounded transition-colors ${
                                isSelected ? "bg-primary text-primary-foreground" : "bg-black/60 text-white/50"
                              }`}
                            >
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[9px] truncate text-[#fafbfc] block">
                              {m.fileName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADD VIA URL */}
              {modalTab === "url" && (
                <div className="space-y-4 bg-[#17212a] p-4 rounded-[3px] border border-white/10">
                  <div className="space-y-1">
                    <label className="text-[#96abbe] text-[11px] font-medium">
                      URL adresa fotografie / mockupu *
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      placeholder="https://images.unsplash.com/..."
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-[#070b0f] border border-white/20 rounded-[3px] px-3 py-1.5 text-[#fafbfc] text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#96abbe] text-[11px] font-medium">
                      Popis obrázka (caption, voliteľné)
                    </label>
                    <input
                      type="text"
                      value={urlCaption}
                      placeholder="Aplikácia na vizitkách..."
                      onChange={(e) => setUrlCaption(e.target.value)}
                      className="w-full bg-[#070b0f] border border-white/20 rounded-[3px] px-3 py-1.5 text-[#fafbfc] text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!urlInput.trim()}
                      onClick={handleAddUrl}
                      className="px-4 py-1.5 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs disabled:opacity-40 hover:opacity-90"
                    >
                      Pridať do galérie
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: LIGHTBOX SETTINGS */}
              {modalTab === "settings" && (
                <div className="space-y-4 bg-[#17212a] p-4 rounded-[3px] border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#fafbfc] text-xs block">
                        Celoobrazovkový Lightbox
                      </span>
                      <span className="text-[11px] text-[#96abbe] block">
                        Umožňuje návštevníkovi po kliknutí na fotku otvoriť detail
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cfg.lightbox.enabled}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            lightbox: { ...cfg.lightbox, enabled: e.target.checked },
                          })
                        }
                        className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#070b0f] border-white/20"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-end px-5 py-3 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a]"
              style={{ backgroundColor: "#17212a" }}
            >
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
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
