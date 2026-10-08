"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  X,
  AlertTriangle,
  Settings2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Palette,
  LayoutGrid,
  RotateCcw,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M20DosAndDontsConfig,
  m20DosAndDontsSchema,
  M20RuleItem,
  DEFAULT_M20_ITEMS,
  M20ItemType,
  M20BackgroundMode,
} from "@/lib/validations/modules/m20";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { uploadMediaAction, getBrandMediaAction } from "@/actions/media";
import { BrandAsset } from "@/lib/types/asset";
import { MediaAsset } from "@/lib/types/media";
import { getWcagContrast } from "@/lib/utils/color-calc";
import { UniversalMediaPickerModal, SelectedMediaItem } from "@/components/admin/media/universal-media-picker-modal";

/**
 * High-fidelity fallback SVG graphics for default rules if custom image is not yet uploaded
 */
function DefaultRuleGraphic({
  type,
  ruleId,
  isDark = true,
}: {
  type: M20ItemType;
  ruleId: string;
  isDark?: boolean;
}) {
  const logoSrc = isDark ? "/logo/logo-symbol-light.svg" : "/logo/logo-symbol-dark.svg";

  if (ruleId === "rule-1" || type === "dont") {
    // Distorted logo representation with stretch guides
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full p-6 select-none">
        {/* Subtle grid lines in background */}
        <div className="absolute inset-4 border border-dashed border-red-500/20 rounded pointer-events-none flex items-center justify-center">
          <span className="absolute -top-2.5 bg-card px-2 text-[10px] font-mono text-red-500 font-bold border border-red-500/30 rounded-xs">
            PROPORTION LOCK BROKEN
          </span>
        </div>

        {/* Distorted symbol */}
        <div className="transform scale-x-[1.65] scale-y-[0.7] transition-transform">
          <img
            src={logoSrc}
            alt="Distorted Mark"
            className="w-20 h-20 object-contain opacity-80"
          />
        </div>

        {/* Stretch arrows */}
        <div className="absolute inset-x-8 flex justify-between items-center text-red-500 text-xs font-mono font-bold">
          <span>&larr; stretch</span>
          <span>stretch &rarr;</span>
        </div>
      </div>
    );
  }

  if (ruleId === "rule-2") {
    // Altered colors representation
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full p-6 select-none">
        <div className="relative filter hue-rotate-180 contrast-125 saturate-200">
          <img
            src={logoSrc}
            alt="Unapproved Colors"
            className="w-20 h-20 object-contain"
          />
        </div>
        <div className="absolute bottom-3 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-500 font-bold">
          UNAPPROVED PALETTE
        </div>
      </div>
    );
  }

  if (ruleId === "rule-4" || type === "warning") {
    // Monochrome / technical limitation graphic
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full p-6 select-none">
        <div className="filter grayscale contrast-200 opacity-90">
          <img
            src={logoSrc}
            alt="Monochrome Mark"
            className="w-20 h-20 object-contain"
          />
        </div>
        <div className="absolute bottom-3 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-500 font-bold">
          1-COLOR RESTRICTED
        </div>
      </div>
    );
  }

  // Approved / Do state
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-6 select-none">
      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <img
          src={logoSrc}
          alt="Approved Mark"
          className="w-20 h-20 object-contain"
        />
      </div>
      <div className="absolute bottom-3 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
        APPROVED CLEARSPACE & CONTRAST
      </div>
    </div>
  );
}

export default function M20DosAndDontsModule({
  id: moduleId,
  moduleType = "M20_DosAndDonts",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { tokens, resolveRadius, resolveColor, resolveStyles } = useBrandCascade();
  const brandRadius = resolveRadius();
  const isManualDark = tokens.theme?.isDark ?? true;
  const params = useParams();
  const brandId = (params?.brandId as string) || "";

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m20DosAndDontsSchema.safeParse(config);
    if (res.success) {
      return {
        ...res.data,
        items: res.data.items.length > 0 ? res.data.items : DEFAULT_M20_ITEMS,
      };
    }
    return {
      layout: "cards" as const,
      doColor: null,
      dontColor: null,
      warningColor: null,
      columns: 2,
      defaultBackground: "auto" as const,
      badgePosition: "top-left" as const,
      showFilter: false,
      items: DEFAULT_M20_ITEMS,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M20DosAndDontsConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"items" | "settings">("items");
  const [activeFilter, setActiveFilter] = useState<"all" | "do" | "dont" | "warning">("all");
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [assetPickerRuleIndex, setAssetPickerRuleIndex] = useState<number | null>(null);
  const [uploadingRuleIndex, setUploadingRuleIndex] = useState<number | null>(null);
  const [isUniversalPickerOpen, setIsUniversalPickerOpen] = useState(false);
  const [pickerTargetRuleIndex, setPickerTargetRuleIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetUploadIndexRef = useRef<number | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  const [brandMedia, setBrandMedia] = useState<MediaAsset[]>([]);

  // Fetch brand assets and media (for semantic role icons)
  useEffect(() => {
    if (brandId) {
      getBrandMediaAction(brandId)
        .then((res) => {
          if (res?.success && res.media) {
            setBrandMedia(res.media);
          }
        })
        .catch((err) => console.error("Failed to load brand media in M20:", err));

      if (isEditor) {
        getBrandAssetsAction(brandId)
          .then((res) => {
            if (res?.success && res.assets) {
              setBrandAssets(res.assets);
            }
          })
          .catch((err) => console.error("Failed to load brand assets in M20:", err));
      }
    }
  }, [brandId, isEditor]);

  // Resolve custom brand semantic icons
  const semanticSuccessIconUrl = useMemo(() => {
    const found = brandMedia.find((m) => m.semanticRole === "SUCCESS");
    return found?.fileUrl || null;
  }, [brandMedia]);

  const semanticErrorIconUrl = useMemo(() => {
    const found = brandMedia.find((m) => m.semanticRole === "ERROR");
    return found?.fileUrl || null;
  }, [brandMedia]);

  const semanticWarningIconUrl = useMemo(() => {
    const found = brandMedia.find((m) => m.semanticRole === "WARNING");
    return found?.fileUrl || null;
  }, [brandMedia]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M20DosAndDontsConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M20 config:", err);
      }
    }
  };

  // Handle direct file upload for a rule card
  const handleFileUpload = async (index: number, file: File) => {
    setUploadingRuleIndex(index);
    try {
      if (brandId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("fileType", "IMAGE");
        const res = await uploadMediaAction(brandId, formData);
        if (res.success && res.asset?.fileUrl) {
          const updated = [...cfg.items];
          updated[index] = {
            ...updated[index],
            imageUrl: res.asset.fileUrl,
          };
          handleSaveConfig({ ...cfg, items: updated });
          return;
        }
      }

      // Offline / fallback to local Data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const updated = [...cfg.items];
          updated[index] = {
            ...updated[index],
            imageUrl: dataUrl,
          };
          handleSaveConfig({ ...cfg, items: updated });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload image in M20:", err);
    } finally {
      setUploadingRuleIndex(null);
    }
  };

  // Reorder items
  const moveItem = (index: number, direction: "up" | "down") => {
    const list = [...cfg.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    handleSaveConfig({ ...cfg, items: list });
  };

  // Resolve semantic or custom indicator colors
  const resolvedDoColor = cfg.doColor
    ? `#${cfg.doColor.replace(/^#/, "")}`
    : resolveColor(undefined, "success") || "#10b981";

  const resolvedDontColor = cfg.dontColor
    ? `#${cfg.dontColor.replace(/^#/, "")}`
    : resolveColor(undefined, "danger") || "#e11d48";

  const resolvedWarningColor = cfg.warningColor
    ? `#${cfg.warningColor.replace(/^#/, "")}`
    : resolveColor(undefined, "warning") || "#f59e0b";

  // Filtered items based on client-side filter
  const displayedItems = useMemo(() => {
    if (!cfg.showFilter || activeFilter === "all") return cfg.items;
    return cfg.items.filter((item) => item.type === activeFilter);
  }, [cfg.items, cfg.showFilter, activeFilter]);

  // Compute CSS column classes for cards layout
  const gridColumnClass = useMemo(() => {
    switch (cfg.columns) {
      case 1:
        return "grid-cols-1";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      case 2:
      default:
        return "grid-cols-1 sm:grid-cols-2";
    }
  }, [cfg.columns]);

  // Resolve background style for a card
  const getCardBackgroundStyle = (item: M20RuleItem): React.CSSProperties => {
    const bgMode = item.background === "auto" ? cfg.defaultBackground : item.background;

    switch (bgMode) {
      case "light":
        return { backgroundColor: "#ffffff" };
      case "dark":
        return { backgroundColor: "#0e161d" };
      case "checkerboard":
        return isManualDark
          ? {
              backgroundColor: "#0e161d",
              backgroundImage:
                "linear-gradient(45deg, #17212a 25%, transparent 25%), linear-gradient(-45deg, #17212a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #17212a 75%), linear-gradient(-45deg, transparent 75%, #17212a 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }
          : {
              backgroundColor: "#fafbfc",
              backgroundImage:
                "linear-gradient(45deg, #eef2f6 25%, transparent 25%), linear-gradient(-45deg, #eef2f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eef2f6 75%), linear-gradient(-45deg, transparent 75%, #eef2f6 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            };
      case "custom":
        if (item.customBgHex) {
          return { backgroundColor: `#${item.customBgHex.replace(/^#/, "")}` };
        }
        return isManualDark ? { backgroundColor: "#0e161d" } : { backgroundColor: "var(--muted, #f1f4f7)" };
      case "auto":
      default:
        return isManualDark
          ? {
              backgroundColor: "#0e161d",
              backgroundImage:
                "radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }
          : {
              backgroundColor: "var(--muted, #f1f4f7)",
              backgroundImage:
                "radial-gradient(circle, rgba(14, 22, 29, 0.08) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            };
    }
  };

  const isCardDark = (item: M20RuleItem): boolean => {
    const bgMode = item.background === "auto" ? cfg.defaultBackground : item.background;
    if (bgMode === "light") return false;
    if (bgMode === "dark") return true;
    if (bgMode === "custom" && item.customBgHex) {
      const contrast = getWcagContrast(item.customBgHex);
      return contrast.preferredText === "white";
    }
    return isManualDark;
  };

  // Grouped items for minimalist text view
  const doItems = useMemo(() => cfg.items.filter((i) => i.type === "do"), [cfg.items]);
  const dontItems = useMemo(() => cfg.items.filter((i) => i.type === "dont"), [cfg.items]);
  const warningItems = useMemo(() => cfg.items.filter((i) => i.type === "warning"), [cfg.items]);

  return (
    <div
      className="relative group/m20 transition-all duration-200"
      style={{
        borderRadius: brandRadius,
        ...resolveStyles(cfg.styleOverrides),
      }}
    >
      {/* Hidden file input for direct file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && targetUploadIndexRef.current !== null) {
            handleFileUpload(targetUploadIndexRef.current, file);
          }
          e.target.value = "";
        }}
      />

      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/m20:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#070b0f] border border-white/20 px-2.5 py-1.5 rounded-[3px] shadow-md">
          {/* Quick toggle between visual cards and minimal summary */}
          <button
            type="button"
            onClick={() =>
              handleSaveConfig({
                ...cfg,
                layout: cfg.layout === "minimal" ? "cards" : "minimal",
              })
            }
            className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white transition-colors border-r border-white/20 pr-2 mr-1"
            title="Prepnúť režim zobrazenia (Karty vs Minimalistický text)"
          >
            {cfg.layout === "minimal" ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                <span>Karty</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Minimal</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            title="Upraviť pravidlá Do's and Don'ts"
          >
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            <span>Upraviť pravidlá</span>
          </button>
        </div>
      )}

      {/* Header section if showH3 */}
      {showH3 && (
        <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {resolveI18nText(h3Title, locale) || "Pravidlá používania (Do's & Don'ts)"}
          </h3>
        </div>
      )}

      {/* Client Filter Controls (applicable in cards mode) */}
      {cfg.layout === "cards" && cfg.showFilter && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 rounded-[3px] text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Všetky ({cfg.items.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("do")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-semibold transition-all ${
              activeFilter === "do"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: resolvedDoColor }}
            />
            Povolené ({cfg.items.filter((i) => i.type === "do").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("dont")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-semibold transition-all ${
              activeFilter === "dont"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: resolvedDontColor }}
            />
            Zakázané ({cfg.items.filter((i) => i.type === "dont").length})
          </button>

          {cfg.items.some((i) => i.type === "warning") && (
            <button
              type="button"
              onClick={() => setActiveFilter("warning")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-semibold transition-all ${
                activeFilter === "warning"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                  : "bg-muted border border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: resolvedWarningColor }}
              />
              Pozor ({cfg.items.filter((i) => i.type === "warning").length})
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: VISUAL CARDS (S OBRÁZKAMI A DIAGRAMMI)           */}
      {/* ======================================================== */}
      {cfg.layout === "cards" && (
        <div className={`grid ${gridColumnClass} gap-5 sm:gap-6`}>
          {displayedItems.map((item, index) => {
            const itemTitle = resolveI18nText(item.title, locale);
            const itemDescription = resolveI18nText(item.description, locale);

            // Badge properties
            let badgeBg = resolvedDontColor;
            let badgeIcon = semanticErrorIconUrl ? (
              <img src={semanticErrorIconUrl} alt="Don't" className="w-4 h-4 object-contain brightness-0 invert" />
            ) : (
              <X className="w-4 h-4 text-white stroke-[2.5]" />
            );
            let badgeLabel = "DON'T";

            if (item.type === "do") {
              badgeBg = resolvedDoColor;
              badgeIcon = semanticSuccessIconUrl ? (
                <img src={semanticSuccessIconUrl} alt="Do" className="w-4 h-4 object-contain brightness-0 invert" />
              ) : (
                <Check className="w-4 h-4 text-white stroke-[2.5]" />
              );
              badgeLabel = "DO";
            } else if (item.type === "warning") {
              badgeBg = resolvedWarningColor;
              badgeIcon = semanticWarningIconUrl ? (
                <img src={semanticWarningIconUrl} alt="Warning" className="w-4 h-4 object-contain brightness-0 invert" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-white stroke-[2.5]" />
              );
              badgeLabel = "POZOR";
            }

            const badgePositionClass =
              cfg.badgePosition === "top-right" ? "top-3 right-3" : "top-3 left-3";

            const badgeContrast = getWcagContrast(badgeBg);
            const badgeTextColor = badgeContrast.preferredText === "white" ? "#fafbfc" : "#070b0f";

            return (
              <div
                key={item.id}
                className="flex flex-col bg-card border border-border/60 overflow-hidden shadow-xs hover:border-border transition-all duration-200"
                style={{ borderRadius: brandRadius }}
              >
                {/* Visual Preview Box */}
                <div
                  className="relative w-full aspect-square flex items-center justify-center overflow-hidden border-b border-border/40"
                  style={getCardBackgroundStyle(item)}
                >
                  {/* Visual Status Badge */}
                  <div
                    className={`absolute ${badgePositionClass} z-20 flex items-center gap-1.5 shadow-md`}
                  >
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-2 ring-black/40 transition-transform"
                      style={{ backgroundColor: badgeBg, color: badgeTextColor }}
                    >
                      {badgeIcon}
                    </div>
                    <span
                      className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-[2px] tracking-wider shadow-sm ring-1 ring-black/20"
                      style={{ backgroundColor: badgeBg, color: badgeTextColor }}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Artwork / Image / Fallback Graphic */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={itemTitle}
                      className="max-w-[78%] max-h-[75%] object-contain drop-shadow-sm select-none transition-transform duration-300"
                    />
                  ) : (
                    <DefaultRuleGraphic type={item.type} ruleId={item.id} isDark={isCardDark(item)} />
                  )}
                </div>

                {/* Text Info Section */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1.5">
                    {/* Title */}
                    {isEditor ? (
                      <InlineEditableText
                        value={itemTitle}
                        as="h4"
                        className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug"
                        onSave={(val) => {
                          const updated = [...cfg.items];
                          const realIdx = cfg.items.findIndex((i) => i.id === item.id);
                          if (realIdx >= 0) {
                            updated[realIdx] = {
                              ...updated[realIdx],
                              title: setI18nText(updated[realIdx].title, val, locale),
                            };
                            handleSaveConfig({ ...cfg, items: updated });
                          }
                        }}
                      />
                    ) : (
                      <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug">
                        {itemTitle}
                      </h4>
                    )}

                    {/* Description */}
                    {isEditor ? (
                      <InlineEditableText
                        value={itemDescription || ""}
                        as="p"
                        multiline
                        placeholder="Kliknite pre pridanie vysvetľujúceho popisu pravidla..."
                        className="text-xs sm:text-sm text-muted-foreground leading-relaxed"
                        onSave={(val) => {
                          const updated = [...cfg.items];
                          const realIdx = cfg.items.findIndex((i) => i.id === item.id);
                          if (realIdx >= 0) {
                            updated[realIdx] = {
                              ...updated[realIdx],
                              description: setI18nText(updated[realIdx].description, val, locale),
                            };
                            handleSaveConfig({ ...cfg, items: updated });
                          }
                        }}
                      />
                    ) : (
                      itemDescription && (
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {itemDescription}
                        </p>
                      )
                    )}
                  </div>

                  {/* Editor fast controls */}
                  {isEditor && (
                    <div className="pt-2 flex items-center justify-between border-t border-border/20 text-[10px] font-mono text-muted-foreground">
                      <span className="uppercase tracking-wider">
                        Typ:{" "}
                        <strong
                          style={{
                            color:
                              item.type === "do"
                                ? resolvedDoColor
                                : item.type === "dont"
                                ? resolvedDontColor
                                : resolvedWarningColor,
                          }}
                        >
                          {item.type}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="hover:text-primary transition-colors underline"
                      >
                        Konfigurovať kartu
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: MINIMALIST TEXT SUMMARY (ČISTÉ ZHRNUTIE VETAMI) */}
      {/* ======================================================== */}
      {cfg.layout === "minimal" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DO COLUMN: ČO DODRŽIAVAŤ */}
            <div
              className="bg-card border rounded-lg p-5 sm:p-6 space-y-4"
              style={{
                borderColor: `${resolvedDoColor}40`,
                borderRadius: brandRadius,
              }}
            >
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: resolvedDoColor }}
                >
                  {semanticSuccessIconUrl ? (
                    <img src={semanticSuccessIconUrl} alt="Do" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                    Čo dodržiavať (Povolené)
                  </h4>
                  <span className="text-[10px] font-mono text-muted-foreground block">
                    Schválené zásady práce s identitou
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {doItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Žiadne schválené pravidlá neboli zadefinované.
                  </p>
                ) : (
                  doItems.map((item) => {
                    const itemTitle = resolveI18nText(item.title, locale);
                    const itemDesc = resolveI18nText(item.description, locale);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 rounded hover:bg-neutral-800/20 transition-colors"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: resolvedDoColor }}
                        />
                        <div className="space-y-0.5 flex-1">
                          <strong className="text-xs sm:text-sm font-semibold text-foreground block">
                            {itemTitle}
                          </strong>
                          {itemDesc && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {itemDesc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DON'T COLUMN: ČOHO SA VYVAROVAŤ */}
            <div
              className="bg-card border rounded-lg p-5 sm:p-6 space-y-4"
              style={{
                borderColor: `${resolvedDontColor}40`,
                borderRadius: brandRadius,
              }}
            >
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: resolvedDontColor }}
                >
                  {semanticErrorIconUrl ? (
                    <img src={semanticErrorIconUrl} alt="Don't" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                  ) : (
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                    Čoho sa vyvarovať (Zakázané)
                  </h4>
                  <span className="text-[10px] font-mono text-muted-foreground block">
                    Nepovolené deformácie a manipulácie
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {dontItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Žiadne zakázané manipulácie neboli zadefinované.
                  </p>
                ) : (
                  dontItems.map((item) => {
                    const itemTitle = resolveI18nText(item.title, locale);
                    const itemDesc = resolveI18nText(item.description, locale);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 rounded hover:bg-neutral-800/20 transition-colors"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: resolvedDontColor }}
                        />
                        <div className="space-y-0.5 flex-1">
                          <strong className="text-xs sm:text-sm font-semibold text-foreground block">
                            {itemTitle}
                          </strong>
                          {itemDesc && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {itemDesc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* WARNING SECTION (AK SÚ DEFINOVANÉ VÝSTRAHY) */}
          {warningItems.length > 0 && (
            <div
              className="bg-card border rounded-lg p-4 sm:p-5 space-y-3"
              style={{
                borderColor: `${resolvedWarningColor}40`,
                borderRadius: brandRadius,
              }}
            >
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: resolvedWarningColor }}
                >
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                </div>
                <h5 className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                  Výnimočné a obmedzené situácie (Pozor)
                </h5>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {warningItems.map((item) => {
                  const itemTitle = resolveI18nText(item.title, locale);
                  const itemDesc = resolveI18nText(item.description, locale);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 p-2 rounded bg-muted/40 border border-border/40"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: resolvedWarningColor }}
                      />
                      <div className="space-y-0.5 flex-1">
                        <strong className="text-xs font-semibold text-foreground block">
                          {itemTitle}
                        </strong>
                        {itemDesc && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {itemDesc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN SETTINGS MODAL / SHEET                             */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div className="dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-150 text-[#fafbfc]" data-theme="dark">
          <div
            className="w-full max-w-3xl bg-[#0e161d] border border-white/15 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#fafbfc]"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-[#fafbfc] text-sm tracking-tight">
                  Správa pravidiel Do's & Don'ts (M20)
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

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-white/10 bg-[#070b0f] px-5 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTab("items")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "items"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Karty pravidiel ({cfg.items.length})</span>
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
                <Palette className="w-3.5 h-3.5" />
                <span>Farby & Rozloženie</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: ITEMS MANAGEMENT */}
              {modalTab === "items" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs">
                        Zoznam pravidiel
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Definujte povolené a zakázané zásady používania identity.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: M20RuleItem = {
                          id: `rule-${Date.now()}`,
                          type: "dont",
                          imageUrl: "",
                          title: {
                            en: "New Usage Guideline",
                            sk: "Nové pravidlo používania",
                            cs: "Nové pravidlo používání",
                          },
                          description: {
                            en: "Describe the specific rule or prohibited modification here.",
                            sk: "Detailne popíšte konkrétne pravidlo alebo zakázanú modifikáciu.",
                            cs: "Detailně popište konkrétní pravidlo nebo zakázanou modifikaci.",
                          },
                          background: "auto",
                        };
                        handleSaveConfig({
                          ...cfg,
                          items: [...cfg.items, newItem],
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pridať pravidlo</span>
                    </button>
                  </div>

                  {/* Rules list */}
                  <div className="space-y-4">
                    {cfg.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-[#17212a] border border-white/10 rounded p-4 space-y-3 relative group/item"
                      >
                        {/* Top bar with type selector and controls */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          {/* Type toggle */}
                          <div className="flex items-center gap-1 bg-[#070b0f] p-0.5 rounded border border-white/15">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...cfg.items];
                                updated[index] = { ...updated[index], type: "do" };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                item.type === "do"
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : "text-[#96abbe] hover:text-[#fafbfc]"
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>DO</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...cfg.items];
                                updated[index] = { ...updated[index], type: "dont" };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                item.type === "dont"
                                  ? "bg-rose-500 text-white shadow-xs"
                                  : "text-[#96abbe] hover:text-[#fafbfc]"
                              }`}
                            >
                              <X className="w-3 h-3 stroke-[3]" />
                              <span>DON'T</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...cfg.items];
                                updated[index] = { ...updated[index], type: "warning" };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                item.type === "warning"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-[#96abbe] hover:text-[#fafbfc]"
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3 stroke-[3]" />
                              <span>POZOR</span>
                            </button>
                          </div>

                          {/* Reordering & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveItem(index, "up")}
                              className="p-1 rounded text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-30 transition-colors"
                              title="Posunúť vyššie"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={index === cfg.items.length - 1}
                              onClick={() => moveItem(index, "down")}
                              className="p-1 rounded text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-30 transition-colors"
                              title="Posunúť nižšie"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = cfg.items.filter((_, i) => i !== index);
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ml-1"
                              title="Odstrániť pravidlo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Fields: Title, Image, Background */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Title SK */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Názov pravidla (SK):
                            </label>
                            <input
                              type="text"
                              value={
                                typeof item.title === "object"
                                  ? item.title.sk || item.title.en || ""
                                  : item.title
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = {
                                  ...updated[index],
                                  title: setI18nText(updated[index].title, val, "sk"),
                                };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Title EN */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Názov pravidla (EN):
                            </label>
                            <input
                              type="text"
                              value={
                                typeof item.title === "object"
                                  ? item.title.en || ""
                                  : item.title
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = {
                                  ...updated[index],
                                  title: setI18nText(updated[index].title, val, "en"),
                                };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Description SK */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Popis pravidla (SK):
                            </label>
                            <textarea
                              rows={2}
                              value={
                                typeof item.description === "object"
                                  ? item.description.sk || item.description.en || ""
                                  : item.description || ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = {
                                  ...updated[index],
                                  description: setI18nText(updated[index].description, val, "sk"),
                                };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none resize-none"
                            />
                          </div>

                          {/* Description EN */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Popis pravidla (EN):
                            </label>
                            <textarea
                              rows={2}
                              value={
                                typeof item.description === "object"
                                  ? item.description.en || ""
                                  : item.description || ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = {
                                  ...updated[index],
                                  description: setI18nText(updated[index].description, val, "en"),
                                };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none resize-none"
                            />
                          </div>

                          {/* Image source with direct file upload */}
                          <div className="space-y-1 sm:col-span-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Obrázok ukážky (JPG, PNG, SVG):
                              </label>
                              <div className="flex items-center gap-2">
                                {/* Direct File Upload Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPickerTargetRuleIndex(index);
                                    setIsUniversalPickerOpen(true);
                                  }}
                                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Vybrať z médií / Nahrať</span>
                                </button>

                                {/* Select from Brand Assets */}
                                {brandAssets.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAssetPickerRuleIndex(
                                        assetPickerRuleIndex === index ? null : index
                                      )
                                    }
                                    className="text-[10px] text-[#96abbe] hover:text-[#fafbfc] flex items-center gap-1"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>Z knižnice log</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <input
                              type="text"
                              placeholder="https://... alebo nahrajte súbor tlačidlom vyššie"
                              value={item.imageUrl}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = { ...updated[index], imageUrl: val };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none font-mono"
                            />
                          </div>

                          {/* Card background selector */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-mono text-[#96abbe] block">
                              Podklad plátna náhľadu:
                            </label>
                            <div className="flex items-center gap-2">
                              <select
                                value={item.background}
                                onChange={(e) => {
                                  const val = e.target.value as M20BackgroundMode;
                                  const updated = [...cfg.items];
                                  updated[index] = { ...updated[index], background: val };
                                  handleSaveConfig({ ...cfg, items: updated });
                                }}
                                className="flex-1 bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                              >
                                <option value="auto">Auto (Dediť z modulu)</option>
                                <option value="dark">Tmavé (#0E161D)</option>
                                <option value="light">Svetlé (#FFFFFF)</option>
                                <option value="checkerboard">Šachovnica (Priehľadné)</option>
                                <option value="custom">Vlastný HEX</option>
                              </select>

                              {item.background === "custom" && (
                                <div className="flex items-center gap-1 bg-[#070b0f] border border-white/15 rounded px-2 py-1 text-xs">
                                  <span className="text-[#96abbe] font-mono">#</span>
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="17212A"
                                    value={(item.customBgHex || "").replace(/^#/, "").toUpperCase()}
                                    onChange={(e) => {
                                      const val = e.target.value
                                        .replace(/[^0-9A-Fa-f]/g, "")
                                        .slice(0, 6)
                                        .toUpperCase();
                                      const updated = [...cfg.items];
                                      updated[index] = {
                                        ...updated[index],
                                        customBgHex: val,
                                      };
                                      handleSaveConfig({ ...cfg, items: updated });
                                    }}
                                    className="w-16 bg-transparent text-[#fafbfc] font-mono focus:outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Brand Assets Picker Dropdown */}
                        {assetPickerRuleIndex === index && brandAssets.length > 0 && (
                          <div className="mt-2 p-3 bg-[#070b0f] border border-white/15 rounded space-y-2">
                            <span className="text-[10px] font-mono text-[#96abbe] uppercase tracking-wider block">
                              Kliknutím vyberte logo značky pre túto kartu:
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                              {brandAssets.map((asset) => {
                                const physicalSvg = asset.files?.find((f) => f.fileFormat === "SVG");
                                const logoUrl =
                                  physicalSvg?.fileUrl ||
                                  (asset.svgContent ? `/api/assets/${asset.id}/svg` : "") ||
                                  asset.previewUrl ||
                                  asset.files?.[0]?.fileUrl ||
                                  "";
                                const assetName =
                                  resolveI18nText(asset.name, locale) ||
                                  asset.name?.en ||
                                  asset.name?.sk ||
                                  "Logo";
                                return (
                                  <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...cfg.items];
                                      updated[index] = {
                                        ...updated[index],
                                        imageUrl: logoUrl,
                                        assetId: asset.id,
                                      };
                                      handleSaveConfig({ ...cfg, items: updated });
                                      setAssetPickerRuleIndex(null);
                                    }}
                                    className="p-2 bg-[#17212a] hover:bg-[#1f2c36] border border-white/10 rounded flex flex-col items-center gap-1 transition-all"
                                  >
                                    <div className="w-full h-10 flex items-center justify-center overflow-hidden">
                                      {logoUrl ? (
                                        <img
                                          src={logoUrl}
                                          alt={assetName}
                                          className="max-h-8 max-w-full object-contain"
                                        />
                                      ) : (
                                        <ImageIcon className="w-5 h-5 text-[#96abbe]" />
                                      )}
                                    </div>
                                    <span className="text-[9px] text-[#96abbe] truncate w-full text-center">
                                      {assetName}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: COLORS & LAYOUT SETTINGS */}
              {modalTab === "settings" && (
                <div className="space-y-6">
                  {/* Layout Display Mode: Cards vs Minimal Text Summary */}
                  <div className="bg-[#17212a] border border-white/10 rounded p-4 space-y-3">
                    <span className="font-semibold text-[#fafbfc] text-xs block">
                      Štýl prezentácie pravidiel:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, layout: "cards" })}
                        className={`p-3 rounded border text-left transition-all ${
                          cfg.layout === "cards"
                            ? "border-primary bg-primary/10 text-[#fafbfc] ring-1 ring-primary/40"
                            : "border-white/10 text-[#96abbe] hover:text-[#fafbfc] bg-[#070b0f]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <LayoutGrid className="w-4 h-4 text-primary" />
                          <span className="font-bold text-xs">Vizuálne karty</span>
                        </div>
                        <span className="text-[10px] text-[#96abbe] leading-normal block">
                          Veľké karty s obrázkami, náhľadmi chýb a statusovými odznakmi.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, layout: "minimal" })}
                        className={`p-3 rounded border text-left transition-all ${
                          cfg.layout === "minimal"
                            ? "border-primary bg-primary/10 text-[#fafbfc] ring-1 ring-primary/40"
                            : "border-white/10 text-[#96abbe] hover:text-[#fafbfc] bg-[#070b0f]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-bold text-xs">Minimalistické zhrnutie</span>
                        </div>
                        <span className="text-[10px] text-[#96abbe] leading-normal block">
                          Kompaktný textový prehľad rozdelený na DO a DON'T iba v niekoľkých vetách.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Semantic Color Overrides */}
                  <div className="bg-[#17212a] border border-white/10 rounded p-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-primary" />
                        <span>Sémantické farby indikátorov</span>
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Predvolene preberajú farby zo systémových tokenov značky (--color-success,
                        --color-danger, --color-warning). Môžete ich však predefinovať pre vlastnú
                        estetiku značky.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      {/* DO color */}
                      <div className="space-y-2 bg-[#070b0f] p-3 rounded border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#fafbfc] flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: resolvedDoColor }}
                            />
                            DO (Povolené)
                          </span>
                          {cfg.doColor && (
                            <button
                              type="button"
                              onClick={() => handleSaveConfig({ ...cfg, doColor: null })}
                              className="text-[10px] text-[#96abbe] hover:text-primary flex items-center gap-1"
                              title="Reset na systémový token"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[#17212a] border border-white/15 rounded px-2 py-1 text-xs">
                            <span className="text-[#96abbe] font-mono">#</span>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="10B981"
                              value={(cfg.doColor || "").replace(/^#/, "").toUpperCase()}
                              onChange={(e) => {
                                const val = e.target.value
                                  .replace(/[^0-9A-Fa-f]/g, "")
                                  .slice(0, 6)
                                  .toUpperCase();
                                handleSaveConfig({
                                  ...cfg,
                                  doColor: val || null,
                                });
                              }}
                              className="w-20 bg-transparent text-[#fafbfc] font-mono focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-[#96abbe] font-mono">
                            {cfg.doColor ? "Vlastná" : "Systémová"}
                          </span>
                        </div>
                      </div>

                      {/* DON'T color */}
                      <div className="space-y-2 bg-[#070b0f] p-3 rounded border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#fafbfc] flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: resolvedDontColor }}
                            />
                            DON'T (Zakázané)
                          </span>
                          {cfg.dontColor && (
                            <button
                              type="button"
                              onClick={() => handleSaveConfig({ ...cfg, dontColor: null })}
                              className="text-[10px] text-[#96abbe] hover:text-primary flex items-center gap-1"
                              title="Reset na systémový token"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[#17212a] border border-white/15 rounded px-2 py-1 text-xs">
                            <span className="text-[#96abbe] font-mono">#</span>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="E11D48"
                              value={(cfg.dontColor || "").replace(/^#/, "").toUpperCase()}
                              onChange={(e) => {
                                const val = e.target.value
                                  .replace(/[^0-9A-Fa-f]/g, "")
                                  .slice(0, 6)
                                  .toUpperCase();
                                handleSaveConfig({
                                  ...cfg,
                                  dontColor: val || null,
                                });
                              }}
                              className="w-20 bg-transparent text-[#fafbfc] font-mono focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-[#96abbe] font-mono">
                            {cfg.dontColor ? "Vlastná" : "Systémová"}
                          </span>
                        </div>
                      </div>

                      {/* WARNING color */}
                      <div className="space-y-2 bg-[#070b0f] p-3 rounded border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#fafbfc] flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: resolvedWarningColor }}
                            />
                            POZOR (Výstraha)
                          </span>
                          {cfg.warningColor && (
                            <button
                              type="button"
                              onClick={() => handleSaveConfig({ ...cfg, warningColor: null })}
                              className="text-[10px] text-[#96abbe] hover:text-primary flex items-center gap-1"
                              title="Reset na systémový token"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[#17212a] border border-white/15 rounded px-2 py-1 text-xs">
                            <span className="text-[#96abbe] font-mono">#</span>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="F59E0B"
                              value={(cfg.warningColor || "").replace(/^#/, "").toUpperCase()}
                              onChange={(e) => {
                                const val = e.target.value
                                  .replace(/[^0-9A-Fa-f]/g, "")
                                  .slice(0, 6)
                                  .toUpperCase();
                                handleSaveConfig({
                                  ...cfg,
                                  warningColor: val || null,
                                });
                              }}
                              className="w-20 bg-transparent text-[#fafbfc] font-mono focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-[#96abbe] font-mono">
                            {cfg.warningColor ? "Vlastná" : "Systémová"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid Layout & General Settings (for cards mode) */}
                  {cfg.layout === "cards" && (
                    <div className="bg-[#17212a] border border-white/10 rounded p-4 space-y-4">
                      <h4 className="font-semibold text-[#fafbfc] text-xs flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-primary" />
                        <span>Rozloženie mriežky a zobrazenie</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Columns count */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#fafbfc] block">
                            Počet stĺpcov kariet:
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4].map((cols) => (
                              <button
                                key={cols}
                                type="button"
                                onClick={() => handleSaveConfig({ ...cfg, columns: cols })}
                                className={`flex-1 py-1.5 rounded border text-xs font-bold transition-all ${
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

                        {/* Badge position */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#fafbfc] block">
                            Umiestnenie stavového odznaku:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveConfig({ ...cfg, badgePosition: "top-left" })
                              }
                              className={`py-1.5 rounded border text-xs font-bold transition-all ${
                                cfg.badgePosition === "top-left"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-[#070b0f] border-white/15 text-[#96abbe] hover:text-[#fafbfc]"
                              }`}
                            >
                              Vľavo hore
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveConfig({ ...cfg, badgePosition: "top-right" })
                              }
                              className={`py-1.5 rounded border text-xs font-bold transition-all ${
                                cfg.badgePosition === "top-right"
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-[#070b0f] border-white/15 text-[#96abbe] hover:text-[#fafbfc]"
                              }`}
                            >
                              Vpravo hore
                            </button>
                          </div>
                        </div>

                        {/* Default Preview Background */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#fafbfc] block">
                            Predvolený podklad plátna:
                          </label>
                          <select
                            value={cfg.defaultBackground}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...cfg,
                                defaultBackground: e.target.value as M20BackgroundMode,
                              })
                            }
                            className="w-full bg-[#070b0f] border border-white/15 rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                          >
                            <option value="auto">Auto (Neutrálne tmavé s jemnou mriežkou)</option>
                            <option value="dark">Tmavé (#0E161D)</option>
                            <option value="light">Svetlé (#FFFFFF)</option>
                            <option value="checkerboard">Šachovnica (Transparentné)</option>
                          </select>
                        </div>

                        {/* Category Filter Toggle */}
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <label className="text-xs font-semibold text-[#fafbfc] flex items-center justify-between cursor-pointer">
                            <span>Zobraziť filter kategórií</span>
                            <input
                              type="checkbox"
                              checked={cfg.showFilter}
                              onChange={(e) =>
                                handleSaveConfig({ ...cfg, showFilter: e.target.checked })
                              }
                              className="rounded border-white/20 bg-[#070b0f] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                          </label>
                          <span className="text-[11px] text-[#96abbe]">
                            Umožní návštevníkom rýchlo filtrovať karty podľa DO, DON'T alebo POZOR.
                          </span>
                        </div>
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

      {/* Universal Media Picker Modal */}
      {isUniversalPickerOpen && pickerTargetRuleIndex !== null && (
        <UniversalMediaPickerModal
          isOpen={isUniversalPickerOpen}
          onClose={() => {
            setIsUniversalPickerOpen(false);
            setPickerTargetRuleIndex(null);
          }}
          brandId={brandId}
          title="Vybrať obrázok pre pravidlo Do's & Don'ts"
          description="Zvoľte existujúci obrázok, logo alebo nahrajte nový súbor."
          currentUrl={cfg.items[pickerTargetRuleIndex]?.imageUrl}
          onSelect={(selected) => {
            const updated = [...cfg.items];
            updated[pickerTargetRuleIndex] = {
              ...updated[pickerTargetRuleIndex],
              imageUrl: selected.url,
            };
            handleSaveConfig({ ...cfg, items: updated });
          }}
          acceptedFileTypes="image/*,.png,.jpg,.jpeg,.webp,.svg"
          allowDirectUrl={true}
          includeBrandLogos={true}
        />
      )}
    </div>
  );
}
