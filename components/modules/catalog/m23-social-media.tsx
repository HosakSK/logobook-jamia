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
  Check,
  X,
  Sparkles,
  Layers,
  Circle,
  Eye,
  EyeOff,
  ExternalLink,
  Share2,
  FileCode,
  Loader2,
  Filter,
  Package,
} from "lucide-react";
import JSZip from "jszip";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M23SocialMediaConfig,
  m23SocialMediaSchema,
  M23FormatItem,
  M23DownloadItem,
  M23Platform,
  M23FormatType,
  M23DownloadFormat,
  DEFAULT_M23_FORMATS,
} from "@/lib/validations/modules/m23";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { uploadMediaAction } from "@/actions/media";
import { BrandAsset } from "@/lib/types/asset";

/**
 * Platform definitions with titles & icons
 */
const PLATFORM_INFO: Record<
  M23Platform,
  { label: string; short: string; color: string }
> = {
  instagram: { label: "Instagram", short: "IG", color: "#E1306C" },
  linkedin: { label: "LinkedIn", short: "LI", color: "#0A66C2" },
  facebook: { label: "Facebook", short: "FB", color: "#1877F2" },
  youtube: { label: "YouTube", short: "YT", color: "#FF0000" },
  x: { label: "X (Twitter)", short: "X", color: "#FFFFFF" },
  tiktok: { label: "TikTok", short: "TT", color: "#00F2FE" },
  custom: { label: "Ostatné / Vlastné", short: "Custom", color: "#10B981" },
};

/**
 * Typographic badges for download formats (No trademarked logos!)
 */
function FormatBadge({ format }: { format: M23DownloadFormat }) {
  switch (format) {
    case "PNG":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          PNG
        </span>
      );
    case "PSD":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
          PSD
        </span>
      );
    case "FIGMA":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30">
          FIGMA
        </span>
      );
    case "AI":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
          AI
        </span>
      );
    case "ZIP":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
          ZIP
        </span>
      );
    case "SVG":
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-teal-500/20 text-teal-400 border border-teal-500/30">
          SVG
        </span>
      );
    default:
      return (
        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-neutral-800 text-neutral-300 border border-border">
          {format}
        </span>
      );
  }
}

/**
 * Fallback vector mockups for each format type if no custom preview image is uploaded
 */
function SocialFormatFallbackMockup({
  item,
  isDark = true,
}: {
  item: M23FormatItem;
  isDark?: boolean;
}) {
  const { type, platform, dimensions } = item;
  const logoSymbol = isDark ? "/logo/logo-symbol-light.svg" : "/logo/logo-symbol-dark.svg";

  // 1. AVATAR FALLBACK
  if (type === "avatar") {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-6 select-none relative overflow-hidden ${
          isDark ? "bg-[#111922] text-white" : "bg-muted/30 text-[#0e161d]"
        }`}
      >
        <div
          className={`w-24 h-24 rounded-full border flex items-center justify-center shadow-lg relative ${
            isDark ? "bg-[#17212a] border-white/10" : "bg-card border-border/80"
          }`}
        >
          <img
            src={logoSymbol}
            alt="Brand Avatar"
            className="w-14 h-14 object-contain drop-shadow-xs"
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-3">
          {platform} Avatar · {dimensions.width}×{dimensions.height}
        </span>
      </div>
    );
  }

  // 2. STORY / REEL (9:16)
  if (type === "story") {
    return (
      <div
        className={`w-full h-full p-5 flex flex-col justify-between select-none relative overflow-hidden ${
          isDark ? "bg-[#0a0f14] text-white" : "bg-white text-[#0e161d]"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full p-1 border flex items-center justify-center ${
                isDark ? "bg-[#17212a] border-white/10" : "bg-muted border-border/60"
              }`}
            >
              <img src={logoSymbol} alt="Icon" className="w-4 h-4 object-contain" />
            </div>
            <span
              className={`text-xs font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#0e161d]"
              }`}
            >
              Logobook
            </span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">9:16</span>
        </div>

        <div className="my-auto text-center space-y-2">
          <img
            src={logoSymbol}
            alt="Story Symbol"
            className="w-14 h-14 object-contain mx-auto opacity-80"
          />
          <span
            className={`text-sm font-bold block ${
              isDark ? "text-white" : "text-[#0e161d]"
            }`}
          >
            Story & Reel Cover
          </span>
          <span className="text-[10px] text-muted-foreground block font-mono">
            {dimensions.width} × {dimensions.height} px
          </span>
        </div>

        <div className="text-center">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
            Swipe Up · View Link
          </span>
        </div>
      </div>
    );
  }

  // 3. COVER / BANNER
  if (type === "cover") {
    return (
      <div
        className={`w-full h-full p-5 flex items-center justify-between select-none relative overflow-hidden ${
          isDark ? "bg-[#111922] text-white" : "bg-[#f1f4f7] text-[#0e161d]"
        }`}
      >
        <div className="flex items-center gap-3 z-10">
          <img
            src={logoSymbol}
            alt="Logo"
            className="w-10 h-10 object-contain drop-shadow-xs"
          />
          <div>
            <span
              className={`text-sm font-bold block tracking-tight ${
                isDark ? "text-white" : "text-[#0e161d]"
              }`}
            >
              Logobook Studio
            </span>
            <span className="text-[10px] font-mono text-muted-foreground block">
              Official {platform.toUpperCase()} Cover Banner
            </span>
          </div>
        </div>

        <div className="z-10 text-right font-mono text-[10px] text-muted-foreground">
          <span>{dimensions.width} × {dimensions.height} px</span>
        </div>
      </div>
    );
  }

  // 4. POST (Feed)
  return (
    <div
      className={`w-full h-full p-6 flex flex-col justify-between select-none relative overflow-hidden ${
        isDark ? "bg-[#111922] text-white" : "bg-card text-[#0e161d]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          {platform} Post
        </span>
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>

      <div className="my-auto text-center space-y-2">
        <img
          src={logoSymbol}
          alt="Symbol"
          className="w-16 h-16 object-contain mx-auto"
        />
        <span
          className={`text-sm font-bold tracking-tight block ${
            isDark ? "text-white" : "text-[#0e161d]"
          }`}
        >
          Social Feed Template
        </span>
        <span className="text-[10px] font-mono text-muted-foreground block">
          {dimensions.width} × {dimensions.height} px
        </span>
      </div>

      <div
        className={`flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-2 border-t ${
          isDark ? "border-white/5" : "border-black/5"
        }`}
      >
        <span>Brand Identity System</span>
        <span>RGB / 72 DPI</span>
      </div>
    </div>
  );
}

export default function M23SocialMediaModule({
  id: moduleId,
  moduleType = "M23_SocialMedia",
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
    const res = m23SocialMediaSchema.safeParse(config);
    if (res.success) {
      return {
        ...res.data,
        formats: res.data.formats.length > 0 ? res.data.formats : DEFAULT_M23_FORMATS,
      };
    }
    return {
      platforms: ["instagram", "linkedin", "facebook", "youtube", "x"] as M23Platform[],
      formats: DEFAULT_M23_FORMATS,
      downloadAllZipUrl: null,
      showDownloadAllZip: true,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M23SocialMediaConfig>(parsedConfig);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [circularMaskStates, setCircularMaskStates] = useState<Record<string, boolean>>({});
  const [isZipping, setIsZipping] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"formats" | "settings">("formats");
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [uploadingFormatId, setUploadingFormatId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetUploadFormatIdRef = useRef<string | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
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
        .catch((err) => console.error("Failed to load brand assets in M23:", err));
    }
  }, [brandId, isEditor]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M23SocialMediaConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M23 config:", err);
      }
    }
  };

  // Direct file upload for format preview
  const handleFileUpload = async (formatId: string, file: File) => {
    setUploadingFormatId(formatId);
    try {
      if (brandId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("fileType", "IMAGE");
        const res = await uploadMediaAction(brandId, formData);
        if (res.success && res.asset?.fileUrl) {
          const fileUrl = res.asset.fileUrl;
          const updated = cfg.formats.map((f) =>
            f.id === formatId ? { ...f, previewUrl: fileUrl } : f
          );
          handleSaveConfig({ ...cfg, formats: updated });
          return;
        }
      }

      // Offline fallback to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const updated = cfg.formats.map((f) =>
            f.id === formatId ? { ...f, previewUrl: dataUrl } : f
          );
          handleSaveConfig({ ...cfg, formats: updated });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload format preview in M23:", err);
    } finally {
      setUploadingFormatId(null);
    }
  };

  // Filtered formats by active platform tab
  const displayedFormats = useMemo(() => {
    if (activeTab === "all") return cfg.formats;
    return cfg.formats.filter((f) => f.platform === activeTab);
  }, [cfg.formats, activeTab]);

  // Active platforms present in the formats list
  const activePlatforms = useMemo(() => {
    const list: string[] = ["all"];
    cfg.platforms.forEach((p) => {
      if (cfg.formats.some((f) => f.platform === p)) {
        list.push(p);
      }
    });
    return list;
  }, [cfg.platforms, cfg.formats]);

  // Toggle circular masking overlay for avatar
  const toggleCircularMask = (formatId: string) => {
    setCircularMaskStates((prev) => ({
      ...prev,
      [formatId]: !prev[formatId],
    }));
  };

  // Download All as ZIP bundle using JSZip
  const handleDownloadAllZip = async () => {
    if (cfg.downloadAllZipUrl) {
      window.open(cfg.downloadAllZipUrl, "_blank");
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("social-media-kit");

      let addedCount = 0;
      for (const item of cfg.formats) {
        const fileUrl = item.previewUrl || (item.downloads[0]?.url ? item.downloads[0].url : "");
        if (fileUrl && folder) {
          try {
            const resp = await fetch(fileUrl);
            if (resp.ok) {
              const blob = await resp.blob();
              const ext = fileUrl.split(".").pop()?.split("?")[0] || "png";
              folder.file(`${item.platform}_${item.type}_${item.dimensions.width}x${item.dimensions.height}.${ext}`, blob);
              addedCount++;
            }
          } catch (e) {
            console.warn(`Could not add ${fileUrl} to ZIP:`, e);
          }
        }
      }

      // If no remote files could be fetched, add a readme with dimensions
      if (folder) {
        const readmeContent = cfg.formats
          .map(
            (f) =>
              `${f.platform.toUpperCase()} - ${resolveI18nText(f.title, "en")}: ${f.dimensions.width}x${f.dimensions.height}px`
          )
          .join("\n");
        folder.file("SPECIFICATIONS.txt", `SOCIAL MEDIA ASSET SPECIFICATIONS\n\n${readmeContent}`);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = "social-media-kit.zip";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    } catch (err) {
      console.error("Failed to generate ZIP package:", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div
      className="relative group/m23 transition-all duration-200 space-y-6"
      style={{
        borderRadius: brandRadius,
        ...resolveStyles(cfg.styleOverrides),
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && targetUploadFormatIdRef.current) {
            handleFileUpload(targetUploadFormatIdRef.current, file);
          }
          e.target.value = "";
        }}
      />

      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/m23:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#070b0f] border border-white/20 px-2.5 py-1.5 rounded-[3px] shadow-md">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            title="Spravovať formáty sociálnych sietí"
          >
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            <span>Spravovať formáty</span>
          </button>
        </div>
      )}

      {/* Module Header & Optional H3 Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          {showH3 ? (
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {resolveI18nText(h3Title, locale) || "Sociálne siete a bannery (Social Media Kit)"}
            </h3>
          ) : (
            <h4 className="text-lg font-bold tracking-tight text-foreground">
              Sociálne siete a bannery
            </h4>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            Pripravené grafické formáty, presné rozmery v pixeloch a šablóny na stiahnutie.
          </p>
        </div>

        {/* Global Download All ZIP Button */}
        {cfg.showDownloadAllZip && (
          <button
            type="button"
            disabled={isZipping}
            onClick={handleDownloadAllZip}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-90 active:scale-[0.99] transition-all self-start sm:self-auto"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Balím ZIP...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>Stiahnuť celý Social Kit (ZIP)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Platform Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/30 scrollbar-none">
        {activePlatforms.map((plat) => {
          const isAll = plat === "all";
          const info = !isAll ? PLATFORM_INFO[plat as M23Platform] : null;
          const count = isAll
            ? cfg.formats.length
            : cfg.formats.filter((f) => f.platform === plat).length;

          return (
            <button
              key={plat}
              type="button"
              onClick={() => setActiveTab(plat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === plat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{isAll ? "Všetky formáty" : info?.label || plat}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  activeTab === plat ? "bg-black/20 text-white" : "bg-black/30 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Formats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedFormats.map((item) => {
          const itemTitle = resolveI18nText(item.title, locale);
          const isAvatar = item.type === "avatar";
          const isMaskActive = circularMaskStates[item.id] ?? false;
          const platInfo = PLATFORM_INFO[item.platform];

          // Compute aspect ratio for card preview box
          const previewAspect =
            item.type === "story"
              ? "aspect-[9/16] max-h-[320px]"
              : item.type === "cover"
              ? "aspect-[16/7] max-h-[220px]"
              : item.type === "post"
              ? "aspect-[4/5] max-h-[280px]"
              : "aspect-square max-h-[260px]";

          return (
            <div
              key={item.id}
              className="flex flex-col bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs hover:border-border transition-all duration-200"
              style={{ borderRadius: brandRadius }}
            >
              {/* Card Preview Container */}
              <div
                className={`relative w-full ${previewAspect} mx-auto flex items-center justify-center bg-muted/30 overflow-hidden border-b border-border/40 select-none group/preview`}
              >
                {/* Artwork / Preview Image */}
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={itemTitle}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                ) : (
                  <SocialFormatFallbackMockup item={item} isDark={isManualDark} />
                )}

                {/* Circular Masking Overlay for Avatars */}
                {isAvatar && isMaskActive && (
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    {/* Dark radial mask cutout */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at center, transparent 48.5%, rgba(0, 0, 0, 0.78) 49.5%)",
                      }}
                    />
                    {/* Dashed circular outline */}
                    <div className="w-[96%] h-[96%] rounded-full border border-dashed border-white/70 absolute pointer-events-none" />
                    <span className="absolute bottom-2 px-2 py-0.5 rounded bg-black/85 text-[9px] font-mono text-white/90 shadow-sm">
                      Kruhový orez aplikácie (Safe zone)
                    </span>
                  </div>
                )}

                {/* Top Badges: Platform & Dimensions */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/80 text-white border border-white/10">
                    {platInfo?.label || item.platform}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/60 text-white/80 border border-white/5">
                    {item.type}
                  </span>
                </div>

                {/* Circular Mask Toggle Button for Avatars */}
                {isAvatar && (
                  <button
                    type="button"
                    onClick={() => toggleCircularMask(item.id)}
                    className={`absolute bottom-2.5 right-2.5 z-30 px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 transition-all shadow-md ${
                      isMaskActive
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-black/75 hover:bg-black text-white/80 border border-white/20"
                    }`}
                    title="Prepnúť simuláciu kruhového orezu"
                  >
                    <Circle className="w-3 h-3" />
                    <span>{isMaskActive ? "Kruh aktívny" : "Kruhový orez"}</span>
                  </button>
                )}
              </div>

              {/* Card Meta & Download Actions */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {isEditor ? (
                      <InlineEditableText
                        value={itemTitle}
                        as="h4"
                        className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug"
                        onSave={(val) => {
                          const updated = cfg.formats.map((f) =>
                            f.id === item.id
                              ? { ...f, title: setI18nText(f.title, val, locale) }
                              : f
                          );
                          handleSaveConfig({ ...cfg, formats: updated });
                        }}
                      />
                    ) : (
                      <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug">
                        {itemTitle}
                      </h4>
                    )}

                    <span className="font-mono text-xs font-bold text-primary shrink-0 ml-2">
                      {item.dimensions.width} × {item.dimensions.height} px
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground block">
                    Pomer strán:{" "}
                    {item.dimensions.width === item.dimensions.height
                      ? "1:1"
                      : `${(item.dimensions.width / item.dimensions.height).toFixed(2)}:1`}
                  </span>
                </div>

                {/* Downloads Buttons */}
                <div className="pt-2 border-t border-border/30 flex flex-wrap items-center gap-2">
                  {item.downloads.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">
                      Žiadne priložené šablóny
                    </span>
                  ) : (
                    item.downloads.map((dl) => {
                      const dlLabel = resolveI18nText(dl.label, locale);
                      return (
                        <a
                          key={dl.id}
                          href={dl.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/60 hover:bg-muted border border-border/50 text-foreground text-xs font-medium transition-colors"
                        >
                          <FormatBadge format={dl.format} />
                          <span className="truncate max-w-[140px] text-[11px]">{dlLabel}</span>
                          <Download className="w-3 h-3 text-muted-foreground shrink-0" />
                        </a>
                      );
                    })
                  )}

                  {/* Fast upload preview button in editor */}
                  {isEditor && (
                    <button
                      type="button"
                      disabled={uploadingFormatId === item.id}
                      onClick={() => {
                        targetUploadFormatIdRef.current = item.id;
                        fileInputRef.current?.click();
                      }}
                      className="ml-auto text-[10px] text-primary hover:underline flex items-center gap-1 font-mono"
                    >
                      {uploadingFormatId === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>Nahrať náhľad</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* ADMIN SETTINGS MODAL / SHEET                             */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-150"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        >
          <div
            className="w-full max-w-3xl bg-[#0e161d] border border-[rgba(63,85,102,0.45)] rounded-[var(--brand-radius,6px)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#fafbfc]"
            style={{ backgroundColor: "#0e161d" }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a]"
              style={{ backgroundColor: "#17212a" }}
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-[#fafbfc] text-sm tracking-tight">
                  Správa formátov pre sociálne siete (M23)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-[#1f2c36] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div
              className="flex items-center border-b border-[rgba(63,85,102,0.45)] bg-[#17212a] px-5 gap-2 pt-2"
              style={{ backgroundColor: "#17212a" }}
            >
              <button
                type="button"
                onClick={() => setModalTab("formats")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  modalTab === "formats"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Formáty ({cfg.formats.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("settings")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  modalTab === "settings"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Platformy & ZIP Balíček</span>
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="p-5 overflow-y-auto space-y-6 flex-1 bg-[#0e161d]"
              style={{ backgroundColor: "#0e161d" }}
            >
              {/* TAB 1: FORMATS MANAGER */}
              {modalTab === "formats" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs">
                        Zoznam šablón a formátov
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Definujte rozlíšenia a priraďte sťahovacie súbory pre jednotlivé siete.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newFmt: M23FormatItem = {
                          id: `fmt-${Date.now()}`,
                          platform: "instagram",
                          type: "post",
                          title: {
                            en: "New Social Format",
                            sk: "Nový formát sociálnej siete",
                          },
                          dimensions: { width: 1080, height: 1080 },
                          previewUrl: "",
                          downloads: [],
                        };
                        handleSaveConfig({
                          ...cfg,
                          formats: [...cfg.formats, newFmt],
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-[var(--brand-radius,4px)] text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pridať formát</span>
                    </button>
                  </div>

                  {/* Formats Items */}
                  <div className="space-y-4">
                    {cfg.formats.map((fmt, index) => (
                      <div
                        key={fmt.id}
                        className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded-lg p-4 space-y-3"
                      >
                        {/* Header: Platform & Type select + Delete */}
                        <div className="flex items-center justify-between border-b border-[rgba(63,85,102,0.45)] pb-2">
                          <div className="flex items-center gap-2">
                            {/* Platform Select */}
                            <select
                              value={fmt.platform}
                              onChange={(e) => {
                                const updated = [...cfg.formats];
                                updated[index] = {
                                  ...updated[index],
                                  platform: e.target.value as M23Platform,
                                };
                                handleSaveConfig({ ...cfg, formats: updated });
                              }}
                              className="bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] font-semibold focus:border-primary focus:outline-none"
                            >
                              <option value="instagram">Instagram</option>
                              <option value="linkedin">LinkedIn</option>
                              <option value="facebook">Facebook</option>
                              <option value="youtube">YouTube</option>
                              <option value="x">X (Twitter)</option>
                              <option value="tiktok">TikTok</option>
                              <option value="custom">Vlastná sieť</option>
                            </select>

                            {/* Type Select */}
                            <select
                              value={fmt.type}
                              onChange={(e) => {
                                const updated = [...cfg.formats];
                                updated[index] = {
                                  ...updated[index],
                                  type: e.target.value as M23FormatType,
                                };
                                handleSaveConfig({ ...cfg, formats: updated });
                              }}
                              className="bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            >
                              <option value="avatar">Avatar (Profil)</option>
                              <option value="cover">Cover (Hlavička)</option>
                              <option value="post">Post (Príspevok)</option>
                              <option value="story">Story / Reel (9:16)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = cfg.formats.filter((_, i) => i !== index);
                              handleSaveConfig({ ...cfg, formats: updated });
                            }}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Zmazať formát"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title & Dimensions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Názov formátu:
                            </label>
                            <input
                              type="text"
                              value={
                                typeof fmt.title === "object"
                                  ? fmt.title.sk || fmt.title.en || ""
                                  : fmt.title
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.formats];
                                updated[index] = {
                                  ...updated[index],
                                  title: { en: val, sk: val },
                                };
                                handleSaveConfig({ ...cfg, formats: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Dimensions Width x Height */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Šírka (px):
                              </label>
                              <input
                                type="number"
                                value={fmt.dimensions.width}
                                onChange={(e) => {
                                  const updated = [...cfg.formats];
                                  updated[index] = {
                                    ...updated[index],
                                    dimensions: {
                                      ...updated[index].dimensions,
                                      width: Number(e.target.value) || 0,
                                    },
                                  };
                                  handleSaveConfig({ ...cfg, formats: updated });
                                }}
                                className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1.5 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Výška (px):
                              </label>
                              <input
                                type="number"
                                value={fmt.dimensions.height}
                                onChange={(e) => {
                                  const updated = [...cfg.formats];
                                  updated[index] = {
                                    ...updated[index],
                                    dimensions: {
                                      ...updated[index].dimensions,
                                      height: Number(e.target.value) || 0,
                                    },
                                  };
                                  handleSaveConfig({ ...cfg, formats: updated });
                                }}
                                className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1.5 text-xs text-[#fafbfc] font-mono focus:border-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preview Image URL & Upload */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              URL obrázka náhľadu:
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                targetUploadFormatIdRef.current = fmt.id;
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
                            placeholder="https://... alebo nechajte prázdne pre vektorový mockup"
                            value={fmt.previewUrl}
                            onChange={(e) => {
                              const updated = [...cfg.formats];
                              updated[index] = {
                                ...updated[index],
                                previewUrl: e.target.value,
                              };
                              handleSaveConfig({ ...cfg, formats: updated });
                            }}
                            className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:border-primary focus:outline-none"
                          />
                        </div>

                        {/* Downloads for this format */}
                        <div className="pt-2 border-t border-[rgba(63,85,102,0.45)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#fafbfc]">
                              Tlačidlá na stiahnutie:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newDl: M23DownloadItem = {
                                  id: `dl-${Date.now()}`,
                                  format: "PNG",
                                  url: "",
                                  label: { en: "Download PNG", sk: "Stiahnuť PNG" },
                                };
                                const updated = [...cfg.formats];
                                updated[index] = {
                                  ...updated[index],
                                  downloads: [...updated[index].downloads, newDl],
                                };
                                handleSaveConfig({ ...cfg, formats: updated });
                              }}
                              className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Pridať súbor</span>
                            </button>
                          </div>

                          {fmt.downloads.map((dl, dlIdx) => (
                            <div
                              key={dl.id}
                              className="flex items-center gap-2 bg-[#070b0f] p-2 rounded border border-[rgba(63,85,102,0.45)]"
                            >
                              <select
                                value={dl.format}
                                onChange={(e) => {
                                  const updated = [...cfg.formats];
                                  updated[index].downloads[dlIdx] = {
                                    ...updated[index].downloads[dlIdx],
                                    format: e.target.value as M23DownloadFormat,
                                  };
                                  handleSaveConfig({ ...cfg, formats: updated });
                                }}
                                className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-[11px] text-[#fafbfc] font-mono focus:outline-none"
                              >
                                <option value="PNG">PNG</option>
                                <option value="PSD">PSD</option>
                                <option value="FIGMA">FIGMA</option>
                                <option value="AI">AI</option>
                                <option value="ZIP">ZIP</option>
                                <option value="SVG">SVG</option>
                              </select>

                              <input
                                type="text"
                                placeholder="Názov tlačidla (napr. Stiahnuť PNG)"
                                value={
                                  typeof dl.label === "object"
                                    ? dl.label.sk || dl.label.en || ""
                                    : dl.label
                                }
                                onChange={(e) => {
                                  const updated = [...cfg.formats];
                                  updated[index].downloads[dlIdx] = {
                                    ...updated[index].downloads[dlIdx],
                                    label: { en: e.target.value, sk: e.target.value },
                                  };
                                  handleSaveConfig({ ...cfg, formats: updated });
                                }}
                                className="flex-1 bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:outline-none"
                              />

                              <input
                                type="text"
                                placeholder="URL adresa súboru"
                                value={dl.url}
                                onChange={(e) => {
                                  const updated = [...cfg.formats];
                                  updated[index].downloads[dlIdx] = {
                                    ...updated[index].downloads[dlIdx],
                                    url: e.target.value,
                                  };
                                  handleSaveConfig({ ...cfg, formats: updated });
                                }}
                                className="flex-1 bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded px-2 py-1 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...cfg.formats];
                                  updated[index].downloads = updated[index].downloads.filter(
                                    (_, i) => i !== dlIdx
                                  );
                                  handleSaveConfig({ ...cfg, formats: updated });
                                }}
                                className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: PLATFORMS & ZIP CONFIG */}
              {modalTab === "settings" && (
                <div className="space-y-6">
                  {/* Platforms toggles */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Povolené sociálne siete
                    </h4>
                    <p className="text-[11px] text-[#96abbe]">
                      Označte siete, pre ktoré chcete zobrazovať záložky a filtre.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      {Object.entries(PLATFORM_INFO).map(([key, info]) => {
                        const platKey = key as M23Platform;
                        const isChecked = cfg.platforms.includes(platKey);

                        return (
                          <label
                            key={platKey}
                            className="flex items-center justify-between p-2 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer"
                          >
                            <span className="text-xs text-[#fafbfc] font-medium">
                              {info.label}
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...cfg.platforms, platKey]
                                  : cfg.platforms.filter((p) => p !== platKey);
                                handleSaveConfig({ ...cfg, platforms: updated });
                              }}
                              className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Download All ZIP Settings */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Globálny balíček (Stiahnuť celý Social Kit)
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer">
                        <span className="text-xs text-[#fafbfc] font-medium">
                          Zobraziť tlačidlo na stiahnutie celého balíčka
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
                          Vlastná URL adresa ZIP balíčka (voliteľné):
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
                          prehliadači zo všetkých dostupných náhľadov.
                        </span>
                      </div>
                    </div>
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
