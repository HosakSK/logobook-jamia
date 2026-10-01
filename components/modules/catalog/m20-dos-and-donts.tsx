"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { BrandAsset } from "@/lib/types/asset";

/**
 * High-fidelity fallback SVG graphics for default rules if custom image is not yet uploaded
 */
function DefaultRuleGraphic({
  type,
  ruleId,
}: {
  type: M20ItemType;
  ruleId: string;
}) {
  if (ruleId === "rule-1" || type === "dont") {
    // Distorted logo representation with stretch guides
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full p-6 select-none">
        {/* Subtle grid lines in background */}
        <div className="absolute inset-4 border border-dashed border-red-500/20 rounded pointer-events-none flex items-center justify-center">
          <span className="absolute -top-2.5 bg-[#0e161d] px-2 text-[10px] font-mono text-red-400">
            PROPORTION LOCK BROKEN
          </span>
        </div>

        {/* Distorted symbol */}
        <div className="transform scale-x-[1.65] scale-y-[0.7] transition-transform">
          <img
            src="/logo/logo-symbol-light.svg"
            alt="Distorted Mark"
            className="w-20 h-20 object-contain opacity-80"
          />
        </div>

        {/* Stretch arrows */}
        <div className="absolute inset-x-8 flex justify-between items-center text-red-400 text-xs font-mono">
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
            src="/logo/logo-symbol-light.svg"
            alt="Unapproved Colors"
            className="w-20 h-20 object-contain"
          />
        </div>
        <div className="absolute bottom-3 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400">
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
            src="/logo/logo-symbol-light.svg"
            alt="Monochrome Mark"
            className="w-20 h-20 object-contain"
          />
        </div>
        <div className="absolute bottom-3 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400">
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
          src="/logo/logo-symbol-light.svg"
          alt="Approved Mark"
          className="w-20 h-20 object-contain"
        />
      </div>
      <div className="absolute bottom-3 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
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
  const { resolveRadius, resolveColor, resolveStyles } = useBrandCascade();
  const brandRadius = resolveRadius();
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

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Fetch brand assets for quick selection in editor
  useEffect(() => {
    if (brandId && isEditor) {
      getBrandAssetsAction(brandId)
        .then((res) => {
          if (res?.success && res.assets) {
            setBrandAssets(res.assets);
          }
        })
        .catch((err) => console.error("Failed to load brand assets in M20:", err));
    }
  }, [brandId, isEditor]);

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

  // Compute CSS column classes
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
        return {
          backgroundColor: "#0e161d",
          backgroundImage:
            "linear-gradient(45deg, #17212a 25%, transparent 25%), linear-gradient(-45deg, #17212a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #17212a 75%), linear-gradient(-45deg, transparent 75%, #17212a 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        };
      case "custom":
        if (item.customBgHex) {
          return { backgroundColor: `#${item.customBgHex.replace(/^#/, "")}` };
        }
        return { backgroundColor: "#0e161d" };
      case "auto":
      default:
        return {
          backgroundColor: "#0e161d",
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        };
    }
  };

  return (
    <div
      className="relative group/m20 transition-all duration-200"
      style={{
        borderRadius: brandRadius,
        ...resolveStyles(cfg.styleOverrides),
      }}
    >
      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/m20:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#17212a]/90 backdrop-blur-md border border-border/80 px-2 py-1 rounded-[3px] shadow-md">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-primary transition-colors"
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

      {/* Client Filter Controls */}
      {cfg.showFilter && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 rounded-[3px] text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-[#17212a] border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Všetky ({cfg.items.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("do")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-semibold transition-all ${
              activeFilter === "do"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-[#17212a] border border-border/40 text-muted-foreground hover:text-foreground"
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
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-[#17212a] border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: resolvedDontColor }}
            />
            Zakázané ({cfg.items.filter((i) => i.type === "dont").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("warning")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-semibold transition-all ${
              activeFilter === "warning"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-[#17212a] border border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: resolvedWarningColor }}
            />
            Pozor ({cfg.items.filter((i) => i.type === "warning").length})
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className={`grid ${gridColumnClass} gap-5 sm:gap-6`}>
        {displayedItems.map((item, index) => {
          const itemTitle = resolveI18nText(item.title, locale);
          const itemDescription = resolveI18nText(item.description, locale);

          // Badge properties
          let badgeBg = resolvedDontColor;
          let badgeIcon = <X className="w-4 h-4 text-white stroke-[2.5]" />;
          let badgeLabel = "DON'T";

          if (item.type === "do") {
            badgeBg = resolvedDoColor;
            badgeIcon = <Check className="w-4 h-4 text-white stroke-[2.5]" />;
            badgeLabel = "DO";
          } else if (item.type === "warning") {
            badgeBg = resolvedWarningColor;
            badgeIcon = <AlertTriangle className="w-4 h-4 text-white stroke-[2.5]" />;
            badgeLabel = "POZOR";
          }

          const badgePositionClass =
            cfg.badgePosition === "top-right" ? "top-3 right-3" : "top-3 left-3";

          return (
            <div
              key={item.id}
              className="flex flex-col bg-[#17212a] border border-border/60 overflow-hidden shadow-xs hover:border-border transition-all duration-200"
              style={{ borderRadius: brandRadius }}
            >
              {/* Visual Preview Box */}
              <div
                className="relative w-full aspect-[16/10] sm:aspect-[4/3] flex items-center justify-center overflow-hidden border-b border-border/40"
                style={getCardBackgroundStyle(item)}
              >
                {/* Visual Status Badge */}
                <div
                  className={`absolute ${badgePositionClass} z-20 flex items-center gap-1.5 shadow-md`}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-2 ring-black/40 transition-transform"
                    style={{ backgroundColor: badgeBg }}
                  >
                    {badgeIcon}
                  </div>
                  <span
                    className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-[2px] text-white tracking-wider shadow-sm ring-1 ring-black/20"
                    style={{ backgroundColor: badgeBg }}
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
                  <DefaultRuleGraphic type={item.type} ruleId={item.id} />
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

                {/* Editor fast type indicator */}
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

      {/* ADMIN SETTINGS MODAL / SHEET */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-[#131c24] border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm tracking-tight">
                  Správa pravidiel Do's & Don'ts (M20)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-border/60 bg-[#101820] px-5 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTab("items")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "items"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Farby & Rozloženie</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: ITEMS MANAGEMENT */}
              {modalTab === "items" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground text-xs">
                        Zoznam pravidiel
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
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
                        className="bg-[#17212a] border border-border/50 rounded p-4 space-y-3 relative group/item"
                      >
                        {/* Top bar with type selector and controls */}
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          {/* Type toggle */}
                          <div className="flex items-center gap-1 bg-[#0e161d] p-0.5 rounded border border-border/40">
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
                                  : "text-muted-foreground hover:text-foreground"
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
                                  : "text-muted-foreground hover:text-foreground"
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
                                  : "text-muted-foreground hover:text-foreground"
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
                              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                              title="Posunúť vyššie"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={index === cfg.items.length - 1}
                              onClick={() => moveItem(index, "down")}
                              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
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
                            <label className="text-[10px] font-mono text-muted-foreground block">
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
                              className="w-full bg-[#0e161d] border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Title EN */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-muted-foreground block">
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
                              className="w-full bg-[#0e161d] border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Description SK */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-muted-foreground block">
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
                              className="w-full bg-[#0e161d] border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none resize-none"
                            />
                          </div>

                          {/* Description EN */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-muted-foreground block">
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
                              className="w-full bg-[#0e161d] border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none resize-none"
                            />
                          </div>

                          {/* Image source */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-mono text-muted-foreground block">
                                URL obrázka ukážky:
                              </label>
                              {brandAssets.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAssetPickerRuleIndex(
                                      assetPickerRuleIndex === index ? null : index
                                    )
                                  }
                                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>Vybrať z logotypov</span>
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="https://... alebo nechajte prázdne pre SVG grafiku"
                              value={item.imageUrl}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...cfg.items];
                                updated[index] = { ...updated[index], imageUrl: val };
                                handleSaveConfig({ ...cfg, items: updated });
                              }}
                              className="w-full bg-[#0e161d] border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Card background selector */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-muted-foreground block">
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
                                className="flex-1 bg-[#0e161d] border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                              >
                                <option value="auto">Auto (Dediť z modulu)</option>
                                <option value="dark">Tmavé (#0E161D)</option>
                                <option value="light">Svetlé (#FFFFFF)</option>
                                <option value="checkerboard">Šachovnica (Priehľadné)</option>
                                <option value="custom">Vlastný HEX</option>
                              </select>

                              {item.background === "custom" && (
                                <div className="flex items-center gap-1 bg-[#0e161d] border border-border/50 rounded px-2 py-1 text-xs">
                                  <span className="text-muted-foreground font-mono">#</span>
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
                                    className="w-16 bg-transparent text-foreground font-mono focus:outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Brand Assets Picker Dropdown */}
                        {assetPickerRuleIndex === index && brandAssets.length > 0 && (
                          <div className="mt-2 p-3 bg-[#0e161d] border border-border/60 rounded space-y-2">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                              Kliknutím vyberte logo značky pre túto kartu:
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                              {brandAssets.map((asset) => {
                                const logoUrl =
                                  asset.previewUrl ||
                                  asset.files?.find((f) => f.fileFormat === "SVG")?.fileUrl ||
                                  asset.files?.[0]?.fileUrl ||
                                  (asset.svgContent
                                    ? `data:image/svg+xml;utf8,${encodeURIComponent(asset.svgContent)}`
                                    : "");
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
                                    className="p-2 bg-[#17212a] hover:bg-[#1f2c36] border border-border/50 rounded flex flex-col items-center gap-1 transition-all"
                                  >
                                    <div className="w-full h-10 flex items-center justify-center overflow-hidden">
                                      {logoUrl ? (
                                        <img
                                          src={logoUrl}
                                          alt={assetName}
                                          className="max-h-8 max-w-full object-contain"
                                        />
                                      ) : (
                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
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
                  {/* Semantic Color Overrides */}
                  <div className="bg-[#17212a] border border-border/50 rounded p-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-primary" />
                        <span>Sémantické farby indikátorov</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Predvolene preberajú farby zo systémových tokenov značky (--color-success,
                        --color-danger, --color-warning). Môžete ich však predefinovať pre vlastnú
                        estetiku značky.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      {/* DO color */}
                      <div className="space-y-2 bg-[#0e161d] p-3 rounded border border-border/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
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
                              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                              title="Reset na systémový token"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[#17212a] border border-border/50 rounded px-2 py-1 text-xs">
                            <span className="text-muted-foreground font-mono">#</span>
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
                              className="w-20 bg-transparent text-foreground font-mono focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {cfg.doColor ? "Vlastná" : "Systémová"}
                          </span>
                        </div>
                      </div>

                      {/* DON'T color */}
                      <div className="space-y-2 bg-[#0e161d] p-3 rounded border border-border/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
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
                              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                              title="Reset na systémový token"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[#17212a] border border-border/50 rounded px-2 py-1 text-xs">
                            <span className="text-muted-foreground font-mono">#</span>
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
                              className="w-20 bg-transparent text-foreground font-mono focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {cfg.dontColor ? "Vlastná" : "Systémová"}
                          </span>
                        </div>
                      </div>

                      {/* WARNING color */}
                      <div className="space-y-2 bg-[#0e161d] p-3 rounded border border-border/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
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
                              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                              title="Reset na systémový token"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[#17212a] border border-border/50 rounded px-2 py-1 text-xs">
                            <span className="text-muted-foreground font-mono">#</span>
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
                              className="w-20 bg-transparent text-foreground font-mono focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {cfg.warningColor ? "Vlastná" : "Systémová"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid Layout & General Settings */}
                  <div className="bg-[#17212a] border border-border/50 rounded p-4 space-y-4">
                    <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      <span>Rozloženie mriežky a zobrazenie</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Columns count */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground block">
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
                                  : "bg-[#0e161d] border-border/50 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {cols} {cols === 1 ? "stĺpec" : cols < 5 ? "stĺpce" : "stĺpcov"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Badge position */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground block">
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
                                : "bg-[#0e161d] border-border/50 text-muted-foreground hover:text-foreground"
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
                                : "bg-[#0e161d] border-border/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Vpravo hore
                          </button>
                        </div>
                      </div>

                      {/* Default Preview Background */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground block">
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
                          className="w-full bg-[#0e161d] border border-border/50 rounded px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="auto">Auto (Neutrálne tmavé s jemnou mriežkou)</option>
                          <option value="dark">Tmavé (#0E161D)</option>
                          <option value="light">Svetlé (#FFFFFF)</option>
                          <option value="checkerboard">Šachovnica (Transparentné)</option>
                        </select>
                      </div>

                      {/* Category Filter Toggle */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between cursor-pointer">
                          <span>Zobraziť filter kategórií</span>
                          <input
                            type="checkbox"
                            checked={cfg.showFilter}
                            onChange={(e) =>
                              handleSaveConfig({ ...cfg, showFilter: e.target.checked })
                            }
                            className="rounded border-border/60 bg-[#0e161d] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          Umožní návštevníkom rýchlo filtrovať karty podľa DO, DON'T alebo POZOR.
                        </span>
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
