"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Download,
  ExternalLink,
  FolderDown,
  FileText,
  ArrowRight,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Settings2,
  Check,
  FileArchive,
  Image as ImageIcon,
  Sparkles,
  Palette,
  X,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M05DownloadButtonConfig,
  m05DownloadButtonSchema,
} from "@/lib/validations/modules/m05";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction, getBrandPagesAction } from "@/actions/pages";
import { getBrandMediaAction } from "@/actions/media";
import { PageItem } from "@/lib/types/page";
import { MediaAsset } from "@/lib/types/media";

/**
 * Standard YIQ luminance algorithm to calculate optimal text contrast (white vs dark abyss).
 */
function getContrastColor(hexColor?: string): string {
  if (!hexColor) return "#070b0f";
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#070b0f" : "#ffffff";
}

/**
 * Supported system icons for M05
 */
const SYSTEM_ICONS = [
  { id: "download", label: "Download", icon: Download },
  { id: "external-link", label: "External Link", icon: ExternalLink },
  { id: "folder-down", label: "Folder Down", icon: FolderDown },
  { id: "file-text", label: "Document", icon: FileText },
  { id: "arrow-right", label: "Arrow Right", icon: ArrowRight },
  { id: "link", label: "Link", icon: LinkIcon },
];

export default function M05DownloadTlacidloModule({
  id: moduleId,
  moduleType = "M05_DownloadTlacidlo",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { tokens, resolveRadius } = useBrandCascade();
  const params = useParams();
  const brandId = (params?.brandId as string) || "";

  // Inherit strict brand radius (no local destructive radius override)
  const brandRadius = resolveRadius();

  // Parse config safely with defaults
  const parsedConfig = useMemo(() => {
    const res = m05DownloadButtonSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      align: "center" as const,
      size: "medium" as const,
      style: "primary" as const,
      icon: {
        source: "system" as const,
        iconId: "download",
        position: "left" as const,
      },
      openInNewTab: false,
      label: {
        en: "Download Assets",
        sk: "Stiahnuť podklady",
        cs: "Stáhnout podklady",
      },
      linkType: "external" as const,
      url: "#",
    };
  }, [config]);

  const [cfg, setCfg] = useState<M05DownloadButtonConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"link" | "icon" | "style">("link");

  // State for fetched pages and media assets
  const [brandPages, setBrandPages] = useState<PageItem[]>([]);
  const [brandMedia, setBrandMedia] = useState<MediaAsset[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load pages and media when modal opens
  useEffect(() => {
    if (isSettingsModalOpen && brandId) {
      if (brandPages.length === 0) {
        setIsLoadingPages(true);
        getBrandPagesAction(brandId)
          .then((res) => {
            if (res.success && res.pages) {
              setBrandPages(res.pages);
            }
          })
          .catch((err) => console.error("Error fetching pages:", err))
          .finally(() => setIsLoadingPages(false));
      }

      if (brandMedia.length === 0) {
        setIsLoadingMedia(true);
        getBrandMediaAction(brandId)
          .then((res) => {
            if (res.success && res.media) {
              setBrandMedia(res.media);
            }
          })
          .catch((err) => console.error("Error fetching media:", err))
          .finally(() => setIsLoadingMedia(false));
      }
    }
  }, [isSettingsModalOpen, brandId, brandPages.length, brandMedia.length]);

  // Save changes handler
  const handleSaveConfig = async (newConfig: M05DownloadButtonConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M05 config:", err);
      }
    }
  };

  // Inline text save handler
  const handleInlineLabelSave = async (newText: string) => {
    const updatedLabel = setI18nText(cfg.label, newText, locale);
    const newConfig: M05DownloadButtonConfig = {
      ...cfg,
      label: updatedLabel,
    };
    await handleSaveConfig(newConfig);
  };

  // Resolve button label
  const resolvedLabel = resolveI18nText(cfg.label, locale) || "Download Assets";

  // Resolve alignment class
  const alignClass = useMemo(() => {
    switch (cfg.align) {
      case "left":
        return "justify-start";
      case "right":
        return "justify-end";
      case "full":
        return "w-full";
      case "center":
      default:
        return "justify-center";
    }
  }, [cfg.align]);

  // Resolve size classes
  const sizeClasses = useMemo(() => {
    switch (cfg.size) {
      case "small":
        return "h-8 px-3.5 text-xs gap-1.5";
      case "large":
        return "h-13 px-7 text-base font-semibold gap-2.5";
      case "medium":
      default:
        // 44px recommended mobile tap target
        return "h-11 px-5 text-sm font-semibold gap-2";
    }
  }, [cfg.size]);

  const iconSizeClass = useMemo(() => {
    switch (cfg.size) {
      case "small":
        return "w-3.5 h-3.5";
      case "large":
        return "w-5 h-5";
      case "medium":
      default:
        return "w-4 h-4";
    }
  }, [cfg.size]);

  // Resolve styling (colors and border)
  const buttonStyleObject = useMemo<React.CSSProperties>(() => {
    const primaryBrandColor = tokens?.colors?.primary || "#c8d400";
    const secondaryBrandColor = tokens?.colors?.secondary || "#17212a";

    switch (cfg.style) {
      case "primary":
        return {
          backgroundColor: primaryBrandColor,
          color: getContrastColor(primaryBrandColor),
          border: "none",
          borderRadius: brandRadius,
        };
      case "secondary":
        return {
          backgroundColor: secondaryBrandColor,
          color: getContrastColor(secondaryBrandColor),
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: brandRadius,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: primaryBrandColor,
          border: `1px solid ${primaryBrandColor}`,
          borderRadius: brandRadius,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: "currentColor",
          border: "none",
          borderRadius: brandRadius,
        };
      case "custom": {
        const bg = cfg.customColors?.backgroundColor || primaryBrandColor;
        const txt = cfg.customColors?.textColor || getContrastColor(bg);
        return {
          backgroundColor: bg,
          color: txt,
          border: "none",
          borderRadius: brandRadius,
        };
      }
      default:
        return {
          backgroundColor: primaryBrandColor,
          color: getContrastColor(primaryBrandColor),
          borderRadius: brandRadius,
        };
    }
  }, [cfg.style, cfg.customColors, tokens, brandRadius]);

  // Render Icon component
  const renderIcon = () => {
    if (cfg.icon.source === "none") return null;

    if (cfg.icon.source === "m25" && cfg.icon.customIconUrl) {
      return (
        <img
          src={cfg.icon.customIconUrl}
          alt=""
          className={`${iconSizeClass} object-contain shrink-0`}
        />
      );
    }

    const matched = SYSTEM_ICONS.find((i) => i.id === cfg.icon.iconId);
    if (!matched) return <Download className={`${iconSizeClass} shrink-0`} />;
    const IconComponent = matched.icon;
    return <IconComponent className={`${iconSizeClass} shrink-0`} />;
  };

  // Compute final destination URL
  const targetHref = useMemo(() => {
    if (cfg.linkType === "internal" && cfg.internalPageId) {
      return `?pageId=${cfg.internalPageId}`;
    }
    return cfg.url || "#";
  }, [cfg.linkType, cfg.internalPageId, cfg.url]);

  return (
    <div className="relative group/m05 py-2">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-3">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m05:opacity-100 transition-opacity duration-150 absolute -top-9 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#17212a] border border-border/70 rounded-[3px] p-1 shadow-lg text-xs">
          {/* Alignment Selector */}
          <div className="flex items-center border-r border-border/50 pr-1 mr-1">
            <button
              type="button"
              title="Zarovnať vľavo"
              onClick={() => handleSaveConfig({ ...cfg, align: "left" })}
              className={`p-1 rounded-[2px] transition-colors ${
                cfg.align === "left"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Zarovnať na stred"
              onClick={() => handleSaveConfig({ ...cfg, align: "center" })}
              className={`p-1 rounded-[2px] transition-colors ${
                cfg.align === "center"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Zarovnať vpravo"
              onClick={() => handleSaveConfig({ ...cfg, align: "right" })}
              className={`p-1 rounded-[2px] transition-colors ${
                cfg.align === "right"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Plná šírka"
              onClick={() => handleSaveConfig({ ...cfg, align: "full" })}
              className={`p-1 rounded-[2px] transition-colors ${
                cfg.align === "full"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Size Selector */}
          <div className="flex items-center border-r border-border/50 pr-1 mr-1">
            {(["small", "medium", "large"] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                title={`Veľkosť: ${sz}`}
                onClick={() => handleSaveConfig({ ...cfg, size: sz })}
                className={`px-1.5 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors uppercase ${
                  cfg.size === sz
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                }`}
              >
                {sz[0]}
              </button>
            ))}
          </div>

          {/* Style Selector */}
          <div className="flex items-center border-r border-border/50 pr-1 mr-1">
            {(["primary", "secondary", "outline", "ghost", "custom"] as const).map((st) => (
              <button
                key={st}
                type="button"
                title={`Štýl: ${st}`}
                onClick={() => handleSaveConfig({ ...cfg, style: st })}
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] capitalize transition-colors ${
                  cfg.style === st
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Link & Icon Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-primary/20 hover:bg-primary/30 text-primary font-medium text-[11px] transition-colors"
          >
            <Settings2 className="w-3 h-3" />
            <span>Odkaz & Ikona</span>
          </button>
        </div>
      )}

      {/* Button Container with Alignment */}
      <div className={`flex ${alignClass} w-full`}>
        {isEditor ? (
          /* Editor View: Interactive with Inline Editing */
          <div
            className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none shadow-sm cursor-default ${sizeClasses} ${
              cfg.align === "full" ? "w-full" : ""
            }`}
            style={buttonStyleObject}
          >
            {cfg.icon.position === "left" && renderIcon()}
            <InlineEditableText
              value={resolvedLabel}
              onSave={handleInlineLabelSave}
              placeholder="Zadajte text tlačidla..."
              className="outline-none focus:ring-1 focus:ring-primary/40 px-1 py-0.5 rounded"
            />
            {cfg.icon.position === "right" && renderIcon()}
          </div>
        ) : (
          /* Public / Client View: Real Link */
          <a
            href={targetHref}
            target={cfg.openInNewTab ? "_blank" : undefined}
            rel={cfg.openInNewTab ? "noopener noreferrer" : undefined}
            download={cfg.linkType === "media" ? true : undefined}
            className={`inline-flex items-center justify-center font-medium transition-all duration-150 shadow-sm hover:opacity-90 active:scale-[0.99] ${sizeClasses} ${
              cfg.align === "full" ? "w-full" : ""
            }`}
            style={buttonStyleObject}
          >
            {cfg.icon.position === "left" && renderIcon()}
            <span>{resolvedLabel}</span>
            {cfg.icon.position === "right" && renderIcon()}
          </a>
        )}
      </div>

      {/* Settings Modal (Link Picker, Icon Picker, Custom Colors) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div
            className="bg-[#17212a] border border-border/80 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nastavenia tlačidla (M05 CTA / Download)
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
                onClick={() => setModalTab("link")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "link"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Cieľ odkazu (Link)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("icon")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "icon"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Ikona tlačidla
              </button>
              {cfg.style === "custom" && (
                <button
                  type="button"
                  onClick={() => setModalTab("style")}
                  className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                    modalTab === "style"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Vlastné farby
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: LINK PICKER */}
              {modalTab === "link" && (
                <div className="space-y-4">
                  {/* Link Type Selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Typ cieľa
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, linkType: "external" })}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.linkType === "external"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Externá URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, linkType: "internal" })}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.linkType === "internal"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Interná stránka</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, linkType: "media", openInNewTab: true })}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.linkType === "media"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <FileArchive className="w-3.5 h-3.5" />
                        <span>Media súbor (R2)</span>
                      </button>
                    </div>
                  </div>

                  {/* 1A: External URL Input */}
                  {cfg.linkType === "external" && (
                    <div className="space-y-3 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[11px] font-medium">
                          Externá webová adresa (Google Drive, Dropbox, Figma, atď.)
                        </label>
                        <input
                          type="url"
                          value={cfg.url || ""}
                          placeholder="https://drive.google.com/..."
                          onChange={(e) => handleSaveConfig({ ...cfg, url: e.target.value })}
                          className="w-full bg-[#17212a] border border-border/70 rounded-[3px] px-3 py-2 text-foreground focus:outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={cfg.openInNewTab}
                          onChange={(e) => handleSaveConfig({ ...cfg, openInNewTab: e.target.checked })}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5 bg-[#17212a] border-border/70"
                        />
                        <span className="text-foreground text-[11px]">
                          Otvoriť odkaz v novom okne (_blank)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* 1B: Internal Page Selector */}
                  {cfg.linkType === "internal" && (
                    <div className="space-y-3 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[11px] font-medium">
                          Vyberte cieľovú podstránku manuálu
                        </label>
                        {isLoadingPages ? (
                          <div className="text-muted-foreground text-xs py-2 italic">
                            Načítavam stránky manuálu...
                          </div>
                        ) : brandPages.length === 0 ? (
                          <div className="text-muted-foreground text-xs py-2">
                            Žiadne podstránky neboli nájdené.
                          </div>
                        ) : (
                          <select
                            value={cfg.internalPageId || ""}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                internalPageId: e.target.value,
                                openInNewTab: false,
                              })
                            }
                            className="w-full bg-[#17212a] border border-border/70 rounded-[3px] px-3 py-2 text-foreground focus:outline-none focus:border-primary text-xs"
                          >
                            <option value="">-- Vyberte podstránku --</option>
                            {brandPages.map((pg) => {
                              const pgTitle =
                                typeof pg.title === "object"
                                  ? resolveI18nText(pg.title, locale) || pg.slug
                                  : pg.title || pg.slug;
                              return (
                                <option key={pg.id} value={pg.id}>
                                  {pgTitle} ({pg.slug})
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 1C: Media File Selector */}
                  {cfg.linkType === "media" && (
                    <div className="space-y-3 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[11px] font-medium">
                          Vyberte súbor na stiahnutie z knižnice médií
                        </label>
                        {isLoadingMedia ? (
                          <div className="text-muted-foreground text-xs py-2 italic">
                            Načítavam assety z knižnice...
                          </div>
                        ) : brandMedia.length === 0 ? (
                          <div className="text-muted-foreground text-xs py-2">
                            V Media knižnici zatiaľ nie sú nahrané žiadne súbory.
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {brandMedia.map((m) => {
                              const isSelected = cfg.url === m.fileUrl;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() =>
                                    handleSaveConfig({
                                      ...cfg,
                                      url: m.fileUrl || "",
                                      mediaAssetId: m.id,
                                      openInNewTab: true,
                                    })
                                  }
                                  className={`w-full flex items-center justify-between p-2 rounded-[3px] border transition-colors text-left ${
                                    isSelected
                                      ? "bg-primary/10 border-primary text-foreground"
                                      : "bg-[#17212a] border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileArchive className="w-3.5 h-3.5 shrink-0 text-primary" />
                                    <span className="truncate font-medium">{m.fileName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-muted-foreground uppercase font-mono">
                                      {m.fileType}
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ICON PICKER */}
              {modalTab === "icon" && (
                <div className="space-y-4">
                  {/* Icon Source Selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Zdroj ikony
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveConfig({
                            ...cfg,
                            icon: { ...cfg.icon, source: "system" },
                          })
                        }
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.icon.source === "system"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Systémové (Lucide)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveConfig({
                            ...cfg,
                            icon: { ...cfg.icon, source: "m25" },
                          })
                        }
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.icon.source === "m25"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Vlastná značky (M25)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveConfig({
                            ...cfg,
                            icon: { ...cfg.icon, source: "none" },
                          })
                        }
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                          cfg.icon.source === "none"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Bez ikony</span>
                      </button>
                    </div>
                  </div>

                  {/* System Icon Selection Grid */}
                  {cfg.icon.source === "system" && (
                    <div className="space-y-1.5 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                      <label className="text-muted-foreground text-[11px] font-medium">
                        Vyberte systémovú ikonu
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {SYSTEM_ICONS.map((item) => {
                          const IconComp = item.icon;
                          const isSelected = cfg.icon.iconId === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                handleSaveConfig({
                                  ...cfg,
                                  icon: { ...cfg.icon, iconId: item.id },
                                })
                              }
                              className={`flex items-center gap-2 p-2 rounded-[3px] border text-left transition-colors ${
                                isSelected
                                  ? "bg-primary/10 border-primary text-primary font-bold"
                                  : "bg-[#17212a] border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                              }`}
                            >
                              <IconComp className="w-4 h-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Brand Custom Icon Selection */}
                  {cfg.icon.source === "m25" && (
                    <div className="space-y-3 bg-[#17212a] p-3 rounded-[3px] border border-border/40">
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[11px] font-medium">
                          URL adresa vlastnej ikony (SVG alebo PNG)
                        </label>
                        <input
                          type="url"
                          value={cfg.icon.customIconUrl || ""}
                          placeholder="https://.../icon.svg"
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              icon: { ...cfg.icon, customIconUrl: e.target.value },
                            })
                          }
                          className="w-full bg-[#17212a] border border-border/70 rounded-[3px] px-3 py-2 text-foreground focus:outline-none focus:border-primary text-xs"
                        />
                      </div>

                      {brandMedia.filter((m) => m.fileType === "ICON" || m.fileType === "IMAGE").length > 0 && (
                        <div className="space-y-1 pt-1">
                          <label className="text-muted-foreground text-[11px] font-medium">
                            Alebo vyberte z nahraných ikon brandu
                          </label>
                          <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                            {brandMedia
                              .filter((m) => m.fileType === "ICON" || m.fileType === "IMAGE")
                              .map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() =>
                                    handleSaveConfig({
                                      ...cfg,
                                      icon: { ...cfg.icon, customIconUrl: m.fileUrl || "" },
                                    })
                                  }
                                  className={`p-2 rounded-[3px] border flex flex-col items-center justify-center gap-1 transition-colors ${
                                    cfg.icon.customIconUrl === m.fileUrl
                                      ? "bg-primary/10 border-primary"
                                      : "bg-[#17212a] border-border/40 hover:border-border"
                                  }`}
                                >
                                  <img
                                    src={m.thumbnailUrl || m.fileUrl}
                                    alt={m.fileName}
                                    className="w-6 h-6 object-contain"
                                  />
                                  <span className="text-[9px] truncate max-w-full text-muted-foreground">
                                    {m.fileName}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Icon Position Selector */}
                  {cfg.icon.source !== "none" && (
                    <div className="space-y-1.5 pt-1">
                      <label className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Pozícia ikony
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveConfig({
                              ...cfg,
                              icon: { ...cfg.icon, position: "left" },
                            })
                          }
                          className={`p-2 rounded-[3px] border transition-colors ${
                            cfg.icon.position === "left"
                              ? "bg-primary/10 border-primary text-primary font-bold"
                              : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Vľavo od textu
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveConfig({
                              ...cfg,
                              icon: { ...cfg.icon, position: "right" },
                            })
                          }
                          className={`p-2 rounded-[3px] border transition-colors ${
                            cfg.icon.position === "right"
                              ? "bg-primary/10 border-primary text-primary font-bold"
                              : "bg-[#17212a] border-border/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Vpravo od textu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CUSTOM COLORS */}
              {modalTab === "style" && cfg.style === "custom" && (
                <div className="space-y-4 bg-[#17212a] p-4 rounded-[3px] border border-border/40">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Palette className="w-4 h-4" />
                    <span>Nastavenie vlastných farieb tlačidla</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[11px]">Farba pozadia</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cfg.customColors?.backgroundColor || tokens?.colors?.primary || "#c8d400"}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              customColors: {
                                ...cfg.customColors,
                                backgroundColor: e.target.value,
                              },
                            })
                          }
                          className="w-8 h-8 rounded border border-border/60 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={cfg.customColors?.backgroundColor || ""}
                          placeholder="#c8d400"
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              customColors: {
                                ...cfg.customColors,
                                backgroundColor: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#17212a] border border-border/70 rounded-[3px] px-2.5 py-1.5 text-foreground font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[11px]">Farba textu</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cfg.customColors?.textColor || "#070b0f"}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              customColors: {
                                ...cfg.customColors,
                                textColor: e.target.value,
                              },
                            })
                          }
                          className="w-8 h-8 rounded border border-border/60 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={cfg.customColors?.textColor || ""}
                          placeholder="#070b0f"
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              customColors: {
                                ...cfg.customColors,
                                textColor: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-[#17212a] border border-border/70 rounded-[3px] px-2.5 py-1.5 text-foreground font-mono text-xs"
                        />
                      </div>
                    </div>
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
