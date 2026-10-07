"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  Settings2,
  Check,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ExternalLink,
  Code2,
  FileCode,
  Sparkles,
  RefreshCw,
  FolderArchive,
  Layers,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M16PaletteDownloadsConfig,
  M16SwatchItem,
  m16PaletteDownloadsSchema,
} from "@/lib/validations/modules/m16";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandColorsAction } from "@/actions/colors";
import { BrandColor } from "@/lib/types/color";

export default function M16VzorkovnikyAPaletyNaStiahnutieModule({
  id: moduleId,
  moduleType = "M16_VzorkovnikyAPaletyNaStiahnutie",
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

  // 3 standard default seed presets (as approved by user)
  const defaultItems = useMemo<M16SwatchItem[]>(() => [
    {
      id: "preset-ase-illustrator",
      title: {
        en: "Adobe Illustrator Swatches (.ase / .ai)",
        sk: "Vzorkovníky pre Adobe Illustrator (.ase / .ai)",
      },
      description: {
        en: "Digital RGB swatches ready to import into Adobe Swatches panel.",
        sk: "Digitálne RGB vzorkovníky pripravené na priamy import do Adobe panelu vzoriek.",
      },
      buttonLabel: { en: "Download .ASE", sk: "Stiahnuť .ASE" },
      badgeText: "ASE",
      storageType: "EXTERNAL_LINK",
      fileUrl: "https://drive.google.com",
    },
    {
      id: "preset-ase-cmyk",
      title: {
        en: "Print CMYK Swatches (.ase)",
        sk: "Tlačové CMYK vzorkovníky (.ase)",
      },
      description: {
        en: "Standardized process color definitions for offset and digital print workflows.",
        sk: "Štandardizované definície procesných farieb pre ofsetovú a digitálnu tlač.",
      },
      buttonLabel: { en: "Download .ASE", sk: "Stiahnuť .ASE" },
      badgeText: "ASE",
      storageType: "EXTERNAL_LINK",
      fileUrl: "https://drive.google.com",
    },
    {
      id: "preset-tokens-css",
      title: {
        en: "Design Tokens & CSS Variables (.css / .json)",
        sk: "Dizajnové tokeny a CSS premenné (.css / .json)",
      },
      description: {
        en: "Live generated CSS variables and JSON design tokens from the brand color palette.",
        sk: "Živo generované CSS premenné a JSON dizajnové tokeny priamo z palety značky.",
      },
      buttonLabel: { en: "Generate .CSS", sk: "Stiahnuť .CSS" },
      badgeText: "CSS",
      storageType: "AUTO_GENERATE",
      autoGenerateType: "css_variables",
      fileUrl: "",
    },
  ], []);

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m16PaletteDownloadsSchema.safeParse(config);
    if (res.success) {
      return {
        ...res.data,
        items: res.data.items.length > 0 ? res.data.items : defaultItems,
      };
    }
    return {
      title: {
        en: "Palette & Swatch Downloads",
        sk: "Vzorkovníky a palety na stiahnutie",
      },
      description: {
        en: "Ready-to-use digital swatches for graphic software and code.",
        sk: "Predpripravené palety a digitálne vzorkovníky pre grafické programy a kód.",
      },
      items: defaultItems,
    };
  }, [config, defaultItems]);

  const [cfg, setCfg] = useState<M16PaletteDownloadsConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"items" | "general">("items");

  // Track downloaded feedback for item
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Loaded brand colors for auto-generation
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);

  // Drag and drop state for items reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load brand colors
  useEffect(() => {
    if (brandId) {
      getBrandColorsAction(brandId)
        .then((res) => {
          if (res.success && res.colors) setBrandColors(res.colors);
        })
        .catch((err) => console.error("Error loading brand colors for M16:", err));
    }
  }, [brandId]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M16PaletteDownloadsConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M16 config:", err);
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

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const list = [...cfg.items];
    const item = list.splice(draggedIndex, 1)[0];
    list.splice(dropIndex, 0, item);

    setDraggedIndex(null);
    setDragOverIndex(null);
    handleSaveConfig({ ...cfg, items: list });
  };

  // Auto-generate and download CSS Variables or JSON Design Tokens
  const triggerAutoDownload = (type: "css_variables" | "json_tokens", itemId: string) => {
    const safeBrandName = "brand";
    let fileContent = "";
    let fileName = "";
    let mimeType = "";

    const activeList =
      brandColors.length > 0
        ? brandColors
        : [
            {
              id: "c-1",
              name: { en: "Primary" },
              hex: tokens?.colors?.primary?.toUpperCase() || "#C8D400",
              rgb: "200, 212, 0",
            },
            {
              id: "c-2",
              name: { en: "Secondary" },
              hex: "#0E161D",
              rgb: "14, 22, 29",
            },
            {
              id: "c-3",
              name: { en: "Accent Teal" },
              hex: "#009F80",
              rgb: "0, 159, 128",
            },
          ];

    if (type === "css_variables") {
      fileName = `${safeBrandName}-colors.css`;
      mimeType = "text/css";
      const vars = activeList
        .map((c) => {
          const nameObj = c.name as Record<string, string> | undefined;
          const rawName = typeof c.name === "object" && nameObj ? nameObj.en || nameObj.sk || c.hex : (c.name as unknown as string) || c.hex;
          const varName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return `  --color-${varName}: ${c.hex.toUpperCase()};`;
        })
        .join("\n");

      fileContent = `/**\n * Brand Color Tokens generated from Logobook.sk\n */\n:root {\n${vars}\n}\n`;
    } else {
      fileName = `${safeBrandName}-tokens.json`;
      mimeType = "application/json";
      const tokenObj: Record<string, any> = {
        brand: {
          color: {},
        },
      };

      activeList.forEach((c) => {
        const nameObj = c.name as Record<string, string> | undefined;
        const rawName = typeof c.name === "object" && nameObj ? nameObj.en || nameObj.sk || c.hex : (c.name as unknown as string) || c.hex;
        const key = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        tokenObj.brand.color[key] = {
          value: c.hex.toUpperCase(),
          type: "color",
        };
      });

      fileContent = JSON.stringify(tokenObj, null, 2);
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedId(itemId);
    setTimeout(() => setDownloadedId(null), 2500);
  };

  const sectionTitle = resolveI18nText(cfg.title, locale) || "Vzorkovníky a palety na stiahnutie";
  const sectionDesc = cfg.description ? resolveI18nText(cfg.description, locale) : "";

  return (
    <div className="relative group/m16 py-4 space-y-4">
      {/* Optional H3 Header */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m16:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Správa vzorkovníkov</span>
          </button>
        </div>
      )}

      {/* SECTION HEADER WITH INLINE EDITING */}
      <div className="space-y-1">
        <InlineEditableText
          value={sectionTitle}
          onSave={async (newVal: string) => {
            await handleSaveConfig({
              ...cfg,
              title: setI18nText(cfg.title, locale, newVal),
            });
          }}
          disabled={!isEditor}
          as="h3"
          className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground"
        />

        {(sectionDesc || isEditor) && (
          <InlineEditableText
            value={sectionDesc}
            placeholder="Doplňte sprievodný text ku vzorkovníkom..."
            onSave={async (newVal: string) => {
              await handleSaveConfig({
                ...cfg,
                description: setI18nText(cfg.description, locale, newVal),
              });
            }}
            disabled={!isEditor}
            as="p"
            className="text-xs text-muted-foreground leading-relaxed max-w-2xl"
          />
        )}
      </div>

      {/* SWATCH DOWNLOAD CARDS LIST */}
      <div className="space-y-3 pt-1">
        {cfg.items.map((item, idx) => {
          const itemTitle = resolveI18nText(item.title, locale) || "Digitálny vzorkovník";
          const itemDesc = item.description ? resolveI18nText(item.description, locale) : "";
          const btnLabel = resolveI18nText(item.buttonLabel, locale) || "Stiahnuť súbor";
          const isDownloaded = downloadedId === item.id;
          const badge = item.badgeText || "ASE";

          return (
            <div
              key={item.id || `item-${idx}`}
              className="bg-card border border-border/60 p-4 sm:p-5 transition-all duration-200 shadow-xs hover:border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ borderRadius: brandRadius }}
            >
              {/* Left & Middle: Pure Typographic Tag + Content */}
              <div className="flex items-start gap-4 min-w-0">
                {/* Pure Typographic Format Badge (Legal compliant, no trademark logos) */}
                <div
                  className="w-13 h-13 rounded-[3px] bg-muted/60 border border-border/80 flex flex-col items-center justify-center shrink-0 shadow-2xs select-none"
                  style={{ borderRadius: brandRadius }}
                >
                  <span className="font-mono text-sm font-extrabold text-primary tracking-wider uppercase">
                    {badge}
                  </span>
                  <span className="text-[8px] font-mono text-muted-foreground uppercase font-semibold">
                    {item.storageType === "AUTO_GENERATE" ? "GENERATED" : "SWATCH"}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight truncate">
                      {itemTitle}
                    </h4>
                    {item.storageType === "AUTO_GENERATE" && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] bg-primary/10 border border-primary/30 text-primary font-bold">
                        Live Export
                      </span>
                    )}
                  </div>

                  {itemDesc && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {itemDesc}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Action Download Button (44px min tap target) */}
              <div className="shrink-0 flex items-center sm:self-center">
                {item.storageType === "AUTO_GENERATE" ? (
                  <button
                    type="button"
                    onClick={() =>
                      triggerAutoDownload(item.autoGenerateType || "css_variables", item.id)
                    }
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-[3px] bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ borderRadius: brandRadius }}
                  >
                    {isDownloaded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-950 font-bold" />
                        <span>Vygenerované!</span>
                      </>
                    ) : (
                      <>
                        <Code2 className="w-4 h-4" />
                        <span>{btnLabel}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <a
                    href={item.fileUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={item.storageType === "LOGOBOOK_R2"}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-[3px] bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                    style={{ borderRadius: brandRadius }}
                  >
                    <Download className="w-4 h-4" />
                    <span>{btnLabel}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADMIN SETTINGS MODAL (Pencil Hell Free) */}
      {isSettingsModalOpen && (
        <div className="dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-150 text-[#fafbfc]" data-theme="dark">
          <div
            className="w-full max-w-2xl bg-[#0e161d] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#fafbfc]"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-[#fafbfc]">
                  Nastavenia stiahnuteľných vzorkovníkov (M16)
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
                onClick={() => setModalTab("items")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "items"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                1. Súbory a odkazy ({cfg.items.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab("general")}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  modalTab === "general"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                2. Nadpisy modulu
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* TAB 1: SWATCH ITEMS */}
              {modalTab === "items" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#fafbfc] text-xs">
                      Položky na stiahnutie:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...cfg, items: defaultItems })}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[#17212a] border border-white/15 text-[#96abbe] hover:text-[#fafbfc] text-[11px] font-medium transition-colors"
                        title="Obnoviť 3 štandardné vzorové položky (Illustrator, CMYK, CSS)"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Vzorové položky</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newItem: M16SwatchItem = {
                            id: `swatch-${Date.now()}`,
                            title: { en: "Custom Swatch File", sk: "Nový vzorkovník" },
                            description: { en: "Description...", sk: "Popis súboru..." },
                            buttonLabel: { en: "Download", sk: "Stiahnuť" },
                            badgeText: "ASE",
                            storageType: "EXTERNAL_LINK",
                            fileUrl: "",
                          };
                          handleSaveConfig({
                            ...cfg,
                            items: [...cfg.items, newItem],
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-[11px] hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pridať položku</span>
                      </button>
                    </div>
                  </div>

                  {/* Items List in Modal */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {cfg.items.map((item, index) => {
                      const isDragging = draggedIndex === index;
                      const isOver = dragOverIndex === index;

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`p-3.5 rounded-[3px] border bg-[#17212a] space-y-3 transition-all ${
                            isDragging
                              ? "opacity-40 border-dashed border-primary"
                              : isOver
                              ? "border-primary bg-primary/10"
                              : "border-white/10 hover:border-white/25"
                          }`}
                        >
                          {/* Row Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="cursor-grab active:cursor-grabbing text-[#96abbe] hover:text-[#fafbfc]">
                                <GripVertical className="w-4 h-4" />
                              </span>
                              <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded-[2px] bg-[#070b0f] border border-white/15 text-primary">
                                {item.badgeText || "ASE"}
                              </span>
                              <span className="font-bold text-[#fafbfc] truncate">
                                {resolveI18nText(item.title, locale) || "Položka"}
                              </span>
                            </div>

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
                                title="Zmazať položku"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Item Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Title */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Názov vzorkovníka:
                              </label>
                              <input
                                type="text"
                                value={typeof item.title === "object" ? item.title.sk || item.title.en || "" : item.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...cfg.items];
                                  updated[index] = {
                                    ...updated[index],
                                    title: { en: val, sk: val },
                                  };
                                  handleSaveConfig({ ...cfg, items: updated });
                                }}
                                className="w-full bg-[#070b0f] border border-white/15 rounded-[2px] px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                              />
                            </div>

                            {/* Badge text (Pure typography tag, e.g. ASE, AI, JSON, CSS, ZIP) */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Typografická skratka formátu:
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                value={item.badgeText || "ASE"}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  const updated = [...cfg.items];
                                  updated[index] = {
                                    ...updated[index],
                                    badgeText: val,
                                  };
                                  handleSaveConfig({ ...cfg, items: updated });
                                }}
                                className="w-full font-mono uppercase bg-[#070b0f] border border-white/15 rounded-[2px] px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                              />
                            </div>

                            {/* Description */}
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Popis vzorkovníka:
                              </label>
                              <input
                                type="text"
                                value={typeof item.description === "object" ? item.description.sk || item.description.en || "" : item.description || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...cfg.items];
                                  updated[index] = {
                                    ...updated[index],
                                    description: { en: val, sk: val },
                                  };
                                  handleSaveConfig({ ...cfg, items: updated });
                                }}
                                className="w-full bg-[#070b0f] border border-white/15 rounded-[2px] px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                              />
                            </div>

                            {/* Button Label */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Text tlačidla:
                              </label>
                              <input
                                type="text"
                                value={typeof item.buttonLabel === "object" ? item.buttonLabel.sk || item.buttonLabel.en || "" : item.buttonLabel}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...cfg.items];
                                  updated[index] = {
                                    ...updated[index],
                                    buttonLabel: { en: val, sk: val },
                                  };
                                  handleSaveConfig({ ...cfg, items: updated });
                                }}
                                className="w-full bg-[#070b0f] border border-white/15 rounded-[2px] px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                              />
                            </div>

                            {/* Storage Type */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#96abbe] block">
                                Typ zdroja:
                              </label>
                              <select
                                value={item.storageType}
                                onChange={(e) => {
                                  const val = e.target.value as "LOGOBOOK_R2" | "EXTERNAL_LINK" | "AUTO_GENERATE";
                                  const updated = [...cfg.items];
                                  updated[index] = {
                                    ...updated[index],
                                    storageType: val,
                                    autoGenerateType: val === "AUTO_GENERATE" ? "css_variables" : undefined,
                                  };
                                  handleSaveConfig({ ...cfg, items: updated });
                                }}
                                className="w-full bg-[#070b0f] border border-white/15 rounded-[2px] px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                              >
                                <option value="EXTERNAL_LINK">Externý odkaz (Dropbox / Drive / Figma)</option>
                                <option value="AUTO_GENERATE">Automatický Live export (CSS / JSON)</option>
                                <option value="LOGOBOOK_R2">Logobook R2 Úložisko</option>
                              </select>
                            </div>

                            {/* File URL or Auto-generate options */}
                            {item.storageType === "AUTO_GENERATE" ? (
                              <div className="sm:col-span-2 space-y-1 bg-[#070b0f] p-2.5 rounded-[2px] border border-white/10">
                                <label className="text-[10px] font-mono text-primary font-bold block">
                                  Formát generovaného kódu:
                                </label>
                                <div className="flex items-center gap-4 pt-0.5 text-[#fafbfc]">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`gen-${item.id}`}
                                      checked={item.autoGenerateType === "css_variables" || !item.autoGenerateType}
                                      onChange={() => {
                                        const updated = [...cfg.items];
                                        updated[index] = {
                                          ...updated[index],
                                          autoGenerateType: "css_variables",
                                          badgeText: "CSS",
                                        };
                                        handleSaveConfig({ ...cfg, items: updated });
                                      }}
                                    />
                                    <span>CSS Variables (:root premenné)</span>
                                  </label>

                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`gen-${item.id}`}
                                      checked={item.autoGenerateType === "json_tokens"}
                                      onChange={() => {
                                        const updated = [...cfg.items];
                                        updated[index] = {
                                          ...updated[index],
                                          autoGenerateType: "json_tokens",
                                          badgeText: "JSON",
                                        };
                                        handleSaveConfig({ ...cfg, items: updated });
                                      }}
                                    />
                                    <span>Figma / JSON Tokens</span>
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-mono text-[#96abbe] block">
                                  Odkaz na stiahnutie (URL):
                                </label>
                                <input
                                  type="text"
                                  placeholder="https://drive.google.com/... alebo https://..."
                                  value={item.fileUrl}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = [...cfg.items];
                                    updated[index] = {
                                      ...updated[index],
                                      fileUrl: val,
                                    };
                                    handleSaveConfig({ ...cfg, items: updated });
                                  }}
                                  className="w-full bg-[#070b0f] border border-white/15 rounded-[2px] px-2 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: GENERAL TEXTS */}
              {modalTab === "general" && (
                <div className="space-y-3 bg-[#17212a] p-4 rounded-[3px] border border-white/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#96abbe] block">
                      Hlavný nadpis bloku:
                    </label>
                    <input
                      type="text"
                      value={typeof cfg.title === "object" ? cfg.title.sk || cfg.title.en || "" : cfg.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleSaveConfig({
                          ...cfg,
                          title: { en: val, sk: val },
                        });
                      }}
                      className="w-full bg-[#070b0f] border border-white/15 rounded-[2px] px-2.5 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#96abbe] block">
                      Sprievodný text:
                    </label>
                    <textarea
                      rows={2}
                      value={typeof cfg.description === "object" ? cfg.description.sk || cfg.description.en || "" : cfg.description || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleSaveConfig({
                          ...cfg,
                          description: { en: val, sk: val },
                        });
                      }}
                      className="w-full bg-[#070b0f] border border-white/15 rounded-[2px] px-2.5 py-1 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                    />
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
