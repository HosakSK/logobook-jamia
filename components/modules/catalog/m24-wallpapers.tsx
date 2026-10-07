"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  Settings2,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Video,
  Layers,
  X,
  Maximize2,
  Loader2,
  Check,
  Package,
  Tablet,
  Eye,
  Sliders,
} from "lucide-react";
import JSZip from "jszip";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M24WallpapersConfig,
  m24WallpapersSchema,
  M24WallpaperItem,
  M24Category,
  M24FrameType,
  M24Resolutions,
  DEFAULT_M24_WALLPAPERS,
} from "@/lib/validations/modules/m24";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { uploadMediaAction } from "@/actions/media";
import { BrandAsset } from "@/lib/types/asset";

/**
 * Category metadata
 */
const CATEGORY_TABS: { id: string; label: string; icon: any }[] = [
  { id: "all", label: "Všetky tapety", icon: Layers },
  { id: "desktop", label: "Desktop & Notebook", icon: Monitor },
  { id: "mobile", label: "Smartfón", icon: Smartphone },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "virtual_meeting", label: "Videohovory (Teams/Zoom)", icon: Video },
];

/**
 * Fallback vector artwork when wallpaper image URL is not yet uploaded
 */
function WallpaperFallbackGraphic({
  category,
}: {
  category: M24Category;
}) {
  return (
    <div className="w-full h-full bg-[#101820] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Decorative gradient lines */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 pointer-events-none" />
      <div className="w-20 h-20 rounded-2xl bg-[#17212a] border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
        <img
          src="/logo/logo-symbol-light.svg"
          alt="Brand Symbol"
          className="w-12 h-12 object-contain opacity-90"
        />
      </div>

      <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mt-3 z-10">
        Logobook Wallpapers · {category.toUpperCase()}
      </span>
    </div>
  );
}

export default function M24FiremneTapetyAPozadiaModule({
  id: moduleId,
  moduleType = "M24_FiremneTapetyAPozadia",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveRadius, resolveStyles } = useBrandCascade();
  const brandRadius = resolveRadius();
  const params = useParams();
  const brandId = (params?.brandId as string) || "";

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m24WallpapersSchema.safeParse(config);
    if (res.success) {
      return {
        ...res.data,
        wallpapers: res.data.wallpapers.length > 0 ? res.data.wallpapers : DEFAULT_M24_WALLPAPERS,
      };
    }
    return {
      gridColumns: 2,
      showDeviceFrames: true,
      downloadAllZipUrl: null,
      showDownloadAllZip: true,
      wallpapers: DEFAULT_M24_WALLPAPERS,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M24WallpapersConfig>(parsedConfig);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [deviceFramesActive, setDeviceFramesActive] = useState<boolean>(
    parsedConfig.showDeviceFrames
  );
  const [lightboxItem, setLightboxItem] = useState<M24WallpaperItem | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"wallpapers" | "settings">("wallpapers");
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadCallbackRef = useRef<((fileUrl: string) => void) | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
    setDeviceFramesActive(parsedConfig.showDeviceFrames);
  }, [parsedConfig]);

  // Load brand assets for logo / image picker
  useEffect(() => {
    if (brandId && isEditor) {
      getBrandAssetsAction(brandId)
        .then((res) => {
          if (res?.success && res.assets) {
            setBrandAssets(res.assets);
          }
        })
        .catch((err) => console.error("Failed to load brand assets in M24:", err));
    }
  }, [brandId, isEditor]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M24WallpapersConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M24 config:", err);
      }
    }
  };

  // Direct file upload handler
  const handleFileUpload = async (file: File) => {
    setUploadingTarget("active");
    try {
      if (brandId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("fileType", "IMAGE");
        const res = await uploadMediaAction(brandId, formData);
        if (res.success && res.asset?.fileUrl) {
          if (uploadCallbackRef.current) {
            uploadCallbackRef.current(res.asset.fileUrl);
          }
          return;
        }
      }

      // Offline fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl && uploadCallbackRef.current) {
          uploadCallbackRef.current(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload image in M24:", err);
    } finally {
      setUploadingTarget(null);
    }
  };

  // Filtered wallpapers by category
  const displayedWallpapers = useMemo(() => {
    if (activeCategory === "all") return cfg.wallpapers;
    return cfg.wallpapers.filter((wp) => wp.category === activeCategory);
  }, [cfg.wallpapers, activeCategory]);

  // Column classes
  const gridColumnClass = useMemo(() => {
    switch (cfg.gridColumns) {
      case 1:
        return "grid-cols-1";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 2:
      default:
        return "grid-cols-1 md:grid-cols-2";
    }
  }, [cfg.gridColumns]);

  // Download All Wallpapers into a single ZIP archive
  const handleDownloadAllZip = async () => {
    if (cfg.downloadAllZipUrl) {
      window.open(cfg.downloadAllZipUrl, "_blank");
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("brand-wallpapers");

      let addedCount = 0;
      for (const item of cfg.wallpapers) {
        const titleEn = resolveI18nText(item.title, "en").replace(/[^a-zA-Z0-9-_]/g, "_");
        const resList: { key: string; url: string | null }[] = [
          { key: "4k", url: item.resolutions.uhd_4k },
          { key: "qhd", url: item.resolutions.qhd },
          { key: "fhd", url: item.resolutions.fhd },
          { key: "mobile", url: item.resolutions.mobile },
          { key: "tablet", url: item.resolutions.tablet },
        ];

        for (const r of resList) {
          if (r.url && folder) {
            try {
              const resp = await fetch(r.url);
              if (resp.ok) {
                const blob = await resp.blob();
                const ext = r.url.split(".").pop()?.split("?")[0] || "jpg";
                folder.file(`${titleEn}_${r.key}.${ext}`, blob);
                addedCount++;
              }
            } catch (e) {
              console.warn(`Could not add ${r.url} to ZIP:`, e);
            }
          }
        }
      }

      if (folder) {
        const readme = cfg.wallpapers
          .map((w) => `${resolveI18nText(w.title, "en")} (${w.category})`)
          .join("\n");
        folder.file("WALLPAPERS_INDEX.txt", `BRAND WALLPAPERS KIT\n\n${readme}`);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = "brand-wallpapers.zip";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    } catch (err) {
      console.error("Failed to generate Wallpapers ZIP package:", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div
      className="relative group/m24 transition-all duration-200 space-y-6"
      style={{
        borderRadius: brandRadius,
        ...resolveStyles(cfg.styleOverrides),
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />

      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/m24:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#070b0f] border border-white/20 px-2.5 py-1.5 rounded-[3px] shadow-md">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            title="Spravovať firemné tapety a rozlíšenia"
          >
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            <span>Spravovať tapety</span>
          </button>
        </div>
      )}

      {/* Module Header & Optional H3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          {showH3 ? (
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {resolveI18nText(h3Title, locale) || "Firemné tapety a pozadia (Brand Wallpapers)"}
            </h3>
          ) : (
            <h4 className="text-lg font-bold tracking-tight text-foreground">
              Firemné tapety a pozadia
            </h4>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            Oficiálne vizuály na plochu monitora, smartfónu a virtuálne pozadia pre meetingy.
          </p>
        </div>

        {/* Global Controls: Device Frames Switch & Download All ZIP */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Device Frames Toggle */}
          <button
            type="button"
            onClick={() => setDeviceFramesActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              deviceFramesActive
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted border-border/50 text-muted-foreground hover:text-foreground"
            }`}
            title="Prepnúť vizualizáciu v rámoch zariadení"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{deviceFramesActive ? "Rámy zariadení: Zapnuté" : "Rámy zariadení: Vypnuté"}</span>
          </button>

          {/* Download All ZIP */}
          {cfg.showDownloadAllZip && (
            <button
              type="button"
              disabled={isZipping}
              onClick={handleDownloadAllZip}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-90 active:scale-[0.99] transition-all"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Balím ZIP...</span>
                </>
              ) : (
                <>
                  <Package className="w-3.5 h-3.5" />
                  <span>Stiahnuť všetky tapety (ZIP)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/30 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.id === "all"
              ? cfg.wallpapers.length
              : cfg.wallpapers.filter((w) => w.category === tab.id).length;

          if (tab.id !== "all" && count === 0) return null;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  activeCategory === tab.id
                    ? "bg-black/20 text-white"
                    : "bg-black/30 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Wallpapers Grid */}
      <div className={`grid ${gridColumnClass} gap-6 sm:gap-8`}>
        {displayedWallpapers.map((item) => {
          const itemTitle = resolveI18nText(item.title, locale);
          const isMobile = item.frameType === "mobile" || item.category === "mobile";
          const useDeviceFrame = deviceFramesActive && item.frameType !== "none";

          return (
            <div
              key={item.id}
              className="flex flex-col bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs hover:border-border transition-all duration-200"
              style={{ borderRadius: brandRadius }}
            >
              {/* Wallpaper Preview Stage */}
              <div
                className="w-full bg-[#0a0f14] p-4 sm:p-6 flex items-center justify-center relative overflow-hidden select-none border-b border-border/40 group/preview min-h-[220px]"
                onClick={() => setLightboxItem(item)}
              >
                {/* Background dot pattern */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* DEVICE FRAME OR BARE PREVIEW */}
                {useDeviceFrame ? (
                  isMobile ? (
                    /* SMARTPHONE MOCKUP FRAME */
                    <div className="relative w-full max-w-[190px] rounded-[30px] p-2 bg-[#0e161d] border-2 border-neutral-700 shadow-2xl transition-transform duration-300 group-hover/preview:scale-[1.02] cursor-pointer">
                      {/* Top dynamic island cutout */}
                      <div className="absolute top-3 inset-x-0 mx-auto w-12 h-2.5 bg-black rounded-full z-20" />
                      {/* Screen container */}
                      <div className="relative w-full aspect-[9/19.5] rounded-[22px] overflow-hidden bg-black flex items-center justify-center">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={itemTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <WallpaperFallbackGraphic category={item.category} />
                        )}
                      </div>
                    </div>
                  ) : (
                    /* DESKTOP / LAPTOP MOCKUP FRAME */
                    <div className="w-full max-w-[420px] transition-transform duration-300 group-hover/preview:scale-[1.02] cursor-pointer">
                      {/* Display chassis */}
                      <div className="w-full bg-[#1e293b] rounded-t-lg p-2 border border-neutral-700 shadow-2xl">
                        {/* Top camera dot */}
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mx-auto mb-1.5" />
                        {/* Screen */}
                        <div className="relative w-full aspect-video rounded-sm overflow-hidden bg-black flex items-center justify-center">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={itemTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <WallpaperFallbackGraphic category={item.category} />
                          )}
                        </div>
                      </div>
                      {/* Laptop chin / base */}
                      <div className="w-[104%] -ml-[2%] h-2 bg-[#334155] rounded-b-md shadow-md border-t border-neutral-600" />
                      <div className="w-16 h-1 bg-[#1e293b] mx-auto rounded-b" />
                    </div>
                  )
                ) : (
                  /* FRAMELESS CLEAN PREVIEW */
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 shadow-lg cursor-pointer group-hover/preview:scale-[1.01] transition-transform">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={itemTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <WallpaperFallbackGraphic category={item.category} />
                    )}
                  </div>
                )}

                {/* Hover zoom lightbox badge */}
                <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover/preview:opacity-100 transition-opacity bg-black/80 p-1.5 rounded-md text-white/90 hover:text-white pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Wallpaper Details & Download Buttons */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {isEditor ? (
                      <InlineEditableText
                        value={itemTitle}
                        as="h4"
                        className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug"
                        onSave={(val) => {
                          const updated = cfg.wallpapers.map((w) =>
                            w.id === item.id
                              ? { ...w, title: setI18nText(w.title, val, locale) }
                              : w
                          );
                          handleSaveConfig({ ...cfg, wallpapers: updated });
                        }}
                      />
                    ) : (
                      <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug">
                        {itemTitle}
                      </h4>
                    )}

                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold shrink-0 ml-2">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Resolution Download Buttons */}
                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground mr-1 block">
                    Stiahnuť:
                  </span>

                  {item.resolutions.uhd_4k && (
                    <a
                      href={item.resolutions.uhd_4k}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-muted/60 hover:bg-muted border border-border/60 hover:border-primary/50 text-foreground text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3 text-primary" />
                      <span>4K UHD (3840×2160)</span>
                    </a>
                  )}

                  {item.resolutions.qhd && (
                    <a
                      href={item.resolutions.qhd}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-muted/60 hover:bg-muted border border-border/60 hover:border-primary/50 text-foreground text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3 text-primary" />
                      <span>QHD (2560×1440)</span>
                    </a>
                  )}

                  {item.resolutions.fhd && (
                    <a
                      href={item.resolutions.fhd}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-muted/60 hover:bg-muted border border-border/60 hover:border-primary/50 text-foreground text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3 text-primary" />
                      <span>FHD (1920×1080)</span>
                    </a>
                  )}

                  {item.resolutions.mobile && (
                    <a
                      href={item.resolutions.mobile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-muted/60 hover:bg-muted border border-border/60 hover:border-primary/50 text-foreground text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3 text-primary" />
                      <span>Mobile (1170×2532)</span>
                    </a>
                  )}

                  {item.resolutions.tablet && (
                    <a
                      href={item.resolutions.tablet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-muted/60 hover:bg-muted border border-border/60 hover:border-primary/50 text-foreground text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3 text-primary" />
                      <span>Tablet (2048×2732)</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN LIGHTBOX INSPECTION DIALOG */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-200"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="w-full max-w-5xl bg-[#0e161d] border border-[rgba(63,85,102,0.45)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#fafbfc]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a]">
              <div>
                <h4 className="font-bold text-[#fafbfc] text-sm">
                  {resolveI18nText(lightboxItem.title, locale)}
                </h4>
                <span className="text-[10px] font-mono text-[#96abbe] uppercase">
                  {lightboxItem.category} Wallpaper
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-[#070b0f] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image Preview */}
            <div className="p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-black/60 min-h-[360px]">
              {lightboxItem.previewUrl ? (
                <img
                  src={lightboxItem.previewUrl}
                  alt={resolveI18nText(lightboxItem.title, locale)}
                  className="max-h-[60vh] max-w-full object-contain rounded-md shadow-2xl"
                />
              ) : (
                <WallpaperFallbackGraphic category={lightboxItem.category} />
              )}
            </div>

            {/* Lightbox Footer with Resolution Downloads */}
            <div className="p-4 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#96abbe] font-mono">
                Vyberte rozlíšenie pre stiahnutie:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {lightboxItem.resolutions.uhd_4k && (
                  <a
                    href={lightboxItem.resolutions.uhd_4k}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>4K UHD (3840×2160)</span>
                  </a>
                )}

                {lightboxItem.resolutions.qhd && (
                  <a
                    href={lightboxItem.resolutions.qhd}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-[#070b0f] hover:bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>QHD (2560×1440)</span>
                  </a>
                )}

                {lightboxItem.resolutions.fhd && (
                  <a
                    href={lightboxItem.resolutions.fhd}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-[#070b0f] hover:bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>FHD (1920×1080)</span>
                  </a>
                )}

                {lightboxItem.resolutions.mobile && (
                  <a
                    href={lightboxItem.resolutions.mobile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-[#070b0f] hover:bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Mobile (1170×2532)</span>
                  </a>
                )}

                {lightboxItem.resolutions.tablet && (
                  <a
                    href={lightboxItem.resolutions.tablet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-[#070b0f] hover:bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Tablet (2048×2732)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN SETTINGS MODAL / SHEET                             */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-[#0e161d] border border-[rgba(63,85,102,0.45)] rounded-[var(--brand-radius,6px)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#fafbfc]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-[#fafbfc] text-sm tracking-tight">
                  Správa firemných tapiet (M24)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-[#070b0f] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-[rgba(63,85,102,0.45)] bg-[#070b0f] px-5 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTab("wallpapers")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "wallpapers"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Zoznam tapiet ({cfg.wallpapers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("settings")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "settings"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Mriežka & ZIP Balíček</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-[#0e161d]">
              {/* TAB 1: WALLPAPERS LIST */}
              {modalTab === "wallpapers" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs">
                        Zoznam tapiet a rozlíšení
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Pridajte tapety a doplňte URL odkazy pre jednotlivé rozlíšenia (4K, QHD, FHD,
                        Mobile).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newWp: M24WallpaperItem = {
                          id: `wp-${Date.now()}`,
                          title: { en: "New Brand Wallpaper", sk: "Nová firemná tapeta" },
                          category: "desktop",
                          previewUrl: "",
                          frameType: "desktop",
                          resolutions: {
                            uhd_4k: null,
                            qhd: null,
                            fhd: null,
                            mobile: null,
                            tablet: null,
                          },
                        };
                        handleSaveConfig({
                          ...cfg,
                          wallpapers: [...cfg.wallpapers, newWp],
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-[var(--brand-radius,4px)] text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pridať tapetu</span>
                    </button>
                  </div>

                  {/* Wallpaper Items List */}
                  <div className="space-y-4">
                    {cfg.wallpapers.map((wp, index) => (
                      <div
                        key={wp.id}
                        className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded-lg p-4 space-y-3"
                      >
                        {/* Header: Category & Frame Type + Delete */}
                        <div className="flex items-center justify-between border-b border-[rgba(63,85,102,0.45)] pb-2">
                          <div className="flex items-center gap-2">
                            {/* Category Select */}
                            <select
                              value={wp.category}
                              onChange={(e) => {
                                const updated = [...cfg.wallpapers];
                                updated[index] = {
                                  ...updated[index],
                                  category: e.target.value as M24Category,
                                };
                                handleSaveConfig({ ...cfg, wallpapers: updated });
                              }}
                              className="bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] font-semibold focus:border-primary focus:outline-none"
                            >
                              <option value="desktop">Desktop</option>
                              <option value="mobile">Smartfón</option>
                              <option value="tablet">Tablet</option>
                              <option value="virtual_meeting">Videohovory</option>
                            </select>

                            {/* Frame Type Select */}
                            <select
                              value={wp.frameType}
                              onChange={(e) => {
                                const updated = [...cfg.wallpapers];
                                updated[index] = {
                                  ...updated[index],
                                  frameType: e.target.value as M24FrameType,
                                };
                                handleSaveConfig({ ...cfg, wallpapers: updated });
                              }}
                              className="bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            >
                              <option value="desktop">Rám: Notebook / Monitor</option>
                              <option value="mobile">Rám: Smartfón</option>
                              <option value="none">Bez rámu (Čistý náhľad)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = cfg.wallpapers.filter((_, i) => i !== index);
                              handleSaveConfig({ ...cfg, wallpapers: updated });
                            }}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Zmazať tapetu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title SK & EN */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Názov tapety (SK):
                            </label>
                            <input
                              type="text"
                              value={
                                typeof wp.title === "object"
                                  ? wp.title.sk || wp.title.en || ""
                                  : wp.title
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.wallpapers];
                                updated[index] = {
                                  ...updated[index],
                                  title: setI18nText(updated[index].title, val, "sk"),
                                };
                                handleSaveConfig({ ...cfg, wallpapers: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Názov tapety (EN):
                            </label>
                            <input
                              type="text"
                              value={
                                typeof wp.title === "object"
                                  ? wp.title.en || ""
                                  : wp.title
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.wallpapers];
                                updated[index] = {
                                  ...updated[index],
                                  title: setI18nText(updated[index].title, val, "en"),
                                };
                                handleSaveConfig({ ...cfg, wallpapers: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Preview Image URL & Upload */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Náhľadový obrázok (Preview):
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                uploadCallbackRef.current = (url) => {
                                  const updated = [...cfg.wallpapers];
                                  updated[index].previewUrl = url;
                                  handleSaveConfig({ ...cfg, wallpapers: updated });
                                };
                                fileInputRef.current?.click();
                              }}
                              className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Nahrať JPG/PNG</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="https://... URL náhľadu"
                            value={wp.previewUrl}
                            onChange={(e) => {
                              const updated = [...cfg.wallpapers];
                              updated[index].previewUrl = e.target.value;
                              handleSaveConfig({ ...cfg, wallpapers: updated });
                            }}
                            className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:border-primary focus:outline-none"
                          />
                        </div>

                        {/* Resolution URLs */}
                        <div className="pt-2 border-t border-[rgba(63,85,102,0.45)] space-y-2">
                          <span className="text-[11px] font-semibold text-[#fafbfc] block">
                            Odkazy na stiahnutie jednotlivých rozlíšení:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {/* 4K UHD */}
                            <div className="space-y-1 bg-[#070b0f] p-2 rounded border border-[rgba(63,85,102,0.45)]">
                              <span className="text-[10px] font-mono text-[#96abbe] block font-bold">
                                4K UHD (3840×2160):
                              </span>
                              <input
                                type="text"
                                placeholder="https://... URL 4K súboru"
                                value={wp.resolutions.uhd_4k || ""}
                                onChange={(e) => {
                                  const updated = [...cfg.wallpapers];
                                  updated[index].resolutions.uhd_4k = e.target.value || null;
                                  handleSaveConfig({ ...cfg, wallpapers: updated });
                                }}
                                className="w-full bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:outline-none"
                              />
                            </div>

                            {/* QHD */}
                            <div className="space-y-1 bg-[#070b0f] p-2 rounded border border-[rgba(63,85,102,0.45)]">
                              <span className="text-[10px] font-mono text-[#96abbe] block font-bold">
                                QHD (2560×1440):
                              </span>
                              <input
                                type="text"
                                placeholder="https://... URL QHD súboru"
                                value={wp.resolutions.qhd || ""}
                                onChange={(e) => {
                                  const updated = [...cfg.wallpapers];
                                  updated[index].resolutions.qhd = e.target.value || null;
                                  handleSaveConfig({ ...cfg, wallpapers: updated });
                                }}
                                className="w-full bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:outline-none"
                              />
                            </div>

                            {/* FHD */}
                            <div className="space-y-1 bg-[#070b0f] p-2 rounded border border-[rgba(63,85,102,0.45)]">
                              <span className="text-[10px] font-mono text-[#96abbe] block font-bold">
                                FHD 1080p (1920×1080):
                              </span>
                              <input
                                type="text"
                                placeholder="https://... URL FHD súboru"
                                value={wp.resolutions.fhd || ""}
                                onChange={(e) => {
                                  const updated = [...cfg.wallpapers];
                                  updated[index].resolutions.fhd = e.target.value || null;
                                  handleSaveConfig({ ...cfg, wallpapers: updated });
                                }}
                                className="w-full bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:outline-none"
                              />
                            </div>

                            {/* Mobile */}
                            <div className="space-y-1 bg-[#070b0f] p-2 rounded border border-[rgba(63,85,102,0.45)]">
                              <span className="text-[10px] font-mono text-[#96abbe] block font-bold">
                                Mobile (1170×2532):
                              </span>
                              <input
                                type="text"
                                placeholder="https://... URL Mobile súboru"
                                value={wp.resolutions.mobile || ""}
                                onChange={(e) => {
                                  const updated = [...cfg.wallpapers];
                                  updated[index].resolutions.mobile = e.target.value || null;
                                  handleSaveConfig({ ...cfg, wallpapers: updated });
                                }}
                                className="w-full bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:outline-none"
                              />
                            </div>

                            {/* Tablet */}
                            <div className="space-y-1 bg-[#070b0f] p-2 rounded border border-[rgba(63,85,102,0.45)] sm:col-span-2">
                              <span className="text-[10px] font-mono text-[#96abbe] block font-bold">
                                Tablet (2048×2732):
                              </span>
                              <input
                                type="text"
                                placeholder="https://... URL Tablet súboru"
                                value={wp.resolutions.tablet || ""}
                                onChange={(e) => {
                                  const updated = [...cfg.wallpapers];
                                  updated[index].resolutions.tablet = e.target.value || null;
                                  handleSaveConfig({ ...cfg, wallpapers: updated });
                                }}
                                className="w-full bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: SETTINGS & ZIP */}
              {modalTab === "settings" && (
                <div className="space-y-6">
                  {/* Grid Columns */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Rozloženie mriežky tapiet
                    </h4>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3].map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() => handleSaveConfig({ ...cfg, gridColumns: cols })}
                          className={`flex-1 py-2 rounded-[var(--brand-radius,4px)] border text-xs font-bold transition-all ${
                            cfg.gridColumns === cols
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-[#070b0f] border-[rgba(63,85,102,0.45)] text-[#96abbe] hover:text-[#fafbfc]"
                          }`}
                        >
                          {cols} {cols === 1 ? "stĺpec" : cols < 5 ? "stĺpce" : "stĺpcov"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Device Frames Default */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Rámy zariadení (Device Frames)
                    </h4>
                    <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer">
                      <span className="text-xs text-[#fafbfc] font-medium">
                        Zobraziť tapety v rámoch zariadení predvolene
                      </span>
                      <input
                        type="checkbox"
                        checked={cfg.showDeviceFrames}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...cfg,
                            showDeviceFrames: e.target.checked,
                          })
                        }
                        className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Download All ZIP Settings */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Hromadný ZIP balíček tapiet
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer">
                        <span className="text-xs text-[#fafbfc] font-medium">
                          Zobraziť tlačidlo na stiahnutie všetkých tapiet
                        </span>
                        <input
                          type="checkbox"
                          checked={cfg.showDownloadAllZip}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              showDownloadAllZip: e.target.checked,
                            })
                          }
                          className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#fafbfc] block">
                          Vlastná URL adresa ZIP archívu (voliteľné):
                        </label>
                        <input
                          type="text"
                          placeholder="https://drive.google.com/... alebo nechajte prázdne pre automatický JSZip"
                          value={cfg.downloadAllZipUrl || ""}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              downloadAllZipUrl: e.target.value || null,
                            })
                          }
                          className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:border-primary focus:outline-none"
                        />
                        <span className="text-[10px] text-[#96abbe] block">
                          Ak ponecháte prázdne, systém vygeneruje ZIP súbor automaticky priamo v
                          prehliadači zo všetkých dostupných rozlíšení.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a]">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-[var(--brand-radius,4px)] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
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
